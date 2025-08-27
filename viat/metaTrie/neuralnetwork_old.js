/* eslint-disable @stylistic/no-mixed-operators */
/* eslint-disable no-shadow */
// Import async serialization helpers (CBOR)
import { decode, encodeStrict } from '#utilities/serialize';
// Utility helpers
import { isBuffer, isPlainObject, merge } from '@universalweb/utilitylib';
// Patch Node's util for tfjs-node (Node >=18 removed util.isNullOrUndefined)
import { createRequire } from 'module';
// Used to detect direct execution for the demo
import { fileURLToPath } from 'url';
// Import hash512 only for demo data generation; do not re-hash inputs inside Bloom
import { hash512 } from '#utilities/cryptography/hash/shake256';
import path from 'path';
// Random 64-byte buffer generator for demo convenience
import { random64ByteBuffer } from '#crypto/utils.js';
// Create a CommonJS require for util
const require = createRequire(import.meta.url);
// Load util to patch isNullOrUndefined used by tfjs-node
const utilMod = require('util');
if (typeof utilMod.isNullOrUndefined !== 'function') {
	// Add a compatibility shim for tfjs-node
	utilMod.isNullOrUndefined = (v) => {
		return v === null || v === undefined;
	};
}
// Load tfjs-node after the util patch so backend uses it
const tf = await import('@tensorflow/tfjs-node');
// Neural-network-based Bloom filter (no backup classical Bloom).
// - Inputs are always 64-byte hashes (Buffer or Uint8Array).
// - Uses a tiny MLP (tfjs-node) with deterministic weights seeded by a salt.
// - Produces k index positions in [0, mBits) and sets/checks bits in a bit array.
// - State (bit array + config) can be serialized via CBOR (encodeStrict/decode).
const DEFAULTS = Object.freeze({
	// 1,048,576 bits (~128 KiB)
	mBits: 1024 * 1024,
	// Number of indices per element
	kHashes: 7,
	// Hidden layer sizes for the MLP (input = 64, output = kHashes)
	layers: [128, 64],
	// Optional seed (Buffer 64 bytes). If not provided, one is generated.
	seed: undefined,
});
// Ensure input is exactly 64 bytes (Buffer or Uint8Array)
function assert64ByteInput(buf) {
	if (!isBuffer(buf) && !(buf instanceof Uint8Array)) {
		throw new TypeError('Input must be a Buffer or Uint8Array');
	}
	if (buf.length !== 64) {
		throw new RangeError('Input must be exactly 64 bytes');
	}
}
// Simple bit-array helpers
class BitArray {
	constructor(mBits) {
		if (!Number.isInteger(mBits) || mBits <= 0) {
			throw new RangeError('mBits must be a positive integer');
		}
		this.mBits = mBits;
		this.bytes = Buffer.alloc(((mBits + 7) >> 3), 0);
	}
	setBit(i) {
		const idx = i >>> 3;
		const bit = i & 7;
		this.bytes[idx] |= (1 << bit);
	}
	getBit(i) {
		const idx = i >>> 3;
		const bit = i & 7;
		return (this.bytes[idx] & (1 << bit)) !== 0;
	}
	setMany(indices) {
		for (let i = 0; i < indices.length; i++) {
			this.setBit(indices[i]);
		}
	}
	allSet(indices) {
		for (let i = 0; i < indices.length; i++) {
			if (!this.getBit(indices[i])) {
				return false;
			}
		}
		return true;
	}
}
// Deterministic SplitMix64 PRNG using BigInt
class SplitMix64 {
	constructor(seedBigInt) {
		this.state = seedBigInt & 0xFFFFFFFFFFFFFFFFn;
	}
	next64() {
		// https://xoshiro.di.unimi.it/splitmix64.c
		this.state = (this.state + 0x9E3779B97F4A7C15n) & 0xFFFFFFFFFFFFFFFFn;
		let z = this.state;
		z = (z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n & 0xFFFFFFFFFFFFFFFFn;
		z = (z ^ (z >> 27n)) * 0x94D049BB133111EBn & 0xFFFFFFFFFFFFFFFFn;
		z = z ^ (z >> 31n);
		return z & 0xFFFFFFFFFFFFFFFFn;
	}
	// Double in [0,1)
	nextDouble() {
		// Take top 53 bits to produce a JS Number
		const z = this.next64();
		const mantissa = Number(z >> 11n) & ((1 << 53) - 1);
		// 2^53
		return mantissa / 9007199254740992;
	}
	// Uniform in [-limit, limit]
	nextUniform(limit) {
		return (this.nextDouble() * 2 - 1) * limit;
	}
}
// Build a deterministic seed BigInt from a 64-byte seed buffer without hashing (avoid async hash512)
function seedBigIntFromBuffer(buf64) {
	assert64ByteInput(buf64);
	// Fold 8x8-byte chunks with XOR and a fixed odd constant to diffuse bits.
	// No re-hashing of input data.
	let s = 0n;
	// Odd constant
	const C = 0x9E3779B185EBCA87n;
	for (let i = 0; i < 8; i++) {
		let v = 0n;
		const off = i * 8;
		for (let j = 0; j < 8; j++) {
			v = (v << 8n) | BigInt(buf64[off + j]);
		}
		s ^= (v + C) * C;
	}
	if (s === 0n) {
		s = 1n;
	}
	return s & 0xFFFFFFFFFFFFFFFFn;
}
// Initialize Dense layer weights deterministically using SplitMix64 and Glorot
function initDenseWeightsDeterministic(rng, fanIn, fanOut) {
	// Glorot uniform limit
	const limit = Math.sqrt(6 / (fanIn + fanOut));
	const kernel = new Float32Array(fanIn * fanOut);
	for (let i = 0; i < kernel.length; i++) {
		kernel[i] = rng.nextUniform(limit);
	}
	// Bias initialized to zeros
	const bias = new Float32Array(fanOut);
	return {
		kernel,
		bias,
	};
}
function buildDeterministicMLP({
	inputSize, hidden, outputSize, seedBuf,
}) {
	const seed = seedBigIntFromBuffer(seedBuf);
	const rng = new SplitMix64(seed);
	const model = tf.sequential();
	let prev = inputSize;
	// Hidden layers with tanh activation for good mixing
	for (let i = 0; i < hidden.length; i++) {
		const units = hidden[i];
		model.add(tf.layers.dense({
			units,
			activation: 'tanh',
			inputShape: i === 0 ? [inputSize] : undefined,
			useBias: true,
		}));
		// Assign deterministic weights
		const {
			kernel, bias,
		} = initDenseWeightsDeterministic(rng, prev, units);
		const kernelT = tf.tensor2d(kernel, [prev, units], 'float32');
		const biasT = tf.tensor1d(bias, 'float32');
		model.layers[model.layers.length - 1].setWeights([kernelT, biasT]);
		kernelT.dispose();
		biasT.dispose();
		prev = units;
	}
	// Output layer with tanh; map [-1,1] -> [0,1] later
	model.add(tf.layers.dense({
		units: outputSize,
		activation: 'tanh',
		useBias: true,
	}));
	{
		const {
			kernel, bias,
		} = initDenseWeightsDeterministic(rng, prev, outputSize);
		const kernelT = tf.tensor2d(kernel, [prev, outputSize], 'float32');
		const biasT = tf.tensor1d(bias, 'float32');
		model.layers[model.layers.length - 1].setWeights([kernelT, biasT]);
		kernelT.dispose();
		biasT.dispose();
	}
	return model;
}
// Normalize to [-1, 1] to avoid tanh centering all outputs near 0
function normalizeInput64(buf64) {
	// Map bytes to [-1,1]
	const x = new Float32Array(64);
	for (let i = 0; i < 64; i++) {
		x[i] = (buf64[i] - 127.5) / 127.5;
	}
	return x;
}
// Map NN outputs deterministically to indices in [0, mBits)
// Mix in 32-bit words from the 64-byte hash (no re-hash) for strong dispersion.
function mapNNOutputsToIndices(y, mBits, buf64) {
	const k = y.length;
	const indices = new Uint32Array(k);
	for (let i = 0; i < k; i++) {
		// y[i] in [-1,1] -> [0,1)
		let v = (y[i] + 1) * 0.5;
		if (v <= 0) {
			v = 0;
		}
		// Avoid hitting exactly 1.0 to keep modulo stable
		if (v >= 1) {
			v = 1 - 1e-7;
		}
		// Base from NN
		let u = (v * 0x100000000) >>> 0;
		// Per-index 32-bit tweak from input bytes (wrap inside 64 bytes)
		const off = (i * 4) & 63;
		const tweak = (
			(buf64[off]) |
            (buf64[(off + 1) & 63] << 8) |
            (buf64[(off + 2) & 63] << 16) |
            (buf64[(off + 3) & 63] << 24)
		) >>> 0;
		// Mix NN-derived bits with input-derived bits
		u ^= (tweak * 2654435761) >>> 0;
		u = (((u ^ (u >>> 16) ^ ((i * 2246822519) >>> 0)) * 1664525 + 1013904223) >>> 0);
		indices[i] = mBits > 0 ? (u % mBits) >>> 0 : 0;
	}
	return indices;
}
// kHashes = number of hash functions (indices)
// mBits = size of the bit array in bits
export default class Bloom {
	constructor(options = {}) {
		const opts = merge({}, DEFAULTS, options);
		if (!Array.isArray(opts.layers) || opts.layers.length === 0) {
			throw new TypeError('layers must be a non-empty array of positive integers');
		}
		this.mBits = opts.mBits >>> 0;
		this.kHashes = opts.kHashes >>> 0;
		if (this.kHashes <= 0) {
			throw new RangeError('kHashes must be >= 1');
		}
		// Seed buffer must be 64 bytes; if not provided, generate one.
		this.seedBuf = isBuffer(opts.seed) && opts.seed.length === 64 ? Buffer.from(opts.seed) : Buffer.from(random64ByteBuffer());
		this.layers = opts.layers.map((n) => {
			return n >>> 0;
		});
		this.model = buildDeterministicMLP({
			inputSize: 64,
			hidden: this.layers,
			outputSize: this.kHashes,
			seedBuf: this.seedBuf,
		});
		this.bits = new BitArray(this.mBits);
	}
	// buf64: Buffer or Uint8Array of exactly 64 bytes (already a hash)
	add(buf64) {
		assert64ByteInput(buf64);
		const x = normalizeInput64(buf64);
		const yTensor = tf.tidy(() => {
			return this.model.predict(tf.tensor2d([x], [1, 64], 'float32'));
		});
		// Float32Array length kHashes
		const y = yTensor.dataSync();
		yTensor.dispose();
		const indices = mapNNOutputsToIndices(y, this.mBits, buf64);
		this.bits.setMany(indices);
	}
	// buf64: Buffer or Uint8Array of exactly 64 bytes (already a hash)
	has(buf64) {
		assert64ByteInput(buf64);
		const x = normalizeInput64(buf64);
		const yTensor = tf.tidy(() => {
			return this.model.predict(tf.tensor2d([x], [1, 64], 'float32'));
		});
		const y = yTensor.dataSync();
		yTensor.dispose();
		const indices = mapNNOutputsToIndices(y, this.mBits, buf64);
		return this.bits.allSet(indices);
	}
	// Serialize to CBOR (Buffer) - async
	async toBytes() {
		const payload = {
			v: 1,
			mBits: this.mBits,
			kHashes: this.kHashes,
			layers: this.layers,
			// Buffer 64 bytes
			seed: this.seedBuf,
			// Buffer of bit array bytes
			bits: this.bits.bytes,
		};
		return encodeStrict(payload);
	}
	// Deserialize from CBOR (Buffer or Uint8Array) - async
	static async fromBytes(bytes) {
		const obj = await decode(bytes);
		if (!isPlainObject(obj)) {
			throw new TypeError('Decoded state is not an object');
		}
		const {
			v, mBits, kHashes, layers, seed, bits,
		} = obj;
		if (v !== 1) {
			throw new Error(`Unsupported version: ${v}`);
		}
		if (!isBuffer(seed) || seed.length !== 64) {
			throw new TypeError('seed must be a 64-byte Buffer');
		}
		const bloom = new Bloom({
			mBits,
			kHashes,
			layers,
			seed,
		});
		if (!isBuffer(bits)) {
			throw new TypeError('bits must be a Buffer');
		}
		if (bits.length !== bloom.bits.bytes.length) {
			throw new RangeError('bits length does not match mBits');
		}
		bits.copy(bloom.bits.bytes);
		return bloom;
	}
	// For testing: get the raw bit array (Buffer)
	exportRaw() {
		return this.bits.bytes;
	}
	// For testing: get the current seed (Buffer 64 bytes)
	exportSeed() {
		return Buffer.from(this.seedBuf);
	}
}
(async () => {
	// Create a Bloom instance
	const bloom = new Bloom({
		mBits: 1 << 20,
		kHashes: 7,
		layers: [128, 64],
	});
	// Prepare sample 64-byte inputs
	const a = await hash512(random64ByteBuffer());
	const b = await hash512(random64ByteBuffer());
	const c = await hash512(random64ByteBuffer());
	const d = await hash512(random64ByteBuffer());
	// Add a and b
	bloom.add(a);
	bloom.add(b);
	// Membership checks
	// Expected: true
	console.log('has(a):', bloom.has(a));
	// Expected: true
	console.log('has(b):', bloom.has(b));
	// Expected: likely false
	console.log('has(c):', bloom.has(c));
	// Expected: likely false
	console.log('has(d):', bloom.has(d));
	// Expected: likely false
	console.log('has(test):', bloom.has(await hash512(Buffer.from('test'))));
	// Serialize/deserialize (async)
	const bytes = await bloom.toBytes();
	const restored = await Bloom.fromBytes(bytes);
	// Post-restore checks
	// Expected: true
	console.log('restored has(a):', restored.has(a));
	// Expected: likely false
	console.log('restored has(c):', restored.has(c));
	// Expected: likely false
	console.log('restored has(d):', restored.has(d));
})().catch((err) => {
	console.error('Demo error:', err);
});
