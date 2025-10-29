// x25519 ed25519 aegis-256/xchacha20-poly1305 shake256
import { bufferAlloc, int32, randomize } from '#utilities/cryptography/utils';
import aegis256 from '../cipher/AEGIS256.js';
import dilithium from '#crypto/signature/dilithium44.js';
import ed25519 from '../signature/ed25519.js';
import shake256 from '../hash/shake256.js';
import viatDefaults from '#viat/defaults';
import x25519 from '../keyExchange/x25519.js';
import xChaCha from '../cipher/xChaCha.js';
export const legacyCipherSuite = {
	name: 'legacyCipherSuite',
	alias: 'legacy',
	description: 'ed25519, x25519, SHAKE256 BACKUP: Dilithium',
	addressType: 'legacy',
	id: 0,
	viatCipherID: 0,
	preferred: true,
	speed: 2,
	security: 0,
	hash: shake256,
	walletSize: viatDefaults.wallets.legacy.walletSize,
	keyExchangeSeedSize: x25519.seedSize,
	seedSize: ed25519.seedSize,
	encryption: aegis256,
	softwareEncryption: xChaCha,
	hardwareEncryption: aegis256,
	keyExchange: x25519,
	signature: ed25519,
	backupSignature: dilithium,
	// REPLAY PROTECTION AND USED TO MAKE TWO BLOCKS WITH IDENTICAL DATA UNIQUE
	createBlockNonce(size = 16) {
		return randomize(bufferAlloc(size));
	},
};
export default legacyCipherSuite;
