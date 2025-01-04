/** @format */
import * as defaultCrypto from '#crypto';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair,
	serverSetSessionAttach,
	x25519
} from '../keyExchange/x25519.js';
import {
	createSessionKey,
	decrypt,
	encrypt,
	nonceBox
} from '../encryption/XChaCha.js';
import { assign } from '@universalweb/acid';
import { blake3 } from '../hash/blake3.js';
import { kyber768_x25519 } from '../keyExchange/kyber768_x25519.js';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_client_session_keys,
	crypto_kx_server_session_keys
} = sodiumLib;
const {
	randomConnectionId,
	randomBuffer,
	toHex,
	clearBuffer,
	clearBuffers,
	getX25519Key,
	combineKeys,
	combineSessionKeys
} = defaultCrypto;
const { id: encryptionKeypairID } = x25519;
const hash = blake3.hash;
export const x25519_xChaCha = {
	name: 'x25519_xChaCha',
	alias: 'default',
	id: 0,
	speed: 1,
	security: 0,
	encryptionKeypairID,
	matchingKeyExchangeID: 0,
	async clientEphemeralKeypair(destination) {
		const generatedKeypair = await encryptionKeypair();
		return generatedKeypair;
	},
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
		console.log(
			'Public Key from destination',
			destination.publicKey[0],
			destination.publicKey.length
		);
		await clientSetSessionAttach(source, destination);
	},
	async clientSetSession(source, destination, cipherData) {
		const {
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey
		} = source;
		source.transmitKey = null;
		source.receiveKey = null;
		destination.publicKey = cipherData;
		await clientSetSessionAttach(source, destination);
		const {
			transmitKey,
			receiveKey
		} = source;
		combineSessionKeys(source, oldTransmitKey, oldReceiveKey);
		clearBuffers(oldTransmitKey, oldReceiveKey);
	},
	async serverEphemeralKeypair(destination) {
		const source = encryptionKeypair();
		return source;
	},
	async serverInitializeSession(source, destination, cipherData) {
		destination.publicKey = cipherData;
		source.nextSession = await x25519_xChaCha.serverEphemeralKeypair(
			source,
			destination
		);
		await serverSetSessionAttach(source, destination);
	},
	async sendServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		frame[3] = source.nextSession.publicKey;
	},
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
		await serverSetSessionAttach(source, destination);
		combineSessionKeys(source, oldTransmitKey, oldReceiveKey);
		clearBuffers(oldTransmitKey, oldReceiveKey);
	},
	async ephemeralKeypair(destination) {
		const generatedKeypair = encryptionKeypair();
		return generatedKeypair;
	},
	async encryptKeypair(source) {
		return encryptionKeypair(source);
	},
	async keypair(source) {
		return encryptionKeypair(source);
	},
	hybridToX25519(target) {
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
	},
	certificateKeypairCompatability(source, cipherSuiteId) {
		const encryptionKeypairAlgorithmId =
			source.certificate.encryptionKeypairAlgorithm.id;
		if (encryptionKeypairAlgorithmId === cipherSuiteId) {
			return;
		}
		if (encryptionKeypairAlgorithmId === kyber768_x25519.id) {
			x25519_xChaCha.hybridToX25519(source);
		}
	},
	certificateKeypairCompatabilityClient(source, destination) {
		return x25519_xChaCha.certificateKeypairCompatability(
			destination,
			source.cipherSuite.id
		);
	},
	certificateKeypairCompatabilityServer(source, destination) {
		return x25519_xChaCha.certificateKeypairCompatability(
			source,
			source.cipherSuite.id
		);
	},
	createSessionKey,
	certificateEncryptionKeypair: encryptionKeypair,
	decrypt,
	encrypt,
	preferred: true,
	hash
};
