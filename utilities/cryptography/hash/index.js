/*
	BLAKE3 test1 x 2,134,400- ops/sec ±2.58% (84 runs sampled)
	SHAKE256 test2 x 828,134 ops/sec ±4.38% (69 runs sampled)
*/
import blake3 from './blake3.js';
import { currentVersion } from '../../../defaults.js';
import { hasValue } from '@universalweb/acid';
import { setOptions } from '../setOption.js';
import shake256 from './shake256.js';
const cipherList = [blake3, shake256];
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
// import runBench from '#scripts/benchmark';
// runBench(async () => {
// 	return blake3('hello world');
// }, async () => {
// 	return shake256('hello world');
// });
