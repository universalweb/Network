import { resolveStores } from '../attrs/staticConfig.js';
import { schedule } from '../lifecycle/scheduler.js';
import { getValueAtPath, isArray } from '../utilities.js';
import { globalState, Store } from './globalState.js';
import { ComponentSubscriptionTracker, TrackedBundle } from './pathSubscriptions.js';
import { ensureStateBus, StateKeyObserver } from './state.js';
function toList(keys) {
	return isArray(keys) ? keys : [keys];
}
function trackUnsubs(set, subscriptions) {
	const subscriptionsLength = subscriptions.length;
	for (let index = 0; index < subscriptionsLength; index += 1) {
		set.add(subscriptions[index]);
	}
	return new TrackedBundle(set, subscriptions);
}
/**
 * Deferred component-state observer. Bus fires stash the latest value +
 * changedPath on the observer; the scheduler dedups by observer identity so
 * a single coalesced `fire()` runs per scheduler flush regardless of how
 * many bus flushes accumulated between scheduler ticks. `previousValue`
 * advances only at fire time so the callback sees the first→last diff of
 * a coalesced batch. The callback fires AFTER the render scheduler has
 * already settled the DOM in this batch.
 */
class DeferredStateObserver {
	constructor(component, callback, previousValue, options) {
		this.component = component;
		this.callback = callback;
		this.previousValue = previousValue;
		this.nextValue = previousValue;
		this.changedPath = '';
		this.fireOnce = options?.once === true;
		this.subscription = null;
	}
	handle(nextValue, changedPath) {
		this.nextValue = nextValue;
		this.changedPath = changedPath;
		schedule(DeferredStateObserver.prototype.fire, this);
	}
	fire() {
		const nextValue = this.nextValue;
		const previousValue = this.previousValue;
		const changedPath = this.changedPath;
		this.previousValue = nextValue;
		this.callback.call(this.component, nextValue, previousValue, changedPath);
		/* `{ once: true }` — detach after the first (coalesced) fire. Scheduler
		 * dedup means multiple bus hits before this tick still yield ONE fire. */
		if (this.fireOnce && this.subscription) {
			this.subscription.unsubscribe();
		}
	}
}
function observeAsyncKey(component, key, callback, options) {
	const statePath = String(key ?? '');
	const bus = ensureStateBus(component);
	const previousValue = getValueAtPath(component.STATE, statePath);
	const observer = new DeferredStateObserver(component, callback, previousValue, options);
	const subscription = bus.subscribe(statePath, DeferredStateObserver.prototype.handle, observer);
	observer.subscription = subscription;
	/* `immediate` fires synchronously at setup (seed with the current value),
	 * matching the sync `observe`; subsequent fires stay deferred/coalesced.
	 * The immediate fire COUNTS toward `once` (Vue parity): the combo means
	 * "fire exactly once, right now". */
	if (options?.immediate === true) {
		callback.call(component, previousValue, undefined, statePath);
		if (options.once === true) {
			subscription.unsubscribe();
		}
	}
	return subscription;
}
export function observeAsync(keys, callback, options) {
	const keyList = toList(keys);
	const subscriptions = new Array(keyList.length);
	const keyListLength = keyList.length;
	for (let keyIndex = 0; keyIndex < keyListLength; keyIndex++) {
		subscriptions[keyIndex] = observeAsyncKey(this, keyList[keyIndex], callback, options);
	}
	this.stateUnsubs ??= new ComponentSubscriptionTracker();
	return trackUnsubs(this.stateUnsubs, subscriptions);
}
/**
 * Sync global-state observer. The callback fires with `this` bound to the
 * observing component — consistent with `observe` / `observeAsync`, so passing
 * a bare component method (`observeGlobal('wallet', this.handleWalletChange)`)
 * works without a wrapping arrow. `this.component` is carried on the observer
 * so the shared `StateKeyObserver.prototype.handle` stays a single first-class
 * function (no per-call closure) while still supplying component-`this`.
 */
function observeGlobalKey(component, callback, key) {
	const previousValue = globalState.get(key);
	/*
	 * StateKeyObserver, not a global-specific twin: the two differed only in a
	 * field name (`callback` vs `handler`) and the `{ once: true }` tail, which
	 * a bare construct leaves inert (`fireOnce` false, `subscription` null). The
	 * subscription is wired back for the same reason observeStateKey wires it —
	 * an observer that cannot reach its own subscription is a trap for whoever
	 * later threads options through this call.
	 */
	const observer = new StateKeyObserver(component, callback, previousValue, undefined);
	const subscription = globalState.bus.subscribe(key, StateKeyObserver.prototype.handle, observer);
	observer.subscription = subscription;
	return subscription;
}
export function observeGlobal(keys, callback) {
	const keyList = toList(keys);
	const subscriptions = new Array(keyList.length);
	const keyListLength = keyList.length;
	for (let keyIndex = 0; keyIndex < keyListLength; keyIndex++) {
		subscriptions[keyIndex] = observeGlobalKey(this, callback, keyList[keyIndex]);
	}
	this.globalUnsubs ??= new ComponentSubscriptionTracker();
	return trackUnsubs(this.globalUnsubs, subscriptions);
}
/**
 * Tear down every globalState observer this component has on `key`. Same
 * contract as `unobserve` but scoped to the `globalUnsubs` tracker. Other
 * components observing the same key are untouched.
 */
export function unobserveGlobal(key) {
	this.globalUnsubs?.removeByKey(String(key ?? ''));
}
/**
 * Resolve the store an `observeStore` call targets. A `Store` instance passes
 * through (the escape hatch for a store not declared in `static stores` — tests,
 * ad-hoc slices); a string name resolves against the component's chain-merged
 * `static stores` table, the same channel `bind('stores.name.key')` uses, and an
 * undeclared name throws with the component tag so the miss is loud at authoring.
 * @returns {Store} The resolved store instance.
 */
function resolveObservedStore(component, storeOrName) {
	if (Store.is(storeOrName)) {
		return storeOrName;
	}
	const store = resolveStores(component.constructor)[storeOrName];
	if (!store) {
		throw new Error(`<${component.localName}> observes store "${storeOrName}" but declares no such store in static stores.`);
	}
	return store;
}
function observeStoreKey(component, store, callback, key, options) {
	const statePath = String(key ?? '');
	const previousValue = store.get(statePath);
	const observer = new StateKeyObserver(component, callback, previousValue, options);
	const subscription = store.bus.subscribe(statePath, StateKeyObserver.prototype.handle, observer);
	observer.subscription = subscription;
	/* `{ immediate: true }` seeds the callback now with the current value (no prior
	 * value yet → previousValue undefined). It makes router start-order irrelevant:
	 * a late subscriber reads the already-published route. The immediate fire COUNTS
	 * toward `once`. */
	if (options?.immediate === true) {
		callback.call(component, previousValue, undefined, statePath);
		if (options.once === true) {
			subscription.unsubscribe();
		}
	}
	return subscription;
}
/**
 * Subscribe a component to a NAMED store's key(s) with a callback — the store
 * twin of `observeGlobal`, filling the gap for side-effectful reactions to a
 * `static stores` slice (a route change driving a data load, not a render read).
 * `storeOrName` is a declared store name or a `Store` instance; `keys` is a key
 * or array sharing one callback fired as `(nextValue, previousValue, changedPath)`
 * with `this` bound to the component. `options` is `{ immediate, once }` — a
 * deliberate superset of `observeGlobal`. Auto-cleaned on disconnect via a
 * per-store tracker in `this.storeUnsubs` (per store, not one flat tracker, since
 * a tracker buckets by path — two stores sharing a key name must stay independent).
 * @returns {TrackedBundle} Handle whose unsubscribe() releases every created subscription.
 */
export function observeStore(storeOrName, keys, callback, options) {
	const store = resolveObservedStore(this, storeOrName);
	const keyList = toList(keys);
	const keyListLength = keyList.length;
	const subscriptions = new Array(keyListLength);
	for (let keyIndex = 0; keyIndex < keyListLength; keyIndex += 1) {
		subscriptions[keyIndex] = observeStoreKey(this, store, callback, keyList[keyIndex], options);
	}
	this.storeUnsubs ??= new Map();
	let tracker = this.storeUnsubs.get(store);
	if (!tracker) {
		tracker = new ComponentSubscriptionTracker();
		this.storeUnsubs.set(store, tracker);
	}
	return trackUnsubs(tracker, subscriptions);
}
/**
 * Tear down every observer this component has on `key` of the named store. Same
 * contract as `unobserveGlobal`, scoped to that store's tracker; other components
 * (and this component's other stores) are untouched.
 */
export function unobserveStore(storeOrName, key) {
	const store = resolveObservedStore(this, storeOrName);
	this.storeUnsubs?.get(store)?.removeByKey(String(key ?? ''));
}
/**
 * Disconnect sweep — unsubscribe every named-store observer across every store
 * this component observed. A bare `this.storeUnsubs?.clear()` would empty the Map
 * without unsubscribing, so the teardown walks each tracker.
 */
export function clearStoreObservers() {
	if (!this.storeUnsubs) {
		return;
	}
	for (const tracker of this.storeUnsubs.values()) {
		tracker.clear();
	}
	this.storeUnsubs = null;
}
