import { currentCertificateVersion, currentVersion } from '../../defaults.js';
import { hasValue } from '@universalweb/acid';
import { kyber768 } from './kyber768.js';
import { kyber768Half_x25519 } from './kyber768Half_x25519.js';
import { kyber768_x25519 } from './kyber768_x25519.js';
import { setOptions } from '../utils.js';
import { x25519 } from './x25519.js';
import { x25519_blake3 } from './x25519_blake3.js';
// import { x25519_sodium } from './x25519_blake2b.js';
const cipherList = [
	kyber768Half_x25519,
	kyber768_x25519,
	kyber768,
	x25519,
	x25519_blake3,
	// x25519_sodium
];
export const keyExchangeAlgorithm = new Map();
const keyExchangeAlgorithmVersion1 = new Map();
keyExchangeAlgorithm.set(currentVersion, keyExchangeAlgorithmVersion1);
keyExchangeAlgorithmVersion1.set('all', cipherList);
setOptions(keyExchangeAlgorithmVersion1, cipherList);
export function getKeyExchangeAlgorithm(algo = 0, version = currentCertificateVersion) {
	if (!hasValue(algo)) {
		return false;
	}
	const versionMap = keyExchangeAlgorithm.get(version);
	if (versionMap) {
		return versionMap.get(algo);
	}
}
