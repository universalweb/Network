// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clear, isBuffer } from '@universalweb/acid';
import {
	clientSetSession,
	encryptionKeypair as encryptionKeypairX25519,
	get25519KeyCopy,
	getX25519Key,
	serverSetSession,
	serverSetSessionAttach,
} from '../keyExchange/x25519_blake3.js';
import { decapsulate, encapsulate } from '../keyExchange/kyber768.js';
import { decrypt, encrypt, encryptionOverhead } from '../encryption/XChaCha.js';
import { kyber768Half_x25519 } from '../keyExchange/kyber768Half_x25519.js';
const {
	randomBuffer,
	toBase64,
	toHex,
	combineKeysSHAKE256,
	clearBuffers,
	clearBuffer,
	clearSessionKeys,
	clearSessionWithSharedSecret,
} = defaultCrypto;
const {
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	ml_kem768,
	hash,
	getKyberKey
} = kyber768Half_x25519;
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	alias: 'hpqthalf',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and SHAKE256 but certification verification only occurs with x25519.',
	id: 1,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		0: true,
		1: true
	},
	clientEphemeralKeypair,
	generateSeed,
	keypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	hash,
	decrypt,
	encrypt,
	encryptionOverhead
};
// copyright © Thomas Marchi
