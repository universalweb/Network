/*
  	* Client Module
	* UDSP - Universal Data Stream Protocol
	* UWS Universal Web client
	* Establishes a UDP based bi-directional real-time client between a client and end service.
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
	createSessionKey, clientSession, createClientId, keypair, toBase64, emptyNonce, sessionKeys
} from '#crypto';
import { pluckBuffer } from '#pluckBuffer';
import { getCertificate } from '#certificate';
import { watch } from '#watch';
// Client specific imports to extend class
import { send } from './send.js';
import { emit } from './emit.js';
import { request } from '#udsp/request';
import { processMessage } from './processMessage.js';
import { onMessage } from './onPaacket.js';
import { connect } from './connect.js';
import { onListening } from './listening.js';
import { currentPath } from '#directory';
// UNIVERSAL WEB Client Class
export class Client {
	type = 'client';
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	descriptor = 'UDSP_CLIENT';
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
		} = service.ephemeral;
		configure('CLIENT CONFIGURATION');
		assign(this, {
			ip: configIP || ip,
			port: configPort || port,
			service,
			profile,
		});
		this.connect = connect.bind(this);
		this.send = send.bind(this);
		this.request = request.bind(this);
		this.processMessage = processMessage.bind(this);
		this.emit = emit.bind(this);
		this.onListening = onListening.bind(this);
		this.onMessage = onMessage.bind(this);
		thisClient.clientId = createClientId();
		success(`clientId:`, this.clientId);
		success(`Creating Shared Keys`);
		const transmitKey = thisClient.transmitKey = createSessionKey();
		const receiveKey = thisClient.receiveKey = createSessionKey();
		// Currently unused but may in the future
		const ephemeralProfileTransmitKey = thisClient.ephemeralProfileTransmitKey = createSessionKey();
		const ephemeralProfileReceiveKey = thisClient.ephemeralProfileReceiveKey = createSessionKey();
		success(`Creating Connection Keypair`);
		thisClient.keypair = keypair();
		thisClient.ephemeralPublic = omit(profile.ephemeral, ['private']);
		if (profile.master) {
			thisClient.masterPublic = omit(profile.master, ['private']);
		}
		const { ephemeral: { signature: profileSignature } } = profile;
		const {
			ephemeral: {
				key: destinationPublicKey,
				signature: destinationSignature
			}
		} = service;
		thisClient.destination = {
			publicKey: destinationPublicKey,
		};
		const {
			publicKey,
			secretKey: privateKey,
		} = thisClient.keypair;
		clientSession(receiveKey, transmitKey, publicKey, privateKey, destinationPublicKey);
		// Can be used to encrypt-authenticate the profile with the server
		// clientSession(ephemeralProfileReceiveKey, ephemeralProfileTransmitKey, profile.ephemeral.publicKey, profile.ephemeral.secretKey, destinationPublicKey);
		configure(`Shared Keys Created`);
		console.log(receiveKey, transmitKey);
		const serviceKey = toBase64(destinationSignature);
		const profileKey = toBase64(profileSignature);
		// Needs to be more complex if forcing no connection with the same credentials
		const connectionKey = `${serviceKey}${profileKey}`;
		this.connectionKey = connectionKey;
		Client.connections.set(connectionKey, thisClient);
		thisClient.server.on('message', thisClient.onMessage.bind(thisClient));
		thisClient.server.on('listening', thisClient.onListening);
		return this;
	}
	reKey(targetPublicKey) {
		const thisClient = this;
		const {
			publicKey,
			secretKey
		} = thisClient.keypair;
		thisClient.destination.publicKey = targetPublicKey;
		const newSessionKeys = sessionKeys(publicKey, secretKey, targetPublicKey);
		thisClient.ephemeralKeypair = thisClient.reKey;
		thisClient.transmitKey = newSessionKeys.transmitKey;
		thisClient.receiveKey = newSessionKeys.receiveKey;
		thisClient.lastReKey = Date.now();
		success(`client reKeyed -> ID: ${thisClient.connectionKey}`);
	}
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
		Client.connections.delete(this.connectionKey);
	}
	packetIdGenerator = construct(UniqID);
}
export function getClient(configuration) {
	const serviceKey = configuration.service.ephemeral.signature.toString('base64');
	const profileKey = configuration.profile.ephemeral.signature.toString('base64');
	const connectionKey = `${serviceKey}${profileKey}`;
	const clientFound = Client.connections.get(connectionKey);
	if (clientFound) {
		return clientFound;
	}
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
	const result = getClient(configuration, Client);
	if (result) {
		return result;
	}
	const uwClient = await createClient(configuration);
	console.time('CONNECTING');
	const connectRequest = await uwClient.connect();
	console.timeEnd('CONNECTING');
	return uwClient;
}
export { getCertificate };
