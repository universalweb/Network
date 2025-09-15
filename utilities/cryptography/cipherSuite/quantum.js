// Kyber-768 dilithium65 aegis-256/xchacha20-poly1305 shake256
import { bufferAlloc, int32, randomize } from '#utilities/cryptography/utils';
import aegis256 from '../cipher/AEGIS256.js';
import dilithium from '../signature/dilithium65.js';
import kyber768 from '../keyExchange/kyber768.js';
import shake256 from '../hash/shake256.js';
import xChaCha from '../cipher/xChaCha.js';
export const quantumCipherSuite = {
	name: 'quantumCipherSuite',
	alias: 'dilithium65_sphincs192',
	description: 'ed25519, x25519, SHAKE256',
	id: 2,
	viatCipherID: 2,
	preferred: true,
	speed: 1,
	security: 1,
	hash: shake256,
	walletSize: 64,
	keyExchangeSeedSize: kyber768.seedSize,
	seedSize: kyber768.seedSize,
	encryption: aegis256,
	softwareEncryption: xChaCha,
	hardwareEncryption: aegis256,
	keyExchange: kyber768,
	signature: dilithium,
	// REPLAY PROTECTION AND USED TO MAKE TWO BLOCKS WITH IDENTICAL DATA UNIQUE
	createBlockNonce(size = 16) {
		return randomize(bufferAlloc(size));
	},
};
export default quantumCipherSuite;
