import * as defaultCrypto from '#crypto';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair,
	serverSetSessionAttach
} from './x25519.js';
import {
	createSessionKey,
	decrypt,
	encrypt,
	nonceBox
} from './XChaCha.js';
import {
	getSignaturePublicKeyFromPrivateKey,
	sign,
	signDetached,
	signatureKeypair,
	signatureKeypairToEncryptionKeypair,
	signaturePrivateKeyToEncryptPrivateKey,
	signaturePublicKeyToEncryptPublicKey,
	verifySignature,
	verifySignatureDetached,
} from './ed25519.js';
import { blake3 } from '@noble/hashes/blake3';
import { hash } from './blake3.js';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_client_session_keys,
	crypto_kx_server_session_keys,
} = sodiumLib;
const {
	randomConnectionId, randomBuffer, toBase64
} = defaultCrypto;
export const x25519_xchacha20 = {
	name: 'x25519_xchacha20',
	alias: 'default',
	id: 0,
	nonceBox,
	async encryptKeypair(source) {
		return encryptionKeypair(source);
	},
	createSessionKey,
	async keypair(source) {
		return encryptionKeypair(source);
	},
	async serverEphemeralKeypair(destination) {
		const source = encryptionKeypair();
		return source;
	},
	async ephemeralKeypair(destination) {
		const generatedKeypair = encryptionKeypair();
		return generatedKeypair;
	},
	async clientEphemeralKeypair(destination) {
		const generatedKeypair = encryptionKeypair();
		return generatedKeypair;
	},
	certificateEncryptionKeypair: encryptionKeypair,
	decrypt,
	encrypt,
	clientSetSession,
	clientInitializeSession: clientSetSessionAttach,
	serverInitializeSession: serverSetSessionAttach,
	serverSetSession: serverSetSessionAttach,
	preferred: true,
	hash: blake3,
};
