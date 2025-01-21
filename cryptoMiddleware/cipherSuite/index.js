import {
	compactMapArray,
	hasValue,
	isArray,
	isNumber
} from '@universalweb/acid';
import { currentCertificateVersion, currentVersion } from '../../defaults.js';
import { encryptionKeypairAlgorithm } from '../index';
import { kyber768_xChaCha } from '../cipherSuite/Kyber768_xChaCha.js';
import { setOptions } from '../utils.js';
import { viatCipherSuite } from './viat.js';
import { x25519_kyber768Half_xchacha20 } from '../cipherSuite/x25519_Kyber768Half_xChaCha.js';
import { x25519_kyber768_xchacha20 } from './x25519_Kyber768_xChaCha.js';
import { x25519_xChaCha } from '../cipherSuite/x25519_xChaCha.js';
const cipherList = [
	x25519_xChaCha,
	x25519_kyber768Half_xchacha20,
	kyber768_xChaCha,
	x25519_kyber768_xchacha20,
	viatCipherSuite
];
export const cipherSuites = new Map();
const cipherSuitesVersion1 = new Map();
cipherSuites.set(currentVersion, cipherSuitesVersion1);
cipherSuitesVersion1.set('all', cipherList);
setOptions(cipherSuitesVersion1, cipherList);
export function getEncryptionKeypairAlgorithm(algo = 0, version = currentCertificateVersion) {
	if (!hasValue(algo)) {
		return false;
	}
	const versionMap = encryptionKeypairAlgorithm.get(version);
	if (versionMap) {
		return versionMap.get(algo);
	}
}
export const cipherSuitesCertificates = new Map();
const cipherSuitesCertificatesVersion1 = new Map();
cipherSuitesCertificates.set(currentVersion, cipherSuitesCertificatesVersion1);
cipherSuitesCertificatesVersion1.set('all', cipherList);
setOptions(cipherSuitesCertificatesVersion1, cipherList);
export function getCipherSuite(cipherSuiteName = 0, version = currentVersion) {
	if (!hasValue(cipherSuiteName)) {
		return false;
	}
	const versionMap = cipherSuites.get(version);
	if (versionMap) {
		return versionMap.get(cipherSuiteName);
	}
}
export function getCipherSuites(indexes, version = currentVersion) {
	if (indexes) {
		if (isNumber(indexes)) {
			return getCipherSuite(indexes, version);
		} else if (isArray(indexes)) {
			const cipherSuitesArray = compactMapArray(indexes, (value) => {
				const cipherSuite = getCipherSuite(value, version);
				if (cipherSuite) {
					return cipherSuite;
				}
			});
			return cipherSuitesArray;
		}
	}
	return getCipherSuite('all', version);
}
