import { defaultLogger } from '../debug/logger.js';
import {
	cachedProxy,
	getValueAtPath,
	hasOwn,
	isArray,
	isPlainObject,
	isSymbol,
	joinPath,
	plainEqual,
	setValueAtPath,
} from '../utilities.js';
import { PathSubscriptions } from './pathSubscriptions.js';
/**
 * Reactive bus for a `Store`. Mirrors `ComponentStateBus` in state.js: holds
 * a back-reference to the store so `getValue(path)` resolves against the
 * store's reactive proxy at flush time. `onFlush` is inherited as a no-op —
 * a Store has no render pipeline of its own; downstream observers drive
 * their own renders.
 */
class StoreBus extends PathSubscriptions {
	constructor(store) {
		super();
		this.store = store;
	}
	getValue(path) {
		return getValueAtPath(this.store.proxy, path);
	}
}
function reportWastedStoreSet(obj, key, value, fullPath) {
	if (!plainEqual(obj[key], value)) {
		return null;
	}
	return `wasted set on "${fullPath}" — new value is structurally equal to current but a different reference; reuse the existing reference to avoid re-render.`;
}
/**
 * Stateless trap container for a reactive `Store`. Each proxy holds a tiny
 * handler instance carrying just `(store, path)` so the trap can resolve the
 * bus and proxy cache via `this.store` without module-scope state — the
 * legacy `let GLOBAL_STATE = null` reassignment is gone. Methods live on the
 * prototype for JIT monomorphization across every nested-path proxy.
 */
class StoreProxyHandler {
	constructor(store, path) {
		this.store = store;
		this.path = path;
	}
	static create(store, target, path = '') {
		if (!isPlainObject(target) && !isArray(target)) {
			return target;
		}
		return cachedProxy(store.proxyCache, target, path, StoreProxyHandler, store);
	}
	static build(target, path, store) {
		return new Proxy(target, new StoreProxyHandler(store, path));
	}
	get(obj, key) {
		if (isSymbol(key)) {
			return Reflect.get(obj, key);
		}
		const propertyValue = Reflect.get(obj, key);
		const nestedPath = joinPath(this.path, key);
		if (isPlainObject(propertyValue) || isArray(propertyValue)) {
			return StoreProxyHandler.create(this.store, propertyValue, nestedPath);
		}
		return propertyValue;
	}
	set(obj, key, value) {
		if (obj[key] === value) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		// Dev-only waste detect under perf; hot path stays === only.
		if (defaultLogger.perfOn) {
			defaultLogger.perf('globalState', reportWastedStoreSet, obj, key, value, fullPath);
		}
		Reflect.set(obj, key, value);
		this.store.bus.notify(fullPath);
		return true;
	}
	deleteProperty(obj, key) {
		/**
		 * `delete store.foo` is translated to null-assignment so the store's
		 * hidden class stays stable — `delete` would trigger a V8 deopt.
		 * Callers that need true "absent" semantics should model the field
		 * with a Map or use a sentinel.
		 */
		if (!hasOwn(obj, key) || obj[key] === null) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		obj[key] = null;
		this.store.bus.notify(fullPath);
		return true;
	}
}
/**
 * Reactive key/value store. Owns its STATE container, a path-keyed bus, and
 * a `proxy` that traps reads/writes so mutations notify subscribers. The
 * shape mirrors what each WebComponent has internally (STATE + stateBus +
 * stateProxy); this is just that machinery hoisted into a stand-alone class.
 *
 * `Store.create()` is the only constructor entry point — no `null`-then-
 * reassigned bootstrap. Subscribe with `.observe(key, handler)`; the returned
 * `Subscription` instance has an `.unsubscribe()` for explicit teardown.
 * Component-side wrappers (`this.observeGlobal`) delegate here and add
 * auto-cleanup tied to the component lifecycle.
 */
export class Store {
	STATE = {};
	proxyCache = new WeakMap();
	proxy = null;
	bus = null;
	static create() {
		const store = new Store();
		store.bus = new StoreBus(store);
		store.proxy = StoreProxyHandler.create(store, store.STATE);
		return store;
	}
	static is(value) {
		return value instanceof Store;
	}
	get(key) {
		return key === undefined ? this.proxy : getValueAtPath(this.proxy, key);
	}
	set(updates) {
		if (!isPlainObject(updates)) {
			return;
		}
		const keys = Object.keys(updates);
		const keysLength = keys.length;
		for (let index = 0; index < keysLength; index++) {
			const key = keys[index];
			this.setOne(key, updates[key]);
		}
	}
	// @engram em:network/code/tk-35-x11-x12-x18-shipped-raw-state-guard-setone-channel-mem — X11/X12: raw-STATE guard + setOne (91.8x same-ref skip)
	/**
	 * Single-key write with the equality guard — the primitive `set` loops
	 * over and `StoreRealm.write` calls directly (no `{[path]: value}` detour
	 * per two-way write). Wrappers intercepting store writes must wrap BOTH
	 * `set` and `setOne`.
	 *
	 * The guard reads `this.STATE` RAW. The proxy read wrapped object values
	 * in a child proxy, so `current === value` could never hit for a reused
	 * stored ref and every object write fell through to a plainEqual walked
	 * entirely through get traps. Raw reads restore the O(1) identity skip,
	 * and the deep compare — still the guard for fresh-but-structurally-equal
	 * objects (the wasted-set warning's whole motivation) — runs untrapped.
	 * The pathMap probe keeps the one skip only the proxy read caught, a
	 * caller passing back the memoized child proxy, as an identity hit:
	 * `getValueAtPath(proxy, key)` always returns
	 * `proxyCache.get(rawCurrent).get(key)`, so two map hits replicate the
	 * old comparison without minting proxies. Writes still go through the
	 * proxy so the set trap notifies; direct proxy mutations still warn —
	 * callers who reach past the store API opt out of the guard.
	 */
	setOne(key, value) {
		const current = getValueAtPath(this.STATE, key);
		if (current === value) {
			return;
		}
		const pathMap = this.proxyCache.get(current);
		if (pathMap && pathMap.get(key) === value) {
			return;
		}
		if (plainEqual(current, value)) {
			return;
		}
		setValueAtPath(this.proxy, key, value);
	}
	observe(key, handler) {
		return this.bus.subscribe(key, handler);
	}
	/**
	 * Replace the whole store in place, preserving `STATE` (and therefore
	 * `proxy`) identity. A Proxy target is immutable, so `store.STATE = {}`
	 * would strand `store.proxy` on the old object; instead we null out the
	 * keys the new state drops (null-as-absent — the same hidden-class-stable
	 * convention as `deleteProperty`) and overwrite the rest directly, bypassing
	 * the per-key `set` trap so N writes cost N assignments, not N notifies.
	 *
	 * Identity preservation is the whole point: every `globalRealm.read`, the
	 * shared global render proxy (memoized on `globalState.proxy` identity), and
	 * every captured `this.global` reference keep resolving against the live
	 * proxy with no rebuild. `proxyCache` is left as-is — it is keyed by target
	 * object, so replaced children fall out of reachability and GC while any
	 * child object reused by reference keeps its valid cached proxy.
	 *
	 * A single `bus.notifyAll()` fans the change to every subscriber once, at
	 * its own path (O(subs), no N×N overlap scan) — dropped keys fire with the
	 * resolved `null`, so a subscriber at a removed path re-renders empty rather
	 * than reading stale.
	 * @param {object} nextState - The replacement top-level state object.
	 */
	replaceState(nextState) {
		const next = isPlainObject(nextState) ? nextState : {};
		if (plainEqual(this.STATE, next)) {
			return;
		}
		const state = this.STATE;
		const currentKeys = Object.keys(state);
		const currentKeysLength = currentKeys.length;
		for (let index = 0; index < currentKeysLength; index++) {
			const key = currentKeys[index];
			if (!hasOwn(next, key)) {
				state[key] = null;
			}
		}
		const nextKeys = Object.keys(next);
		const nextKeysLength = nextKeys.length;
		for (let index = 0; index < nextKeysLength; index++) {
			const key = nextKeys[index];
			state[key] = next[key];
		}
		this.bus.notifyAll();
	}
}
export const globalState = Store.create();
/*
 * A reactive REALM is the object-reference replacement for the old `global.`
 * string prefix: a self-contained {bus, read, write, global} that says WHICH
 * reactive store a dependency belongs to. Routing, value resolution, and
 * two-way writes go through the realm directly — no string parsing, and
 * local / global / private channels never co-mingle. This is the shared
 */
/**
 * Reactive realm for a `Store` — the shared-bus channel a `this.global.*` /
 * `this.<storeName>.*` tracking proxy attributes its dependencies to. A CLASS
 * (not a per-store object literal with fresh `read`/`write` closures): the
 * store rides an instance field and the accessors live on the prototype, so
 * every store realm shares one monomorphic shape with zero per-store closure.
 * `sharedBus: true` — the store's bus serves every component (no per-component
 * `onFlush → updateView`), so a renderDep on this realm ENQUEUES the component
 * into the global-render drain instead of relying on its own bus flush; the
 * local realm (state.js) carries `sharedBus: false`. render.js picks the dirty
 * marker off this flag, now a monomorphic own-property read across realm types.
 */
class StoreRealm {
	constructor(store) {
		this.store = store;
		this.bus = store.bus;
		this.global = true;
		this.sharedBus = true;
	}
	read(path) {
		return getValueAtPath(this.store.proxy, path);
	}
	write(path, value) {
		this.store.setOne(path, value);
	}
}
// global realm singleton; per-component local realms live in state.js.
export const globalRealm = new StoreRealm(globalState);
const storeRealms = new WeakMap();
/**
 * The reactive realm for a named `Store`. Memoized per store so the realm
 * identity — which keys both the render dep-map and the subscription submap —
 * is stable across renders.
 * @param {Store} store - The store to wrap.
 * @returns {StoreRealm} The store's realm.
 */
export function storeRealm(store) {
	let realm = storeRealms.get(store);
	if (!realm) {
		realm = new StoreRealm(store);
		storeRealms.set(store, realm);
	}
	return realm;
}
