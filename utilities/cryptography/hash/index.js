import { hash256 as blake3 } from '#hash/blake3';
import { currentVersion } from '../../../defaults.js';
import { hasValue } from '@universalweb/utilitylib';
import { setOptions } from '../setOption.js';
import { hash256 as shake256 } from '#hash/shake256';
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
/*
	TEST 1
	BLAKE3 test1 x 2,134,400- ops/sec ±2.58% (84 runs sampled)
	SHAKE256 test2 x 828,134 ops/sec ±4.38% (69 runs sampled)
	TEST 2
	test1 x 2,123,805 ops/sec ±1.04% (89 runs sampled)
	test2 x 1,606,408 ops/sec ±1.38% (94 runs sampled)
	TEST 3
	test1 x 2,168,632 ops/sec ±0.43% (95 runs sampled)
	test2 x 1,578,221 ops/sec ±1.03% (95 runs sampled)
*/
// import runBench from '#utilities/benchmark';
// runBench(async () => {
// 	return blake3('hello world');
// }, async () => {
// 	return shake256('hello world');
// });
