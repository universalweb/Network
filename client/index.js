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
	isString
} from 'Acid';
import dgram from 'dgram';
// Default utility imports
import { success, configure } from '#logs';
import { buildPacketSize } from '#buildPacketSize';
import { buildStringSize } from '#buildStringSize';
import {
	createSessionKey,
	clientSession,
	createClientId,
	keypair,
	toBase64
} from '#crypto';
import { pluckBuffer } from '#pluckBuffer';
import { getCertificate } from '#certificate';
import { watch } from '#watch';
// Client specific imports to extend class
import { send } from './send.js';
import { emit } from './emit.js';
import { request } from './request.js';
import { processMessage } from './processMessage.js';
import { onMessage } from './onMessage.js';
import { connect } from './connect.js';
import { onListening, listen } from './listening.js';
import { currentPath } from '#directory';
// UNIVERSAL WEB Client Class
export class Client {
	type = 'client';
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	descriptor = 'UDSP_CLIENT';
	constructor(configuration) {
		const thisContext = this;
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
		this.listen = listen.bind(this);
		this.onMessage = onMessage.bind(this);
		thisContext.clientId = createClientId();
		success(`clientId:`, this.clientId);
		success(`Creating Shared Keys`);
		const transmitKey = thisContext.transmitKey = createSessionKey();
		const receiveKey = thisContext.receiveKey = createSessionKey();
		// Currently unused but may in the future
		const ephemeralProfileTransmitKey = thisContext.ephemeralProfileTransmitKey = createSessionKey();
		const ephemeralProfileReceiveKey = thisContext.ephemeralProfileReceiveKey = createSessionKey();
		console.log(ephemeralProfileTransmitKey, ephemeralProfileReceiveKey);
		success(`Creating Connection Keypair`);
		thisContext.keypair = keypair();
		thisContext.ephemeralPublic = omit(profile.ephemeral, ['private']);
		if (profile.master) {
			thisContext.masterPublic = omit(profile.master, ['private']);
		}
		const { ephemeral: { signature: profileSignature } } = profile;
		const {
			ephemeral: {
				key: serverPublicKey,
				signature: serviceSignature
			}
		} = service;
		const {
			publicKey,
			secretKey: privateKey,
		} = thisContext.keypair;
		clientSession(receiveKey, transmitKey, publicKey, privateKey, serverPublicKey);
		// Can be used to encrypt-authenticate the profile with the server
		// clientSession(ephemeralProfileReceiveKey, ephemeralProfileTransmitKey, profile.ephemeral.publicKey, profile.ephemeral.secretKey, serverPublicKey);
		configure(`Shared Keys Created`);
		console.log(receiveKey, transmitKey);
		this.listen();
		thisContext.server.on('message', thisContext.onMessage.bind(thisContext));
		const serviceKey = toBase64(serviceSignature);
		const profileKey = toBase64(profileSignature);
		// Needs to be more complex if forcing no connection with the same credentials
		const connectionKey = `${serviceKey}${profileKey}`;
		this.connectionKey = connectionKey;
		Client.connections.set(connectionKey, thisContext);
		return thisContext;
	}
	maxMTU = 1000;
	encoding = 'binary';
	max = 1280;
	static connections = new Map();
	state = 0;
	server = dgram.createSocket('udp4');
	requestQueue = new Map();
	close() {
		console.log(this, 'client closed down.');
		this.server.close();
		Client.connections.delete(this.connectionKey);
	}
	buildPacketSize(encryptedLength) {
		return buildPacketSize(encryptedLength, this.maxPacketSizeLength);
	}
	buildStringSize(encryptedLength) {
		return buildStringSize(encryptedLength, this.maxStringSizeLength);
	}
	packetIdGenerator = construct(UniqID);
}
export function getClient(configuration) {
	const serviceKey = configuration.service.ephemeral.signature.toString('base64');
	const profileKey = configuration.profile.ephemeral.signature.toString('base64');
	const connectionKey = `${serviceKey}${profileKey}`;
	const client = Client.connections.get(connectionKey);
	if (client) {
		return client;
	}
}
export async function createClient(configuration, ignoreConnections) {
	console.log(configuration);
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
	return construct(Client, [configuration]);
}
export async function udsp(configuration, ignoreConnections) {
	const uwClient = await createClient(configuration);
	console.time('CONNECTING');
	const connectRequest = await uwClient.connect();
	console.timeEnd('CONNECTING');
	return uwClient;
}
export { getCertificate };
