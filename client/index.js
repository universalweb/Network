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
	construct
} from 'Acid';
import dgram from 'dgram';
// Default utility imports
import { success, configure } from '../utilities/logs.js';
import { buildPacketSize } from '../utilities/buildPacketSize.js';
import { buildStringSize } from '../utilities/buildStringSize.js';
import { file } from '../utilities/file.js';
import {
	createSessionKey,
	clientSession,
	createClientId,
	keypair,
	toBase64
} from '../utilities/crypto.js';
import { pluckBuffer } from '../utilities/pluckBuffer.js';
import { certificate } from '../utilities/certificate/index.js';
import { watch } from '../utilities/watch.js';
// Client specific imports
import { getClient } from './getClient.js';
// Client specific imports to extend class
import { send } from './send/index.js';
import { request } from './request/index.js';
import { processMessage } from './processMessage/index.js';
import { onMessage } from './onMessage/index.js';
import { connect } from './connect/index.js';
import { listening } from './listening/index.js';
export class UDSP {
	type = 'client';
	description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	descriptor = 'UDSP_CLIENT';
	constructor(configuration) {
		const client = this;
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
		configure.logImprt('CLIENT CONFIGURATION');
		this.endpoint = {
			ip: server.ip || ip,
			port: server.port || port,
			maxMTU: 1000,
			encoding: 'binary',
			max: 1280,
		};
		client.clientId = createClientId();
		success(`clientId:`, this.clientId);
		success(`Creating Shared Keys`);
		const transmitKey = client.transmitKey = createSessionKey();
		const receiveKey = client.receiveKey = createSessionKey();
		// Currently unused but may in the future
		const ephemeralProfileTransmitKey = client.ephemeralProfileTransmitKey = createSessionKey();
		const ephemeralProfileReceiveKey = client.ephemeralProfileReceiveKey = createSessionKey();
		console.log(ephemeralProfileTransmitKey, ephemeralProfileReceiveKey);
		success(`Creating Connection Keypair`);
		client.keypair = keypair();
		client.ephemeralPublic = omit(profile.ephemeral, ['private']);
		if (profile.master) {
			client.masterPublic = omit(profile.master, ['private']);
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
		} = client.keypair;
		clientSession(receiveKey, transmitKey, publicKey, privateKey, serverPublicKey);
		// Can be used to encrypt-authenticate the profile with the server
		// clientSession(ephemeralProfileReceiveKey, ephemeralProfileTransmitKey, profile.ephemeral.publicKey, profile.ephemeral.secretKey, serverPublicKey);
		configure(`Shared Keys Created`);
		console.log(receiveKey, transmitKey);
		client.server.on('message', client.onMessage.bind(client));
		const serviceKey = toBase64(serviceSignature);
		const profileKey = toBase64(profileSignature);
		// Needs to be more complex if forcing no connection with the same credentials
		const connectionKey = `${serviceKey}${profileKey}`;
		this.connectionKey = connectionKey;
		UDSP.connections.set(connectionKey, client);
		return client;
	}
	static connections = new Map();
	status = {
		code: 0
	};
	server = dgram.createSocket('udp4');
	requests = new Map();
	close() {
		console.log(this, 'client closed down.');
		this.server.close();
		UDSP.connections.delete(this.connectionKey);
	}
	connect = connect;
}
export function udsp(configuration, ignoreConnections) {
	const client = getClient(configuration);
	if (client) {
		return client;
	}
	return construct(UDSP, configuration);
}
// UNIVERSAL WEB client
export function getCertificate(certificateLocation) {
	return certificate.get(certificateLocation);
}
export { getClient };
