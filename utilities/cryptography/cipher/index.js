import {
	compactMapArray,
	hasValue,
	isArray,
	isNumber
} from '@universalweb/acid';
import aegis256 from './AEGIS-256.js';
import { currentVersion } from '../../../defaults.js';
import { setOptions } from '../setOption.js';
import xChaCha from './xChaCha.js';
const cipherList = [xChaCha, aegis256];
export const ciphers = new Map();
const ciphersVersion1 = new Map();
ciphers.set(1, ciphersVersion1);
setOptions(ciphersVersion1, cipherList);
export function getCipher(cipherId = 0, version = currentVersion) {
	if (!hasValue(cipherId)) {
		return false;
	}
	const algoVersion = ciphers.get(version);
	if (algoVersion) {
		return algoVersion.get(cipherId);
	}
}
export function getCiphers(indexes, version = currentVersion) {
	if (indexes) {
		if (isNumber(indexes)) {
			return getCipher(indexes, version);
		} else if (isArray(indexes)) {
			const cipherSuitesArray = compactMapArray(indexes, (value) => {
				const cipherSuite = getCipher(value, version);
				if (cipherSuite) {
					return cipherSuite;
				}
			});
			return cipherSuitesArray;
		}
	}
	return getCipher('all', version);
}
