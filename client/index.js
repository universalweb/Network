/*
  * Client Module
  * This is required for proof of Identity on the universal web.
  * An Identity Certificate allows users to access the Domain Information Service.
  * Identities are unique and can't be duplicated.
  * Master Certificates are used for requesting ephemeral certificates and signing them.
  * TThe ephemeral certificate to prove identity.
  * Encryption is done by the ephemeral certificate.
  * Ephemeral certificates also act as a form of identification and as a passwordless login.
*/
const {
	encode,
	decode
} = require('what-the-pack').initialize(2 ** 30);
const utility = require('Lucy');
const connections = {};
const {
	omit
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
		} = this;
		this.streamId = createStreamId();
		this.api = {};
		success(`StreamID:`, this.streamId);
		alert(`Creating Shared Keys`);
		const transmitKey = this.transmitKey = createSessionKey();
		const receiveKey = this.receiveKey = createSessionKey();
		this.profile = profile;
		this.service = service;
		this.ephemeralPublic = omit(profile.ephemeral, ['private']);
		if (profile.master) {
			this.masterPublic = omit(profile.master, ['private']);
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
		require('./send')(stream);
		require('./onMessage')(stream);
		require('./listening')(stream);
		(async () => {
			await require('./api')(stream);
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
udspPrototype.type = 'client';
udspPrototype.encode = encode;
udspPrototype.decode = decode;
udspPrototype.utility = utility;
require('../utilities/buildPacketSize')(udspPrototype);
require('../utilities/buildStringSize')(udspPrototype);
require('./liquid')(udspPrototype);
require('../utilities/console/')(udspPrototype);
require('../utilities/file/')(udspPrototype);
require('../utilities/crypto/')(udspPrototype);
require('../utilities/pluckBuffer')(udspPrototype);
require('../utilities/certificate/')(udspPrototype);
require('../utilities/watch/')(udspPrototype);
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
