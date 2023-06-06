/*
  	* Client Module
	* UDSP - Universal Data Stream Protocol
	* UW Universal Web
	* UWP Universal Web Protocol
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
	isTrue
} from 'Acid';
import dgram from 'dgram';
// Default utility imports
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
import { send } from './send.js';
import { emit } from './emit.js';
import { request } from '#udsp/request';
import { processMessage } from './processMessage.js';
import { onMessage } from './onPacket.js';
import { connect as clientConnect } from './connect.js';
import { onListening } from './listening.js';
import { currentPath } from '#directory';
import { keychainGet } from '#keychain';
import { on } from '../server/events.js';
import { onError } from '../server/onError.js';
import { onListen } from '../server/onListen.js';
import { onPacket } from '../server/onPacket.js';
// UNIVERSAL WEB Client Class
export class Client {
	constructor(configuration) {
		console.log('-------CLIENT INITIALIZING-------\n');
		return this.initialize(configuration);
	}
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
			console.log('Loading Destination Certificate', destinationCertificate);
			const certificate = await getCertificate(destinationCertificate);
			assign(destination, certificate);
		}
		if (!destination.publicKey) {
			console.log('No destination certificate provided.');
		}
		console.log(destination);
		if (isTrue(destination.encryptKeypair)) {
		}
		destination.encryptKeypair = {
			publicKey: signPublicKeyToEncryptPublicKey(destination.publicKey),
		};
		if (ip) {
			destination.ip = ip;
		}
		if (port) {
			destination.port = port;
		}
		this.encryptConnectionId = destination.encryptConnectionId;
		this.encryptClientId = destination.encryptClientId;
		this.encryptServerId = destination.encryptServerId;
		this.compression = destination.compression;
		this.headerCompression = destination.headerCompression;
		this.crypto = destination.crypto;
		this.cryptography = destination.cryptography;
		if (destination.autoLogin && this.login) {
			this.autoLogin = true;
		}
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
			console.log('Loading Keychain', keychain);
			this.certificate = await this.getKeychainSave(keychain);
		}
		if (this.certificate.ephemeral) {
			this.activeCertificate = this.certificate.ephemeral;
		} else if (this.certificate.master) {
			this.activeCertificate = this.certificate.ephemeral;
		}
	}
	async configCryptography() {
		if (!this.keyPair) {
			this.keypair = keypair();
		}
		success(`Created Connection Keypair`);
		this.sessionKeys = clientSessionKeys(this.keypair, this.destination.encryptKeypair.publicKey);
		success(`Created Shared Keys`);
		success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
		success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
		if (this.encryptConnectionId) {
			this.destination.connectionIdKeypair = this.keypair;
		}
	}
	connect = clientConnect;
	send = send;
	request = request;
	processMessage = processMessage;
	emit = emit;
	onListening = onListening;
	onMessage = onMessage;
	async attachEvents() {
		const thisClient = this;
		this.server.on('error', () => {
			console.log('CLIENT UDP SERVER ERROR');
			return thisClient.onError && thisClient.onError();
		});
		this.server.on('listening', () => {
			return thisClient.onListening();
		});
		this.server.on('message', () => {
			return thisClient.onMessage();
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
		await this.attachEvents();
		Client.connections.set(this.idString, this);
		if (this.autoConnect) {
			console.time('CONNECTING');
			const connectRequest = await this.connect();
			console.log('Client Connect Response', connectRequest);
			console.timeEnd('CONNECTING');
		}
		return this;
	}
	reKey(targetPublicKey) {
		const thisClient = this;
		success(`client reKeyed -> ID: ${thisClient.idString}`);
	}
	close() {
		console.log(this, 'client closed down.');
		this.server.close();
		Client.connections.delete(this.id);
	}
	destination = {};
	autoConnect = true;
	type = 'client';
	isClient = true;
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	descriptor = 'UWClient';
	maxMTU = 1000;
	encoding = 'binary';
	max = 1280;
	static connections = new Map();
	state = 0;
	server = dgram.createSocket('udp6');
	requestQueue = new Map();
	packetIdGenerator = construct(UniqID);
}
export async function client(configuration, ignoreConnections) {
	const uwClient = await construct(Client, [configuration]);
	return uwClient;
}
export { getCertificate };
