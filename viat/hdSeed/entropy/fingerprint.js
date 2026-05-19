import { encode, hash } from '../utils.js';
import {
	isBigInt, isBoolean, isBuffer, isFunction, isNumber, isPlainObject, isString, isTypedArray, isU8, isUndefined,
} from '@universalweb/utilitylib';
// Surface that should NOT be enumerated on the browser's `navigator`:
//  * Protected Audience API (`runAdAuction`, `joinAdInterestGroup`, etc.) —
//    deprecated, accessing the function references logs warnings.
//  * Legacy quota storage (`webkitPersistentStorage`, `webkitTemporaryStorage`) —
//    reading either property triggers Chrome's
//    "StorageType.persistent is deprecated" console warning even if we
//    never invoke a method on the returned handle. The modern
//    `navigator.storage` API replaces both.
//  * Permission-gated APIs that yield nothing without a user grant
//    (bluetooth/usb/serial/hid/geolocation/wakeLock/presentation/xr/clipboard).
//  * Live device handles that aren't deterministic fingerprint material
//    (mediaDevices/serviceWorker/credentials/locks).
//  * Legacy aliases with deprecation warnings (`webkitGetUserMedia`).
const BROWSER_IGNORED = new Set([
	'plugins',
	'mimeTypes',
	'clipboard',
	'credentials',
	'locks',
	'mediaDevices',
	'serviceWorker',
	'runAdAuction',
	'joinAdInterestGroup',
	'leaveAdInterestGroup',
	'updateAdInterestGroups',
	'clearOriginJoinedAdInterestGroups',
	'getInterestGroupAdAuctionData',
	'createAuctionNonce',
	'protectedAudience',
	'adAuctionComponents',
	'deprecatedURNToURL',
	'deprecatedReplaceInURN',
	'webkitPersistentStorage',
	'webkitTemporaryStorage',
	'storage',
	'bluetooth',
	'usb',
	'serial',
	'hid',
	'wakeLock',
	'presentation',
	'xr',
	'geolocation',
	'permissions',
	'share',
	'canShare',
	'vibrate',
	'mediaCapabilities',
	'windowControlsOverlay',
	'virtualKeyboard',
	'ink',
	'webkitGetUserMedia',
	'getUserMedia',
	'getGamepads',
	'getInstalledRelatedApps',
	'requestMIDIAccess',
]);
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
	if (isBuffer(value) || isU8(value) || isTypedArray(value)) {
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
function collectCanvasFingerprint() {
	try {
		const canvas = globalThis.document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			return undefined;
		}
		context.textBaseline = 'top';
		context.font = '14px "Arial"';
		context.fillStyle = 'rgba(108, 74, 255, 0.74)';
		context.fillText('🔒 UW HDST', 2, 2);
		context.strokeStyle = '#34d399';
		context.strokeRect(60, 6, 24, 14);
		return canvas.toDataURL();
	} catch (error) {
		return undefined;
	}
}
function collectWebGLFingerprint() {
	try {
		const canvas = globalThis.document.createElement('canvas');
		const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (!gl) {
			return undefined;
		}
		const result = {
			vendor: gl.getParameter(gl.VENDOR),
			renderer: gl.getParameter(gl.RENDERER),
			version: gl.getParameter(gl.VERSION),
			shading: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
			maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
		};
		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		if (debugInfo) {
			result.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
			result.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
		}
		const extensions = gl.getSupportedExtensions();
		if (Array.isArray(extensions) && extensions.length) {
			result.extensions = extensions.slice().sort();
		}
		return normalizeFingerprintValue(result);
	} catch (error) {
		return undefined;
	}
}
async function collectClientHints(navigatorRef) {
	const userAgentData = navigatorRef?.userAgentData;
	if (!userAgentData) {
		return undefined;
	}
	const base = {
		mobile: userAgentData.mobile,
		platform: userAgentData.platform,
	};
	const brands = userAgentData.brands;
	if (Array.isArray(brands) && brands.length) {
		base.brands = brands
			.map((brand) => {
				return `${brand.brand}|${brand.version}`;
			})
			.sort();
	}
	if (typeof userAgentData.getHighEntropyValues === 'function') {
		try {
			const extra = await userAgentData.getHighEntropyValues([
				'architecture',
				'bitness',
				'model',
				'platformVersion',
				'uaFullVersion',
				'fullVersionList',
				'wow64',
			]);
			Object.assign(base, extra);
		} catch (error) {
			// Some browsers gate high-entropy hints; degrade silently.
		}
	}
	return normalizeFingerprintValue(base);
}
function collectViewportFingerprint() {
	const result = {
		innerWidth: globalThis.innerWidth,
		innerHeight: globalThis.innerHeight,
		outerWidth: globalThis.outerWidth,
		outerHeight: globalThis.outerHeight,
		scrollX: globalThis.scrollX,
		scrollY: globalThis.scrollY,
	};
	const visual = globalThis.visualViewport;
	if (visual) {
		result.visualWidth = visual.width;
		result.visualHeight = visual.height;
		result.visualScale = visual.scale;
	}
	return normalizeFingerprintValue(result);
}
function collectIntlFingerprint() {
	const result = {};
	try {
		const dt = new globalThis.Intl.DateTimeFormat().resolvedOptions();
		result.dateTime = {
			locale: dt.locale,
			calendar: dt.calendar,
			numberingSystem: dt.numberingSystem,
			timeZone: dt.timeZone,
		};
	} catch (error) {
		// ignored
	}
	try {
		const nf = new globalThis.Intl.NumberFormat().resolvedOptions();
		result.numberFormat = {
			locale: nf.locale,
			numberingSystem: nf.numberingSystem,
		};
	} catch (error) {
		// ignored
	}
	try {
		const collator = new globalThis.Intl.Collator().resolvedOptions();
		result.collator = {
			locale: collator.locale,
			usage: collator.usage,
			sensitivity: collator.sensitivity,
		};
	} catch (error) {
		// ignored
	}
	return normalizeFingerprintValue(result);
}
function collectCryptoEntropy() {
	const cryptoApi = globalThis.crypto;
	if (!cryptoApi?.getRandomValues) {
		return undefined;
	}
	try {
		const bytes = new Uint8Array(64);
		cryptoApi.getRandomValues(bytes);
		return normalizeFingerprintValue(bytes);
	} catch (error) {
		return undefined;
	}
}
function collectFreshUUIDs() {
	const cryptoApi = globalThis.crypto;
	if (typeof cryptoApi?.randomUUID !== 'function') {
		return undefined;
	}
	const ids = [];
	for (let index = 0; index < 4; index += 1) {
		try {
			ids.push(cryptoApi.randomUUID());
		} catch (error) {
			break;
		}
	}
	return ids.length ? ids : undefined;
}
function collectHardwareSignals(navigatorRef) {
	const result = {
		hardwareConcurrency: navigatorRef.hardwareConcurrency,
		deviceMemory: navigatorRef.deviceMemory,
		maxTouchPoints: navigatorRef.maxTouchPoints,
		pdfViewerEnabled: navigatorRef.pdfViewerEnabled,
		cookieEnabled: navigatorRef.cookieEnabled,
		onLine: navigatorRef.onLine,
	};
	if (navigatorRef.connection) {
		const conn = navigatorRef.connection;
		result.connection = {
			effectiveType: conn.effectiveType,
			downlink: conn.downlink,
			rtt: conn.rtt,
			saveData: conn.saveData,
			type: conn.type,
		};
	}
	return normalizeFingerprintValue(result);
}
export async function getFingerprintEntropy(size = 64) {
	const fingerprintData = {
		runtime: 'unknown',
		timezone: new globalThis.Intl.DateTimeFormat().resolvedOptions().timeZone,
		timezoneOffset: new Date().getTimezoneOffset(),
		timeNow: Date.now(),
		perf: globalThis.performance?.now?.(),
		perfTimeOrigin: globalThis.performance?.timeOrigin,
		intl: collectIntlFingerprint(),
		crypto: collectCryptoEntropy(),
		uuids: collectFreshUUIDs(),
	};
	const navigatorRef = globalThis.navigator;
	if (typeof globalThis.document !== 'undefined' && navigatorRef) {
		const screenIgnored = new Set();
		fingerprintData.runtime = 'browser';
		fingerprintData.navigator = collectFingerprintProperties(navigatorRef, BROWSER_IGNORED);
		fingerprintData.hardware = collectHardwareSignals(navigatorRef);
		fingerprintData.clientHints = await collectClientHints(navigatorRef);
		fingerprintData.screen = collectFingerprintProperties(globalThis.screen, screenIgnored);
		fingerprintData.viewport = collectViewportFingerprint();
		fingerprintData.location = collectFingerprintProperties(globalThis.location, new Set(['ancestorOrigins']));
		fingerprintData.devicePixelRatio = normalizeFingerprintValue(globalThis.devicePixelRatio);
		fingerprintData.canvas = normalizeFingerprintValue(collectCanvasFingerprint());
		fingerprintData.webgl = collectWebGLFingerprint();
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
	const encodedFingerprint = await encode(fingerprintData);
	return hash(encodedFingerprint, size);
}
