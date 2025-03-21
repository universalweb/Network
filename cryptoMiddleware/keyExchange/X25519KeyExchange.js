// CLASS To quickly create variations of x25519 key exchanges
// TODO: Use clear buffer functions for combine keys
// TODO: First Packet Encryption is required as an offering for any public key algorithm with small enough keys
import {
	bufferAlloc,
	clearBuffer,
	clearBuffers,
	int32,
	randomBuffer,
	randomize
} from '#crypto';
import {
	crypto_kx_keypair,
	crypto_scalarmult
} from '#utilities/sodium';
import { KeyExchange } from './keyExchange.js';
import { assign } from '@universalweb/acid';
import { introHeaderRPC } from '../../udsp/protocolHeaderRPCs.js';
import { introRPC } from '../../udsp/protocolFrameRPCs.js';
const kyber768_x25519ID = 3;
const publicKeySize = int32;
const privateKeySize = int32;
const sessionKeySize = int32;
// Send Intro encrypt with server key to  new client key
export async function getSharedSecret(source, destination) {
	const sharedSecret = bufferAlloc(sessionKeySize);
	await crypto_scalarmult(sharedSecret, source?.privateKey || source, destination?.publicKey || destination);
	console.log('Shared Secret', sharedSecret);
	return sharedSecret;
}
export async function keyExchangeKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(publicKeySize);
	const privateKey = config?.privateKey || bufferAlloc(privateKeySize);
	await crypto_kx_keypair(publicKey, privateKey);
	if (config) {
		config.publicKey = publicKey;
		config.privateKey = privateKey;
		return config;
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
function certificateKeypairCompatability(source, cipherId) {
	const keyExchangeAlgorithmId =
			source.certificate.keyExchangeAlgorithm.id;
	if (keyExchangeAlgorithmId === cipherId) {
		return;
	}
	if (keyExchangeAlgorithmId === kyber768_x25519ID) {
		hybridToX25519(source);
	}
}
class X25519KeyExchange extends KeyExchange {
	constructor(config) {
		super(config);
		assign(this, config);
		return this;
	}
	getSharedSecret = getSharedSecret;
	keyExchangeKeypair = keyExchangeKeypair;
	clientEphemeralKeypair = keyExchangeKeypair;
	serverEphemeralKeypair = keyExchangeKeypair;
	hybridToX25519 = hybridToX25519;
	async clientInitializeSession(source, destination) {
		source.sharedSecret = await getSharedSecret(source, destination);
		await this.createClientSession(source, destination, source);
	}
	async createClientIntro(source, destination, frame, header) {
		console.log('Send Client Intro', source.cipherData);
		header[1] = source.nextSession.publicKey;
	}
	async clientSetSession(source, destination, cipherData) {
		console.log('clientSetSession');
		source.sharedSecret = await getSharedSecret(source, cipherData);
		console.log('sharedSecret', source.sharedSecret);
		await this.finalizeSession(source, destination);
		await this.clientCleanup(source);
		source.nextSession = null;
	}
	async serverInitializeSessionMethod(source, destination, cipherData) {
		source.sharedSecret = await getSharedSecret(source, destination);
		source.nextSession = await keyExchangeKeypair();
	}
	// The only thing which won't be public by default is the public key
	async createServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		header[1] = source.nextSession.publicKey;
	}
	async serverSetSession(source, destination, cipherData) {
		console.log('serverSetSession');
		if (source.nextSession) {
			source.sharedSecret = await getSharedSecret(source.nextSession, destination);
			source.nextSession = null;
		}
		await this.finalizeSession(source, destination);
		await this.serverCleanup(source);
		source.nextSession = null;
	}
	async finalizeSession(source, destination) {
		console.log('finalizeSession', source.type);
		await this.finalizeSessionKeys(source, destination);
	}
	certificateKeypairCompatability = certificateKeypairCompatability;
	certificateKeypairCompatabilityClient(source, destination) {
		return certificateKeypairCompatability(
			destination,
			source.cipher.id
		);
	}
	certificateKeypairCompatabilityServer(source, destination) {
		return certificateKeypairCompatability(
			source,
			source.cipher.id
		);
	}
	async initializeKeypair(source, target) {
		if (target) {
			target.publicKey = source.publicKey;
			target.privateKey = source.privateKey;
			return target;
		}
		return assign({}, source);
	}
	async initializeCertificateKeypair(keypair, target) {
		return this.initializeKeypair(target, keypair);
	}
	publicKeySize = publicKeySize;
	privateKeySize = privateKeySize;
	clientPublicKeySize = publicKeySize;
	clientPrivateKeySize = privateKeySize;
	serverPublicKeySize = publicKeySize;
	serverPrivateKeySize = privateKeySize;
	sessionKeySize = sessionKeySize;
	preferred = false;
	certificateEncryptionKeypair = keyExchangeKeypair;
}
export function x25519KeyExchange(config) {
	return new X25519KeyExchange(config);
}
export default x25519KeyExchange;
