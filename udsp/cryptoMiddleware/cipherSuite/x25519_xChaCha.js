import * as defaultCrypto from '#crypto';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair,
	serverSetSessionAttach
} from '../keyExchange/x25519.js';
import {
	createSessionKey,
	decrypt,
	encrypt,
	nonceBox
} from '../encryption/XChaCha.js';
import {
	getPublicKeyFromPrivateKey,
	sign,
	signatureKeypair,
	signatureKeypairToEncryptionKeypair,
	signaturePrivateKeyToEncryptPrivateKey,
	signaturePublicKeyToEncryptPublicKey,
	verifySignature,
	verifySignatureDetached,
} from '../signature/ed25519.js';
import { assign } from '@universalweb/acid';
import { blake3 } from '../hash/blake3.js';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_client_session_keys,
	crypto_kx_server_session_keys,
} = sodiumLib;
const {
	randomConnectionId,
	randomBuffer,
	toHex,
	clearBuffer
} = defaultCrypto;
const hash = blake3.hash;
export const x25519_xChaCha = {
	name: 'x25519_xChaCha',
	alias: 'default',
	id: 0,
	speed: 1,
	security: 0,
	async clientEphemeralKeypair(destination) {
		const generatedKeypair = encryptionKeypair();
		return generatedKeypair;
	},
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
		console.log('Public Key from destination', destination.publicKey[0]);
		clientSetSessionAttach(source, destination);
	},
	async clientSetSession(source, destination, cipherData) {
		destination.publicKey = cipherData;
		return clientSetSession(source, destination);
	},
	async serverEphemeralKeypair(destination) {
		const source = encryptionKeypair();
		return source;
	},
	async serverInitializeSession(source, destination, cipherData) {
		destination.publicKey = cipherData;
		source.nextSession = await x25519_xChaCha.serverEphemeralKeypair(source, destination);
		await serverSetSessionAttach(source, destination);
	},
	async sendServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		frame[3] = source.nextSession.publicKey;
	},
	async serverSetSession(source, destination) {
		if (source.nextSession) {
			clearBuffer(source.publicKey);
			clearBuffer(source.privateKey);
			assign(source, source.nextSession);
			source.nextSession = null;
		}
		serverSetSessionAttach(source, destination);
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
	createSessionKey,
	certificateEncryptionKeypair: encryptionKeypair,
	decrypt,
	encrypt,
	preferred: true,
	hash,
};
