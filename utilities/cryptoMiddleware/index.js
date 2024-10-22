/* TODO: Add Mobile/Embedded Preferred option & algorithms. */
import * as defaultCrypto from '#crypto';
import {
	assign,
	clearBuffer,
	compactMapArray,
	eachArray,
	hasValue,
	isArray,
	isNumber,
	isUndefined
} from '@universalweb/acid';
import { currentCertificateVersion, currentVersion } from '../../defaults.js';
import { blake3 } from './hash/blake3.js';
import { dilithium44 } from './signature/dilithium44.js';
import { dilithium44_ed25519 } from './signature/dilithium44_ed25519.js';
import { dilithium65 } from './signature/dilithium65.js';
import { dilithium87 } from './signature/dilithium87.js';
import { ed25519 } from './signature/ed25519.js';
import { kyber768 } from './keyExchange/kyber768.js';
import { kyber768Half_x25519 } from './keyExchange/kyber768Half_x25519.js';
import { kyber768_x25519 } from './keyExchange/kyber768_x25519.js';
import { kyber768_xChaCha } from './cipherSuite/Kyber768_xChaCha.js';
import { x25519 } from './keyExchange/x25519.js';
import { x25519_kyber768Half_xchacha20 } from './cipherSuite/x25519_Kyber768Half_xChaCha.js';
import { x25519_xChaCha } from './cipherSuite/x25519_xChaCha.js';
function setOption(source, option) {
	const {
		id, name: cipherName, alias
	} = option;
	if (hasValue(cipherName)) {
		source.set(cipherName, option);
	}
	if (hasValue(id)) {
		source.set(id, option);
	}
	if (hasValue(alias)) {
		source.set(alias, option);
	}
}
export const cipherSuites = new Map();
const cipherSuitesVersion1 = new Map();
cipherSuites.set(currentVersion, cipherSuitesVersion1);
cipherSuitesVersion1.set('all', [
	x25519_xChaCha,
	x25519_kyber768Half_xchacha20,
	kyber768_xChaCha
]);
setOption(cipherSuitesVersion1, x25519_xChaCha);
setOption(cipherSuitesVersion1, x25519_kyber768Half_xchacha20);
setOption(cipherSuitesVersion1, kyber768_xChaCha);
export const encryptionKeypairAlgorithm = new Map();
const encryptionKeypairAlgorithmVersion1 = new Map();
encryptionKeypairAlgorithm.set(currentVersion, encryptionKeypairAlgorithmVersion1);
encryptionKeypairAlgorithm.set('all', [
	kyber768Half_x25519,
	kyber768_x25519,
	kyber768,
	x25519,
]);
setOption(encryptionKeypairAlgorithmVersion1, kyber768);
setOption(encryptionKeypairAlgorithmVersion1, x25519);
setOption(encryptionKeypairAlgorithmVersion1, kyber768Half_x25519);
setOption(encryptionKeypairAlgorithmVersion1, kyber768_x25519);
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
cipherSuitesCertificatesVersion1.set('all', [
	x25519_xChaCha,
	x25519_kyber768Half_xchacha20,
	kyber768_xChaCha
]);
setOption(cipherSuitesCertificatesVersion1, x25519_xChaCha);
setOption(cipherSuitesCertificatesVersion1, x25519_kyber768Half_xchacha20);
setOption(cipherSuitesCertificatesVersion1, kyber768_xChaCha);
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
export const publicKeyAlgorithms = new Map();
const publicKeyAlgorithmVersion1 = new Map();
publicKeyAlgorithms.set(1, publicKeyAlgorithmVersion1);
publicKeyAlgorithmVersion1.set('all', [
	ed25519,
	dilithium44_ed25519,
	dilithium44,
	dilithium65,
	dilithium87
]);
setOption(publicKeyAlgorithmVersion1, ed25519);
setOption(publicKeyAlgorithmVersion1, dilithium44_ed25519);
setOption(publicKeyAlgorithmVersion1, dilithium44);
setOption(publicKeyAlgorithmVersion1, dilithium65);
setOption(publicKeyAlgorithmVersion1, dilithium87);
export function getSignatureAlgorithm(publicKeyAlgorithmName = 0, version = currentVersion) {
	if (!hasValue(publicKeyAlgorithmName)) {
		return false;
	}
	const versionMap = publicKeyAlgorithms.get(version);
	if (versionMap) {
		return versionMap.get(publicKeyAlgorithmName);
	}
}
export const publicKeyCertificateAlgorithms = new Map();
const publicKeyCertificateAlgorithmsVersion1 = new Map();
publicKeyCertificateAlgorithms.set(currentVersion, publicKeyCertificateAlgorithmsVersion1);
publicKeyCertificateAlgorithmsVersion1.set('all', [
	ed25519,
	dilithium44_ed25519,
	dilithium44,
	dilithium65,
	dilithium87
]);
setOption(publicKeyCertificateAlgorithmsVersion1, ed25519);
setOption(publicKeyCertificateAlgorithmsVersion1, dilithium44_ed25519);
setOption(publicKeyCertificateAlgorithmsVersion1, dilithium44);
setOption(publicKeyCertificateAlgorithmsVersion1, dilithium65);
setOption(publicKeyCertificateAlgorithmsVersion1, dilithium87);
export function getSignatureAlgorithmByCertificate(publicKeyAlgorithmName = 0, version = currentCertificateVersion) {
	if (!hasValue(publicKeyAlgorithmName)) {
		return false;
	}
	const algoVersion = publicKeyCertificateAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(publicKeyAlgorithmName);
	}
}
export const hashAlgorithms = new Map();
const hashAlgorithmsVersion1 = new Map();
hashAlgorithms.set(1, hashAlgorithmsVersion1);
setOption(hashAlgorithmsVersion1, blake3);
export function getHashAlgorithm(hashAlgorithmName = 0, version = currentVersion) {
	if (!hasValue(hashAlgorithmName)) {
		return false;
	}
	const algoVersion = hashAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(hashAlgorithmName);
	}
}
