import {
	compactMapArray,
	hasValue,
	isArray,
	isNumber,
} from '@universalweb/utilitylib';
import { currentVersion } from '../../../defaults.js';
import { setOptions } from '../setOption.js';
import { viatCipherSuite } from './viat.js';
const cipherList = [viatCipherSuite];
export const cipherSuites = new Map();
const cipherSuitesVersion1 = new Map();
cipherSuites.set(currentVersion, cipherSuitesVersion1);
cipherSuitesVersion1.set('all', cipherList);
setOptions(cipherSuitesVersion1, cipherList);
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
