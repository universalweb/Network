import * as defaultCrypto from '#crypto';
import {
	clientSessionKeysAttach,
	encryptionKeypair,
	serverSessionKeys,
	serverSessionKeysAttach
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
	short: 'x25519',
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
	async ephemeralServerKeypair(destination) {
		const source = encryptionKeypair();
		source.framePublicKey = source.publicKey;
		return source;
	},
	async ephemeralKeypair(destination) {
		const generatedKeypair = encryptionKeypair();
		generatedKeypair.headerPublicKey = generatedKeypair.publicKey;
		return generatedKeypair;
	},
	certificateEncryptionKeypair: encryptionKeypair,
	decrypt,
	encrypt,
	clientSessionKeys: clientSessionKeysAttach,
	async clientInitialSession(...args) {
		return clientSessionKeysAttach(...args);
	},
	serverSessionKeys: serverSessionKeysAttach,
	preferred: true,
	hash: blake3,
};
