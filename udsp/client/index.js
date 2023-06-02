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
	promise
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
// UNIVERSAL WEB Client Class
export class Client {
	constructor(configuration) {
		console.log('-------CLIENT INITIALIZING-------\n');
		return this.initialize(configuration);
	}
	configDefaults() {
		const { connect } = this.configuration;
		this.connect = connect;
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
			destination.certificate = certificate.original;
			assign(destination, certificate.decoded);
		}
		if (!destination.certificate) {
			console.log('No destination certificate provided.');
		}
		console.log(destination);
		destination.encryptKeypair = {
			publicKey: signPublicKeyToEncryptPublicKey(destination.publicKey),
		};
		if (ip) {
			destination.ip = ip;
		}
		if (port) {
			destination.port = port;
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
		if (this.destination.encryptConnectionId) {
			this.destination.connectionIdKeypair = this.keypair;
		}
	}
	async attachEvents() {
		this.connect = clientConnect.bind(this);
		this.send = send.bind(this);
		this.request = request.bind(this);
		this.processMessage = processMessage.bind(this);
		this.emit = emit.bind(this);
		this.onListening = onListening.bind(this);
		this.onMessage = onMessage.bind(this);
		this.server.on('message', this.onMessage);
		this.server.on('listening', this.onListening);
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
		if (this.connect) {
			console.time('CONNECTING');
			const connectRequest = await this.connect();
			console.log('Client Connect Response', connectRequest);
			console.timeEnd('CONNECTING');
		}
		return this;
	}
	reKey(targetPublicKey) {
		const thisClient = this;
		const {
			publicKey,
			privateKey
		} = thisClient.keypair;
		thisClient.destination.publicKey = targetPublicKey;
		const newSessionKeys = clientSessionKeys(publicKey, privateKey, targetPublicKey);
		thisClient.ephemeralKeypair = thisClient.reKey;
		thisClient.transmitKey = newSessionKeys.transmitKey;
		thisClient.receiveKey = newSessionKeys.receiveKey;
		thisClient.lastReKey = Date.now();
		success(`client reKeyed -> ID: ${thisClient.idString}`);
	}
	close() {
		console.log(this, 'client closed down.');
		this.server.close();
		Client.connections.delete(this.id);
	}
	destination = {};
	connect = true;
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
