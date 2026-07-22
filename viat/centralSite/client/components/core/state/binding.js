import {
	cachedProxy,
	isArrayBuffer,
	isFunction,
	isMap,
	isObject,
	isSet,
	isSymbol,
	joinPath,
	setValueAtPath,
} from '../utilities.js';
import { globalRealm, storeRealm } from './globalState.js';
import { ensureStateBus, localRealm, STATE_PATH } from './state.js';
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
/**
 * Resolve a keyed binding's CHANNEL once, at the authoring boundary. The key
 * mirrors the component property access it stands for (an optional leading
 * `this.` is accepted and stripped):
 *
 *     bind('items')                → local state  (bare = shorthand for state.*)
 *     bind('state.items')          → local state, explicit
 *     bind('global.things')        → the shared global store
 *     bind('stores.shop.items')    → the named store `shop` from `static stores`
 *
 * A DOTTED key must name its channel — any other first segment throws. This is
 * deliberate enforcement, not convenience: the channel vocabulary is FIXED
 * (state / global / stores), so a state key can never alias a store name (the
 * D/E misroute class), and every deep path reads exactly like the property
 * chain it binds. Bare keys keep the local shorthand, so a top-level local key
 * literally named `global` or `stores` stays local.
 * @param {string} rawKey - The authored binding key.
 * @returns {{global: boolean, storeName: string|null, key: string}} The carried channel + bare path.
 */
function buildBindingChannel(rawKey) {
	const key = rawKey.startsWith('this.') ? rawKey.slice(5) : rawKey;
	const dotIndex = key.indexOf('.');
	if (dotIndex === -1) {
		return {
			global: false,
			storeName: null,
			key,
		};
	}
	const channel = key.slice(0, dotIndex);
	const rest = key.slice(dotIndex + 1);
	if (channel === 'state') {
		return {
			global: false,
			storeName: null,
			key: rest,
		};
	}
	if (channel === 'global') {
		return {
			global: true,
			storeName: null,
			key: rest,
		};
	}
	if (channel === 'stores') {
		const nameEnd = rest.indexOf('.');
		if (nameEnd === -1) {
			throw new Error(`bind/list key "${rawKey}": bind a path WITHIN the store — stores.${rest}.<path>.`);
		}
		return {
			global: false,
			storeName: rest.slice(0, nameEnd),
			key: rest.slice(nameEnd + 1),
		};
	}
	throw new Error(`bind/list key "${rawKey}": a dotted key must name its channel — state.<path>, global.<path>, or stores.<name>.<path>. Bare keys (no dot) are the state shorthand.`);
}
/*
 * Channel parses are memoized — binding keys are static template strings, a
 * bounded vocabulary re-parsed on every Binding construction every render
 * pass. The cached channel object is SHARED across Binding instances:
 * consumers copy its scalar fields out and must never mutate or retain it.
 * At the cap the whole cache drops (a cold re-parse is transparent) and the
 * check rides only the miss branch, mirroring PARSED_PATHS in utilities.js.
 * A throwing key propagates before caching, so bad keys re-throw every call.
 */
const PARSED_CHANNELS = new Map();
const PARSED_CHANNELS_CAP = 10000;
// @engram em:network/code/tk-35-x11-x12-x18-shipped-raw-state-guard-setone-channel-mem — X18: channel memo (6.5x Binding ctor)
function parseBindingChannel(rawKey) {
	let channel = PARSED_CHANNELS.get(rawKey);
	if (!channel) {
		if (PARSED_CHANNELS.size >= PARSED_CHANNELS_CAP) {
			PARSED_CHANNELS.clear();
		}
		channel = buildBindingChannel(rawKey);
		PARSED_CHANNELS.set(rawKey, channel);
	}
	return channel;
}
export class Binding {
	constructor(key, value, kind = null) {
		/*
		 * Channel is resolved ONCE here (see parseBindingChannel) and carried as
		 * data — a `global` flag, an optional `storeName`, and a BARE path — so
		 * no downstream code re-parses a string to pick a realm.
		 */
		const channel = parseBindingChannel(key);
		this.global = channel.global;
		this.storeName = channel.storeName;
		this.key = channel.key;
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
/*
 * Reactive host-ATTRIBUTE channel — the `this.attrs.*` twin of state tracking.
 * Attr deps ride the component's OWN `ComponentStateBus` (via `localRealm`), so
 * they inherit its `onFlush → updateView` patch-pass kick and microtask
 * batching for free — a dedicated bus would flip the dirty flag but never
 * repaint. The `attr:` path prefix keeps attr buckets distinct from same-named
 * state keys on that shared bus (the dep map is realm-keyed too, so this is
 * belt-and-suspenders). `trackAttrRead` mirrors the state proxy's dep record;
 * `notifyAttrChange` fires from `attributeChangedCallback` for every observed
 * attribute — a change with no matching read-subscriber hits no bucket and
 * `onFlush`'s clean-template guard skips the repaint (precise, not blanket).
 */
const ATTR_DEP_PREFIX = 'attr:';
export function trackAttrRead(component, key) {
	if (currentTracking) {
		addDep(currentTracking, localRealm(component), ATTR_DEP_PREFIX + key);
	}
}
export function notifyAttrChange(component, key) {
	ensureStateBus(component).notify(ATTR_DEP_PREFIX + key);
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
		this.sizePath = joinPath(path, 'size');
		this.carrier = null;
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
			const nestedPath = this.sizePath;
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
			/*
			 * Cache the carrier on the facade (which is per-(target,path)); the
			 * handler is a singleton, so it cannot hold per-path state. realm and
			 * path are immutable for the facade's life.
			 */
			facade.carrier ??= {
				realm: facade.factory.realm,
				path: facade.path,
			};
			return facade.carrier;
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
		this.carrier = null;
		// Per-key child-proxy cache — skips joinPath + WeakMap/Map on hot re-reads.
		this.children = null;
	}
	static build(target, path, factory) {
		if (isSet(target) || isMap(target)) {
			const facade = new TrackingCollection(target, factory, path);
			return new Proxy(facade, TrackingCollectionProxyHandler.instance);
		}
		return new Proxy(target, new TrackingProxyHandler(factory, path));
	}
	/*
	 * Resolve a nested container to its tracking proxy. Handler-local Map keyed
	 * by property key; hit when the raw source identity is unchanged. Miss still
	 * goes through the factory cache so aliasing stays correct.
	 */
	childProxy(key, propertyValue, nestedPath) {
		const entry = this.children?.get(key);
		if (entry && entry.source === propertyValue) {
			return entry.proxy;
		}
		const path = entry?.path ?? nestedPath ?? joinPath(this.path, key);
		const proxy = this.factory.create(propertyValue, path);
		(this.children ??= new Map()).set(key, {
			source: propertyValue,
			path,
			proxy,
		});
		return proxy;
	}
	get(target, key) {
		const factory = this.factory;
		if (key === STATE_PATH) {
			// Per-(target,path) handler — realm and path are immutable, cache once.
			this.carrier ??= {
				realm: factory.realm,
				path: this.path,
			};
			return this.carrier;
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
		// Lazy nestedPath — only allocate when a consumer (dep track / child proxy) needs it.
		let nestedPath;
		if (!isFunction(propertyValue) && currentTracking) {
			nestedPath = joinPath(this.path, key);
			if (!propertyIndex || !propertyIndex.hasNonReactive || !propertyIndex.nonReactivePaths.has(nestedPath)) {
				addDep(currentTracking, factory.realm, nestedPath);
			}
		}
		if (isObject(propertyValue)) {
			return this.childProxy(key, propertyValue, nestedPath);
		}
		return propertyValue;
	}
	set(target, key, nextValue) {
		const factory = this.factory;
		if (factory.source) {
			factory.setValue(joinPath(this.path, key), nextValue);
			return true;
		}
		return Reflect.set(target, key, nextValue);
	}
}
/**
 * Per-(source, prefix) factory carrying the proxy cache, the dep prefix, and
 * the upstream `source` proxy that writes route through. `setValue` is a
 * prototype method — zero per-factory arrow allocations. Sites that wrote
 * through the old `makeSetter` arrow now call `factory.setValue(path, value)`
 * directly; the trap is responsible for the source-null fallback. Declared
 * AFTER the handler classes it instantiates through `cachedProxy`, so every
 * class reference in this module points backward.
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
		if (!isObject(value) || ArrayBuffer.isView(value) || isArrayBuffer(value)) {
			return value;
		}
		return cachedProxy(this.cache, value, path, TrackingProxyHandler, this);
	}
}
export function makeProxy(state, component) {
	const source = component?.stateProxy ?? state;
	const realm = component ? localRealm(component) : null;
	return new TrackingFactory(source, realm, component ?? null).create(state ?? {}, '');
}
/**
 * Memoized per-component render proxy — rebuilt only when the backing STATE
 * object identity changes (replaceState). The single shared implementation for
 * every render/tracking entry point (render passes and tracked template
 * expressions alike).
 * @param {WebComponent} component - The component whose render proxy to ensure.
 */
export function ensureRenderProxies(component) {
	const currentState = component.STATE ?? {};
	if (!component.renderProxy || component.renderProxyState !== currentState) {
		component.renderProxy = makeProxy(currentState, component);
		component.renderProxyState = currentState;
	}
}
/*
 * Module-level memo. The global render proxy is component-INDEPENDENT — built
 * with component=null and the const globalRealm, so a per-component copy was
 * always behaviorally identical and one shared instance serves every component
 * during render tracking (dep attribution rides the ambient currentTracking at
 * trap time, never anything baked into the proxy). Keyed on the source proxy
 * identity: a correct global reset MUST rebuild globalState.proxy (a Proxy's
 * target is fixed at construction — it cannot be repointed), so any reset yields
 * a fresh identity and this memo self-invalidates on the next call; a mutate-in-
 * place clear of the existing state object stays correct too, via live
 * read-through. The one case a single-slot memo cannot cover is multiple /
 * swappable realms — that belongs with the deferred per-component arbitrary-store
 * work, which would re-key this cache per realm.
 */
let cachedGlobalSource = null;
let cachedGlobalProxy = null;
export function makeGlobalProxy(globalState) {
	if (cachedGlobalProxy && cachedGlobalSource === globalState) {
		return cachedGlobalProxy;
	}
	cachedGlobalSource = globalState;
	cachedGlobalProxy = new TrackingFactory(globalState, globalRealm, null).create(globalState ?? {}, '');
	return cachedGlobalProxy;
}
const storeProxyCache = new WeakMap();
/**
 * Per-store render-tracking proxy — the named-store twin of `makeGlobalProxy`.
 * Component-INDEPENDENT (dep attribution rides the ambient `currentTracking` at
 * trap time, never baked into the proxy), so one shared tracking proxy per store
 * serves every component that reads `this.<storeName>` during render. Memoized on
 * the store's `proxy` identity — which `Store.replaceState` preserves via its
 * in-place reset — so the memo survives a store reset with no rebuild.
 * @param {Store} store - The store to build a tracking proxy for.
 * @returns {Proxy} The dep-tracking proxy attributing reads to the store's realm.
 */
export function makeStoreProxy(store) {
	const source = store.proxy;
	let proxy = storeProxyCache.get(source);
	if (!proxy) {
		proxy = new TrackingFactory(source, storeRealm(store), null).create(source, '');
		storeProxyCache.set(source, proxy);
	}
	return proxy;
}
/**
 * One-way reactive reference to a state path — a surgical binding spot that
 * patches in place without re-running render(). The key names its channel per
 * `parseBindingChannel`: `bind('items')` (local shorthand), `bind('state.a.b')`,
 * `bind('global.x')`, `bind('stores.shop.items')`. The binding auto-classifies
 * its content kind (or reads it from the component's `static properties`); the
 * typed variants (`bind.text` / `bind.html` / `bind.component` / `bind.list`)
 * DECLARE the kind so the engine skips classification. Each variant also
 * accepts a function → a computed spot carrying the kind. Exposed on every
 * component as `this.bind` — no import needed.
 * @param {string} stateKey - The channel-prefixed (or bare local) path to bind.
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
export function isBindingType(value) {
	if (!value) {
		return false;
	}
	const ctor = value.constructor;
	return ctor === Binding || ctor === ListBinding;
}
