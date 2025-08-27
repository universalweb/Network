// Bloom Filter experiments
import { decode, encodeStrict } from '#utilities/serialize';
import { hash256, hash512 } from '#crypto/hash/shake256.js';
import { isBuffer, isPlainObject, merge } from '@universalweb/utilitylib';
import { random64ByteBuffer } from '#crypto/utils.js';
import runBench from '#utilities/benchmark';
// Cached module-level constants (camelCase)rr
const wordBits = 64n;
const wordMask = 63n;
const int32 = 32;
// Big-endian bytes -> BigInt
function bytesToBigInt(buf) {
	let x = 0n;
	// Number (small)
	const len = int32;
	// largest multiple of 8
	const full = len & ~7;
	for (let i = 0; i < full; i += 8) {
		// BigInt
		const chunk = buf.readBigUInt64BE(i);
		x = (x << 64n) | chunk;
	}
	const rem = len - full;
	if (rem !== 0) {
		let tail = 0n;
		for (let i = full; i < len; i++) {
			tail = (tail << 8n) | BigInt(buf[i]);
		}
		x = (x << BigInt(rem * 8)) | tail;
	}
	return x;
}
function readRemainingBytes(buf, start) {
	let x = 0n;
	for (let i = start; i < buf.length; i++) {
		x = (x << 8n) | BigInt(buf[i]);
	}
	return x;
}
// Normalize input to a Buffer: accepts Buffer or { hash: Buffer }
function inputToBuffer(input) {
	if (isBuffer(input)) {
		return input;
	}
	if (isPlainObject(input) && isBuffer(input.hash)) {
		return input.hash;
	}
	return undefined;
}
// Sparse BigInt bitset: Map<wordIndex(BigInt), wordBits(BigInt)>
class BigIntBitset {
	constructor(source) {
		// key: wordIndex(BigInt), value: 64-bit word BigInt
		this.sourceMap = source || new Map();
	}
	set(bitIndex) {
		const wordIdx = bitIndex >> 6n;
		const bit = 1n << (bitIndex & wordMask);
		const cur = this.sourceMap.get(wordIdx) ?? 0n;
		this.sourceMap.set(wordIdx, cur | bit);
	}
	has(bitIndex) {
		const wordIdx = bitIndex >> 6n;
		const word = this.sourceMap.get(wordIdx);
		if (word === undefined) {
			return false;
		}
		const bit = 1n << (bitIndex & wordMask);
		return (word & bit) !== 0n;
	}
	clear() {
		this.sourceMap.clear();
	}
	toEntries() {
		return this.sourceMap;
	}
	fromEntries(entries) {
		this.sourceMap.clear();
		this.sourceMap = entries;
	}
}
/**
 * BloomFilter using SHAKE256 double hashing with pre-hashed 64-byte inputs.
 * - mBits: total bits (BigInt)
 * - k: number of hash functions (BigInt).
 *
 * Index_i = (h1 + i*h2) mod mBits
 * where h1 = first 32 bytes of the provided SHAKE256-512 output
 *       h2 = last 32 bytes of the provided SHAKE256-512 output, forced odd.
 */
export class BloomFilter {
	constructor(config) {
		if (isBuffer(config)) {
			return this.fromBuffer(config);
		} else if (isPlainObject(config)) {
			return this.configure(config);
		}
	}
	configure(config) {
		if (isPlainObject(config)) {
			const {
				mBits,
				kHashes,
				sourceMap,
			} = config;
			this.mBits = BigInt(mBits);
			this.k = BigInt(kHashes);
			this.bits = new BigIntBitset(sourceMap);
		}
	}
	// Add an element using a precomputed 64-byte SHAKE256 output (Buffer or { hash: Buffer }).
	async add(input) {
		if (this.mBits <= 0n || this.k <= 0n) {
			return;
		}
		const data = inputToBuffer(input);
		if (!data || data.length !== 64) {
			// require 64-byte SHAKE256-512 output
			return;
		}
		const mBits = this.mBits;
		const k = this.k;
		const h1 = bytesToBigInt(data.subarray(0, 32));
		const h2 = bytesToBigInt(data.subarray(32, 64)) | 1n;
		let idx = h1 % mBits;
		const step = h2 % mBits;
		for (let i = 0n; i < k; i++) {
			this.bits.set(idx);
			// idx = (idx + step) % mBits;  // BigInt division per loop (slow)
			idx += step;
			// single conditional subtract
			if (idx >= mBits) {
				idx -= mBits;
			}
		}
	}
	// Test membership using a precomputed 64-byte SHAKE256 output only (no internal hashing).
	async has(input) {
		if (this.mBits <= 0n || this.k <= 0n) {
			return false;
		}
		const data = inputToBuffer(input);
		if (!data || data.length !== 64) {
			// require 64-byte SHAKE256-512 output
			return false;
		}
		const mBits = this.mBits;
		const k = this.k;
		const h1 = bytesToBigInt(data.subarray(0, 32));
		let idx = h1 % mBits;
		if (!this.bits.has(idx)) {
			return false;
		}
		if (k === 1n) {
			return true;
		}
		const step = (bytesToBigInt(data.subarray(32, 64)) | 1n) % mBits;
		// First successor index
		idx += step;
		if (idx >= mBits) {
			idx -= mBits;
		}
		for (let i = 1n; i < k; i++) {
			if (!this.bits.has(idx)) {
				return false;
			}
			idx += step;
			if (idx >= mBits) {
				idx -= mBits;
			}
		}
		return true;
	}
	clear() {
		this.bits.clear();
	}
	// CBOR snapshot that preserves BigInt and binary data
	exportBuffer() {
		// sourceMap: Array<[BigInt, BigInt]>
		return encodeStrict({
			mBits: this.mBits,
			kHashes: this.k,
			sourceMap: this.bits.sourceMap,
		});
	}
	async fromBuffer(cborBuffer) {
		const config = await decode(cborBuffer);
		console.log(config);
		this.configure(config);
		return this;
	}
}
// Assume h64a and h64b are Buffers of length 64 produced elsewhere via SHAKE256-512.
console.clear();
const h64a = await hash512(random64ByteBuffer());
// const h64b = await hash512(random64ByteBuffer());
// const h64c = await hash512(random64ByteBuffer());
// const h64d = await hash512(random64ByteBuffer());
// const bloom = new BloomFilter({
// 	mBits: 1024n,
// 	kHashes: 7n,
// });
// await bloom.add(h64a);
// await bloom.add(h64b);
// await bloom.add(h64c);
// await runBench(() => {
// 	bytesToBigInt(h64a);
// });
// console.log(bloom.bits);
// console.log(await bloom.has(h64a));
// console.log(await bloom.has(h64b));
// console.log(await bloom.has(h64c));
// console.log(await new BloomFilter(await bloom.exportBuffer()), (await bloom.exportBuffer()).length);
