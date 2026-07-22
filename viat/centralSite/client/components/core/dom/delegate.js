/*
 * Delegate subsystem — the document/global half of the event surface.
 *
 * Public methods mixed onto `WebComponent.prototype` via base.js:
 *   this.delegate(name, handler, options?)              — Tier 2: document bus
 *   this.delegateTo(name, sel, handler, scope?, opts?)  — Tier 3: scoped delegation
 *   this.onEnv(name, handler, options?)                 — Tier 4: globalThis master
 *   this.clearDelegateListeners()                       — lifecycle sweep
 *
 * Public free functions (services / non-component callers):
 *   emitDelegate(name, data)                            — publish onto the bus
 *   installScopedDelegate(name, sel, handler, scope?, opts?) — owner-less Tier 3
 *                                                         install for services like
 *                                                         tooltip-service that wire
 *                                                         delegated listeners at
 *                                                         module load (before any
 *                                                         component exists).
 *                                                         Mirrored as the static
 *                                                         `WebComponent.delegateTo`.
 *
 * Architecture
 *
 * Tier 2 (`delegate`) is a pure pub/sub bus: one master listener at
 * `document` per event name, flat `Map<eventName, Set<DelegateEntry>>`.
 * No selector, no `composedPath` JS traversal, no subevent dot-notation.
 * `viewport:change`, `pulldown:toggle`, etc. are the canonical event names.
 *
 * Tier 3 (`delegateTo`) is scoped delegation: one master listener at the
 * caller-provided `scope` (default: the component itself) per event name,
 * `closest(selector)` on dispatch to find a matching descendant. Native
 * engine work, no JS DOM walk.
 *
 * Tier 4 (`onEnv`) attaches the master at `globalThis` per event name —
 * for browser-level events like `resize`, `online`, `visibilitychange`.
 * Single registration, multiple subscribers.
 *
 * Every subscription is a `DelegateEntry` (mirrors `EventEntry` shape):
 * `WeakRef` on owner, idempotent `unsubscribe`, auto-sweep on disconnect
 * via `component.delegateEntries`. Handlers run via `handler.call(owner, …)`
 * — no arrow fields, no `.bind`, no per-registration wrapper closure
 * beyond the entry itself.
 */
import { createBusEvent } from '../events/events.js';
import { settleEventResult } from '../events/settle.js';
import {
	isFunction, isObject, isPromiseLike, isString, sweepEntrySet, weakRefFor,
} from '../utilities.js';
/*
 * — Master registry (Tiers 2 and 4) — one master listener per (target,
 *   eventName), fanning out to that event's entry bucket.
 *
 * The registry INSTANCE is the EventListener (DOM spec: any object with a
 * `handleEvent` qualifies), exactly like ScopeRecord below. That is what makes
 * one class serve both tiers: `removeEventListener(name, this, options)` matches
 * by instance identity, so there is no per-target dispatcher function to keep
 * paired with its own `add`/`remove` calls — which is precisely what the two
 * hand-written copies existed to arrange.
 *
 * The target is resolved LAZILY on first attach, not in the constructor: these
 * are module-load singletons, and `document` must not be touched at import time
 * (delegate.js is imported by module graphs that load before a DOM exists).
 *
 * Snapshot before dispatch. Live Set iteration would change two contract-
 * sensitive cases vs a snapshot: a handler that unsubscribes a not-yet-visited
 * sibling for THIS event would skip it (snapshot still fires it), and a handler
 * that ADDS a listener for this event would receive the in-flight event
 * (snapshot doesn't — matching native DOM, where mid-dispatch additions don't
 * fire). Every delegate call site was written against snapshot semantics;
 * changing them is a deliberate, test-first pass, not a dedup rider.
 */
const MASTER_DOCUMENT = 'document';
class MasterRegistry {
	buckets = new Map();
	attached = new Set();
	target = null;
	constructor(targetKind, options) {
		this.targetKind = targetKind;
		this.options = options;
	}
	resolveTarget() {
		if (this.target === null) {
			this.target = this.targetKind === MASTER_DOCUMENT ? document : globalThis;
		}
		return this.target;
	}
	handleEvent(domEvent) {
		const bucket = this.buckets.get(domEvent.type);
		if (!bucket || bucket.size === 0) {
			return;
		}
		const snapshot = Array.from(bucket);
		const snapshotLength = snapshot.length;
		for (let index = 0; index < snapshotLength; index++) {
			snapshot[index].invoke(domEvent, null);
		}
	}
	ensureMaster(eventName) {
		if (this.attached.has(eventName)) {
			return;
		}
		this.resolveTarget().addEventListener(eventName, this, this.options);
		this.attached.add(eventName);
	}
	detachMaster(eventName) {
		if (!this.attached.has(eventName)) {
			return;
		}
		this.resolveTarget().removeEventListener(eventName, this, this.options);
		this.attached.delete(eventName);
	}
	/**
	 * Add an entry to its event's bucket, attaching the master on first use.
	 * @param {string} eventName - The delegated event type.
	 * @param {object} entry - The DelegateEntry to register.
	 */
	addEntry(eventName, entry) {
		let bucket = this.buckets.get(eventName);
		if (!bucket) {
			bucket = new Set();
			this.buckets.set(eventName, bucket);
		}
		bucket.add(entry);
		this.ensureMaster(eventName);
	}
	/**
	 * Remove an entry, detaching the master once its bucket empties.
	 * @param {string} eventName - The delegated event type.
	 * @param {object} entry - The DelegateEntry to remove.
	 */
	removeEntry(eventName, entry) {
		const bucket = this.buckets.get(eventName);
		if (!bucket) {
			return;
		}
		bucket.delete(entry);
		if (bucket.size === 0) {
			this.buckets.delete(eventName);
			this.detachMaster(eventName);
		}
	}
}
// Tier 2 — one master at `document` per event name.
const busRegistry = new MasterRegistry(MASTER_DOCUMENT, {
	capture: true,
});
// Tier 4 — one master at `globalThis` per event name.
const envRegistry = new MasterRegistry('global', undefined);
/*
 * — Scoped delegation (Tier 3) — one master per (scope, eventName) pair —
 *
 * Each scope element holds a `WeakMap<scope, Map<eventName, ScopeRecord>>`.
 * A `ScopeRecord` IS the EventListener — DOM spec: any object with a
 * `handleEvent` method qualifies. On dispatch, walk entries and resolve
 * each entry's selector via native `closest()` (no JS composedPath loop).
 */
const scopeMastersByScope = new WeakMap();
class ScopeRecord {
	eventName = '';
	scope = null;
	entries = new Set();
	static create(scope, eventName) {
		const record = new ScopeRecord();
		record.scope = scope;
		record.eventName = eventName;
		return record;
	}
	handleEvent(domEvent) {
		if (!this.entries.size) {
			return;
		}
		/*
		 * Shadow-DOM-aware dispatch.
		 *
		 * `domEvent.target` is RETARGETED to the closest non-shadow
		 * ancestor when the event leaves a shadow tree — for events that
		 * crossed shadow boundaries it points at the shadow host, not the
		 * deep element the user actually interacted with. Calling
		 * `.closest(selector)` on the host walks UP into light DOM, so
		 * matches inside the shadow tree are missed entirely.
		 *
		 * `composedPath()` gives the full bottom-up path INCLUDING shadow
		 * descendants. `path[0]` is the real deep target; `.closest()`
		 * from there finds matches anywhere along the path.
		 *
		 * `scope.contains(matchedTarget)` also doesn't cross shadow
		 * boundaries — a button inside a shadow tree fails `contains`
		 * against `document` even though the event reached document.
		 * Fall back to "does the composedPath traverse scope?" which is
		 * always true for events that actually fired through `scope`.
		 */
		const path = domEvent.composedPath();
		const deepTarget = path.length ? path[0] : domEvent.target;
		if (!deepTarget || !isFunction(deepTarget.closest)) {
			return;
		}
		const inScope = path.indexOf(this.scope) !== -1;
		// Snapshot before dispatch — same contract as dispatchBus.
		const snapshot = Array.from(this.entries);
		const snapshotLength = snapshot.length;
		for (let index = 0; index < snapshotLength; index++) {
			const entry = snapshot[index];
			const matchedTarget = deepTarget.closest(entry.selector);
			if (!matchedTarget) {
				continue;
			}
			if (!inScope && !this.scope.contains(matchedTarget)) {
				continue;
			}
			entry.invoke(domEvent, matchedTarget);
		}
	}
}
function getOrCreateScopeRecord(scope, eventName) {
	let perScope = scopeMastersByScope.get(scope);
	if (!perScope) {
		perScope = new Map();
		scopeMastersByScope.set(scope, perScope);
	}
	const existing = perScope.get(eventName);
	if (existing) {
		return existing;
	}
	const record = ScopeRecord.create(scope, eventName);
	scope.addEventListener(eventName, record);
	perScope.set(eventName, record);
	return record;
}
function releaseScopeRecord(scope, eventName, entry) {
	const perScope = scopeMastersByScope.get(scope);
	if (!perScope) {
		return;
	}
	const record = perScope.get(eventName);
	if (!record) {
		return;
	}
	record.entries.delete(entry);
	if (record.entries.size !== 0) {
		return;
	}
	scope.removeEventListener(eventName, record);
	perScope.delete(eventName);
	if (perScope.size === 0) {
		scopeMastersByScope.delete(scope);
	}
}
// — DelegateEntry class — mirrors `EventEntry` shape —
export class DelegateEntry {
	ownerRef = null;
	kind = '';
	eventName = '';
	selector = '';
	scope = null;
	handler = null;
	fireOnce = false;
	signal = null;
	subscribed = false;
	static create(owner, kind, eventName, handler, options) {
		const entry = new DelegateEntry();
		/*
		 * `owner === null` → owner-less anonymous registration (static delegate,
		 * services). Skips WeakRef, skips owner.delegateEntries tracking, never
		 * auto-unsubscribes on owner GC. Lifetime = page lifetime unless the
		 * caller explicitly calls `entry.unsubscribe()`.
		 */
		entry.ownerRef = owner ? weakRefFor(owner) : null;
		entry.kind = kind;
		entry.eventName = eventName;
		entry.handler = handler;
		entry.fireOnce = isObject(options) && options.once === true;
		entry.signal = isObject(options) ? (options.signal || null) : null;
		return entry;
	}
	/**
	 * Internal dispatch entry point — used by bus/env/scoped masters. Routes
	 * through `handler.call(owner, domEvent, matchTarget, eventName)` so the
	 * handler's `this` is the subscribing component without `.bind` or arrow.
	 * Owner-less path uses `matchTarget` (Tier 3) or the eventName scope as
	 * `this` so handlers still get a sensible binding.
	 */
	invoke(domEvent, matchTarget) {
		let owner = null;
		if (this.ownerRef) {
			owner = this.ownerRef.deref();
			if (!owner) {
				this.unsubscribe();
				return;
			}
		}
		if (this.fireOnce) {
			this.unsubscribe();
		}
		if (!isFunction(this.handler)) {
			return;
		}
		const thisArg = owner || matchTarget || null;
		const result = this.handler.call(thisArg, domEvent, matchTarget || owner, this.eventName);
		if (isPromiseLike(result)) {
			settleEventResult(result, owner, domEvent, matchTarget || owner, this.eventName);
		}
	}
	/**
	 * Abort-signal listener path. The entry doubles as the abort listener
	 * (registered once on the signal), routed through `domEvent.type === 'abort'`.
	 */
	handleEvent(domEvent) {
		if (domEvent.type === 'abort') {
			this.unsubscribe();
		}
	}
	subscribe() {
		if (this.subscribed) {
			return this;
		}
		if (this.signal?.aborted) {
			return this;
		}
		/*
		 * Scoped entries are one-shot: unsubscribe() released the scope
		 * reference for GC, so a re-subscribe has nothing to attach to —
		 * create a fresh delegate instead of throwing into the WeakMap.
		 */
		if (this.kind === 'scoped' && !this.scope) {
			return this;
		}
		// Owner-less entries skip the deref guard — they have no owner to GC.
		let owner = null;
		if (this.ownerRef) {
			owner = this.ownerRef.deref();
			if (!owner) {
				return this;
			}
		}
		if (this.kind === 'bus') {
			busRegistry.addEntry(this.eventName, this);
		} else if (this.kind === 'env') {
			envRegistry.addEntry(this.eventName, this);
		} else if (this.kind === 'scoped') {
			const record = getOrCreateScopeRecord(this.scope, this.eventName);
			record.entries.add(this);
		}
		if (owner) {
			(owner.delegateEntries ??= new Set()).add(this);
		}
		this.subscribed = true;
		if (this.signal) {
			this.signal.addEventListener('abort', this, {
				once: true,
			});
		}
		return this;
	}
	unsubscribe() {
		if (!this.subscribed) {
			this.detachSignal();
			return this;
		}
		if (this.kind === 'bus') {
			busRegistry.removeEntry(this.eventName, this);
		} else if (this.kind === 'env') {
			envRegistry.removeEntry(this.eventName, this);
		} else if (this.kind === 'scoped') {
			releaseScopeRecord(this.scope, this.eventName, this);
		}
		if (this.ownerRef) {
			const owner = this.ownerRef.deref();
			if (owner) {
				owner.delegateEntries?.delete(this);
			}
		}
		this.detachSignal();
		this.subscribed = false;
		this.scope = null;
		return this;
	}
	detachSignal() {
		if (!this.signal) {
			return;
		}
		this.signal.removeEventListener('abort', this);
		this.signal = null;
	}
}
/**
 * Subscribe a delegated event handler on the component's bus. Like `onEnv` and
 * `delegateTo`, it returns a `DelegateEntry` the caller can hold and
 * `unsubscribe()`; the entry is auto-tracked in `component.delegateEntries` and
 * torn down by the disconnect sweep.
 * @param {string} eventName - The event type to delegate.
 * @param {Function} handler - The event handler.
 * @param {AddEventListenerOptions} [options] - Native listener options.
 * @returns {DelegateEntry} The subscription entry.
 */
export function delegate(eventName, handler, options) {
	const trimmedEventName = isString(eventName) ? eventName.trim() : '';
	if (!trimmedEventName) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(handler)) {
		throw new TypeError('handler must be a function');
	}
	const entry = DelegateEntry.create(this, 'bus', trimmedEventName, handler, options);
	entry.subscribe();
	return entry;
}
export function onEnv(eventName, handler, options) {
	const trimmedEventName = isString(eventName) ? eventName.trim() : '';
	if (!trimmedEventName) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(handler)) {
		throw new TypeError('handler must be a function');
	}
	const entry = DelegateEntry.create(this, 'env', trimmedEventName, handler, options);
	entry.subscribe();
	return entry;
}
function installScopedDelegateInternal(owner, eventName, selector, handler, scope, options) {
	const trimmedEventName = isString(eventName) ? eventName.trim() : '';
	if (!trimmedEventName) {
		throw new TypeError('eventName must be a non-empty string');
	}
	const trimmedSelector = isString(selector) ? selector.trim() : '';
	if (!trimmedSelector) {
		throw new TypeError('selector must be a non-empty string');
	}
	if (!isFunction(handler)) {
		throw new TypeError('handler must be a function');
	}
	/*
	 * Owner-less calls (services, static `WebComponent.delegateTo`) MUST pass
	 * an explicit scope — there is no `this` to fall back to. Component-instance
	 * calls default scope to the component itself.
	 */
	const resolvedScope = scope || owner;
	if (!resolvedScope) {
		throw new TypeError('scope must be provided when no owner is bound');
	}
	const entry = DelegateEntry.create(owner, 'scoped', trimmedEventName, handler, options);
	entry.selector = trimmedSelector;
	entry.scope = resolvedScope;
	entry.subscribe();
	return entry;
}
// Instance method — `this` = component owner; auto-tracks via delegateEntries.
export function delegateTo(eventName, selector, handler, scope, options) {
	return installScopedDelegateInternal(this, eventName, selector, handler, scope, options);
}
/**
 * Owner-less scoped delegation — for services / static methods that need
 * delegated listeners before any component exists, or listeners that should
 * live for the page's lifetime. No auto-track, no GC sweep; the caller holds
 * the returned entry for explicit teardown.
 * @param {string} eventName - The event type to delegate.
 * @param {string} selector - CSS selector the event target must match.
 * @param {Function} handler - The event handler.
 * @param {EventTarget} scope - Where the listener attaches (required, no owner fallback).
 * @param {AddEventListenerOptions} [options] - Native listener options.
 * @returns {DelegateEntry} The subscription entry.
 */
export function installScopedDelegate(eventName, selector, handler, scope, options) {
	return installScopedDelegateInternal(null, eventName, selector, handler, scope, options);
}
// — Lifecycle sweep — mixed onto the prototype, called by `lifecycle.js` —
export function clearDelegateListeners() {
	sweepEntrySet(this.delegateEntries);
}
/**
 * Publish onto the document bus from a non-component caller. Services
 * (`viewport.js`, `connection.js`, etc.) call this instead of hand-rolling
 * `document.dispatchEvent(new CustomEvent(...))`. The detail shape matches the
 * conventional `{ data, source }` payload bus subscribers read via `domEvent.detail`.
 * @param {string} eventName - The event type to dispatch.
 * @param {*} [data] - The payload placed on `detail.data`.
 */
export function emitDelegate(eventName, data) {
	document.dispatchEvent(createBusEvent(eventName, data, null, undefined));
}
