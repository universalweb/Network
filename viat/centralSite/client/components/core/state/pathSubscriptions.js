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
 *
 * Overlap matching is index-driven, not scan-driven — but the segment trie is
 * built LAZILY. Subscribe/unsubscribe only flip an `indexDirty` flag (O(1), no
 * node allocation); the trie is (re)built from the live `subs` keys the first
 * time a MULTI-PATH flush needs overlap matching AND the path vocabulary
 * changed since the last build. This keeps a create-storm of buckets that
 * never sees a multi-path flush entirely trie-free (eager per-subscribe
 * indexing was the measured create/append tax), while repeated multi-path
 * flushes with a stable vocabulary reuse the cached trie. Rebuilding from
 * `subs` (the source of truth) rather than maintaining the trie incrementally
 * means it can never drift out of bijection with the map. `collectOverlaps`
 * walks the trie once per changed path (ancestors along the spine, descendants
 * below the endpoint) and dispatches in `subs` insertion order —
 * O(changed·depth + matches + subs) instead of the former O(subs × changed)
 * pairwise scan, which went quadratic when a state replacement notified every
 * subscribed path. The single-path flush (`dispatchSingle`, the dominant
 * shape) and `notifyAll()` never consult the trie at all — a component that
 * only ever sees one mutation per batch builds no index.
 */
import { Perf } from '../debug/perf.js';
import { drainGlobalRenders, drainSpots } from '../lifecycle/scheduler.js';
import {
	isFunction,
	isPromiseLike,
	parsePath,
	pathsOverlap,
	queueAsyncError,
} from '../utilities.js';
/*
 * Module-static master-flush state — every PathSubscriptions instance shares
 * one microtask hop. `masterFlush` is a first-class module-scope function
 * passed directly to `queueMicrotask`; no per-instance bind needed.
 */
const SCHEDULED = new Set();
const EMPTY_CHANGED = Object.freeze([]);
let masterPending = false;
/**
 * One node of a bus's segment-trie subscription index. A node carries a
 * non-null `path` iff it terminates a live subscription bucket. The trie is
 * rebuilt wholesale from the live `subs` keys (see `buildIndex`), so every
 * terminal is by construction a live bucket and the descendant walk never
 * visits a dead branch — no retention counter or parent back-pointer needed.
 */
class PathIndexNode {
	children = new Map();
	path = null;
	static create() {
		return new PathIndexNode();
	}
}
/*
 * Build a fresh segment trie from the live subscription paths. Called only by
 * `ensureIndex`, only when a multi-path flush needs overlap matching and the
 * vocabulary changed since the last build. The '' bucket is skipped exactly as
 * the old incremental indexer did — an empty path has no dot boundary, so
 * `collectOverlaps` matches it separately against `subs`.
 */
function buildIndex(subs) {
	const indexRoot = PathIndexNode.create();
	for (const path of subs.keys()) {
		const parts = parsePath(path);
		if (!parts) {
			continue;
		}
		let node = indexRoot;
		const partsLength = parts.length;
		for (let partIndex = 0; partIndex < partsLength; partIndex++) {
			const segment = parts[partIndex];
			let child = node.children.get(segment);
			if (!child) {
				child = PathIndexNode.create();
				node.children.set(segment, child);
			}
			node = child;
		}
		node.path = path;
	}
	return indexRoot;
}
function appendOverlap(overlapsByPath, subscriptionPath, changedPath) {
	const list = overlapsByPath.get(subscriptionPath);
	if (list) {
		list.push(changedPath);
		return;
	}
	overlapsByPath.set(subscriptionPath, [changedPath]);
}
/*
 * Depth-first over the index below `node` — every terminal strictly below a
 * changed path is a descendant subscription ('items.0.x' under changed
 * 'items'). Pure traversal: no user code runs during the match phase, so the
 * trie cannot mutate mid-walk (handlers fire later, in the dispatch phase).
 */
function collectSubtreeOverlaps(node, changedPath, overlapsByPath) {
	for (const child of node.children.values()) {
		if (child.path !== null) {
			appendOverlap(overlapsByPath, child.path, changedPath);
		}
		collectSubtreeOverlaps(child, changedPath, overlapsByPath);
	}
}
// @engram em:network/code/ispromiselike-gates-catch-at-6-sites-2-were-live-crashes-use — the same class as hotkeys E3; the updateView-fed sites are safe and stay as they are
/*
 * Settle rather than `.catch`, for the same reason events/settle.js does:
 * isPromiseLike only proves `.then` exists, so a bare thenable returned by a
 * user handler has no `.catch` to call — that threw a TypeError mid-dispatch and
 * took the rest of the flush's subscriptions with it. Awaiting normalizes any
 * thenable. Invoked unawaited — a side-observer of a result nobody else holds.
 */
async function settleSubscriptionResult(result) {
	try {
		await result;
	} catch (error) {
		queueAsyncError(error);
	}
}
function fireSubscription(subscription, value, changedPath) {
	const handler = subscription.handler;
	/*
	 * Callable check, not a catch — null after a mid-dispatch unsubscribe
	 * (the once-per-batch suppression), non-function only if a registration
	 * slipped past subscribe's type gate. One branch either way.
	 */
	if (!isFunction(handler)) {
		return;
	}
	const target = subscription.target;
	// @engram em:network/code/bus-flush-containment-per-handler-is-the-correct-granularity — the contract decision + its fail-fast consequences
	/*
	 * Invoked BARE by contract (see subscribe): a handler must not throw — a
	 * handler that can fail wraps its own risky logic and decides its own
	 * recovery, where the context to handle it actually lives. The framework
	 * adds no guard: a violating handler unwinds this flush loudly at its
	 * origin (fail fast), with the documented cost that the remaining
	 * subscribers and this bus's onFlush render kick are skipped for the
	 * already-consumed batch. A returned promise IS settled below — the
	 * framework holds the only reference, so an unobserved rejection would
	 * otherwise crash the host as an unhandledrejection.
	 */
	const result = target ? handler.call(target, value, changedPath) : handler(value, changedPath);
	if (isPromiseLike(result)) {
		settleSubscriptionResult(result);
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
	const instancesLength = instances.length;
	for (let index = 0; index < instancesLength; index++) {
		/*
		 * No guard — deliberate. Every throw that can reach here is app code
		 * breaking its contract: a bare subscriber handler, an app getter/Proxy
		 * under the getValue walk, or an app render() body on renderView's sync
		 * fast path (via onFlush → updateView). It must surface raw and early
		 * at its origin, not be laundered through a catch that masks which code
		 * broke. Framework code on this path does not throw (matchRenderDeps is
		 * framework-only; the render pipeline wedges nothing on a raw throw).
		 * Documented cost: the remaining buses and the drainSpots/
		 * drainGlobalRenders tail are skipped for that microtask; their batches
		 * redeliver on the next notify (fail fast over limp on).
		 */
		instances[index].flush();
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
		const subsLength = subs.length;
		for (let index = 0; index < subsLength; index += 1) {
			subs[index].unsubscribe();
		}
	}
	clear() {
		/*
		 * Subscription.unsubscribe removes from the BUS bucket only — it never
		 * mutates this tracker. Iterate live Sets, then drop the map.
		 */
		for (const bucket of this.byPath.values()) {
			for (const subscription of bucket) {
				subscription.unsubscribe();
			}
		}
		this.byPath.clear();
	}
}
/**
 * Bundle of subscriptions optionally registered against a
 * `ComponentSubscriptionTracker`. Returned by multi-key `observe` /
 * `observeGlobal` / `observeAsync` calls; `.unsubscribe()` tears every member
 * down and removes them from the tracker. Prototype methods, zero per-call
 * closure allocation.
 *
 * `tracker` is NULLABLE by design. Private-state observers are deliberately
 * untracked (observePrivate owns no component-side registry — see its comment),
 * so they used to hand in a freshly built tracker that was never `add()`ed to:
 * a per-call allocation whose only use was an unconditional `delete` against an
 * empty Map. Null instead of a decoy object, with the branch paid once per
 * teardown rather than an allocation paid once per subscribe.
 */
export class TrackedBundle {
	constructor(tracker, subscriptions) {
		this.tracker = tracker;
		this.subscriptions = subscriptions;
	}
	unsubscribe() {
		const tracker = this.tracker;
		const subs = this.subscriptions;
		const subsLength = subs.length;
		if (tracker === null) {
			for (let index = 0; index < subsLength; index += 1) {
				subs[index].unsubscribe();
			}
			return;
		}
		for (let index = 0; index < subsLength; index += 1) {
			subs[index].unsubscribe();
			tracker.delete(subs[index]);
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
		const subscriptions = bus.bucketFor(path);
		subscriptions.add(this);
		this.subscriptions = subscriptions;
	}
	unsubscribe() {
		if (!this.handler) {
			return;
		}
		this.subscriptions.delete(this);
		if (!this.subscriptions.size) {
			this.bus.dropBucket(this.path, this.subscriptions);
		}
		this.handler = null;
		this.target = null;
		this.subscriptions = null;
	}
}
export class PathSubscriptions {
	/*
	 * Both collections mint LAZILY (null until first use) — a bus construct
	 * allocates ZERO collections, so the per-component buses built on the
	 * create path cost nothing until a real subscription (bucketFor mints
	 * `subs`) or a write (notify mints `pending`) arrives.
	 */
	subs = null;
	pending = null;
	pendingAll = false;
	flushScheduled = false;
	/*
	 * O(1) count of NESTED (dotted) subscription paths — maintained at the two
	 * bucket chokepoints (`bucketFor` / `dropBucket`, the same lines that flip
	 * `indexDirty`, so it can never drift from `subs`). When it is 0 every bucket
	 * is a bare top-level key (or ''), so a single changed path overlaps AT MOST
	 * ONE bucket — its exact key, or its first segment (the sole possible bare
	 * ancestor; any longer prefix would itself be dotted, hence absent, and a
	 * descendant would need a dotted sub). `dispatchSingle` reads this to take the
	 * flat fast path — one Map.get, no O(subs) scan, no per-flush snapshot.
	 */
	nestedPathCount = 0;
	/*
	 * Lazily-built overlap index. `indexRoot` stays null until the first
	 * multi-path flush; `indexDirty` (starts true) flips whenever a bucket is
	 * created or dropped so the next multi-path flush rebuilds from live subs.
	 */
	indexRoot = null;
	indexDirty = true;
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
	/**
	 * Render-dep match hook — called by `flush()` BEFORE the bucket dispatch
	 * and OUTSIDE its `subs` gate (a bus may carry render deps and zero
	 * buckets). Base is a no-op; ComponentStateBus overrides it with the
	 * Set-channel probe (see render.js subscribeRenderDeps).
	 * @param {boolean} replaceAll - True on a notifyAll (state replacement) flush.
	 * @param {string[]} changed - The batch's changed paths; empty when replaceAll.
	 */
	matchRenderDeps(replaceAll, changed) {}
	/**
	 * Register a handler for a path. CONTRACT: the handler owns its own
	 * failure — a handler that can fail wraps its risky logic and decides its
	 * recovery where the context lives; dispatch invokes it bare, so a throw
	 * unwinds that flush loudly at its origin (fail fast, nothing laundered).
	 * The type gate runs HERE — once, at registration — so a non-callable
	 * handler breaks at the bug instead of dispatching as a silent no-op.
	 * @param {string} path - The state path to observe.
	 * @param {Function} handler - Called with (value, changedPath) per batch.
	 * @param {object} [target] - Optional thisArg for a shared prototype method.
	 * @param {boolean} [multiPath] - Deliver every overlapping changed path.
	 * @returns {Subscription} The live subscription; call unsubscribe() to release.
	 */
	subscribe(path, handler, target, multiPath) {
		if (!isFunction(handler)) {
			throw new TypeError(`subscribe('${path}') requires a function handler, got ${typeof handler}`);
		}
		return new Subscription(this, path, handler, target, multiPath);
	}
	/**
	 * The only bucket-creation path — pairs the `subs` entry with its index
	 * terminal so the trie and the map can never disagree. Called from the
	 * `Subscription` constructor.
	 */
	bucketFor(path) {
		if (this.subs === null) {
			this.subs = new Map();
		}
		let bucket = this.subs.get(path);
		if (!bucket) {
			bucket = new Set();
			this.subs.set(path, bucket);
			this.indexDirty = true;
			if (path.includes('.')) {
				this.nestedPathCount += 1;
			}
		}
		return bucket;
	}
	/**
	 * The only bucket-deletion path. The identity guard makes a stale call
	 * (an already-replaced bucket) a no-op instead of deleting a live
	 * successor bucket.
	 */
	dropBucket(path, bucket) {
		if (bucket !== undefined && this.subs.get(path) !== bucket) {
			return;
		}
		if (!this.subs.delete(path)) {
			return;
		}
		this.indexDirty = true;
		if (path.includes('.')) {
			this.nestedPathCount -= 1;
		}
	}
	/**
	 * Rebuild the overlap trie from the live `subs` keys iff the vocabulary
	 * changed since the last build. Called at the top of `collectOverlaps`
	 * (multi-path flushes only) — single-path flushes and `notifyAll` never
	 * reach it, so a bus that only sees those never allocates an index.
	 */
	ensureIndex() {
		if (this.indexDirty) {
			this.indexRoot = buildIndex(this.subs);
			this.indexDirty = false;
		}
	}
	notify(path) {
		if (this.pendingAll) {
			return;
		}
		if (this.pending === null) {
			this.pending = new Set();
		}
		this.pending.add(path);
		this.scheduleFlush();
	}
	/**
	 * Batch-notify every subscribed path in one flag — the state-replacement
	 * primitive. The flush dispatches each bucket exactly once with its own
	 * path as the changed path, skipping overlap matching entirely (O(subs)
	 * instead of notifying N paths and matching N×N). Callers replacing a
	 * whole backing store (component `replaceState`, a future store reset)
	 * use this instead of walking `subs.keys()` and notifying each.
	 */
	notifyAll() {
		if (this.pendingAll) {
			return;
		}
		this.pendingAll = true;
		if (this.pending !== null) {
			this.pending.clear();
		}
		this.scheduleFlush();
	}
	scheduleFlush() {
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
		const replaceAll = this.pendingAll;
		this.pendingAll = false;
		const changed = replaceAll || this.pending === null ? EMPTY_CHANGED : [...this.pending];
		if (this.pending !== null) {
			this.pending.clear();
		}
		this.matchRenderDeps(replaceAll, changed);
		if (this.subs !== null && this.subs.size) {
			if (replaceAll) {
				this.dispatchAll();
			} else if (changed.length === 1) {
				this.dispatchSingle(changed[0]);
			} else if (changed.length) {
				this.dispatchChanged(changed);
			}
		}
		this.onFlush();
		Perf.measure('busFlush', perfMark);
	}
	/**
	 * Single-changed-path dispatch — the dominant flush shape (one mutation
	 * per microtask batch). With exactly one changed path the multiPath
	 * replay pass is unreachable (a replay needs a SECOND overlapping path),
	 * so one direct overlap test per bucket beats building the trie match
	 * map; the trie earns its keep only on multi-path batches.
	 */
	dispatchSingle(changedPath) {
		/*
		 * Flat fast path — no nested subscription exists (nestedPathCount === 0), so
		 * `changedPath` overlaps AT MOST ONE bucket: its exact key when flat, else
		 * its first segment (the only bare-key ancestor — a longer prefix would be
		 * dotted, hence absent; a descendant would need a dotted sub). One Map.get
		 * finds it; the O(subs) scan and the per-flush `[...subs.entries()]` snapshot
		 * are skipped. The dominant flush shape in flat-state components (~97% of the
		 * reactive surface here). ≤1 bucket ⇒ dispatch order is trivially preserved.
		 */
		if (this.nestedPathCount === 0) {
			const dotIndex = changedPath.indexOf('.');
			const bucketPath = dotIndex === -1 ? changedPath : changedPath.slice(0, dotIndex);
			this.dispatchBucket(bucketPath, changedPath);
			return;
		}
		const entries = [...this.subs.entries()];
		const entriesLength = entries.length;
		for (let index = 0; index < entriesLength; index++) {
			const subscriptionPath = entries[index][0];
			const subscriptions = entries[index][1];
			if (!subscriptions.size || !pathsOverlap(subscriptionPath, changedPath)) {
				continue;
			}
			const value = this.getValue(subscriptionPath);
			const subscriptionArray = [...subscriptions];
			const subscriptionArrayLength = subscriptionArray.length;
			for (let subscriptionIndex = 0; subscriptionIndex < subscriptionArrayLength; subscriptionIndex++) {
				fireSubscription(subscriptionArray[subscriptionIndex], value, changedPath);
			}
		}
	}
	/**
	 * Fire every subscriber in ONE bucket (resolved by path) with the value at the
	 * bucket's own subscription path. Snapshots the bucket before firing so a
	 * handler that unsubscribes a sibling mid-dispatch is suppressed by
	 * `fireSubscription`'s null-handler guard — identical once-per-batch semantics
	 * to the scan path, which this shares on the flat fast path.
	 * @param {string} bucketPath - The subscription path whose bucket to fire.
	 * @param {string} changedPath - The changed path handed to each subscriber.
	 */
	dispatchBucket(bucketPath, changedPath) {
		const subscriptions = this.subs.get(bucketPath);
		if (!subscriptions || !subscriptions.size) {
			return;
		}
		const value = this.getValue(bucketPath);
		const subscriptionArray = [...subscriptions];
		const subscriptionArrayLength = subscriptionArray.length;
		for (let subscriptionIndex = 0; subscriptionIndex < subscriptionArrayLength; subscriptionIndex++) {
			fireSubscription(subscriptionArray[subscriptionIndex], value, changedPath);
		}
	}
	/**
	 * Match phase — pure, runs before any handler. One trie walk per changed
	 * path: terminals along the spine are ancestor-or-exact subscriptions
	 * ('user' catches changed 'user.name'), terminals below the endpoint are
	 * descendant subscriptions ('items.0.x' catches changed 'items'). Returns
	 * Map<subscriptionPath, overlapping changed paths in notify order> — the
	 * per-bucket list the dispatch phase consumes exactly as the old pairwise
	 * scan did, so the observable contract is unchanged.
	 */
	collectOverlaps(changed) {
		this.ensureIndex();
		const overlapsByPath = new Map();
		const hasEmptyPathBucket = this.subs.has('');
		const changedLength = changed.length;
		for (let changedIndex = 0; changedIndex < changedLength; changedIndex++) {
			const changedPath = changed[changedIndex];
			const parts = parsePath(changedPath);
			if (!parts) {
				/*
				 * An empty changed path overlaps only the literal '' bucket
				 * (no dot boundary exists against an empty string).
				 */
				if (hasEmptyPathBucket) {
					appendOverlap(overlapsByPath, '', changedPath);
				}
				continue;
			}
			let node = this.indexRoot;
			let reachedEnd = true;
			const partsLength = parts.length;
			for (let partIndex = 0; partIndex < partsLength; partIndex++) {
				node = node.children.get(parts[partIndex]);
				if (!node) {
					reachedEnd = false;
					break;
				}
				if (node.path !== null) {
					appendOverlap(overlapsByPath, node.path, changedPath);
				}
			}
			if (reachedEnd) {
				collectSubtreeOverlaps(node, changedPath, overlapsByPath);
			}
		}
		return overlapsByPath;
	}
	/**
	 * Dispatch phase. Iterates the `subs` snapshot in insertion order — the
	 * same bucket order, `getValue` timing, and lazy bucket snapshot as the
	 * former pairwise loop, so handler-observable behavior is identical; only
	 * the overlap discovery changed (precomputed lists instead of rescans).
	 *
	 * Coalesced contract: every subscriber fires AT MOST ONCE per batch, on
	 * the FIRST overlapping changed path, with the latest value at its path.
	 * EXCEPTION: a `multiPath` subscriber (list spots) also fires on each
	 * SUBSEQUENT overlapping path so a batch of sibling deep mutations
	 * (`items.0.x` + `items.1.x`) reaches it as every path, not just the
	 * first.
	 */
	dispatchChanged(changed) {
		const overlapsByPath = this.collectOverlaps(changed);
		if (!overlapsByPath.size) {
			return;
		}
		const entries = [...this.subs.entries()];
		const entriesLength = entries.length;
		for (let index = 0; index < entriesLength; index++) {
			const subscriptionPath = entries[index][0];
			const subscriptions = entries[index][1];
			if (!subscriptions.size) {
				continue;
			}
			const overlapping = overlapsByPath.get(subscriptionPath);
			if (!overlapping) {
				continue;
			}
			const value = this.getValue(subscriptionPath);
			const subscriptionArray = [...subscriptions];
			const subscriptionArrayLength = subscriptionArray.length;
			let hasMultiPath = false;
			for (let subscriptionIndex = 0; subscriptionIndex < subscriptionArrayLength; subscriptionIndex++) {
				const subscription = subscriptionArray[subscriptionIndex];
				if (subscription.multiPath) {
					hasMultiPath = true;
				}
				fireSubscription(subscription, value, overlapping[0]);
			}
			if (!hasMultiPath) {
				continue;
			}
			const overlappingLength = overlapping.length;
			for (let overlapIndex = 1; overlapIndex < overlappingLength; overlapIndex++) {
				for (let subscriptionIndex = 0; subscriptionIndex < subscriptionArrayLength; subscriptionIndex++) {
					const subscription = subscriptionArray[subscriptionIndex];
					if (subscription.multiPath) {
						fireSubscription(subscription, value, overlapping[overlapIndex]);
					}
				}
			}
		}
	}
	/**
	 * `notifyAll` dispatch — every bucket fires exactly once with its own
	 * path as the changed path. Deliberately simpler than the old caller-side
	 * "notify every subscribed path" replacement idiom: a multiPath
	 * subscriber gets ONE fire at its own path (a full-value replacement
	 * makes per-descendant replays redundant — the list spot's keyed diff
	 * re-patches every row from the replaced value in that single pass).
	 */
	dispatchAll() {
		const entries = [...this.subs.entries()];
		const entriesLength = entries.length;
		for (let index = 0; index < entriesLength; index++) {
			const subscriptionPath = entries[index][0];
			const subscriptions = entries[index][1];
			if (!subscriptions.size) {
				continue;
			}
			const value = this.getValue(subscriptionPath);
			const subscriptionArray = [...subscriptions];
			const subscriptionArrayLength = subscriptionArray.length;
			for (let subscriptionIndex = 0; subscriptionIndex < subscriptionArrayLength; subscriptionIndex++) {
				fireSubscription(subscriptionArray[subscriptionIndex], value, subscriptionPath);
			}
		}
	}
}
