/*
  * Client Module
	* UDSP - Universal Data Stream Protocol
	* UWS Universal Web Socket
	* Establishes a UDP based bi-directional real-time socket between a client and end service.
*/
const {
	encode,
	decode
} = require('msgpackr');
const utility = require('Lucy');
const connections = {};
const {
	omit,
	assign
} = utility;
class UDSP {
	constructor(configuration) {
		const socket = this;
		console.log('-------CLIENT INITIALIZING-------\n', configuration);
		const {
			service,
			profile
		} = configuration;
		const {
			crypto: {
				createSessionKey,
				clientSession,
				createSocketId,
				keypair,
			},
			alert,
			success
		} = socket;
		socket.socketId = createSocketId();
		success(`socketId:`, this.socketId);
		success(`Creating Shared Keys`);
		const transmitKey = socket.transmitKey = createSessionKey();
		const receiveKey = socket.receiveKey = createSessionKey();
		const ephemeralProfileTransmitKey = socket.ephemeralProfileTransmitKey = createSessionKey();
		const ephemeralProfileReceiveKey = socket.ephemeralProfileReceiveKey = createSessionKey();
		success(`Creating Connection Keypair`);
		socket.keypair = keypair();
		socket.profile = profile;
		socket.service = service;
		socket.ephemeralPublic = omit(profile.ephemeral, ['private']);
		if (profile.master) {
			socket.masterPublic = omit(profile.master, ['private']);
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
		} = socket.keypair;
		clientSession(receiveKey, transmitKey, publicKey, privateKey, serverPublicKey);
		// Can be used to encrypt and authenticate the profile with the server
		// clientSession(ephemeralProfileReceiveKey, ephemeralProfileTransmitKey, profile.ephemeral.publicKey, profile.ephemeral.secretKey, serverPublicKey);
		alert(`Shared Keys Created`);
		console.log(receiveKey, transmitKey);
		require('./status')(socket);
		require('./configuration')(socket);
		require('./listening')(socket);
		socket.server.on('message', socket.onMessage.bind(socket));
		const serviceKey = serviceSignature.toString('base64');
		const profileKey = profileSignature.toString('base64');
		const connectionKey = `${serviceKey}${profileKey}`;
		connections[connectionKey] = socket;
		return socket;
	}
	server = require('dgram').createSocket('udp4');
	requests = new Map();
	close() {
		console.log(this, 'socket closed down.');
		this.server.close();
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
		const serviceKey = serviceSignature.toString('base64');
		const profileKey = profileSignature.toString('base64');
		const connectionKey = `${serviceKey}${profileKey}`;
		connections[connectionKey] = null;
	}
}
const udspPrototype = UDSP.prototype;
assign(udspPrototype, {
	type: 'client',
	description: 'client module for Universal Web Sockets',
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
// UNIVERSAL WEB SOCKET
function getsocket(configuration) {
	const serviceKey = configuration.service.ephemeral.signature.toString('base64');
	const profileKey = configuration.profile.ephemeral.signature.toString('base64');
	const connectionKey = `${serviceKey}${profileKey}`;
	const socket = connections[connectionKey];
	if (socket) {
		return socket;
	}
}
function uws(configuration) {
	const socket = getsocket(configuration);
	if (socket) {
		return socket;
	}
	return udsp(configuration);
}
uws.get = getsocket;
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
