export function isObject(value) {
	return value !== null && typeof value === 'object';
}
export function isPlainObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
export function isString(value) {
	return typeof value === 'string';
}
export function isFunction(value) {
	return typeof value === 'function';
}
export function isSymbol(value) {
	return typeof value === 'symbol';
}
export function isElement(value) {
	return value instanceof Element;
}
export function isShadowRoot(value) {
	return value instanceof ShadowRoot;
}
export function isPromiseLike(value) {
	return value !== null && typeof value === 'object' && isFunction(value.then);
}
export function isError(value) {
	return value instanceof Error;
}
export function isUndefined(value) {
	return value === undefined;
}
export function isTypeUndefined(type) {
	return type === 'undefined';
}
export function isNull(value) {
	return value === null;
}
export function noValue(value) {
	return Boolean(isUndefined(value) || isNull(value));
}
export function hasValue(value) {
	return !noValue(value);
}
export function isArray(value) {
	return Array.isArray(value);
}
export function isMap(value) {
	return value instanceof Map;
}
export function isSet(value) {
	return value instanceof Set;
}
export function assign(target, ...sources) {
	return Object.assign(target, ...sources);
}
export function hasOwn(obj, key) {
	return Object.hasOwn(obj, key);
}
export function keysOf(obj) {
	return Object.keys(obj);
}
export function getProto(value) {
	return Object.getPrototypeOf(value);
}
export function isEmpty(value) {
	if (isString(value)) {
		return value.trim() === '';
	}
	if (isArray(value)) {
		return value.length === 0;
	}
	if (isObject(value)) {
		return Object.keys(value).length === 0;
	}
	return false;
}
export function createElementFromHTML(htmlString) {
	const template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstElementChild;
}
/**
 * Resolve a target spec to an element: a selector string is queried against
 * the document; an element passes straight through.
 */
export function resolveTarget(target) {
	return isString(target) ? document.querySelector(target) : target;
}
export const callFn = (fn) => {
	fn();
};
export const eachArray = (arr, fn) => {
	for (let i = 0; i < arr.length; i++) {
		fn(arr[i], i);
	}
};
export const eachObject = (obj, fn) => {
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		fn(keys[i], obj[keys[i]]);
	}
};
export const eachNodeList = (list, fn) => {
	for (let i = 0; i < list.length; i++) {
		fn(list[i], i);
	}
};
export function queueAsyncError(error) {
	queueMicrotask(() => {
		throw error;
	});
}
export function plainEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (a?.constructor !== b?.constructor) {
		return false;
	}
	if (isPlainObject(a) || isArray(a)) {
		const keys = Object.keys(a);
		if (keys.length !== Object.keys(b).length) {
			return false;
		}
		return keys.every((key) => {
			return plainEqual(a[key], b[key]);
		});
	}
	return false;
}
const DOT_CODE = 46;
export function pathsOverlap(a, b) {
	if (a === b) {
		return true;
	}
	const aLen = a.length;
	const bLen = b.length;
	if (aLen < bLen) {
		return b.charCodeAt(aLen) === DOT_CODE && b.startsWith(a);
	}
	if (bLen < aLen) {
		return a.charCodeAt(bLen) === DOT_CODE && a.startsWith(b);
	}
	return false;
}
const PARSED_PATHS = new Map();
export function parsePath(path) {
	if (!path) {
		return null;
	}
	let parts = PARSED_PATHS.get(path);
	if (!parts) {
		parts = path.split('.');
		PARSED_PATHS.set(path, parts);
	}
	return parts;
}
export function getValueAtPath(source, path) {
	const parts = parsePath(path);
	if (!parts) {
		return source;
	}
	let value = source;
	for (let i = 0; i < parts.length; i++) {
		if (value == null) {
			return undefined;
		}
		const key = parts[i];
		if (isSet(value)) {
			value = value.has(key);
		} else if (isMap(value)) {
			value = value.get(key);
		} else {
			value = value[key];
		}
	}
	return value;
}
export function getOrInit(map, key, factory) {
	let entry = map.get(key);
	if (entry === undefined) {
		entry = factory();
		map.set(key, entry);
	}
	return entry;
}
/**
 * Cache-or-build a path-keyed proxy. `builder` is any object exposing a
 * `static build(target, path, extra1, extra2)` method — typically the
 * ProxyHandler class itself. Passing a class reference (not a closure) means
 * zero arrow allocations per call: `builder.build` is a property lookup on a
 * singleton, not a fresh function. Fixed-arity extras cover every reactive
 * proxy in the codebase (max two trailing args needed; pass `undefined` for
 * sites that need fewer).
 */
export function cachedProxy(cache, target, path, builder, extra1, extra2) {
	let pathMap = cache.get(target);
	if (!pathMap) {
		pathMap = new Map();
		cache.set(target, pathMap);
	}
	const existing = pathMap.get(path);
	if (existing) {
		return existing;
	}
	const proxy = builder.build(target, path, extra1, extra2);
	pathMap.set(path, proxy);
	return proxy;
}
export function joinPath(parentPath, key) {
	return parentPath ? `${parentPath}.${String(key)}` : String(key);
}
const CACHED_RESOLVED_PROMISE = Promise.resolve();
export function assignPromisePair(target, pairName) {
	const deferred = Promise.withResolvers();
	target[pairName] = deferred.promise;
	target[`${pairName}Resolver`] = deferred.resolve;
}
export function fireResolver(target, pairName) {
	const resolverName = `${pairName}Resolver`;
	if (target[resolverName]) {
		target[resolverName]();
		target[resolverName] = null;
		target[pairName] = CACHED_RESOLVED_PROMISE;
	}
}
export function runHook(component, hookName, args, errorHandler = 'onLifecycleError') {
	if (!component[hookName]) {
		return true;
	}
	let result;
	try {
		result = args ? component[hookName](...args) : component[hookName]();
	} catch (error) {
		component[errorHandler](error);
		return false;
	}
	if (!isPromiseLike(result)) {
		return true;
	}
	return result.then(() => {
		return true;
	}, (error) => {
		component[errorHandler](error);
		return false;
	});
}
/**
 * Polymorphic disposer: invokes `.unsubscribe()` on a Subscription instance,
 * or calls a plain function for legacy disposers (dragSnap's controller.destroy,
 * the closure handles returned by watchGlobal's stopWatching pattern, etc.).
 * Module-scope so `set.forEach(disposeItem)` reuses one function reference.
 */
export function disposeItem(item) {
	if (item.unsubscribe) {
		item.unsubscribe();
		return;
	}
	item();
}
export function clearUnsubs(set) {
	if (!set) {
		return;
	}
	set.forEach(disposeItem);
	set.clear();
}
/**
 * Tear down a 2-level realm unsub store (Map<realm, Map<path, unsub>>): dispose
 * every per-realm submap, then drop the realms. `forEach(clearUnsubs)` passes
 * each submap as clearUnsubs's first arg (extra forEach args ignored).
 */
export function clearRealmUnsubs(store) {
	if (!store) {
		return;
	}
	store.forEach(clearUnsubs);
	store.clear();
}
/**
 * Keep `current` (Map<key, sub>) in sync with `nextKeys` (Set<key>) by:
 *   - disposing the subscription for any key dropped
 *   - subscribing only for keys newly added
 * Returns the same `current` map (now updated). Stable keys keep their
 * subscription reference so we don't churn subscribers when state shapes
 * are unchanged.
 *
 * `subscribe` is invoked as `subscribe(key, context)` — the optional 4th
 * arg carries per-call data (component, spot, …) so callers can pass a
 * module-scope first-class fn instead of a wrapper closure that captures
 * the same data. Callbacks that don't need a context simply ignore the
 * second parameter.
 */
export function syncSubsByDiff(current, nextKeys, subscribe, context) {
	const entries = [...current.entries()];
	for (let i = 0; i < entries.length; i += 1) {
		const key = entries[i][0];
		if (!nextKeys.has(key)) {
			disposeItem(entries[i][1]);
			current.delete(key);
		}
	}
	const nextArray = [...nextKeys];
	for (let i = 0; i < nextArray.length; i += 1) {
		const key = nextArray[i];
		if (!current.has(key)) {
			current.set(key, subscribe(key, context));
		}
	}
	return current;
}
/**
 * Deep-merge two values per container-aware rules. Used when `mergeObjects` is
 * on for static-state chain merging and for ctor-arg state when the same key
 * already has a populated container. Rules:
 *   - both plain objects → recurse; incoming keys win on conflicts
 *   - both arrays → concat (existing then incoming)
 *   - both Sets → union
 *   - both Maps → new Map; incoming wins on key conflict
 *   - any other shape pair → incoming wins (replace)
 * Always returns a fresh container at the top level so callers can own it.
 */
export function deepMerge(existing, incoming) {
	if (isPlainObject(existing) && isPlainObject(incoming)) {
		const out = {
			...existing,
		};
		const keys = Object.keys(incoming);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			out[key] = deepMerge(existing[key], incoming[key]);
		}
		return out;
	}
	if (isArray(existing) && isArray(incoming)) {
		return [...existing, ...incoming];
	}
	if (isSet(existing) && isSet(incoming)) {
		return new Set([...existing, ...incoming]);
	}
	if (isMap(existing) && isMap(incoming)) {
		return new Map([...existing, ...incoming]);
	}
	return incoming;
}
/**
 * Recursive *container* clone — gives each instance its own owned-shape graph
 * for state purposes.
 *   - Arrays + plain objects: recurse, each element/value is smartClone'd
 *   - Maps + Sets:            new container, entries copied by reference
 *                             (matches `new Map(orig)` / `new Set(orig)`; an
 *                             entry that's an object stays shared — JS would
 *                             mutate it by reference anyway, and deep-cloning
 *                             keyed-collection entries forks singletons)
 *   - Class instances, Date, RegExp, functions, primitives: pass through
 * Used by the framework to materialize instance state from instance-supplied
 * templates. `static state` is never run through this — it's a shared
 * class-level template by design (opt in via `static cloneStaticState = true`).
 */
export function smartClone(value) {
	if (value === null || typeof value !== 'object') {
		return value;
	}
	if (isArray(value)) {
		const out = new Array(value.length);
		for (let i = 0; i < value.length; i++) {
			out[i] = smartClone(value[i]);
		}
		return out;
	}
	if (isMap(value)) {
		return new Map(value);
	}
	if (isSet(value)) {
		return new Set(value);
	}
	if (isPlainObject(value)) {
		const out = {};
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			out[key] = smartClone(value[key]);
		}
		return out;
	}
	return value;
}
export function setValueAtPath(source, path, value) {
	if (!path.includes('.')) {
		source[path] = value;
		return;
	}
	const parts = path.split('.');
	const finalKey = parts.pop();
	let cursor = source;
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (!isPlainObject(cursor[part]) && !isArray(cursor[part])) {
			cursor[part] = {};
		}
		cursor = cursor[part];
	}
	cursor[finalKey] = value;
}
/**
 * Buffer / TypedArray / DataView / ArrayBuffer → URL-safe base64 string
 * (unpadded). Modern path is the native `Uint8Array.prototype.toBase64` (TC39,
 * see MDN `Uint8Array/toBase64#alphabet`); falls back to the platform `Buffer`
 * (global in the viat client) and finally a `btoa` encoder for older engines.
 * Any binary view is normalized to its underlying bytes first, so a non-Uint8
 * typed array / DataView encodes its real bytes rather than its element values.
 */
export function toBase64Url(source) {
	let bytes;
	if (source instanceof Uint8Array) {
		bytes = source;
	} else if (source instanceof ArrayBuffer) {
		bytes = new Uint8Array(source);
	} else {
		bytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	}
	if (bytes.toBase64) {
		return bytes.toBase64({
			alphabet: 'base64url',
			omitPadding: true,
		});
	}
	const platformBuffer = globalThis.Buffer;
	if (platformBuffer) {
		return platformBuffer.from(bytes).toString('base64url');
	}
	let binary = '';
	const chunkSize = 0x8000;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	const standardBase64 = btoa(binary);
	return standardBase64
		.split('+')
		.join('-')
		.split('/')
		.join('_')
		.split('=')
		.join('');
}
