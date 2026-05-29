// Delegate subsystem — the document/global half of the event surface.
//
// Public methods mixed onto `WebComponent.prototype` via base.js:
//   this.delegate(name, handler, options?)              — Tier 2: document bus
//   this.delegateTo(name, sel, handler, scope?, opts?)  — Tier 3: scoped delegation
//   this.onEnv(name, handler, options?)                 — Tier 4: globalThis master
//   this.clearDelegateListeners()                       — lifecycle sweep
//
// Public free function (services / non-component callers):
//   emitDelegate(name, data)                            — publish onto the bus
//
// Architecture
//
// Tier 2 (`delegate`) is a pure pub/sub bus: one master listener at
// `document` per event name, flat `Map<eventName, Set<DelegateEntry>>`.
// No selector, no `composedPath` JS traversal, no subevent dot-notation.
// `viewport:change`, `pulldown:state`, etc. are the canonical event names.
//
// Tier 3 (`delegateTo`) is scoped delegation: one master listener at the
// caller-provided `scope` (default: the component itself) per event name,
// `closest(selector)` on dispatch to find a matching descendant. Native
// engine work, no JS DOM walk.
//
// Tier 4 (`onEnv`) attaches the master at `globalThis` per event name —
// for browser-level events like `resize`, `online`, `visibilitychange`.
// Single registration, multiple subscribers.
//
// Every subscription is a `DelegateEntry` (mirrors `EventEntry` shape):
// `WeakRef` on owner, idempotent `unsubscribe`, auto-sweep on disconnect
// via `component.delegateEntries`. Handlers run via `handler.call(owner, …)`
// — no arrow fields, no `.bind`, no per-registration wrapper closure
// beyond the entry itself.
import {
	isError, isFunction, isObject, isPromiseLike, isString,
} from '../utilities.js';
// — Bus registry (Tier 2) — one master at `document` per event name —
const busRegistry = new Map();
const busMasters = new Set();
function dispatchBus(domEvent) {
	const bucket = busRegistry.get(domEvent.type);
	if (!bucket || bucket.size === 0) {
		return;
	}
	const snapshot = Array.from(bucket);
	for (let i = 0; i < snapshot.length; i++) {
		snapshot[i].invoke(domEvent, null);
	}
}
function ensureBusMaster(eventName) {
	if (busMasters.has(eventName)) {
		return;
	}
	document.addEventListener(eventName, dispatchBus, {
		capture: true,
	});
	busMasters.add(eventName);
}
function detachBusMaster(eventName) {
	if (!busMasters.has(eventName)) {
		return;
	}
	document.removeEventListener(eventName, dispatchBus, {
		capture: true,
	});
	busMasters.delete(eventName);
}
// — Environment registry (Tier 4) — one master at `globalThis` per event name —
const envRegistry = new Map();
const envMasters = new Set();
function dispatchEnv(domEvent) {
	const bucket = envRegistry.get(domEvent.type);
	if (!bucket || bucket.size === 0) {
		return;
	}
	const snapshot = Array.from(bucket);
	for (let i = 0; i < snapshot.length; i++) {
		snapshot[i].invoke(domEvent, null);
	}
}
function ensureEnvMaster(eventName) {
	if (envMasters.has(eventName)) {
		return;
	}
	globalThis.addEventListener(eventName, dispatchEnv);
	envMasters.add(eventName);
}
function detachEnvMaster(eventName) {
	if (!envMasters.has(eventName)) {
		return;
	}
	globalThis.removeEventListener(eventName, dispatchEnv);
	envMasters.delete(eventName);
}
// — Scoped delegation (Tier 3) — one master per (scope, eventName) pair —
//
// Each scope element holds a `WeakMap<scope, Map<eventName, scopeRecord>>`.
// The `scopeRecord` IS the EventListener — DOM spec: any object with a
// `handleEvent` method qualifies. On dispatch, walk entries and resolve
// each entry's selector via native `closest()` (no JS composedPath loop).
const scopeMastersByScope = new WeakMap();
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
	const record = {
		eventName,
		scope,
		entries: new Set(),
		handleEvent(domEvent) {
			if (!record.entries.size) {
				return;
			}
			const snapshot = Array.from(record.entries);
			for (let i = 0; i < snapshot.length; i++) {
				const entry = snapshot[i];
				const matchedTarget = domEvent.target.closest?.(entry.selector);
				if (!matchedTarget) {
					continue;
				}
				if (!scope.contains(matchedTarget)) {
					continue;
				}
				entry.invoke(domEvent, matchedTarget);
			}
		},
	};
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
function queueDelegateError(error, domEvent, owner, eventName) {
	queueMicrotask(() => {
		throw Object.assign(isError(error) ? error : new Error(String(error)), {
			element: owner,
			event: domEvent,
			eventName,
		});
	});
}
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
		entry.ownerRef = new WeakRef(owner);
		entry.kind = kind;
		entry.eventName = eventName;
		entry.handler = handler;
		entry.fireOnce = isObject(options) && options.once === true;
		entry.signal = isObject(options) ? (options.signal || null) : null;
		return entry;
	}
	// Internal dispatch entry point — used by bus/env/scoped masters. Routes
	// through `handler.call(owner, domEvent, matchTarget, eventName)` so the
	// handler's `this` is the subscribing component without `.bind` or arrow.
	invoke(domEvent, matchTarget) {
		const owner = this.ownerRef.deref();
		if (!owner) {
			this.unsubscribe();
			return;
		}
		if (this.fireOnce) {
			this.unsubscribe();
		}
		if (!isFunction(this.handler)) {
			return;
		}
		const result = this.handler.call(owner, domEvent, matchTarget || owner, this.eventName);
		if (isPromiseLike(result)) {
			result.catch((error) => {
				queueDelegateError(error, domEvent, owner, this.eventName);
			});
		}
	}
	// Abort-signal listener path. The entry doubles as the abort listener
	// (registered once on the signal), routed through `domEvent.type === 'abort'`.
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
		const owner = this.ownerRef.deref();
		if (!owner) {
			return this;
		}
		if (this.kind === 'bus') {
			let bucket = busRegistry.get(this.eventName);
			if (!bucket) {
				bucket = new Set();
				busRegistry.set(this.eventName, bucket);
			}
			bucket.add(this);
			ensureBusMaster(this.eventName);
		} else if (this.kind === 'env') {
			let bucket = envRegistry.get(this.eventName);
			if (!bucket) {
				bucket = new Set();
				envRegistry.set(this.eventName, bucket);
			}
			bucket.add(this);
			ensureEnvMaster(this.eventName);
		} else if (this.kind === 'scoped') {
			const record = getOrCreateScopeRecord(this.scope, this.eventName);
			record.entries.add(this);
		}
		owner.delegateEntries.add(this);
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
			const bucket = busRegistry.get(this.eventName);
			if (bucket) {
				bucket.delete(this);
				if (bucket.size === 0) {
					busRegistry.delete(this.eventName);
					detachBusMaster(this.eventName);
				}
			}
		} else if (this.kind === 'env') {
			const bucket = envRegistry.get(this.eventName);
			if (bucket) {
				bucket.delete(this);
				if (bucket.size === 0) {
					envRegistry.delete(this.eventName);
					detachEnvMaster(this.eventName);
				}
			}
		} else if (this.kind === 'scoped') {
			releaseScopeRecord(this.scope, this.eventName, this);
		}
		const owner = this.ownerRef.deref();
		if (owner) {
			owner.delegateEntries.delete(this);
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
// — Public prototype methods —
//
// All three return a `DelegateEntry` so the caller can hold it and call
// `entry.unsubscribe()`. Auto-tracked in `component.delegateEntries`;
// disconnect sweep tears them all down.
export function delegate(eventName, handler, options) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(handler)) {
		throw new TypeError('handler must be a function');
	}
	const entry = DelegateEntry.create(this, 'bus', eventName.trim(), handler, options);
	entry.subscribe();
	return entry;
}
export function onEnv(eventName, handler, options) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(handler)) {
		throw new TypeError('handler must be a function');
	}
	const entry = DelegateEntry.create(this, 'env', eventName.trim(), handler, options);
	entry.subscribe();
	return entry;
}
export function delegateTo(eventName, selector, handler, scope, options) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isString(selector) || !selector.trim()) {
		throw new TypeError('selector must be a non-empty string');
	}
	if (!isFunction(handler)) {
		throw new TypeError('handler must be a function');
	}
	const owner = this;
	const resolvedScope = scope || owner;
	const entry = DelegateEntry.create(owner, 'scoped', eventName.trim(), handler, options);
	entry.selector = selector.trim();
	entry.scope = resolvedScope;
	entry.subscribe();
	return entry;
}
// — Lifecycle sweep — mixed onto the prototype, called by `lifecycle.js` —
export function clearDelegateListeners() {
	const entries = this.delegateEntries;
	if (!entries?.size) {
		return;
	}
	const snapshot = Array.from(entries);
	for (let i = 0; i < snapshot.length; i++) {
		snapshot[i].unsubscribe();
	}
	entries.clear();
}
// — Free function: publish onto the document bus from a non-component caller.
// Services (`viewport.js`, `connection.js`, etc.) call this instead of
// hand-rolling `document.dispatchEvent(new CustomEvent(...))`. The detail
// shape matches the conventional `{ data, source }` payload that bus
// subscribers expect via `domEvent.detail`.
export function emitDelegate(eventName, data) {
	document.dispatchEvent(new CustomEvent(eventName, {
		bubbles: true,
		composed: true,
		detail: {
			data,
			source: null,
		},
	}));
}
