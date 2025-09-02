// CLASS To quickly create variations of x25519 key exchanges
// TODO: Use clear buffer functions for combine keys
// TODO: First Packet Encryption is required as an offering for any public key algorithm with small enough keys
import {
	bufferAlloc,
	clearBuffer,
	clearBuffers,
	int32,
	randomBuffer,
	randomize,
} from '#utilities/cryptography/utils';
import {
	crypto_kx_keypair,
	crypto_scalarmult,
	crypto_scalarmult_BYTES,
} from '#utilities/cryptography/sodium';
import { KeyExchange } from './keyExchange.js';
import { assign } from '@universalweb/utilitylib';
import { introHeaderRPC } from '../../../udsp/rpc/headerRPC.js';
import { introRPC } from '../../../udsp/rpc/frameRPC.js';
const kyber768_x25519ID = 3;
const publicKeySize = int32;
const privateKeySize = int32;
const sessionKeySize = int32;
// Send Intro encrypt with server key to  new client key
export async function getSharedSecret(source, destination) {
	const sharedSecret = bufferAlloc(sessionKeySize);
	await crypto_scalarmult(sharedSecret, source?.privateKey || source, destination?.publicKey || destination);
	source.logInfo('Shared Secret', sharedSecret);
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
		privateKey,
	};
}
function hybridToX25519(target) {
	console.log('Attaching Compatible Key SLICE to only X25519 portion');
	const {
		certificate: {
			publicKeyX25519,
			privateKeyX25519,
		},
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
	// onClientInitialization
	async onClientInitialization(source, destination) {
		source.sharedSecret = await getSharedSecret(source, destination);
		await this.createClientSession(source, destination, source);
	}
	async createClientIntro(source, destination, frame, header) {
		source.logInfo('Send Client Intro', source.cipherData);
		header[2] = source.publicKey;
	}
	async onServerClientInitialization(source, destination) {
		source.logInfo('onServerClientInitialization');
	}
	// GENERATE SERVER EPHEMERAL KEY PAIR
	// THEN UPGRADE KEYS HERE AFTER BODY IS PROCESSED
	async onClientIntroHeader(source, destination, cipherData, header) {
		destination.publicKey = cipherData;
		// console.log(destination, source.privateKey);
		// throw new Error('onClientIntroHeader');
		source.sharedSecret = await getSharedSecret(source, cipherData);
		await this.createServerSession(source, destination, source);
	}
	// AFTER CLIENT INTRO HEADER FINISH PFS KEY UPGRADE
	// TODO: CREATE METHOD TO SKIP THIS IF JUST NEED INTRO AGAIN or Don't see response?
	async onClientIntroHeaderNoFrame(source, destination, cipherData, header) {
		const nextSession = await keyExchangeKeypair();
		assign(source, nextSession);
		source.sharedSecret = await getSharedSecret(source, destination);
		await this.upgradeSessionKeys(source, destination);
		await this.cleanup(source);
	}
	async onClientIntro(source, destination, frame, header) {
		const cipherData = header[2];
		return this.onClientIntroHeaderNoFrame(source, destination, cipherData, frame);
	}
	async createServerIntro(source, destination, frame, header) {
		source.logInfo('Send Server Intro', source.cipherData);
		header[2] = source.publicKey;
	}
	// onServerIntroHeader & on
	async onServerIntroHeader(source, destination, cipherData, header) {
		source.logInfo('onServerIntroHeader');
		if (cipherData) {
			source.sharedSecret = await getSharedSecret(source, cipherData);
			await this.upgradeSessionKeys(source, destination);
			source.logInfo('sharedSecret', source.sharedSecret);
			await this.clientCleanup(source);
		}
	}
	async onServerIntroHeaderNoFrame(source, destination, cipherData, header) {
		source.logInfo('onServerIntroHeaderNoFrame');
	}
	async onServerIntro(source, destination, cipherData, frame, header) {
		source.logInfo('onServerIntro');
	}
	async serverCleanup(source, destination) {
		source.logInfo('serverCleanup', source.type);
		await super.serverCleanup(source);
		await super.cleanup();
	}
	// CLIENT CLEANUP
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
	getSharedSecret = getSharedSecret;
	keyExchangeKeypair = keyExchangeKeypair;
	clientEphemeralKeypair = keyExchangeKeypair;
	serverEphemeralKeypair = keyExchangeKeypair;
	hybridToX25519 = hybridToX25519;
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
