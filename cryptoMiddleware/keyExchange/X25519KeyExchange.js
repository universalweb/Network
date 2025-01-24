// CLASS To quickly create variations of x25519 key exchanges
import * as curve25519 from '@noble/curves/ed25519';
import {
	bufferAlloc,
	clearBuffer,
	int32,
	randomBuffer,
	randomize
} from '#utilities/crypto';
import { assign } from '@universalweb/acid';
import { clearBuffers } from '#crypto';
const kyber768_x25519ID = 3;
const keyAlgorithm = curve25519.x25519;
const generatePrivateKey = keyAlgorithm.utils.randomPrivateKey;
const generatePublicKey = keyAlgorithm.getPublicKey;
const getSharedSecret = curve25519.x25519.getSharedSecret;
const publicKeySize = int32;
const privateKeySize = int32;
const sessionKeySize = int32;
export async function encryptionKeypair(source, cleanFlag) {
	const privateKey = generatePrivateKey();
	const publicKey = generatePublicKey(privateKey);
	if (source) {
		source.publicKey = publicKey;
		source.privateKey = privateKey;
		return source;
	}
	return {
		publicKey,
		privateKey
	};
}
function hybridToX25519(target) {
	console.log('Attaching Compatible Key SLICE to X25519');
	const {
		certificate: {
			publicKeyX25519,
			privateKeyX25519
		}
	} = target;
	if (publicKeyX25519) {
		target.publicKey = publicKeyX25519;
	}
	if (privateKeyX25519) {
		target.privateKey = privateKeyX25519;
	}
}
function certificateKeypairCompatability(source, cipherSuiteId) {
	const encryptionKeypairAlgorithmId =
			source.certificate.encryptionKeypairAlgorithm.id;
	if (encryptionKeypairAlgorithmId === cipherSuiteId) {
		return;
	}
	if (encryptionKeypairAlgorithmId === kyber768_x25519ID) {
		hybridToX25519(source);
	}
}
class X25519KeyExchange {
	constructor(config) {
		assign(this, config);
	}
	async clientEphemeralKeypair(destination) {
		const generatedKeypair = await encryptionKeypair();
		return generatedKeypair;
	}
	async createSession(source, destination, target) {
		const sharedSecret = getSharedSecret(source?.privateKey || source, destination?.publicKey || destination);
		const hashSharedSecret = await this.concatHash512(
			sharedSecret,
			source?.publicKey || source,
			destination.publicKey
		);
		const transmitKey = hashSharedSecret.subarray(sessionKeySize);
		const receiveKey = hashSharedSecret.subarray(0, sessionKeySize);
		if (target) {
			target.sharedSecret = hashSharedSecret;
			target.receiveKey = receiveKey;
			target.transmitKey = transmitKey;
			return target;
		}
		return {
			sharedSecret: hashSharedSecret,
			receiveKey,
			transmitKey
		};
	}
	async clientSetSessionAttach(source, destination) {
		return this.createSession(source, destination, source);
	}
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
		console.log(
			'Public Key from destination',
			destination.publicKey[0],
			destination.publicKey.length
		);
		await this.clientSetSessionAttach(source, destination);
	}
	async clientSetSession(source, destination, cipherData) {
		const {
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey
		} = source;
		source.transmitKey = null;
		source.receiveKey = null;
		destination.publicKey = cipherData;
		await this.clientSetSessionAttach(source, destination);
		const {
			transmitKey,
			receiveKey
		} = source;
		await this.combineSessionKeys(oldTransmitKey, oldReceiveKey, source);
		clearBuffers(oldTransmitKey, oldReceiveKey);
	}
	serverEphemeralKeypair = encryptionKeypair;
	async serverSetSessionAttach(source, destination) {
		return this.createSession(source, destination, source);
	}
	async serverInitializeSession(source, destination, cipherData) {
		destination.publicKey = cipherData;
		source.nextSession = await encryptionKeypair();
		await this.serverSetSessionAttach(source, destination);
	}
	async sendServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		frame[3] = source.nextSession.publicKey;
	}
	async serverSetSession(source, destination) {
		const {
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey
		} = source;
		source.transmitKey = null;
		source.receiveKey = null;
		if (source.nextSession) {
			assign(source, source.nextSession);
			source.nextSession = null;
		}
		await this.serverSetSessionAttach(source, destination);
		await this.combineSessionKeys(oldTransmitKey, oldReceiveKey, source);
		clearBuffers(oldTransmitKey, oldReceiveKey);
	}
	ephemeralKeypair = encryptionKeypair;
	encryptionKeypair = encryptionKeypair;
	keypair = encryptionKeypair;
	certificateKeypairCompatability = certificateKeypairCompatability;
	certificateKeypairCompatabilityClient(source, destination) {
		return certificateKeypairCompatability(
			destination,
			source.cipherSuite.id
		);
	}
	certificateKeypairCompatabilityServer(source, destination) {
		return certificateKeypairCompatability(
			source,
			source.cipherSuite.id
		);
	}
	publicKeySize = publicKeySize;
	privateKeySize = privateKeySize;
	clientPublicKeySize = publicKeySize;
	clientPrivateKeySize = privateKeySize;
	serverPublicKeySize = publicKeySize;
	serverPrivateKeySize = privateKeySize;
	sessionKeySize = sessionKeySize;
	preferred = false;
	certificateEncryptionKeypair = encryptionKeypair;
}
export function x25519KeyExchange(config) {
	return new X25519KeyExchange(config);
}
export default x25519KeyExchange;
