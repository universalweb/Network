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
import { Logger } from '../debug/logger.js';
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
		if (Logger.perfOn) {
			Logger.perf('globalState', reportWastedStoreSet, obj, key, value, fullPath);
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
	get(key) {
		return key === undefined ? this.proxy : getValueAtPath(this.proxy, key);
	}
	set(updates) {
		if (!isPlainObject(updates)) {
			return;
		}
		const proxy = this.proxy;
		const keys = Object.keys(updates);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const value = updates[key];
			const current = getValueAtPath(proxy, key);
			if (current === value) {
				continue;
			}
			/**
			 * Drop structurally-equal writes here so we don't pay re-render
			 * cost on fresh-but-identical objects (the wasted-set perf
			 * warning's whole motivation). Direct proxy mutations still warn
			 * — callers who reach past `Store.set` opt out of the guard.
			 */
			if (plainEqual(current, value)) {
				continue;
			}
			setValueAtPath(proxy, key, value);
		}
	}
	observe(key, handler) {
		return this.bus.subscribe(key, handler);
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
// global realm singleton; per-component local realms live in state.js.
export const globalRealm = {
	bus: globalState.bus,
	global: true,
	read(path) {
		return getValueAtPath(globalState.proxy, path);
	},
	write(path, value) {
		globalState.set({
			[path]: value,
		});
	},
};
