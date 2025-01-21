import { currentVersion } from '../../defaults.js';
import { hasValue } from '@universalweb/acid';
import { setOptions } from '../utils.js';
import { xChaCha } from './xChaCha.js';
const cipherList = [xChaCha];
export const encryptionAlgorithms = new Map();
const encryptionAlgorithmsVersion1 = new Map();
encryptionAlgorithms.set(1, encryptionAlgorithmsVersion1);
setOptions(encryptionAlgorithmsVersion1, cipherList);
export function getEncryptionAlgorithm(encryptionAlgorithmName = 0, version = currentVersion) {
	if (!hasValue(encryptionAlgorithmName)) {
		return false;
	}
	const algoVersion = encryptionAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(encryptionAlgorithmName);
	}
}
