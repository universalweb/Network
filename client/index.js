/*
  * Client Module
	* UDSP - Universal Data Stream Protocol
	* UWS Universal Web Socket
	* Establishes a UDP based bi-directional real-time socket between a client and end service.
*/
const {
	encode,
	decode
} = require('what-the-pack').initialize(2 ** 30);
const utility = require('Lucy');
const connections = {};
const {
	omit,
	assign
} = utility;
class UDSP {
	constructor(configuration, accept) {
		const stream = this;
		console.log('-------CLIENT INITIALIZING-------\n', configuration);
		const {
			service,
			profile
		} = configuration;
		const {
			crypto: {
				createSessionKey,
				clientSession,
				createStreamId
			},
			alert,
			success
		} = stream;
		stream.streamId = createStreamId();
		success(`StreamID:`, this.streamId);
		alert(`Creating Shared Keys`);
		const transmitKey = stream.transmitKey = createSessionKey();
		const receiveKey = stream.receiveKey = createSessionKey();
		stream.profile = profile;
		stream.service = service;
		stream.ephemeralPublic = omit(profile.ephemeral, ['private']);
		if (profile.master) {
			stream.masterPublic = omit(profile.master, ['private']);
		}
		const {
			ephemeral: {
				key: publicKey,
				private: privateKey,
				signature: profileSignature
			}
		} = profile;
		const {
			ephemeral: {
				key: serverPublicKey,
				signature: serviceSignature
			}
		} = service;
		clientSession(receiveKey, transmitKey, publicKey, privateKey, serverPublicKey);
		alert(`Shared Keys Created`);
		console.log(receiveKey, transmitKey);
		require('./status')(stream);
		require('./configuration')(stream);
		require('./listening')(stream);
		stream.server.on('message', stream.onMessage.bind(stream));
		(async () => {
			console.log('-------CLIENT INITIALIZED-------\n');
			console.log('-------CLIENT CONNECTING-------\n');
			await stream.connect();
			console.log('-------CLIENT CONNECTED-------\n');
			const serviceKey = serviceSignature.toString('base64');
			const profileKey = profileSignature.toString('base64');
			const connectionKey = `${serviceKey}${profileKey}`;
			connections[connectionKey] = stream;
			accept(stream);
		})();
	}
	server = require('dgram').createSocket('udp4');
	requests = new Map();
	close() {
		console.log(this, 'Stream closed down.');
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
	return new Promise((accept) => {
		return new UDSP(configuration, accept);
	});
}
// UNIVERSAL WEB SOCKET
async function getStream(configuration) {
	const serviceKey = configuration.service.ephemeral.signature.toString('base64');
	const profileKey = configuration.profile.ephemeral.signature.toString('base64');
	const connectionKey = `${serviceKey}${profileKey}`;
	const stream = connections[connectionKey];
	if (stream) {
		return stream;
	}
}
async function uws(configuration) {
	const stream = await getStream(configuration);
	if (stream) {
		return stream;
	}
	return udsp(configuration);
}
uws.get = getStream;
uws.udsp = udsp;
uws.getCertificate = (location) => {
	return udspPrototype.certificate.get(location);
};
module.exports = uws;
