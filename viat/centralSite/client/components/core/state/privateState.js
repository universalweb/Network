/*
 * privateState — hard-`#`-private, per-instance, reactive component state.
 *
 * Use case: hiding sensitive variables (crypto seeds, private keys, decrypted
 * material) from the PUBLIC reactive surface — `state` / serialization / child
 * `.state=` passing / devtools enumeration / templates.
 *
 * HARD privacy in JS is lexical to the declaring class — a base class cannot
 * create or manage a subclass's `#field`. So the SUBCLASS declares the field
 * and the framework builds the reactive store it holds:
 *
 *   class Wallet extends WebComponent {
 *     #state = this.privateState({ seed: null, balance: 0n });
 *     loadSeed(s) { this.#state.seed = s; }            // write → notify
 *     get masked() { return mask(this.#state.balance); } // tracked read
 *   }
 *
 * The raw private object lives ONLY in `PrivateStateBus.#target` and in the
 * per-trap `target` argument the Proxy hands each trap — never in a stored
 * field on the realm, the handler, or the component. Nothing the framework
 * holds publicly exposes a `.target` walk to the data; `getValue('')` refuses
 * to hand out the root. The store is reachable only through the subclass's own
 * `#state` field, so it dies with the component (no module-level registry).
 *
 * SECURITY BOUNDARY. Hard against the common accidental-exposure surfaces:
 * serialization, enumeration, public `state`, child `.state=`, and the DOM. NOT
 * hard against same-realm code that holds the instance — a private value used
 * reactively is retrievable through a public field:
 *   tplState.spots → spot.depMap → Subscription.bus.getValue(path)   (paths = Map keys)
 * This includes the derived-getter masking pattern: a `${() => …this.#state.x…}`
 * computed spot parks a private-realm Subscription in `spot.depMap`. The `#target`
 * field closes the `.bus.target` walk but not `.bus.getValue(path)`. For a secret
 * that must survive same-realm inspection, keep it behind a Worker / WASM boundary.
 * Future tightening: markRenderDirty / Spot.handle ignore the bus-passed value
 * (they re-read on drain) and only observePrivate consumes it, so the spot and
 * renderDep flush path could be made value-blind to shrink this surface.
 */
import { ComponentSubscriptionTracker, PathSubscriptions, TrackedBundle } from './pathSubscriptions.js';
import { addDep, currentTracking } from './binding.js';
import {
	getValueAtPath,
	isArray,
	isObject,
	isPlainObject,
	isPromiseLike,
	isSymbol,
	joinPath,
	queueAsyncError,
	setValueAtPath,
} from '../utilities.js';
import { STATE_PATH } from './state.js';
/**
 * Bus for one component's private store. Mirrors ComponentStateBus, but reads
 * against the hard-private target instead of `component.STATE`. The target is a
 * `#field` so holding the bus (for example via a Subscription) never exposes a
 * `bus.target` handle to the secret; `getValue('')` refuses the root.
 */
class PrivateStateBus extends PathSubscriptions {
	#target;
	constructor(component, target) {
		super();
		this.component = component;
		this.#target = target;
	}
	getValue(path) {
		if (!path) {
			return undefined;
		}
		return getValueAtPath(this.#target, path);
	}
	onFlush() {
		const result = this.component.updateView();
		if (isPromiseLike(result)) {
			result.catch(queueAsyncError);
		}
	}
}
/**
 * Realm identity for private deps — a distinct object so private paths NEVER
 * co-mingle with local/global in the `Map<realm, Set<path>>` dep accumulator
 * (routing is by realm reference). `global:false` → renderDep picks plain
 * `markRenderDirty`. Holds no target field; reads route through the bus.
 */
class PrivateRealm {
	constructor(component, bus) {
		this.component = component;
		this.bus = bus;
		this.global = false;
		this.private = true;
		this.cache = new WeakMap();
		/*
		 * Set once after the root proxy is built — `write` routes through it so
		 * nested writes notify. Not the data itself (a Proxy), so no leak.
		 */
		this.rootProxy = null;
	}
	read(path) {
		return this.bus.getValue(path);
	}
	write(path, value) {
		if (this.rootProxy) {
			setValueAtPath(this.rootProxy, path, value);
		}
	}
}
/**
 * Combined proxy handler for the private store — low-traffic (sensitive vars,
 * not hot lists), so ONE handler does both jobs the public state splits across
 * two for hot-path monomorphism: `get` records a private-realm dep when a
 * tracking session is live (then recurses), and `set`/`delete` mutate + notify
 * the private bus. Never stores `target` (the Proxy hands it per-trap), so the
 * handler instance carries no path to the secret.
 */
class PrivateProxyHandler {
	constructor(realm, path) {
		this.realm = realm;
		this.path = path;
	}
	static build(target, path, realm) {
		return new Proxy(target, new PrivateProxyHandler(realm, path));
	}
	get(target, key) {
		if (key === STATE_PATH) {
			return {
				realm: this.realm,
				path: this.path,
			};
		}
		if (isSymbol(key)) {
			return Reflect.get(target, key);
		}
		const propertyValue = Reflect.get(target, key);
		const nestedPath = joinPath(this.path, key);
		if (currentTracking && typeof propertyValue !== 'function') {
			addDep(currentTracking, this.realm, nestedPath);
		}
		if (isPlainObject(propertyValue) || isArray(propertyValue)) {
			const cache = this.realm.cache;
			let pathMap = cache.get(propertyValue);
			if (!pathMap) {
				pathMap = new Map();
				cache.set(propertyValue, pathMap);
			}
			const existing = pathMap.get(nestedPath);
			if (existing) {
				return existing;
			}
			const proxy = PrivateProxyHandler.build(propertyValue, nestedPath, this.realm);
			pathMap.set(nestedPath, proxy);
			return proxy;
		}
		return propertyValue;
	}
	set(target, key, value) {
		if (target[key] === value) {
			return true;
		}
		const nestedPath = joinPath(this.path, key);
		Reflect.set(target, key, value);
		this.realm.bus.notify(nestedPath);
		return true;
	}
	deleteProperty(target, key) {
		/*
		 * Null-assign instead of `delete` to preserve the target's hidden class
		 * (matches StateProxyHandler). True absence isn't modeled here.
		 */
		if (!Object.hasOwn(target, key) || target[key] === null) {
			return true;
		}
		const nestedPath = joinPath(this.path, key);
		target[key] = null;
		this.realm.bus.notify(nestedPath);
		return true;
	}
}
/**
 * Build the hard-private reactive store and return the proxy the subclass holds
 * in its own `#field` (`#state = this.privateState({…})`). The component's own
 * methods reach it; nothing else can. `initial` becomes the live target — a
 * fresh object literal per construction in the field initializer, so there is no
 * cross-instance sharing.
 * @this {import('../base.js').WebComponent}
 * @param {object} [initial] - The starting private state.
 * @returns {object} The reactive private-state proxy.
 */
export function privateState(initial = {}) {
	const target = isObject(initial) ? initial : {};
	const bus = new PrivateStateBus(this, target);
	const realm = new PrivateRealm(this, bus);
	const proxy = PrivateProxyHandler.build(target, '', realm);
	realm.rootProxy = proxy;
	return proxy;
}
/**
 * Subscribe an internal handler to one or more paths on a private store. Pass
 * the component's own `#state` proxy (only its methods can name it); the bus is
 * reached transitively via the STATE_PATH symbol, so the framework never stores
 * a handle to the store. The returned disposer is the caller's to keep (for
 * example in a `#field`, disposed in onDisconnect). Auto-cleanup via a public tracker is
 * deliberately avoided because such a tracker would expose
 * `subscription.bus.getValue` and leak the value. GC reclaims the store with the
 * component, and `updateView` no-ops post-disconnect, so an uncleaned observer
 * neither leaks nor misfires.
 * @this {import('../base.js').WebComponent}
 * @param {object} privateProxy - The component's `#state` proxy.
 * @param {string|string[]|object} keys - A path, an array of paths, or a `{ path: handler }` map (with `handler` omitted).
 * @param {Function} [handler] - Called with `(value, changedPath)` on change.
 * @returns {object|null} A Subscription / TrackedBundle disposer, or null when the proxy carries no private bus.
 */
export function observePrivate(privateProxy, keys, handler) {
	const meta = privateProxy?.[STATE_PATH];
	const bus = meta?.realm?.bus;
	if (!bus) {
		return null;
	}
	if (isPlainObject(keys) && handler === undefined) {
		const objKeys = Object.keys(keys);
		const subscriptions = [];
		for (let i = 0; i < objKeys.length; i += 1) {
			subscriptions.push(bus.subscribe(objKeys[i], keys[objKeys[i]]));
		}
		return new TrackedBundle(new ComponentSubscriptionTracker(), subscriptions);
	}
	if (isArray(keys)) {
		const subscriptions = [];
		for (let i = 0; i < keys.length; i += 1) {
			subscriptions.push(bus.subscribe(keys[i], handler));
		}
		return new TrackedBundle(new ComponentSubscriptionTracker(), subscriptions);
	}
	return bus.subscribe(String(keys ?? ''), handler);
}
