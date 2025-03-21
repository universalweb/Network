import { assign, clear, isBuffer } from '@universalweb/acid';
// Closed source not for private and or corporate use.
import {
	clearBuffer,
	clearBuffers,
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import kyber768 from '../keyExchange/kyber768.js';
import kyber768Half_x25519 from '../keyExchange/kyber768Half_x25519.js';
import shake256 from '../hash/shake256.js';
import xChaCha from '../cipher/xChaCha.js';
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	alias: 'hpqthalf',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and SHAKE256 but certification verification only occurs with x25519.',
	id: 1,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		0: true,
		1: true
	},
	encryption: xChaCha,
	keyExchange: kyber768Half_x25519,
	hash: shake256,
};
// copyright © Thomas Marchi
