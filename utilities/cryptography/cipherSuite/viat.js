// Closed source not for private and or corporate use.
// SECURITY REASONS FOR AEGIS-256 - https://libsodium.gitbook.io/doc/secret-key_cryptography/aead
// Kyber-768+x25519 dilithium65+ed25519+SPHINCS aegis-256/xchacha20-poly1305 shake256
import { bufferAlloc, int32, randomize } from '#utilities/cryptography/utils';
import aegis256 from '../cipher/AEGIS256.js';
import kyber768_x25519 from '../keyExchange/kyber768_x25519.js';
import shake256 from '../hash/shake256.js';
import viat from '../signature/viat.js';
import xChaCha from '../cipher/xChaCha.js';
export const viatCipherSuite = {
	name: 'viatCipherSuite',
	alias: 'dilithium65_sphincs192',
	description: 'Dilithium65, SPHINCS+192s, ed25519, Kyber, x25519, SHAKE256.',
	addressType: 'hybrid',
	id: 1,
	viatCipherID: 1,
	preferred: true,
	speed: 0,
	security: 2,
	hash: shake256,
	walletSize: 32,
	keyExchangeSeedSize: kyber768_x25519.seedSize,
	seedSize: viat.seedSize,
	// Consider default encryption algo
	encryption: aegis256,
	softwareEncryption: xChaCha,
	hardwareEncryption: aegis256,
	keyExchange: kyber768_x25519,
	signature: viat,
	// REPLAY PROTECTION AND USED TO MAKE TWO BLOCKS WITH IDENTICAL DATA UNIQUE
	createBlockNonce(size = 16) {
		return randomize(bufferAlloc(size));
	},
};
export default viatCipherSuite;
