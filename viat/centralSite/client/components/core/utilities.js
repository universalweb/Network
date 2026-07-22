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
export function isNode(value) {
	return value instanceof Node;
}
export function isHTMLElement(value) {
	return value instanceof HTMLElement;
}
export function isCSSStyleSheet(value) {
	return value instanceof CSSStyleSheet;
}
export function isPromiseLike(value) {
	return value !== null && typeof value === 'object' && isFunction(value.then);
}
export function isPromise(value) {
	return value instanceof Promise;
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
export function isArrayBuffer(value) {
	return value instanceof ArrayBuffer;
}
export function isUint8Array(value) {
	return value instanceof Uint8Array;
}
export function isDate(value) {
	return value instanceof Date;
}
export function assign(target, ...sources) {
	return Object.assign(target, ...sources);
}
export function hasOwn(obj, key) {
	return Object.hasOwn(obj, key);
}
/**
 * Zero-allocation emptiness probe. `Object.keys(obj).length === 0` allocates the
 * whole keys array purely to read its length; a for-in that returns on the first
 * own key avoids it. Hot: every connect probes `STATE` emptiness.
 * @param {object} obj - The object to test.
 * @returns {boolean} True when `obj` has at least one own enumerable key.
 */
export function hasAnyKey(obj) {
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			return true;
		}
	}
	return false;
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
export function callFn(fn) {
	fn();
}
export function eachArray(arr, fn) {
	const arrLength = arr.length;
	for (let index = 0; index < arrLength; index++) {
		fn(arr[index], index);
	}
}
export function eachObject(obj, fn) {
	const keys = Object.keys(obj);
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index++) {
		fn(keys[index], obj[keys[index]]);
	}
}
export function eachNodeList(list, fn) {
	const listLength = list.length;
	for (let index = 0; index < listLength; index++) {
		fn(list[index], index);
	}
}
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
		const keysLength = keys.length;
		if (keysLength !== Object.keys(b).length) {
			return false;
		}
		for (let index = 0; index < keysLength; index++) {
			const key = keys[index];
			if (!plainEqual(a[key], b[key])) {
				return false;
			}
		}
		return true;
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
/*
 * Bound the split-path cache. Dynamic list-index paths (`items.4821.label`) mint
 * a unique key per row, so an unbounded Map pins one small array per path ever
 * seen — a slow leak across a long session churning large lists. At the cap, drop
 * the whole cache: consumers (getValueAtPath / buildIndex / collectOverlaps) read
 * the returned array locally and never retain it by identity, so a cold re-split
 * is transparent. The check rides ONLY the cache-miss branch, so a cache hit (the
 * hot path) still pays a single Map.get.
 */
const PARSED_PATHS_CAP = 10000;
export function parsePath(path) {
	if (!path) {
		return null;
	}
	let parts = PARSED_PATHS.get(path);
	if (!parts) {
		if (PARSED_PATHS.size >= PARSED_PATHS_CAP) {
			PARSED_PATHS.clear();
		}
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
	const partsLength = parts.length;
	for (let index = 0; index < partsLength; index++) {
		if (value == null) {
			return undefined;
		}
		const key = parts[index];
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
// @engram em:network/code/events-e7-e8-shared-customevent-init-weakreffor-one-ref-per- — the sharing-safety argument, grep-verified
/*
 * One WeakRef per target, ever — every subscription surface (EventEntry,
 * DelegateEntry, hotkeys, cached listeners) refs the same few components, so a
 * fresh WeakRef per registration is pure garbage. Safe to share because a
 * WeakRef is immutable and nothing keys on WeakRef identity; the ephemeron
 * entry dies with its target, so the cache pins nothing.
 */
const weakRefCache = new WeakMap();
export function weakRefFor(target) {
	let ref = weakRefCache.get(target);
	if (ref === undefined) {
		ref = new WeakRef(target);
		weakRefCache.set(target, ref);
	}
	return ref;
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
/*
 * Shared init for error-channel emits — cancelable is the handled-signal:
 * a listener that recovers calls preventDefault(); unprevented falls through
 * to the raw rethrow. Module-static, zero per-error allocation.
 */
const ERROR_EMIT_OPTIONS = {
	cancelable: true,
};
/**
 * Error-as-event channel — failures surface as a cancelable, bubbling,
 * composed CustomEvent on the owning component (detail.data = the error), the
 * same bus shape as every other framework event, so apps handle them where
 * they handle everything else: `@renderError` in a template, addEventListener
 * on the element, or one delegated listener on an app shell (they bubble).
 * preventDefault() marks the error HANDLED. Nobody preventing → the original
 * error rethrows raw via queueAsyncError — silence is impossible, the default
 * is loud. This mirrors the platform's own contract (ErrorEvent /
 * unhandledrejection: preventDefault suppresses the default report).
 * @param {WebComponent} component - The component the failure belongs to.
 * @param {string} eventName - 'renderError' | 'lifecycleError'.
 * @param {unknown} error - The failure, delivered as `detail.data`.
 */
export function emitError(component, eventName, error) {
	if (component.emit(eventName, error, ERROR_EMIT_OPTIONS)) {
		queueAsyncError(error);
	}
}
async function awaitHookResult(result, component, errorEvent) {
	try {
		await result;
		return true;
	} catch (error) {
		emitError(component, errorEvent, error);
		return false;
	}
}
export function runHook(component, hookName, args, errorEvent = 'lifecycleError') {
	if (!component[hookName]) {
		return true;
	}
	let result;
	try {
		result = args ? component[hookName](...args) : component[hookName]();
	} catch (error) {
		emitError(component, errorEvent, error);
		return false;
	}
	if (!isPromiseLike(result)) {
		return true;
	}
	return awaitHookResult(result, component, errorEvent);
}
/**
 * Polymorphic disposer: invokes `.unsubscribe()` on a Subscription instance,
 * or calls a plain function for legacy disposers (the closure handles returned
 * by watchGlobal's stopWatching pattern, etc.).
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
 * Lifecycle disconnect sweep for a Set of subscription ENTRIES (EventEntry /
 * DelegateEntry). Distinct from `clearUnsubs` above: that one disposes a set of
 * polymorphic disposers via `disposeItem`, this one tears down entries that
 * REMOVE THEMSELVES from the very set being walked (both `unsubscribe()`
 * implementations end in `owner.<field>?.delete(this)`), so the snapshot is
 * load-bearing, not defensive. The trailing `clear()` is the defensive half —
 * by then the set is already empty.
 * @param {Set<{unsubscribe: Function}>} entries - The owner's entry set.
 */
export function sweepEntrySet(entries) {
	if (!entries?.size) {
		return;
	}
	const snapshot = Array.from(entries);
	const snapshotLength = snapshot.length;
	for (let index = 0; index < snapshotLength; index++) {
		snapshot[index].unsubscribe();
	}
	entries.clear();
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
// @engram em:network/code/tk-35-x6-tk-32-known-3-shipped-setvalueatpath-parsepath-sync — KNOWN-3: skip-probe bake-in covers both call sites (8.39x unchanged)
/*
 * Fast membership probe for syncSubsByDiff's common case: sizes equal AND every
 * next key already subscribed. When true the diff below is provably a no-op — it
 * would dispose nothing (every current key is still in nextKeys) and subscribe
 * nothing (every next key is already in current) — so returning early elides its
 * two [...spread] snapshots. O(k) tests, zero allocation.
 */
function sameMembership(current, nextKeys) {
	if (current.size !== nextKeys.size) {
		return false;
	}
	for (const key of nextKeys) {
		if (!current.has(key)) {
			return false;
		}
	}
	return true;
}
/**
 * Keep `current` (Map<key, sub>) in sync with `nextKeys` (Set<key>) by:
 *   - disposing the subscription for any key dropped
 *   - subscribing only for keys newly added
 * Returns the same `current` map (now updated). Stable keys keep their
 * subscription reference so we don't churn subscribers when state shapes
 * are unchanged — the sameMembership probe short-circuits straight to that
 * no-op on the overwhelmingly common unchanged-deps pass.
 *
 * `subscribe` is invoked as `subscribe(key, context)` — the optional 4th
 * arg carries per-call data (component, spot, …) so callers can pass a
 * module-scope first-class fn instead of a wrapper closure that captures
 * the same data. Callbacks that don't need a context simply ignore the
 * second parameter.
 */
export function syncSubsByDiff(current, nextKeys, subscribe, context) {
	if (sameMembership(current, nextKeys)) {
		return current;
	}
	const entries = [...current.entries()];
	const entriesLength = entries.length;
	for (let index = 0; index < entriesLength; index += 1) {
		const key = entries[index][0];
		if (!nextKeys.has(key)) {
			disposeItem(entries[index][1]);
			current.delete(key);
		}
	}
	const nextArray = [...nextKeys];
	const nextArrayLength = nextArray.length;
	for (let index = 0; index < nextArrayLength; index += 1) {
		const key = nextArray[index];
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
		const keysLength = keys.length;
		for (let index = 0; index < keysLength; index++) {
			const key = keys[index];
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
 * Used by the framework to materialize instance state: the constructor clones each
 * container value of the chain-merged `static state` template per instance (base.js), so
 * every component owns its own outer objects/arrays/Maps/Sets while primitives, functions,
 * and class instances are shared by assignment. Provided constructor state is NOT cloned
 * (caller-owned) — only the keys it does not carry fall back to a cloned static default.
 */
export function smartClone(value) {
	if (!isObject(value)) {
		return value;
	}
	if (isArray(value)) {
		const out = new Array(value.length);
		const valueLength = value.length;
		for (let index = 0; index < valueLength; index++) {
			out[index] = smartClone(value[index]);
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
		const keysLength = keys.length;
		for (let index = 0; index < keysLength; index++) {
			const key = keys[index];
			out[key] = smartClone(value[key]);
		}
		return out;
	}
	return value;
}
// @engram em:network/code/tk-35-x6-tk-32-known-3-shipped-setvalueatpath-parsepath-sync — X6: cache reuse, never pop (1.53x)
/*
 * Descend via the shared parsePath cache (write paths share the read path's
 * vocabulary, so hits are near-guaranteed) and address the final key BY INDEX.
 * Never parts.pop(): the returned array is the cached instance every future read
 * of this path reuses, so mutating it would corrupt them. The single-key path
 * keeps its includes('.') shortcut to skip the Map lookup entirely.
 */
export function setValueAtPath(source, path, value) {
	if (!path.includes('.')) {
		source[path] = value;
		return;
	}
	const parts = parsePath(path);
	const lastIndex = parts.length - 1;
	let cursor = source;
	for (let index = 0; index < lastIndex; index++) {
		const part = parts[index];
		if (!isPlainObject(cursor[part]) && !isArray(cursor[part])) {
			cursor[part] = {};
		}
		cursor = cursor[part];
	}
	cursor[parts[lastIndex]] = value;
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
	if (isUint8Array(source)) {
		bytes = source;
	} else if (isArrayBuffer(source)) {
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
