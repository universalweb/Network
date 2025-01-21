import { decrypt, encrypt, encryptionOverhead } from '../encryption/XChaCha.js';
import { dilithium65 } from '../signature/dilithium65.js';
import { kyber768_x25519 } from '../keyExchange/kyber768_x25519.js';
import { shake256 } from '@noble/hashes/sha3';
import { x25519_kyber768Half_xchacha20 } from './x25519_Kyber768Half_xChaCha.js';
// Kyber-768+x25519 dilithium65+ed25519+ xchacha20 shake256
export const viatCipherSuite = {
	name: 'viatCipherSuite',
	alias: 'x25519_kyber768_xchacha20_dilithium65_sphincs+',
	description: 'Crystals-Kyber768 with XChaCha20 and SHAKE256.',
	id: 2,
	preferred: true,
	speed: 0,
	security: 1,
	extendedHandshake: true,
};
