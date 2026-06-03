/*
 * PathSubscriptions — path-keyed reactive subscription registry.
 *
 * Subscribers attach to hierarchical paths ('user.name', 'viewport.width');
 * notifiers fire by path; the registry coalesces notifications into a single
 * microtask flush and matches subscribers by path overlap (a subscription to
 * 'user' catches changes at 'user.name' and 'user.profile.email').
 *
 * Abstract base. Subclasses own the bus's relationship to its backing store:
 *   - state/globalState.js   → `GlobalStateBus` reads from GLOBAL_STATE, no flush hook
 *   - state/state.js         → `ComponentStateBus` reads from `component.STATE`,
 *                              flush hook calls `component.updateView()`
 *
 * `getValue(path)` and `onFlush()` are prototype methods on the subclass; the
 * base class declares them as overrides (default no-op `onFlush`, abstract
 * `getValue` that throws if a subclass forgets to implement it). Zero config
 * closures, zero per-instance method allocations — the only per-instance
 * cost is three fields (`subs`, `pending`, `flushScheduled`) plus whatever
 * the subclass adds (typically a `component` reference).
 *
 * Microtask scheduling is shared via module-static master-flush — when any
 * instance receives its first pending notification, the master microtask is
 * scheduled (if not already pending) and one pass through `masterFlush()`
 * flushes every scheduled instance. Zero `.bind`, zero per-call closure,
 * one single shared callback in the queueMicrotask slot.
 *
 * `subscribe(path, handler)` returns a `Subscription` instance instead of a
 * closure — zero per-subscription closure allocations, and the instance
 * carries enough state (`bus`, `path`, `handler`) for the component-side
 * keyed `unobserve(key)` API to find every subscription on a given path
 * without holding the original handler reference.
 */
import {
	getOrInit,
	isPromiseLike,
	pathsOverlap,
	queueAsyncError,
} from '../utilities.js';
import { Perf } from '../debug/perf.js';
import { drainGlobalRenders, drainSpots } from '../lifecycle/scheduler.js';
/*
 * Module-static master-flush state — every PathSubscriptions instance shares
 * one microtask hop. `masterFlush` is a first-class module-scope function
 * passed directly to `queueMicrotask`; no per-instance bind needed.
 */
const SCHEDULED = new Set();
let masterPending = false;
function makeSubscriptionSet() {
	return new Set();
}
function fireSubscription(subscription, value, changedPath) {
	const handler = subscription.handler;
	if (!handler) {
		return;
	}
	const target = subscription.target;
	const result = target ? handler.call(target, value, changedPath) : handler(value, changedPath);
	if (isPromiseLike(result)) {
		result.catch(queueAsyncError);
	}
}
function masterFlush() {
	masterPending = false;
	/*
	 * Snapshot the schedule — flushes may add new instances during dispatch
	 * (a handler calling .notify on another instance, etc.). Those land in
	 * the next master cycle.
	 */
	const instances = [...SCHEDULED];
	SCHEDULED.clear();
	for (let i = 0; i < instances.length; i++) {
		instances[i].flush();
	}
	/*
	 * Every bus has fired its subscribers (renderDep dirties + spot dirties) —
	 * drain the reactive template spots once, in this same microtask. Collapses
	 * the old second hop (per-spot postTask/RAF) into the bus flush.
	 */
	drainSpots();
	/*
	 * Then kick the components whose GLOBAL renderDeps fired — the shared global
	 * bus has no per-component onFlush→updateView, so they enqueued instead.
	 */
	drainGlobalRenders();
}
/**
 * Path-keyed Subscription tracker living on every component as
 * `this.stateUnsubs` / `this.globalUnsubs`. Internal storage is
 * `Map<path, Set<Subscription>>` so `removeByKey(path)` is O(1) and
 * `this.unobserve('foo')` can locate every matching subscription without
 * needing the original handler reference. `add` / `delete` accept a
 * `Subscription` (reads its `.path`); `clear()` tears down every member
 * and empties the map atomically.
 */
export class ComponentSubscriptionTracker {
	byPath = new Map();
	add(subscription) {
		let bucket = this.byPath.get(subscription.path);
		if (!bucket) {
			bucket = new Set();
			this.byPath.set(subscription.path, bucket);
		}
		bucket.add(subscription);
	}
	delete(subscription) {
		const bucket = this.byPath.get(subscription.path);
		if (!bucket) {
			return;
		}
		bucket.delete(subscription);
		if (!bucket.size) {
			this.byPath.delete(subscription.path);
		}
	}
	removeByKey(path) {
		const bucket = this.byPath.get(path);
		if (!bucket) {
			return;
		}
		const subs = [...bucket];
		this.byPath.delete(path);
		for (let i = 0; i < subs.length; i += 1) {
			subs[i].unsubscribe();
		}
	}
	clear() {
		const all = [];
		const buckets = [...this.byPath.values()];
		for (let i = 0; i < buckets.length; i += 1) {
			const subs = [...buckets[i]];
			for (let j = 0; j < subs.length; j += 1) {
				all.push(subs[j]);
			}
		}
		this.byPath.clear();
		for (let i = 0; i < all.length; i += 1) {
			all[i].unsubscribe();
		}
	}
}
/**
 * Bundle of subscriptions registered against a `ComponentSubscriptionTracker`.
 * Returned by multi-key `observe` / `observeGlobal` / `observeAsync` calls;
 * `.unsubscribe()` tears every member down and removes them from the tracker.
 * Prototype methods, zero per-call closure allocation.
 */
export class TrackedBundle {
	constructor(tracker, subscriptions) {
		this.tracker = tracker;
		this.subscriptions = subscriptions;
	}
	unsubscribe() {
		const tracker = this.tracker;
		const subs = this.subscriptions;
		for (let i = 0; i < subs.length; i += 1) {
			subs[i].unsubscribe();
			tracker.delete(subs[i]);
		}
	}
}
/**
 * One subscription on a bus. Carries `bus`, `path`, and `handler` so the
 * component-side `unobserve(key)` API can locate every subscription matching
 * a path without holding the original handler ref. `unsubscribe()` is
 * idempotent — repeated calls or calls after a foreign cleanup are no-ops.
 */
export class Subscription {
	constructor(bus, path, handler, target, multiPath) {
		this.bus = bus;
		this.path = path;
		this.handler = handler;
		/*
		 * Optional `target` — when present, flush invokes the handler via
		 * `handler.call(target, value, path)` so a single shared prototype
		 * method (e.g. `WebComponent.prototype.markRenderDirty`) can serve as
		 * the handler across many components without losing its `this`. Per-
		 * path dedup is by Subscription identity (each construction is unique)
		 * so two components subscribing the same prototype method to the same
		 * path both receive notifications.
		 */
		this.target = target ?? null;
		/*
		 * `multiPath` opts this subscription out of the at-most-once batch
		 * contract: the flush delivers EVERY overlapping changed path, not just
		 * the first. List spots need this — a batch of `items.0.x` + `items.1.x`
		 * must reach the spot as two paths so each touched row is patched.
		 * Default false keeps renderDeps / observers / bindings at once-per-batch.
		 */
		this.multiPath = multiPath === true;
		const subscriptions = getOrInit(bus.subs, path, makeSubscriptionSet);
		subscriptions.add(this);
		this.subscriptions = subscriptions;
	}
	unsubscribe() {
		if (!this.handler) {
			return;
		}
		this.subscriptions.delete(this);
		if (!this.subscriptions.size) {
			this.bus.subs.delete(this.path);
		}
		this.handler = null;
		this.target = null;
		this.subscriptions = null;
	}
}
export class PathSubscriptions {
	subs = new Map();
	pending = new Set();
	flushScheduled = false;
	/**
	 * Abstract — subclasses MUST override. Resolves the current value at a
	 * given path against the bus's backing store; used by `flush` to hand
	 * each subscriber the latest value at its subscribed path.
	 */
	getValue(path) {
		throw new Error('PathSubscriptions.getValue must be overridden by a subclass');
	}
	/**
	 * Hook fired once at the end of every flush, AFTER all subscriber
	 * handlers for this instance have run. Subclasses override to integrate
	 * with the host's render pipeline (e.g. ComponentStateBus triggers
	 * `component.updateView()`). Base class is a no-op so the global bus —
	 * which has no render pipeline of its own — inherits without overriding.
	 */
	onFlush() {}
	subscribe(path, handler, target, multiPath) {
		return new Subscription(this, path, handler, target, multiPath);
	}
	notify(path) {
		this.pending.add(path);
		if (this.flushScheduled) {
			return;
		}
		this.flushScheduled = true;
		SCHEDULED.add(this);
		if (!masterPending) {
			masterPending = true;
			queueMicrotask(masterFlush);
		}
	}
	flush() {
		const perfMark = Perf.mark('busFlush');
		this.flushScheduled = false;
		const changed = [...this.pending];
		this.pending.clear();
		if (this.subs.size) {
			/*
			 * Snapshot entries + handlers per the codebase pattern: indexed
			 * for-loop over Array snapshots avoids forEach callbacks (which
			 * would re-introduce per-call closures), and is safe under
			 * mutation if a handler subscribes/unsubscribes during dispatch.
			 */
			const entries = [...this.subs.entries()];
			for (let i = 0; i < entries.length; i++) {
				const subscriptionPath = entries[i][0];
				const subscriptions = entries[i][1];
				if (!subscriptions.size) {
					continue;
				}
				/*
				 * Coalesced contract: every subscriber fires AT MOST ONCE per
				 * batch, on the FIRST overlapping changed path, with the latest
				 * value at its path. EXCEPTION: a `multiPath` subscriber (list
				 * spots) also fires on each SUBSEQUENT overlapping path so a
				 * batch of sibling deep mutations (`items.0.x` + `items.1.x`)
				 * reaches it as every path, not just the first. The first-overlap
				 * pass detects whether any subscriber is multiPath; if none is
				 * (the common case — renderDeps / observers / bindings), the loop
				 * exits exactly as the original `break` did, with zero extra cost.
				 */
				let subscriptionArray = null;
				let value;
				let hasMultiPath = false;
				for (let j = 0; j < changed.length; j++) {
					if (!pathsOverlap(subscriptionPath, changed[j])) {
						continue;
					}
					const changedPath = changed[j];
					if (!subscriptionArray) {
						value = this.getValue(subscriptionPath);
						subscriptionArray = [...subscriptions];
						for (let k = 0; k < subscriptionArray.length; k++) {
							const subscription = subscriptionArray[k];
							if (subscription.multiPath) {
								hasMultiPath = true;
							}
							fireSubscription(subscription, value, changedPath);
						}
						if (!hasMultiPath) {
							break;
						}
						continue;
					}
					for (let k = 0; k < subscriptionArray.length; k++) {
						const subscription = subscriptionArray[k];
						if (subscription.multiPath) {
							fireSubscription(subscription, value, changedPath);
						}
					}
				}
			}
		}
		this.onFlush();
		Perf.measure('busFlush', perfMark);
	}
}
