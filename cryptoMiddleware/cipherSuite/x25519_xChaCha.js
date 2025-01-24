import {
	clearBuffer,
	clearBuffers,
	randomBuffer,
	toHex,
} from '#crypto';
import XChaCha from '../encryption/XChaCha.js';
import shake256 from '../hash/shake256.js';
import x25519 from '../keyExchange/x25519.js';
export const x25519_xChaCha = {
	name: 'x25519_xChaCha',
	alias: 'default',
	id: 0,
	speed: 1,
	security: 0,
	encryption: XChaCha,
	keyExchange: x25519,
	hash: shake256,
	preferred: true,
};
