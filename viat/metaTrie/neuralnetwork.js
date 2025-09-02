// Experiments in neural networks and bloom filters
// Import async serialization helpers (CBOR)
import { decode, encodeStrict } from '#utilities/serialize';
// Utility helpers
import { isBuffer, isPlainObject, merge } from '@universalweb/utilitylib';
// Patch Node's util for tfjs-node (Node >=18 removed util.isNullOrUndefined)
import { createRequire } from 'module';
// Used to detect direct execution for the demo
import { fileURLToPath } from 'url';
import { hash512 } from '#crypto/hash/shake256.js';
import path from 'path';
// Random 64-byte buffer generator for demo convenience
import { random64ByteBuffer } from '#crypto/utils.js';
// Create a CommonJS require for util
const require = createRequire(import.meta.url);
// Load util to patch isNullOrUndefined used by tfjs-node
const utilMod = require('util');
// Add a compatibility shim for tfjs-node
if (typeof utilMod.isNullOrUndefined !== 'function') {
	utilMod.isNullOrUndefined = (v) => {
		return v === null || v === undefined;
	};
}
// Load tfjs-node after the util patch so backend uses it
const tf = await import('@tensorflow/tfjs-node');
// Neural-network-based membership classifier (no Bloom bit array).
// Inputs are 64-byte hashes and the NN outputs a probability.
// A score (loss) <= threshold means "potentially there"
const DEFAULTS = Object.freeze({
	// Hidden layer sizes for the encoder (decoder is symmetric)
	layers: [16, 4],
	// Learning rate for online training during add()
	learningRate: 0.01,
	// Steps (epochs) per add() call
	stepsPerAdd: 8,
	// Decision threshold on reconstruction loss (auto-tuned if unspecified)
	threshold: undefined,
	// Optional seed (Buffer 64 bytes) to initialize weights deterministically
	seed: undefined,
	// Extra mini-epochs (max) per add() to try to push loss under threshold
	maxExtraEpochsPerAdd: 25,
	// Number of leading bytes to use from the 64-byte hash (32 or 64)
	inputBytes: 32,
	// Multiplier for std-dev in auto threshold = mean + stddevMult * std
	stddevMult: 1,
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
// Deterministic SplitMix64 PRNG using BigInt
class SplitMix64 {
	constructor(seedBigInt) {
		this.state = seedBigInt & 0xFFFFFFFFFFFFFFFFn;
	}
	// Next 64-bit value
	next64() {
		this.state = (this.state + 0x9E3779B97F4A7C15n) & 0xFFFFFFFFFFFFFFFFn;
		let z = this.state;
		z = (z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n & 0xFFFFFFFFFFFFFFFFn;
		z = (z ^ (z >> 27n)) * 0x94D049BB133111EBn & 0xFFFFFFFFFFFFFFFFn;
		z = z ^ (z >> 31n);
		return z & 0xFFFFFFFFFFFFFFFFn;
	}
	// Double in [0,1)
	nextDouble() {
		const z = this.next64();
		const mantissa = Number(z >> 11n) & ((1 << 53) - 1);
		return mantissa / 9007199254740992;
	}
	// Uniform in [-limit, limit]
	nextUniform(limit) {
		return (this.nextDouble() * 2 - 1) * limit;
	}
}
// Build a deterministic seed BigInt from a 64-byte seed buffer without hashing
function seedBigIntFromBuffer(buf64) {
	assert64ByteInput(buf64);
	let s = 0n;
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
	const limit = Math.sqrt(6 / (fanIn + fanOut));
	const kernel = new Float32Array(fanIn * fanOut);
	for (let i = 0; i < kernel.length; i++) {
		kernel[i] = rng.nextUniform(limit);
	}
	const bias = new Float32Array(fanOut);
	return {
		kernel,
		bias,
	};
}
// Build a deterministic MLP classifier with sigmoid output
function buildDeterministicClassifier({
	inputSize, hidden, outputSize, seedBuf,
}) {
	const seed = seedBigIntFromBuffer(seedBuf);
	const rng = new SplitMix64(seed);
	const model = tf.sequential();
	let prev = inputSize;
	for (let i = 0; i < hidden.length; i++) {
		const units = hidden[i];
		model.add(tf.layers.dense({
			units,
			activation: 'tanh',
			inputShape: i === 0 ? [inputSize] : undefined,
			useBias: true,
		}));
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
	model.add(tf.layers.dense({
		units: outputSize,
		activation: 'sigmoid',
		useBias: true,
	}));
	{
		const {
			kernel, bias,
		} = initDenseWeightsDeterministic(rng, prev, outputSize);
		// Give a small positive starting bias to help positives cross 0.5 faster
		bias.fill(0.2);
		const kernelT = tf.tensor2d(kernel, [prev, outputSize], 'float32');
		const biasT = tf.tensor1d(bias, 'float32');
		model.layers[model.layers.length - 1].setWeights([kernelT, biasT]);
		kernelT.dispose();
		biasT.dispose();
	}
	return model;
}
// Build a deterministic autoencoder (encoder -> decoder) with tanh output
function buildDeterministicAutoencoder({
	inputSize, hidden, seedBuf,
}) {
	const seed = seedBigIntFromBuffer(seedBuf);
	const rng = new SplitMix64(seed);
	const model = tf.sequential();
	let prev = inputSize;
	for (let i = 0; i < hidden.length; i++) {
		const units = hidden[i];
		model.add(tf.layers.dense({
			units,
			activation: 'tanh',
			inputShape: i === 0 ? [inputSize] : undefined,
			useBias: true,
			// L2 regularization to avoid trivial generalization
			kernelRegularizer: tf.regularizers.l2({
				l2: 1e-4,
			}),
			biasRegularizer: tf.regularizers.l2({
				l2: 1e-4,
			}),
		}));
		const {
			kernel, bias,
		} = initDenseWeightsDeterministic(rng, prev, units);
		const kT = tf.tensor2d(kernel, [prev, units], 'float32');
		const bT = tf.tensor1d(bias, 'float32');
		model.layers[model.layers.length - 1].setWeights([kT, bT]);
		kT.dispose();
		bT.dispose();
		prev = units;
	}
	for (let i = hidden.length - 2; i >= 0; i--) {
		const units = hidden[i];
		model.add(tf.layers.dense({
			units,
			activation: 'tanh',
			useBias: true,
			kernelRegularizer: tf.regularizers.l2({
				l2: 1e-4,
			}),
			biasRegularizer: tf.regularizers.l2({
				l2: 1e-4,
			}),
		}));
		const {
			kernel, bias,
		} = initDenseWeightsDeterministic(rng, prev, units);
		const kT = tf.tensor2d(kernel, [prev, units], 'float32');
		const bT = tf.tensor1d(bias, 'float32');
		model.layers[model.layers.length - 1].setWeights([kT, bT]);
		kT.dispose();
		bT.dispose();
		prev = units;
	}
	model.add(tf.layers.dense({
		units: inputSize,
		activation: 'tanh',
		useBias: true,
		kernelRegularizer: tf.regularizers.l2({
			l2: 1e-4,
		}),
		biasRegularizer: tf.regularizers.l2({
			l2: 1e-4,
		}),
	}));
	{
		const {
			kernel, bias,
		} = initDenseWeightsDeterministic(rng, prev, inputSize);
		const kT = tf.tensor2d(kernel, [prev, inputSize], 'float32');
		const bT = tf.tensor1d(bias, 'float32');
		model.layers[model.layers.length - 1].setWeights([kT, bT]);
		kT.dispose();
		bT.dispose();
	}
	return model;
}
// Normalize to [-1, 1] using only the first inputBytes of the 64-byte hash
function normalizeInput(buf64, inputBytes) {
	assert64ByteInput(buf64);
	const n = (inputBytes === 64 ? 64 : 32);
	const x = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		x[i] = (buf64[i] - 127.5) / 127.5;
	}
	return x;
}
// Convert a tf.Tensor weight to a Buffer with shape info
function tensorToBufShape(t) {
	const arr = t.dataSync();
	const u8 = new Uint8Array(arr.buffer);
	const buf = Buffer.from(u8);
	return {
		shape: t.shape.slice(),
		data: buf,
	};
}
// Convert a Buffer+shape back to a tf.Tensor
function bufShapeToTensor({
	shape, data,
}) {
	const u8 = new Uint8Array(data);
	const f32 = new Float32Array(u8.buffer, u8.byteOffset, Math.floor(u8.byteLength / 4));
	return tf.tensor(f32, shape, 'float32');
}
// Extract all layer weights in order [kernel, bias] per Dense
function extractWeights(model) {
	const out = [];
	for (const layer of model.layers) {
		const ws = layer.getWeights();
		if (ws.length === 2) {
			out.push({
				kernel: tensorToBufShape(ws[0]),
				bias: tensorToBufShape(ws[1]),
			});
		}
		for (const t of ws) {
			t.dispose();
		}
	}
	return out;
}
// Load weights back into the model
function loadWeights(model, packed) {
	let li = 0;
	for (const layer of model.layers) {
		if (li >= packed.length) {
			break;
		}
		const entry = packed[li++];
		const kT = bufShapeToTensor(entry.kernel);
		const bT = bufShapeToTensor(entry.bias);
		layer.setWeights([kT, bT]);
		kT.dispose();
		bT.dispose();
	}
}
// Neural network membership classifier (autoencoder one-class)
export default class Bloom {
	// Create and compile the model
	constructor(options = {}) {
		const opts = merge({}, DEFAULTS, options);
		if (!Array.isArray(opts.layers) || opts.layers.length === 0) {
			throw new TypeError('layers must be a non-empty array of positive integers');
		}
		this.layers = opts.layers.map((n) => {
			return n >>> 0;
		});
		this.learningRate = Number(opts.learningRate) || DEFAULTS.learningRate;
		this.stepsPerAdd = Number(opts.stepsPerAdd) || DEFAULTS.stepsPerAdd;
		this.maxExtraEpochsPerAdd = Number.isFinite(opts.maxExtraEpochsPerAdd) ? Number(opts.maxExtraEpochsPerAdd) : DEFAULTS.maxExtraEpochsPerAdd;
		this.inputBytes = (opts.inputBytes === 64 ? 64 : 32);
		this.stddevMult = Number.isFinite(opts.stddevMult) ? Number(opts.stddevMult) : DEFAULTS.stddevMult;
		this.seedBuf = isBuffer(opts.seed) && opts.seed.length === 64 ? Buffer.from(opts.seed) : Buffer.from(random64ByteBuffer());
		this.model = buildDeterministicAutoencoder({
			inputSize: this.inputBytes,
			hidden: this.layers,
			seedBuf: this.seedBuf,
		});
		this.optimizer = tf.train.adam(this.learningRate);
		this.model.compile({
			optimizer: this.optimizer,
			loss: 'meanSquaredError',
			metrics: ['mse'],
		});
		// Initialize running stats for reconstruction loss (Welford)
		this.count = 0;
		this.meanLoss = 0;
		this.m2Loss = 0;
		// Initialize decision threshold (auto-updated after adds if not provided)
		this.threshold = Number.isFinite(opts.threshold) ? Number(opts.threshold) : undefined;
	}
	// Add a positive example and train to reconstruct it
	async add(buf64) {
		assert64ByteInput(buf64);
		const x = normalizeInput(buf64, this.inputBytes);
		const xT = tf.tensor2d([x], [1, this.inputBytes], 'float32');
		await this.model.fit(xT, xT, {
			epochs: this.stepsPerAdd,
			batchSize: 1,
			shuffle: false,
			verbose: 0,
		});
		let loss = this.getLoss(buf64);
		let extra = 0;
		while ((this.threshold !== undefined ? loss > this.threshold : false) && extra < this.maxExtraEpochsPerAdd) {
			await this.model.fit(xT, xT, {
				epochs: 1,
				batchSize: 1,
				shuffle: false,
				verbose: 0,
			});
			loss = this.getLoss(buf64);
			extra++;
		}
		xT.dispose();
		// Update running loss stats and auto-threshold if not user-specified
		this.#updateLossStats(loss);
		if (this.threshold === undefined) {
			const std = this.count > 1 ? Math.sqrt(this.m2Loss / (this.count - 1)) : 0;
			this.threshold = this.meanLoss + this.stddevMult * std + 1e-6;
		} else {
			// Monotonically tighten threshold as model improves
			const std = this.count > 1 ? Math.sqrt(this.m2Loss / (this.count - 1)) : 0;
			const candidate = this.meanLoss + this.stddevMult * std + 1e-6;
			this.threshold = Math.min(this.threshold, candidate);
		}
	}
	// Get reconstruction loss (MSE) on normalized input
	getLoss(buf64) {
		assert64ByteInput(buf64);
		const x = normalizeInput(buf64, this.inputBytes);
		const loss = tf.tidy(() => {
			const xT = tf.tensor2d([x], [1, this.inputBytes], 'float32');
			const yT = this.model.predict(xT);
			const lT = tf.losses.meanSquaredError(xT, yT);
			const v = lT.dataSync()[0];
			xT.dispose();
			yT.dispose();
			lT.dispose();
			return v;
		});
		return loss;
	}
	// Check membership by thresholding reconstruction loss
	has(buf64) {
		const loss = this.getLoss(buf64);
		return loss <= this.threshold;
	}
	// Update running mean and variance (Welford)
	#updateLossStats(loss) {
		this.count += 1;
		const delta = loss - this.meanLoss;
		this.meanLoss += delta / this.count;
		const delta2 = loss - this.meanLoss;
		this.m2Loss += delta * delta2;
	}
	// Serialize model and config to CBOR (async)
	async toBytes() {
		const payload = {
			v: 2,
			layers: this.layers,
			learningRate: this.learningRate,
			stepsPerAdd: this.stepsPerAdd,
			threshold: this.threshold,
			seed: this.seedBuf,
			inputBytes: this.inputBytes,
			stddevMult: this.stddevMult,
			count: this.count,
			meanLoss: this.meanLoss,
			m2Loss: this.m2Loss,
			weights: extractWeights(this.model),
		};
		return encodeStrict(payload);
	}
	// Deserialize from CBOR (async)
	static async fromBytes(bytes) {
		const obj = await decode(bytes);
		if (!isPlainObject(obj)) {
			throw new TypeError('Decoded state is not an object');
		}
		const {
			v, layers, learningRate, stepsPerAdd, threshold, seed, weights, inputBytes, stddevMult, count, meanLoss, m2Loss,
		} = obj;
		if (v !== 2) {
			throw new Error(`Unsupported version: ${v}`);
		}
		if (!isBuffer(seed) || seed.length !== 64) {
			throw new TypeError('seed must be a 64-byte Buffer');
		}
		const bloom = new Bloom({
			layers,
			learningRate,
			stepsPerAdd,
			threshold,
			seed,
			inputBytes,
			stddevMult,
		});
		if (!Array.isArray(weights) || weights.length !== bloom.model.layers.length) {
			throw new TypeError('weights missing or incompatible with model');
		}
		loadWeights(bloom.model, weights);
		bloom.count = Number(count) || 0;
		bloom.meanLoss = Number(meanLoss) || 0;
		bloom.m2Loss = Number(m2Loss) || 0;
		return bloom;
	}
}
// Demo: positive-only training, autoencoder membership via reconstruction loss
(async () => {
	// Create classifier with a tighter bottleneck
	const clf = new Bloom({
		layers: [16, 4],
		learningRate: 0.01,
		stepsPerAdd: 8,
		inputBytes: 32,
		threshold: undefined,
		stddevMult: 1,
	});
	// Generate positives (already 64-byte hashes)
	const a = await hash512(random64ByteBuffer());
	const b = await hash512(random64ByteBuffer());
	// Generate candidate negatives (unseen)
	const c = await hash512(random64ByteBuffer());
	const d = await hash512(random64ByteBuffer());
	// Train on positives more times to specialize
	await clf.add(a);
	await clf.add(b);
	// Log current threshold and losses
	console.log('threshold (loss):', clf.threshold.toExponential(6));
	console.log('loss(a):', clf.getLoss(a).toExponential(6));
	console.log('loss(b):', clf.getLoss(b).toExponential(6));
	console.log('loss(c):', clf.getLoss(c).toExponential(6));
	console.log('loss(d):', clf.getLoss(d).toExponential(6));
	// Membership checks (loss <= threshold => true)
	console.log('a potentially there:', clf.has(a));
	console.log('b potentially there:', clf.has(b));
	console.log('c potentially there:', clf.has(c));
	console.log('d potentially there:', clf.has(d));
	// Serialize and restore
	const bytes = await clf.toBytes();
	const restored = await Bloom.fromBytes(bytes);
	// Post-restore checks
	console.log('restored a potentially there:', restored.has(a));
	console.log('restored c potentially there:', restored.has(c));
})().catch((err) => {
	console.error('Demo error:', err);
});
