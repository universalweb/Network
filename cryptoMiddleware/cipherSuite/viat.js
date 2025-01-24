// Kyber-768+x25519 dilithium65+ed25519+SPHINCS xchacha20 shake256
// import viat from '../signature/viat.js';
import kyber768_x25519 from '../keyExchange/kyber768_x25519.js';
import shake256 from '@noble/hashes/sha3';
import xChaCha from '../encryption/XChaCha.js';
export const viatCipherSuite = {
	name: 'viatCipherSuite',
	alias: 'x25519_kyber768_xchacha20_dilithium65_sphincs192',
	description: 'Crystals-Kyber768 with XChaCha20 and SHAKE256.',
	id: 4,
	preferred: true,
	speed: 0,
	security: 1,
	hash: shake256,
	encryption: xChaCha,
	keyExchange: kyber768_x25519,
	extendedHandshake: true,
};
