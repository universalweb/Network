// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { kyber768_x25519 } from '../keyExchange/kyber768_x25519.js';
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	blake3CombineKeys,
	get25519Key,
	getKyberKey
} = defaultCrypto;
const {
	clientInitializeSession,
	serverInitializeSession,
	serverSetSession,
	clientSetSession,
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	ml_kem768,
	hash
} = kyber768_x25519;
export const x25519_kyber768_xchacha20 = {
	name: 'x25519_kyber768_xchacha20',
	alias: 'hpqt',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and Blake3.',
	id: 3,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		0: true,
		1: true
	},
	hash,
	decrypt,
	encrypt,
	clientInitializeSession,
	serverInitializeSession,
	serverSetSession,
	clientSetSession,
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
};

