import { schedule } from '../lifecycle/scheduler.js';
import { getValueAtPath, isArray } from '../utilities.js';
import { globalState } from './globalState.js';
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
