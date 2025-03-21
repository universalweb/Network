// REASONS FOR AEGIS256 - https://libsodium.gitbook.io/doc/secret-key_cryptography/aead
// Kyber-768+x25519 dilithium65+ed25519+SPHINCS aegis-256/xchacha20-poly1305 shake256
import aegis256 from '../cipher/AEGIS-256.js';
import kyber768_x25519 from '../keyExchange/kyber768_x25519.js';
import shake256 from '../hash/shake256.js';
import viat from '../signature/viat.js';
import xChaCha from '../cipher/xChaCha.js';
export const viatCipherSuite = {
	name: 'viatCipherSuite',
	alias: 'x25519_kyber768_xchacha20_dilithium65_sphincs192',
	description: 'Crystals-Kyber768 with XChaCha20 and SHAKE256.',
	id: 4,
	preferred: true,
	speed: 0,
	security: 1,
	hash: shake256,
	encryption: aegis256,
	softwareEncryption: xChaCha,
	hardwareEncryption: aegis256,
	keyExchange: kyber768_x25519,
	signature: viat
};
export default viatCipherSuite;
