/*
 * Resolve the overloaded 3rd/4th factory arg for list/each/filter:
 *   keyFn function | plain options { keyFn?, virtual? }
 * Virtual config lives only under `virtual` (estimatedHeight required).
 */
import {
	isFunction,
	isPlainObject,
} from '../utilities.js';
const TOP_OPTION_KEYS = new Set(['keyFn', 'virtual']);
const VIRTUAL_OPTION_KEYS = new Set([
	'enabled', 'estimatedHeight', 'overscan', 'scrollRoot',
]);
const DEFAULT_OVERSCAN = 4;
/**
 * @param {object} source - Options bag.
 * @param {Set<string>} allowed - Allowed own keys.
 * @param {string} label - Error label for the bag.
 */
function assertKnownKeys(source, allowed, label) {
	const keys = Object.keys(source);
	const keyCount = keys.length;
	for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
		const optionKey = keys[keyIndex];
		if (!allowed.has(optionKey)) {
			throw new TypeError(`unknown ${label} option "${optionKey}"`);
		}
	}
}
/**
 * Normalize `virtual: true | config` → config or null.
 * @param {*} value - Raw virtual option.
 * @returns {null|{enabled:boolean,estimatedHeight:number,overscan:number,scrollRoot:Element|null}}
 */
export function normalizeVirtual(value) {
	if (value == null || value === false) {
		return null;
	}
	let config;
	if (value === true) {
		config = {
			enabled: true,
		};
	} else if (isPlainObject(value)) {
		assertKnownKeys(value, VIRTUAL_OPTION_KEYS, 'virtual');
		config = {
			enabled: value.enabled !== false,
			estimatedHeight: value.estimatedHeight,
			overscan: value.overscan,
			scrollRoot: value.scrollRoot === undefined ? null : value.scrollRoot,
		};
	} else {
		throw new TypeError('virtual must be true or a plain config object');
	}
	if (!config.enabled) {
		return null;
	}
	const estimatedHeight = config.estimatedHeight;
	if (!(typeof estimatedHeight === 'number' && estimatedHeight > 0 && Number.isFinite(estimatedHeight))) {
		throw new TypeError('virtual list requires estimatedHeight (px) — no default');
	}
	const overscan = config.overscan;
	const resolvedOverscan = overscan == null ? DEFAULT_OVERSCAN : overscan;
	if (!(typeof resolvedOverscan === 'number' && resolvedOverscan >= 0 && Number.isFinite(resolvedOverscan))) {
		throw new TypeError('virtual.overscan must be a non-negative number');
	}
	return {
		enabled: true,
		estimatedHeight,
		overscan: resolvedOverscan,
		scrollRoot: config.scrollRoot ?? null,
	};
}
/**
 * @param {*} arg - keyFn or options object.
 * @param {(item:*, index:number)=>*} defaultKeyFn - Factory default keyer.
 * @param {{allowVirtual?:boolean}} [settings]
 * @returns {{keyFn:Function, virtual:null|object}}
 */
export function resolveListOptions(arg, defaultKeyFn, settings = {}) {
	const allowVirtual = settings.allowVirtual !== false;
	if (arg == null) {
		return {
			keyFn: defaultKeyFn,
			virtual: null,
		};
	}
	if (isFunction(arg)) {
		return {
			keyFn: arg,
			virtual: null,
		};
	}
	if (isPlainObject(arg)) {
		assertKnownKeys(arg, TOP_OPTION_KEYS, 'list');
		let keyFn = defaultKeyFn;
		if (arg.keyFn != null) {
			if (!isFunction(arg.keyFn)) {
				throw new TypeError('list options.keyFn must be a function when set');
			}
			keyFn = arg.keyFn;
		}
		const virtual = normalizeVirtual(arg.virtual);
		if (virtual && !allowVirtual) {
			throw new TypeError('each() cannot be virtualized — use list(key, Row, { virtual: … }); each() installs a StaticSpot with no refresh loop');
		}
		// keyFn omitted → factory default (defaultListKeyFn / defaultEachKeyFn).
		return {
			keyFn,
			virtual,
		};
	}
	throw new TypeError('list 3rd argument must be a keyFn or a plain options object');
}
