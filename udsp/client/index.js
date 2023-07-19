/*
  	* Client Module
	* UDSP - Universal Data Stream Protocol
	* UW Universal Web
	* uw:// Universal Web Protocol preferred
	* udsp:// UDSP Protocol
	* Establishes a UDP based bi-directional real-time connection between client and server.
*/
// Default System imports
import {
	encode,
	decode
} from 'msgpackr';
import {
	omit,
	assign,
	construct,
	UniqID,
	isString,
	promise,
	isTrue,
	currentPath
} from '@universalweb/acid';
import dgram from 'dgram';
import { success, configure, info } from '#logs';
import {
	keypair,
	toBase64,
	emptyNonce,
	randomConnectionId,
	clientSessionKeys,
	signPublicKeyToEncryptPublicKey
} from '#crypto';
import { getCertificate, parseCertificate } from '#certificate';
import { watch } from '#watch';
// Client specific imports to extend class
import { emit } from './emit.js';
import { request } from '#udsp/request';
import { cryptography } from '#udsp/cryptography';
import { processMessage } from './processMessage.js';
import { onPacket } from './onPacket.js';
import { onListening } from './listening.js';
import { keychainGet } from '#keychain';
import { Ask } from '../request/ask.js';
import { fetchRequest } from '../fetch.js';
import { UDSP } from '#udsp/base';
import { sendPacket } from '../sendPacket.js';
// UNIVERSAL WEB Client Class
export class Client extends UDSP {
	constructor(configuration) {
		super();
		console.log('-------CLIENT INITIALIZING-------\n');
		return this.initialize(configuration);
	}
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	type = 'client';
	isClient = true;
	configDefaults() {
		const { autoConnect } = this.configuration;
		this.autoConnect = autoConnect;
	}
	async setDestination() {
		const {
			destination,
			configuration: {
				ip,
				port,
				destinationCertificate
			}
		} = this;
		if (isString(destinationCertificate)) {
			// console.log('Loading Destination Certificate', destinationCertificate);
			const certificate = await getCertificate(destinationCertificate);
			assign(destination, certificate);
		}
		if (!destination.publicKey) {
			console.log('No destination certificate provided.');
		}
		if (ip) {
			destination.ip = ip;
		}
		if (port) {
			destination.port = port;
		}
		// console.log('Destination', destination.cryptography);
	}
	async getKeychainSave(keychain) {
		return keychainGet(keychain);
	}
	async setCertificate() {
		const {
			keychain,
			certificate
		} = this.configuration;
		if (isString(certificate)) {
			this.certificate = await parseCertificate(certificate);
		}
		if (keychain) {
			// console.log('Loading Keychain', keychain);
			this.certificate = await this.getKeychainSave(keychain);
		}
	}
	async configCryptography() {
		// console.log(this.cryptography);
		const { destination, } = this;
		const cryptoConfig = assign({
			isClient: true,
			generate: {
				keypair: true,
				connectionIdKeypair: true,
				clientSessionKeys: true,
			}
		}, destination);
		this.cryptography = await cryptography(cryptoConfig);
		if (this.cryptography.encryptionKeypair) {
			this.destination.encryptKeypair = this.cryptography.encryptionKeypair;
		}
		if (this.cryptography.connectionIdKeypair) {
			this.destination.connectionIdKeypair = this.cryptography.connectionIdKeypair;
		}
		this.compression = destination.compression;
		this.headerCompression = destination.headerCompression;
		if (destination.autoLogin && this.autoLogin) {
			this.autoLogin = true;
		}
		if (!this.keyPair) {
			this.keypair = this.cryptography.generated.keypair;
			this.encryptKeypair = this.cryptography.generated.encryptKeypair;
			this.connectionIdKeypair = this.cryptography.generated.connectionIdKeypair;
			success(`Created Connection Keypair`);
		}
		this.sessionKeys = this.cryptography.generated.sessionKeys;
		if (this.sessionKeys) {
			success(`Created Shared Keys`);
			success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
			success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
		}
	}
	async attachEvents() {
		const thisClient = this;
		this.socket.on('error', (err) => {
			console.log('CLIENT UDP SERVER ERROR');
			return thisClient.onError && thisClient.onError(err);
		});
		this.socket.on('listening', () => {
			return thisClient.onListening();
		});
		this.socket.on('message', (packet, rinfo) => {
			return thisClient.onPacket(packet, rinfo);
		});
	}
	async initialize(configuration) {
		const thisClient = this;
		this.configuration = configuration;
		const { id } = this.configuration;
		this.id = id || randomConnectionId();
		this.idString = toBase64(this.id);
		this.clientId = this.id;
		success(`clientId:`, this.idString);
		await this.setDestination();
		await this.setCertificate();
		await this.configCryptography();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		Client.connections.set(this.idString, this);
		if (this.autoConnect) {
			console.time('CONNECTING');
			this.handshake = await this.intro();
			console.timeEnd('CONNECTING');
		}
		return this;
	}
	reKey(targetPublicKey) {
		const thisClient = this;
		success(`client reKeyed -> ID: ${thisClient.idString}`);
	}
	close(statusCode) {
		console.log(toBase64(this.id), `client closed. code ${statusCode}`);
		this.socket.close();
		Client.connections.delete(this.id);
	}
	ask(message, options) {
		const ask = construct(Ask, [message, options, this]);
		return ask;
	}
	sendIntro(ask) {
		console.log('Sending Intro');
		const header = this.setPublicKeyHeader();
		const message = {
			intro: true
		};
		this.introSent = true;
		this.send(message, header);
	}
	serverIntro(message) {
		console.log('Got server Intro', message);
		this.state = 1;
		const {
			scid: serverConnectionId,
			reKey
		} = message;
		this.serverIntroReceived = true;
		this.destination.id = serverConnectionId;
		this.destination.encryptKeypair = {
			publicKey: reKey
		};
		this.destination.sessionKeys = this.cryptography.clientSessionKeys(this.encryptKeypair, reKey);
		this.confirmReKey();
	}
	confirmReKey() {
		console.log('Sending rekey confirmation');
		const header = {};
		const message = {
			confirmClientReKey: true
		};
		this.confirmRekey = true;
		this.send(message, header);
	}
	endHandshake(message) {
		console.log('Handshake Completed');
		const { handshake } = message;
		console.log('Handshake Finished', handshake);
		this.connected = true;
		// Trigger the handshake completed event
		this.handshakeCompleted(message);
	}
	setPublicKeyHeader(header = {}) {
		const key = this.encryptKeypair.publicKey;
		console.log('Setting Public Key in UDSP Header', toBase64(key));
		const { encryptClientKey } = this.cryptography.config;
		header.key = key;
		if (encryptClientKey) {
			console.log('Encrypting Public Key in UDSP Header');
			header.key = cryptography.encryptClientKey(header.key, this.destination.encryptKeypair);
		}
		return header;
	}
	launchHandshake() {
		this.awaitHandshake = promise((accept) => {
			this.handshakeCompleted = accept;
		});
		this.sendIntro();
		return this.awaitHandshake;
	}
	ensureHandshake() {
		if (this.connected === true) {
			return true;
		} else if (!this.handshakeCompleted) {
			this.launchHandshake();
		}
		return this.awaitHandshake;
	}
	async send(message, headers, footer) {
		console.log(`client.send to Server`, this.destination.port, this.destination.ip);
		return sendPacket(message, this, this.socket, this.destination, headers, footer);
	}
	proccessProtocolPacket(message) {
		const {
			intro,
			serverIntro,
			confirmClientReKey,
			handshake
		} = message;
		if (intro) {
			this.sendServerIntro(message);
		} else if (serverIntro) {
			this.serverIntro(message);
		} else if (confirmClientReKey) {
			this.confirmClientReKey(message);
		} else if (handshake) {
			this.endHandshake(message);
		}
	}
	loadCertificate(certificate) {
		this.certificates = certificate;
		this.configCryptography();
	}
	request = request;
	fetch = fetchRequest;
	processMessage = processMessage;
	emit = emit;
	onListening = onListening;
	onPacket = onPacket;
	destination = {};
	autoConnect = false;
	static connections = new Map();
	packetIdGenerator = construct(UniqID);
}
export async function client(configuration) {
	console.log('Create Client');
	const uwClient = await construct(Client, [configuration]);
	return uwClient;
}
// Add the request export here for simple auto connect and then just grab contents to return called UDSP
// client is for a longer stateful connection request to a remote server
// udsp is for a single request to a remote server then closes after response
export { getCertificate };
