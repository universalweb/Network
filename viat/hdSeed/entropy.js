/* global Bun */
import { isBuffer, isPlainObject, isU8 } from '@universalweb/utilitylib';
/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW
	NOTE: This is overly engineered for the unknown potential of future Quantum Computers.
	NOTE: Function to generate entropy with failsafe using Kyber KEM shared secrets and other entropy sources. In the future more entropy sources need to be added to ensure a high entropy pool.
	© copyright Thomas Marchi 2025
*/
import { MASTER_SEED_ENTROPY_SIZES } from './defaults/index.js';
import { encode } from './utils.js';
import { keccakprg } from '@noble/hashes/sha3-addons.js';
import { ml_kem1024 } from '@noble/post-quantum/ml-kem.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { shake256 } from '@noble/hashes/sha3.js';
function getFingerprintPropertyNames(source) {
	if (!source) {
		return [];
	}
	const names = new Set();
	let current = source;
	while (current && current !== Object.prototype) {
		for (const propertyName of Object.getOwnPropertyNames(current)) {
			if (propertyName === 'constructor' || propertyName === '__proto__') {
				continue;
			}
			names.add(propertyName);
		}
		current = Object.getPrototypeOf(current);
	}
	return [...names].sort();
}
function normalizeFingerprintValue(value) {
	if (value === null || value === undefined) {
		return undefined;
	}
	if (typeof value === 'function' || typeof value === 'symbol') {
		return undefined;
	}
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value === 'boolean' || typeof value === 'bigint') {
		return value;
	}
	if (isBuffer(value) || isU8(value)) {
		return value.length ? Array.from(value, (item) => {
			return item.toString(16).padStart(2, '0');
		}).join('') : undefined;
	}
	if (Array.isArray(value)) {
		const normalized = value
			.map(normalizeFingerprintValue)
			.filter((item) => {
				return item !== undefined;
			});
		return normalized.length ? normalized : undefined;
	}
	if (isPlainObject(value)) {
		const normalized = {};
		for (const entry of Object.entries(value)) {
			const key = entry[0];
			const item = entry[1];
			const normalizedItem = normalizeFingerprintValue(item);
			if (normalizedItem !== undefined) {
				normalized[key] = normalizedItem;
			}
		}
		return Object.keys(normalized).length ? normalized : undefined;
	}
	return undefined;
}
function collectFingerprintProperties(source, ignored = new Set()) {
	const fingerprint = {};
	for (const key of getFingerprintPropertyNames(source)) {
		if (ignored.has(key)) {
			continue;
		}
		try {
			const normalizedValue = normalizeFingerprintValue(source[key]);
			if (normalizedValue !== undefined) {
				fingerprint[key] = normalizedValue;
			}
		} catch (error) {
			continue;
		}
	}
	return fingerprint;
}
export async function getEnvironmentFingerprint() {
	const fingerprintData = {
		runtime: 'unknown',
		timezone: new globalThis.Intl.DateTimeFormat().resolvedOptions().timeZone,
		timezoneOffset: new Date().getTimezoneOffset(),
	};
	if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
		let canvasData;
		const browserIgnored = new Set([
			'plugins',
			'mimeTypes',
			'clipboard',
			'credentials',
			'locks',
			'mediaDevices',
			'serviceWorker',
		]);
		const screenIgnored = new Set();
		try {
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			context.textBaseline = 'top';
			context.font = '14px "Arial"';
			context.fillText('🔒 UW HDST', 2, 2);
			canvasData = canvas.toDataURL();
		} catch (error) {
			canvasData = undefined;
		}
		fingerprintData.runtime = 'browser';
		fingerprintData.navigator = collectFingerprintProperties(window.navigator, browserIgnored);
		fingerprintData.screen = collectFingerprintProperties(window.screen, screenIgnored);
		fingerprintData.location = collectFingerprintProperties(window.location, new Set(['ancestorOrigins']));
		fingerprintData.devicePixelRatio = normalizeFingerprintValue(window.devicePixelRatio);
		fingerprintData.canvas = normalizeFingerprintValue(canvasData);
	}
	if (typeof process !== 'undefined') {
		fingerprintData.process = collectFingerprintProperties(process, new Set([
			'env',
			'argv',
			'argv0',
			'config',
			'features',
			'permission',
			'report',
			'stdin',
			'stdout',
			'stderr',
		]));
		fingerprintData.processVersions = normalizeFingerprintValue(process.versions);
		fingerprintData.processRelease = normalizeFingerprintValue(process.release);
		if (fingerprintData.runtime === 'unknown') {
			fingerprintData.runtime = 'node';
		}
	}
	if (typeof Bun !== 'undefined') {
		fingerprintData.bun = collectFingerprintProperties(Bun, new Set([
			'file',
			'password',
			'stdin',
			'stdout',
			'stderr',
			'unsafe',
		]));
		fingerprintData.runtime = 'bun';
	}
	// console.log('getEnvironmentFingerprint', fingerprintData);
	const encodedFingerprint = await encode(fingerprintData);
	return shake256.create({
		dkLen: 64,
	}).update(encodedFingerprint).digest();
}
export async function spongeEntropy(input, size = MASTER_SEED_ENTROPY_SIZES.default) {
	const spongeRandom = await keccakprg(254);
	await spongeRandom.update(await randomBytes(size));
	return spongeRandom.randomBytes(size);
}
export async function generateEntropy(size = MASTER_SEED_ENTROPY_SIZES.default) {
	const randomSeed = await randomBytes(size);
	const kemA = await ml_kem1024.keygen();
	const kemB = await ml_kem1024.keygen();
	const { sharedSecret: secretA } = await ml_kem1024.encapsulate(kemA.publicKey);
	const { sharedSecret: secretB } = await ml_kem1024.encapsulate(kemB.publicKey);
	const spongeRandom = await spongeEntropy(256);
	const output = await shake256.create({
		dkLen: size,
	}).update(randomSeed)
		.update(secretA)
		.update(secretB)
		.update(spongeRandom)
		.update(await getEnvironmentFingerprint())
		.digest();
	return output;
}
async function example() {
	const result = await generateEntropy(256);
	console.log('Sponge Entropy', await spongeEntropy(256));
	console.log('Generate Entropy', result);
	console.log('getEnvironmentFingerprint', await getEnvironmentFingerprint());
	return result;
}
example();

