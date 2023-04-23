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
	UniqID
} from 'Acid';
import dgram from 'dgram';
// Default utility imports
import { success, configure } from '#logs';
import { buildPacketSize } from '#utilities/buildPacketSize.js';
import { buildStringSize } from '#utilities/buildStringSize.js';
import { file } from '#utilities/file.js';
import {
	createSessionKey,
	clientSession,
	createClientId,
	keypair,
	toBase64
} from '#utilities/crypto.js';
import { pluckBuffer } from '#utilities/pluckBuffer.js';
import { certificate } from '#utilities/certificate/index.js';
import { watch } from '#utilities/watch.js';
// Client specific imports
import { getClient } from './getClient.js';
// Client specific imports to extend class
import { send } from './send.js';
import { emit } from './emit.js';
import { request } from './request.js';
import { processMessage } from './processMessage.js';
import { onMessage } from './onMessage.js';
import { connect } from './connect.js';
import { listening, listen } from './listening.js';
export class Client {
	type = 'client';
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	descriptor = 'UDSP_CLIENT';
	constructor(configuration) {
		const thisContext = this;
		console.log('-------CLIENT INITIALIZING-------\n', configuration);
		const {
			service,
			profile,
			server
		} = configuration;
		this.service = service;
		this.profile = profile;
		const {
			ip,
			port
		} = this.service.ephemeral;
		configure('CLIENT CONFIGURATION');
		this.endpoint = {
			ip: server.ip || ip,
			port: server.port || port,
			maxMTU: 1000,
			encoding: 'binary',
			max: 1280,
		};
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
	static connections = new Map();
	state = {
		code: 0
	};
	server = dgram.createSocket('udp4');
	requests = new Map();
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
	connect = connect;
	send = send;
	request = request;
	processMessage = processMessage;
	emit = emit;
	listening = listening;
	listen = listen;
	onMessage = onMessage;
	packetIdGenerator = construct(UniqID);
}
export function createClient(configuration, ignoreConnections) {
	const result = getClient(configuration);
	if (result) {
		return result;
	}
	return construct(Client, configuration);
}
// UNIVERSAL WEB client
export function getCertificate(certificateLocation) {
	return certificate.get(certificateLocation);
}
export { getClient };
