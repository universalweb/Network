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
	createSessionKey, clientSession, keypair, toBase64, emptyNonce, sessionKeys, randomConnectionId, ed25519ToCurve25519PublicKey
} from '#crypto';
import { pluckBuffer } from '#pluckBuffer';
import { getCertificate } from '#certificate';
import { watch } from '#watch';
// Client specific imports to extend class
import { send } from './send.js';
import { emit } from './emit.js';
import { request } from '#udsp/request';
import { processMessage } from './processMessage.js';
import { onMessage } from './onPacket.js';
import { connect } from './connect.js';
import { onListening } from './listening.js';
import { currentPath } from '#directory';
// UNIVERSAL WEB Client Class
export class Client {
	constructor(configuration) {
		const thisClient = this;
		console.log('-------CLIENT INITIALIZING-------\n', configuration);
		this.configuration = configuration;
		const {
			service,
			profile,
			ip: configIP,
			port: configPort
		} = configuration;
		const {
			ip,
			port
		} = service;
		configure('CLIENT CONFIGURATION', service);
		assign(this, {
			ip: configIP || ip,
			port: configPort || port,
			service,
			profile,
		});
		thisClient.keypair = keypair();
		thisClient.destinationPublicKey = service.publicKey;
		thisClient.destinationBoxPublicKey = ed25519ToCurve25519PublicKey(service.publicKey);
		const {
			publicKey,
			privateKey,
		} = thisClient.keypair;
		const clientSessionKeys = sessionKeys(publicKey, privateKey, thisClient.destinationPublicKey);
		const {
			transmitKey,
			receiveKey
		} = clientSessionKeys;
		thisClient.transmitKey = transmitKey;
		thisClient.receiveKey = receiveKey;
		configure(`Shared Keys Created`);
		this.connect = connect.bind(this);
		this.send = send.bind(this);
		this.request = request.bind(this);
		this.processMessage = processMessage.bind(this);
		this.emit = emit.bind(this);
		this.onListening = onListening.bind(this);
		this.onMessage = onMessage.bind(this);
		thisClient.id = randomConnectionId();
		thisClient.idString = toBase64(thisClient.id);
		thisClient.clientId = thisClient.id;
		success(`clientId:`, toBase64(this.id));
		success(`Creating Shared Keys`);
		success(`Creating Connection Keypair`);
		if (service.encryptConnectionId) {
			thisClient.connectionIdKeypair = thisClient.keypair;
		}
		Client.connections.set(thisClient.idString, thisClient);
		thisClient.server.on('message', thisClient.onMessage.bind(thisClient));
		thisClient.server.on('listening', thisClient.onListening);
		return this;
	}
	reKey(targetPublicKey) {
		const thisClient = this;
		const {
			publicKey,
			privateKey
		} = thisClient.keypair;
		thisClient.destination.publicKey = targetPublicKey;
		const newSessionKeys = sessionKeys(publicKey, privateKey, targetPublicKey);
		thisClient.ephemeralKeypair = thisClient.reKey;
		thisClient.transmitKey = newSessionKeys.transmitKey;
		thisClient.receiveKey = newSessionKeys.receiveKey;
		thisClient.lastReKey = Date.now();
		success(`client reKeyed -> ID: ${thisClient.idString}`);
	}
	type = 'client';
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	descriptor = 'UDSP_CLIENT';
	nonce = emptyNonce();
	maxMTU = 1000;
	encoding = 'binary';
	max = 1280;
	static connections = new Map();
	state = 0;
	server = dgram.createSocket('udp6');
	requestQueue = new Map();
	close() {
		console.log(this, 'client closed down.');
		this.server.close();
		Client.connections.delete(this.id);
	}
	packetIdGenerator = construct(UniqID);
}
export async function createClient(configuration, ignoreConnections) {
	console.log(configuration);
	return construct(Client, [configuration]);
}
export async function client(configuration, ignoreConnections) {
	if (isString(configuration.service)) {
		configuration.service = await getCertificate(configuration.service);
	}
	if (isString(configuration.profile)) {
		configuration.profile = await getCertificate(configuration.profile);
	}
	const uwClient = await createClient(configuration);
	console.time('CONNECTING');
	const connectRequest = await uwClient.connect();
	console.timeEnd('CONNECTING');
	return uwClient;
}
export { getCertificate };
