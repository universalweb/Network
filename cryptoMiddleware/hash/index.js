import { blake3 } from './blake3.js';
import { currentVersion } from '../../defaults.js';
import { hasValue } from '@universalweb/acid';
import { setOptions } from '../utils.js';
const cipherList = [blake3];
export const hashAlgorithms = new Map();
const hashAlgorithmsVersion1 = new Map();
hashAlgorithms.set(1, hashAlgorithmsVersion1);
setOptions(hashAlgorithmsVersion1, cipherList);
export function getHashAlgorithm(hashAlgorithmName = 0, version = currentVersion) {
	if (!hasValue(hashAlgorithmName)) {
		return false;
	}
	const algoVersion = hashAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(hashAlgorithmName);
	}
}
