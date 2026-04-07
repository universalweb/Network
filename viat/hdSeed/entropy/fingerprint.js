import { encode, hash } from '../utils.js';
import {
	isBigInt, isBoolean, isBuffer, isFunction, isNumber, isPlainObject, isString, isTypedArray, isU8, isUndefined,
} from '@universalweb/utilitylib';
function getFingerprintPropertyNames(source) {
	if (!source) {
		return [];
	}
	const names = [];
	let current = source;
	while (current && current !== Object.prototype) {
		for (const propertyName of Object.getOwnPropertyNames(current)) {
			if (propertyName === 'constructor' || propertyName === '__proto__') {
				continue;
			}
			if (!names.includes(propertyName)) {
				names.push(propertyName);
			}
		}
		current = Object.getPrototypeOf(current);
	}
	return names.sort();
}
function normalizeFingerprintValue(value) {
	if (value === null || isUndefined(value)) {
		return undefined;
	}
	if (isFunction(value) || typeof value === 'symbol') {
		return undefined;
	}
	if (isString(value)) {
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
	}
	if (isNumber(value)) {
		return Number.isFinite(value) ? value : undefined;
	}
	if (isBoolean(value) || isBigInt(value)) {
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
export async function getFingerprintEntropy(size = 64) {
	const fingerprintData = {
		runtime: 'unknown',
		timezone: new globalThis.Intl.DateTimeFormat().resolvedOptions().timeZone,
		timezoneOffset: new Date().getTimezoneOffset(),
		timeNow: Date.now(),
		perf: performance.now(),
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
	// console.log('getEntropyFingerprint', fingerprintData);
	const encodedFingerprint = await encode(fingerprintData);
	return hash(encodedFingerprint, size);
}
