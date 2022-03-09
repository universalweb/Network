/*
  	* Client Module
	* UDSP - Universal Data Stream Protocol
	* UWS Universal Web client
	* Establishes a UDP based bi-directional real-time client between a client and end service.
*/
const {
	encode,
	decode
} = require('msgpackr');
const utility = require('Acid');
const connections = {};
const {
	omit,
	assign
} = utility;
class UDSP {
	constructor(configuration) {
		const client = this;
		console.log('-------CLIENT INITIALIZING-------\n', configuration);
		const {
			service,
			profile,
		} = configuration;
		assign(this, configuration);
		const {
			crypto: {
				createSessionKey,
				clientSession,
				createClientId,
				keypair,
				toBase64
			},
			alert,
			success
		} = client;
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
		const {
			ephemeral: {
				signature: profileSignature
			}
		} = profile;
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
		alert(`Shared Keys Created`);
		console.log(receiveKey, transmitKey);
		require('./status')(client);
		require('./configuration')(client, configuration);
		require('./listening')(client);
		client.server.on('message', client.onMessage.bind(client));
		const serviceKey = toBase64(serviceSignature);
		const profileKey = toBase64(profileSignature);
		const connectionKey = `${serviceKey}${profileKey}`;
		connections[connectionKey] = client;
		return client;
	}
	server = require('dgram').createSocket('udp4');
	requests = new Map();
	close() {
		const client = this;
		const {
			crypto: {
				toBase64
			}
		} = client;
		console.log(client, 'client closed down.');
		client.server.close();
		const {
			ephemeral: {
				signature: profileSignature
			}
		} = this.profile;
		const {
			ephemeral: {
				signature: serviceSignature
			}
		} = this.service;
		const serviceKey = toBase64(serviceSignature);
		const profileKey = toBase64(profileSignature);
		const connectionKey = `${serviceKey}${profileKey}`;
		connections[connectionKey] = null;
	}
}
const udspPrototype = UDSP.prototype;
assign(udspPrototype, {
	type: 'client',
	description: 'client module for UDSP',
	encode,
	decode,
	utility
});
require('../utilities/buildPacketSize')(udspPrototype);
require('../utilities/buildStringSize')(udspPrototype);
require('../utilities/console/')(udspPrototype);
require('../utilities/file/')(udspPrototype);
require('../utilities/crypto/')(udspPrototype);
require('../utilities/pluckBuffer')(udspPrototype);
require('../utilities/certificate/')(udspPrototype);
require('../utilities/watch/')(udspPrototype);
require('./send')(udspPrototype);
require('./request')(udspPrototype);
require('./processMessage')(udspPrototype);
require('./onMessage')(udspPrototype);
require('./connect/')(udspPrototype);
function udsp(configuration) {
	return new UDSP(configuration);
}
// UNIVERSAL WEB client
function getclient(configuration) {
	const serviceKey = configuration.service.ephemeral.signature.toString('base64');
	const profileKey = configuration.profile.ephemeral.signature.toString('base64');
	const connectionKey = `${serviceKey}${profileKey}`;
	const client = connections[connectionKey];
	if (client) {
		return client;
	}
}
function uws(configuration) {
	const client = getclient(configuration);
	if (client) {
		return client;
	}
	return udsp(configuration);
}
uws.get = getclient;
uws.udsp = udsp;
uws.getCertificate = (location) => {
	return udspPrototype.certificate.get(location);
};
assign(uws, {
	get utility() {
		return utility;
	},
	encode,
	decode,
});
module.exports = uws;
