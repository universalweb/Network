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
import { STATE_PATH, localRealm } from './state.js';
import { globalRealm } from './globalState.js';
/*
 * ── Content kinds ────────────────────────────────────────────────────
 * Classification of any value that lands in a TEXT-position ${…} spot.
 * One value → exactly one kind. The template engine's classifyContentKind()
 * is the single decision point and CONTENT_PATCHERS maps each kind to its
 * patch routine. A typed bind (this.bind.text / .html / …) or a matching
 * `static properties` entry DECLARES the kind up front, skipping classification.
 *
 *   TEXT       plain string / number          → textContent (fast path)
 *   HTML       string containing markup (< &) → innerHTML
 *   COMPONENT  a comp() binding or a DOM Node  → adopt the node
 *   LIST       a LiveList (each() / list())    → keyed element diff
 *   EMPTY      null | undefined | ''           → cleared
 * ─────────────────────────────────────────────────────────────────────
 */
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
		/*
		 * Declared CONTENT_KIND from a typed bind — null means auto-classify
		 * (or resolve from the component's `static properties`).
		 */
		this.kind = kind;
	}
	toString() {
		return String(this.value ?? '');
	}
	valueOf() {
		return this.value;
	}
}
/**
 * Accumulate a tracked read into the per-render dependency Map, partitioned by
 * REALM (local / global / private NEVER co-mingle) — the object-reference
 * replacement for the old `global.`-prefixed flat string set. Paths stay bare;
 * routing is by realm identity, not string parsing.
 */
export function addDep(depMap, realm, path) {
	let paths = depMap.get(realm);
	if (!paths) {
		paths = new Set();
		depMap.set(realm, paths);
	}
	paths.add(path);
}
/**
 * Per-(source, prefix) factory carrying the proxy cache, the dep prefix, and
 * the upstream `source` proxy that writes route through. `setValue` is a
 * prototype method — zero per-factory arrow allocations. Sites that wrote
 * through the old `makeSetter` arrow now call `factory.setValue(path, value)`
 * directly; the trap is responsible for the source-null fallback.
 */
class TrackingFactory {
	constructor(source, realm, component) {
		this.source = source ?? null;
		this.realm = realm;
		this.cache = new WeakMap();
		/*
		 * Component reference — null for the global proxy. Used by the
		 * tracking proxy to dispatch top-level accessor getters via
		 * `.call(component)` and to read the class's propertyIndex (which
		 * declares `react: false` paths, declared kinds, and accessor maps).
		 */
		this.component = component ?? null;
		this.propertyIndex = component?.propertyIndex ?? null;
	}
	setValue(path, value) {
		setValueAtPath(this.source, path, value);
	}
	create(value, path = '') {
		/*
		 * Binary buffers (TypedArray / DataView / ArrayBuffer) are LEAF values —
		 * replaced wholesale, never element-mutated reactively — so pass them
		 * through raw instead of wrapping each in a tracking proxy. Wrapping
		 * breaks `ArrayBuffer.isView` downstream (e.g. template display →
		 * base64url) and serves no reactive purpose.
		 */
		if (!isObject(value) || ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
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
			const propertyIndex = factory.propertyIndex;
			const nestedPath = joinPath(this.path, 'size');
			if (!propertyIndex || !propertyIndex.hasNonReactive || !propertyIndex.nonReactivePaths.has(nestedPath)) {
				addDep(currentTracking, factory.realm, nestedPath);
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
 * (e.g. Template.js list-rendering at line 116/136) keep passing through the
 * tracking proxy.
 */
class TrackingCollectionProxyHandler {
	static instance = new TrackingCollectionProxyHandler();
	get(facade, key, receiver) {
		if (key === STATE_PATH) {
			return {
				realm: facade.factory.realm,
				path: facade.path,
			};
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
			return {
				realm: factory.realm,
				path: this.path,
			};
		}
		if (isSymbol(key)) {
			return Reflect.get(target, key);
		}
		const propertyIndex = factory.propertyIndex;
		/*
		 * Top-level accessor dispatch — declared via `get foo()` / `set foo()`
		 * in `static state`. Fires the getter with `this === component` so it
		 * can read sibling state (those reads route through this same proxy
		 * during render → naturally tracked) and call instance methods. The
		 * accessor's own path is registered as a dep so writes through the
		 * matching setter trigger the spot/renderDep re-fire.
		 */
		if (this.path === '' && propertyIndex?.hasAccessors && propertyIndex.getters.has(key)) {
			if (currentTracking) {
				addDep(currentTracking, factory.realm, key);
			}
			return propertyIndex.getters.get(key).call(factory.component);
		}
		const propertyValue = Reflect.get(target, key);
		const nestedPath = joinPath(this.path, key);
		if (!isFunction(propertyValue) && currentTracking) {
			if (!propertyIndex || !propertyIndex.hasNonReactive || !propertyIndex.nonReactivePaths.has(nestedPath)) {
				addDep(currentTracking, factory.realm, nestedPath);
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
	const realm = component ? localRealm(component) : null;
	return new TrackingFactory(source, realm, component ?? null).create(state ?? {}, '');
}
export function makeGlobalProxy(globalState) {
	return new TrackingFactory(globalState, globalRealm, null).create(globalState ?? {}, '');
}
/**
 * One-way reactive reference to a state path — a surgical binding spot that
 * patches in place without re-running render(). `bind('a.b')` auto-classifies
 * its content kind (or reads it from the component's `static properties`); the
 * typed variants (`bind.text` / `bind.html` / `bind.component` / `bind.list`)
 * DECLARE the kind so the engine skips classification. Each variant also
 * accepts a function → a computed spot carrying the kind. Exposed on every
 * component as `this.bind` — no import needed.
 * @param {string} stateKey - The state path to bind.
 * @param {*} [currentValue] - Optional captured current value.
 * @returns {Binding} The binding descriptor the template engine consumes.
 * @example
 * this.bind.text(key);       // declared TEXT  (strict textContent)
 * this.bind.html(key);       // declared HTML  (innerHTML)
 * this.bind.component(key);  // declared COMPONENT
 * this.bind.list(key, Comp); // declared LIST  (wired in template.js)
 */
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
/**
 * Open a dep-tracking session around a single function call and return
 * `{ value, deps }`. `thisArg` is dispatched through `expr.call(thisArg)` —
 * a single monomorphic call site replaces the per-eval wrapper arrow the
 * template runtime previously allocated for every computed spot refresh. For
 * callers that don't need a `this`, pass `undefined` (under strict-mode
 * modules, `expr.call(undefined)` is equivalent to a bare call).
 * @param {Function} expr - The expression to evaluate under tracking.
 * @param {*} [thisArg] - The `this` value to dispatch the call with.
 * @returns {{value: *, deps: Map}} The evaluated value and the collected deps.
 */
export function track(expr, thisArg) {
	/*
	 * deps is a Map<realm, Set<path>> — same shape as the renderDep accumulator;
	 * a computed spot's reads land in whichever realm produced them.
	 */
	const deps = new Map();
	const previousTracking = currentTracking;
	currentTracking = deps;
	const value = expr.call(thisArg);
	currentTracking = previousTracking;
	return {
		value,
		deps,
	};
}
/*
	`ListBinding` + `isBindingType` live here with `Binding` so the binding-type
	vocabulary has one home that the template parser (extractor) and the runtime
	core both import one-way — mirrors SPOT_TYPE → template/constants.js. Without
	this, the parser's bare-attr inference (which must recognize a Binding value)
	would force a circular template↔parser import.
*/
export class ListBinding extends Binding {
	static isListBinding(source) {
		return source instanceof ListBinding;
	}
	constructor(key, renderFn, keyFn, filterFn = null) {
		super(key, null);
		this.renderFn = renderFn;
		this.keyFn = keyFn;
		this.filterFn = filterFn;
	}
}
/*
	`RemoteListBinding` is a `ListBinding` carrying a remote-load config. It renders
	through the exact same `ListSpot` path (so `isListBinding` is true → keyed diff +
	filterFn are inherited verbatim); the only addition is the load controller the
	template mount-hook attaches when it sees this subtype. Kept here beside the
	other binding types so the parser/runtime share one binding-type vocabulary.
*/
export class RemoteListBinding extends ListBinding {
	static isRemoteListBinding(source) {
		return source instanceof RemoteListBinding;
	}
	constructor(key, renderFn, keyFn, filterFn, remoteConfig) {
		super(key, renderFn, keyFn, filterFn);
		this.remoteConfig = remoteConfig;
	}
}
export function isBindingType(x) {
	if (!x) {
		return false;
	}
	const c = x.constructor;
	return c === Binding || c === ListBinding || c === RemoteListBinding;
}
