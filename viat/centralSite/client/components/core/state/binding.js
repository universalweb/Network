import {
	cachedProxy,
	isFunction,
	isMap,
	isObject,
	isSet,
	isSymbol,
	joinPath,
	setValueAtPath,
} from '../utilities.js';
import { STATE_PATH } from './state.js';
// ── Content kinds ────────────────────────────────────────────────────
// Classification of any value that lands in a TEXT-position ${…} spot.
// One value → exactly one kind. The template engine's classifyContentKind()
// is the single decision point and CONTENT_PATCHERS maps each kind to its
// patch routine. A typed bind (this.bind.text / .html / …) or a matching
// `static types` entry DECLARES the kind up front, skipping classification.
//
//   TEXT       plain string / number          → textContent (fast path)
//   HTML       string containing markup (< &) → innerHTML
//   COMPONENT  a comp() binding or a DOM Node  → adopt the node
//   LIST       a LiveList (each() / list())    → keyed element diff
//   EMPTY      null | undefined | ''           → cleared
// ─────────────────────────────────────────────────────────────────────
export const CONTENT_KIND = {
	TEXT: 'text',
	HTML: 'html',
	COMPONENT: 'component',
	LIST: 'list',
	EMPTY: 'empty',
};
export let currentTracking = null;
export function setCurrentTracking(value) {
	currentTracking = value;
}
export class Binding {
	constructor(key, value, kind = null) {
		this.key = key;
		this.value = value;
		// Declared CONTENT_KIND from a typed bind — null means auto-classify
		// (or resolve from the component's `static types`).
		this.kind = kind;
	}
	toString() {
		return String(this.value ?? '');
	}
	valueOf() {
		return this.value;
	}
}
function makeDependencyKey(prefix, path) {
	if (!prefix) {
		return path;
	}
	return path ? `${prefix}.${path}` : prefix;
}
/**
 * Per-(source, prefix) factory carrying the proxy cache, the dep prefix, and
 * the upstream `source` proxy that writes route through. `setValue` is a
 * prototype method — zero per-factory arrow allocations. Sites that wrote
 * through the old `makeSetter` arrow now call `factory.setValue(path, value)`
 * directly; the trap is responsible for the source-null fallback.
 */
class TrackingFactory {
	constructor(source, prefix, typeIndex) {
		this.source = source ?? null;
		this.prefix = prefix;
		this.cache = new WeakMap();
		// `static types` index — lets the render proxy skip dep-tracking for
		// paths declared `react: false`. Null for the global proxy.
		this.typeIndex = typeIndex ?? null;
	}
	setValue(path, value) {
		setValueAtPath(this.source, path, value);
	}
	create(value, path = '') {
		if (!isObject(value)) {
			return value;
		}
		return cachedProxy(this.cache, value, path, TrackingProxyHandler, this);
	}
}
/**
 * Dep-tracking facade for a Set/Map under the tracking proxy. Every operation
 * lives on the prototype — one function shape across every collection facade,
 * zero closures + zero `.bind` per instance. Mirrors the `ReactiveCollection`
 * pattern from state.js: the proxy wraps the facade (not the raw Set/Map),
 * so method dispatch goes through the prototype with `this = proxy`, which
 * forwards `this.target` reads back through the same trap.
 *
 * Why a `size` getter instead of a passthrough: `size` is the only non-method
 * Set/Map read that the old trap recorded as a dep (functions skipped the
 * dep-tracking branch entirely). Preserving that exact behavior — methods
 * rely on the parent-level `tags` dep already recorded when `state.tags` was
 * first read; only `size` adds a finer-grained `tags.size` dep.
 */
class TrackingCollection {
	constructor(target, factory, path) {
		this.target = target;
		this.factory = factory;
		this.path = path;
	}
	has(key) {
		return this.target.has(key);
	}
	get(key) {
		return this.target.get(key);
	}
	add(item) {
		this.target.add(item);
		return this.target;
	}
	set(key, value) {
		this.target.set(key, value);
		return this.target;
	}
	delete(key) {
		return this.target.delete(key);
	}
	clear() {
		return this.target.clear();
	}
	forEach(cb) {
		return this.target.forEach(cb);
	}
	keys() {
		return this.target.keys();
	}
	values() {
		return this.target.values();
	}
	entries() {
		return this.target.entries();
	}
	get size() {
		if (currentTracking) {
			const factory = this.factory;
			const typeIndex = factory.typeIndex;
			const nestedPath = joinPath(this.path, 'size');
			if (!typeIndex || !typeIndex.hasNonReactive || !typeIndex.nonReactivePaths.has(nestedPath)) {
				currentTracking.add(makeDependencyKey(factory.prefix, nestedPath));
			}
		}
		return this.target.size;
	}
	[Symbol.iterator]() {
		return this.target[Symbol.iterator]();
	}
}
/**
 * Stateless proxy handler for `TrackingCollection` facades — singleton, all
 * traps live on the prototype, no per-proxy state. `getPrototypeOf` reports
 * `Set.prototype` / `Map.prototype` so external `instanceof Set/Map` checks
 * (e.g. template.js list-rendering at line 116/136) keep passing through the
 * tracking proxy.
 */
class TrackingCollectionProxyHandler {
	static instance = new TrackingCollectionProxyHandler();
	get(facade, key, receiver) {
		if (key === STATE_PATH) {
			return makeDependencyKey(facade.factory.prefix, facade.path);
		}
		return Reflect.get(facade, key, receiver);
	}
	set(facade, key, nextValue) {
		const factory = facade.factory;
		const nestedPath = joinPath(facade.path, key);
		if (factory.source) {
			factory.setValue(nestedPath, nextValue);
			return true;
		}
		return Reflect.set(facade.target, key, nextValue);
	}
	getPrototypeOf(facade) {
		return isMap(facade.target) ? Map.prototype : Set.prototype;
	}
}
/**
 * Object/array tracking proxy handler. Per-proxy (carries path); object path
 * still allocates a handler per nested-object dive, but Set/Map values flow
 * into `TrackingCollection` + the singleton collection handler, killing the
 * `.bind`-per-method pattern that used to live in the old unified `get` trap.
 */
class TrackingProxyHandler {
	constructor(factory, path) {
		this.factory = factory;
		this.path = path;
	}
	static build(target, path, factory) {
		if (isSet(target) || isMap(target)) {
			const facade = new TrackingCollection(target, factory, path);
			return new Proxy(facade, TrackingCollectionProxyHandler.instance);
		}
		return new Proxy(target, new TrackingProxyHandler(factory, path));
	}
	get(target, key) {
		const factory = this.factory;
		if (key === STATE_PATH) {
			return makeDependencyKey(factory.prefix, this.path);
		}
		if (isSymbol(key)) {
			return Reflect.get(target, key);
		}
		const propertyValue = Reflect.get(target, key);
		const nestedPath = joinPath(this.path, key);
		if (!isFunction(propertyValue) && currentTracking) {
			const typeIndex = factory.typeIndex;
			if (!typeIndex || !typeIndex.hasNonReactive || !typeIndex.nonReactivePaths.has(nestedPath)) {
				currentTracking.add(makeDependencyKey(factory.prefix, nestedPath));
			}
		}
		if (isObject(propertyValue)) {
			return factory.create(propertyValue, nestedPath);
		}
		return propertyValue;
	}
	set(target, key, nextValue) {
		const factory = this.factory;
		const nestedPath = joinPath(this.path, key);
		if (factory.source) {
			factory.setValue(nestedPath, nextValue);
			return true;
		}
		return Reflect.set(target, key, nextValue);
	}
}
export function makeProxy(state, component) {
	const source = component?.stateProxy ?? state;
	return new TrackingFactory(source, '', component?.typeIndex ?? null).create(state ?? {}, '');
}
export function makeGlobalProxy(globalState) {
	return new TrackingFactory(globalState, 'global', null).create(globalState ?? {}, '');
}
// One-way reactive reference to a state path — a surgical binding spot that
// patches in place without re-running render(). `bind('a.b')` auto-classifies
// its content kind (or reads it from the component's `static types`); the
// typed variants DECLARE the kind so the engine skips classification:
//   this.bind.text(key)       — declared TEXT  (strict textContent)
//   this.bind.html(key)       — declared HTML  (innerHTML)
//   this.bind.component(key)  — declared COMPONENT
//   this.bind.list(key, Comp) — declared LIST  (wired in template.js)
// Each variant also accepts a function → a computed spot carrying the kind.
// Exposed on every component as `this.bind` — no import needed.
export function bind(stateKey, currentValue) {
	return new Binding(String(stateKey ?? ''), currentValue, null);
}
function makeTypedBinding(stateKeyOrFn, currentValue, kind) {
	if (isFunction(stateKeyOrFn)) {
		stateKeyOrFn.contentKind = kind;
		return stateKeyOrFn;
	}
	return new Binding(String(stateKeyOrFn ?? ''), currentValue, kind);
}
function bindText(stateKeyOrFn, currentValue) {
	return makeTypedBinding(stateKeyOrFn, currentValue, CONTENT_KIND.TEXT);
}
function bindHtml(stateKeyOrFn, currentValue) {
	return makeTypedBinding(stateKeyOrFn, currentValue, CONTENT_KIND.HTML);
}
function bindComponent(stateKeyOrFn, currentValue) {
	return makeTypedBinding(stateKeyOrFn, currentValue, CONTENT_KIND.COMPONENT);
}
bind.text = bindText;
bind.html = bindHtml;
bind.component = bindComponent;
export function track(fn) {
	const deps = new Set();
	const previousTracking = currentTracking;
	currentTracking = deps;
	const value = fn();
	currentTracking = previousTracking;
	return {
		value,
		deps,
	};
}
