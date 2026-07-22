import { defaultLogger } from '../debug/logger.js';
import { Perf } from '../debug/perf.js';
import { PHASE } from '../lifecycle/phase.js';
import {
	cachedProxy,
	getValueAtPath,
	hasOwn,
	isArray,
	isMap,
	isObject,
	isPlainObject,
	isPromiseLike,
	isSet,
	isSymbol,
	joinPath,
	pathsOverlap,
	plainEqual,
	queueAsyncError,
	runHook,
	setValueAtPath,
} from '../utilities.js';
import {
	ComponentSubscriptionTracker,
	PathSubscriptions,
	TrackedBundle,
} from './pathSubscriptions.js';
export const STATE_PATH = Symbol('statePath');
/**
 * Concrete bus for a single component's reactive state. Owns a reference to
 * the component so `getValue` and `onFlush` are prototype methods — zero
 * per-component arrow allocations, monomorphic shape across every bus.
 * The render pipeline integration lives on `onFlush`: each flush kicks the
 * component's `updateView` and forwards any async rejection to the global
 * error queue (matching the pre-refactor config-arrow behavior).
 */
class ComponentStateBus extends PathSubscriptions {
	/*
	 * The local renderDep Set channel (see render.js subscribeRenderDeps). Bare
	 * `${this.state.x}` reads all share one idempotent handler
	 * (markRenderDirty), one target (the component), the once-per-batch
	 * contract, and this 1:1 bus — so they need no Subscription objects and no
	 * buckets: one lazy Set of paths replaces per-dep Subscription + bucket-Set
	 * + unsub-map machinery on the create path. `nestedRenderDepCount` keeps
	 * the flat fast path honest: 0 dotted deps ⇒ a changed path overlaps at
	 * most its exact key or its first segment — two O(1) probes.
	 */
	// @engram em:network/concept/renderdep-set-channel-local-render-deps-need-no-subscription — why local renderDeps need no Subscription objects; global/private realms stay on the legacy route
	renderDeps = null;
	nestedRenderDepCount = 0;
	constructor(component) {
		super();
		this.component = component;
	}
	getValue(path) {
		return getValueAtPath(this.component.STATE, path);
	}
	/**
	 * Re-sync the channel to this render pass's tracked local deps. Unchanged
	 * vocabularies (the overwhelmingly common warm pass) run two zero-alloc
	 * probe loops; adds/removes adjust in place. `null`/empty clears — the
	 * template stopped reading local state bare.
	 * @param {Set<string>|null} nextPaths - The pass's tracked local dep paths.
	 */
	syncRenderDeps(nextPaths) {
		const current = this.renderDeps;
		if (!nextPaths || nextPaths.size === 0) {
			if (current !== null && current.size) {
				current.clear();
				this.nestedRenderDepCount = 0;
			}
			return;
		}
		if (current === null) {
			const fresh = new Set();
			let freshNested = 0;
			for (const path of nextPaths) {
				fresh.add(path);
				if (path.indexOf('.') !== -1) {
					freshNested += 1;
				}
			}
			this.renderDeps = fresh;
			this.nestedRenderDepCount = freshNested;
			return;
		}
		let nested = this.nestedRenderDepCount;
		for (const path of current) {
			if (!nextPaths.has(path)) {
				current.delete(path);
				if (path.indexOf('.') !== -1) {
					nested -= 1;
				}
			}
		}
		for (const path of nextPaths) {
			if (!current.has(path)) {
				current.add(path);
				if (path.indexOf('.') !== -1) {
					nested += 1;
				}
			}
		}
		this.nestedRenderDepCount = nested;
	}
	clearRenderDeps() {
		if (this.renderDeps !== null) {
			this.renderDeps = null;
			this.nestedRenderDepCount = 0;
		}
	}
	/*
	 * flush() calls this before the bucket dispatch and outside its `subs`
	 * gate. First overlapping path wins — the dirty flag is idempotent, so
	 * short-circuiting preserves the once-per-batch contract. renderDep
	 * handlers ignore the bus-passed value, so no getValue runs here at all.
	 */
	matchRenderDeps(replaceAll, changed) {
		const renderDeps = this.renderDeps;
		if (renderDeps === null || renderDeps.size === 0) {
			return;
		}
		if (replaceAll) {
			this.component.markRenderDirty();
			return;
		}
		const changedLength = changed.length;
		for (let index = 0; index < changedLength; index++) {
			if (this.renderDepHit(changed[index])) {
				this.component.markRenderDirty();
				return;
			}
		}
	}
	renderDepHit(changedPath) {
		const renderDeps = this.renderDeps;
		if (renderDeps.has(changedPath)) {
			return true;
		}
		/*
		 * All-flat deps: the only other possible overlap is the changed path's
		 * first segment (a deeper write under a bare dep — 'a.b' hits dep 'a').
		 * Any dotted dep forces the full overlap scan; dep sets are small.
		 */
		if (this.nestedRenderDepCount === 0) {
			const dotIndex = changedPath.indexOf('.');
			return dotIndex !== -1 && renderDeps.has(changedPath.slice(0, dotIndex));
		}
		for (const depPath of renderDeps) {
			if (pathsOverlap(depPath, changedPath)) {
				return true;
			}
		}
		return false;
	}
	onFlush() {
		const component = this.component;
		/*
		 * updateView's render side is already gated on `!templateBuilt`, so a flush
		 * that left templateBuilt === true (a surgical spot batch — bind()/list/
		 * two-way patched in place via drainSpots, no bare `${this.state.x}`
		 * renderDep to flip the flag) has exactly ONE residual task: `onStateChange?.()`.
		 * With no such hook, updateView is a pure no-op that STILL allocates a promise
		 * every flush (it is async) — skip it. A renderDep flip (templateBuilt false)
		 * or a live onStateChange both fall through to the real call, so the render
		 * path and the once-per-flush onStateChange contract (incl. replaceState's
		 * zero-subs guarantee, which keys on the hook's presence) stay intact.
		 */
		if (component.templateBuilt === true && !component.onStateChange) {
			return;
		}
		const result = component.updateView();
		if (isPromiseLike(result)) {
			result.catch(queueAsyncError);
		}
	}
}
/**
 * Lazy-init for a component's reactive bus. Single chokepoint so engine
 * callers (render.js subscribeRenderDeps, template.js subscribeStatePath)
 * don't each open-code the `??= new ComponentStateBus(...)` pattern.
 * @param {WebComponent} component - The owning component.
 * @returns {ComponentStateBus} The component's reactive state bus.
 */
export function ensureStateBus(component) {
	if (!component.stateBus) {
		component.stateBus = new ComponentStateBus(component);
	}
	return component.stateBus;
}
/**
 * A per-component LOCAL realm — the object-reference replacement for a bare
 * (unprefixed) dependency string. Carries the component's bus (preserved across
 * replaceState) and reads/writes against the LIVE STATE/stateProxy so it
 * survives state replacement. `global:false` → renderDep subscription picks the
 * plain markRenderDirty. Cached on the component so its identity is stable — it
 * is the key for the tracking accumulator Map and for spot realm resolution.
 */
class LocalRealm {
	constructor(component) {
		this.component = component;
		this.bus = ensureStateBus(component);
		this.global = false;
		/*
		 * Own the flag so render.js's `realm.sharedBus` marker pick is a
		 * monomorphic own-property read across every realm type (StoreRealm
		 * sets it true). The local bus IS the component's stateBus, so its
		 * onFlush → updateView already drives the render; not shared.
		 */
		this.sharedBus = false;
	}
	read(path) {
		return getValueAtPath(this.component.STATE, path);
	}
	write(path, value) {
		setValueAtPath(this.component.stateProxy, path, value);
	}
}
export function localRealm(component) {
	if (!component.localRealmRef) {
		component.localRealmRef = new LocalRealm(component);
	}
	return component.localRealmRef;
}
function notifyStateChange(component, changedPath) {
	ensureStateBus(component).notify(changedPath);
}
/**
 * `static properties` may declare a path `react: false` — a non-reactive path
 * is written straight through to STATE but fires no notification, so it never
 * schedules a render or a spot patch. Default (no entry) is reactive.
 * @param {WebComponent} component - The owning component.
 * @param {string} fullPath - The dotted state path being written.
 * @returns {boolean} True when a write to the path should notify subscribers.
 */
function pathIsReactive(component, fullPath) {
	const propertyIndex = component.propertyIndex;
	if (!propertyIndex || !propertyIndex.hasNonReactive) {
		return true;
	}
	return !propertyIndex.nonReactivePaths.has(fullPath);
}
/**
 * Forwards deep changes on a SOURCE bus subtree to a CHILD component's own bus,
 * translating the absolute source path to the child-relative path. Installed
 * when a parent passes a SHARED reactive object via `.state=`: the child holds
 * the same object by reference, but a deep mutation made through the source
 * proxy notifies only the source's bus — so without this bridge the child's
 * spots never re-read. Delivering the precise deep path (not a blanket re-fire)
 * lets a list spot take its force-assign partial branch, which a top-level
 * notify would skip for an unchanged item reference. One instance per linked
 * child; the handler lives on the prototype so the bus dispatches
 * `handler.call(target, value, changedPath)` with zero per-link closure.
 */
class StateCarrierForwarder {
	constructor(childComponent, sourcePath) {
		this.childComponent = childComponent;
		this.sourcePath = sourcePath;
		this.prefixLength = sourcePath.length + 1;
	}
	forward(value, changedPath) {
		/*
		 * A change AT or above the source path (the whole shared object replaced)
		 * is already delivered by the `.state=` re-merge; only DEEP sub-paths
		 * need bridging. Gated by the child's own `pathIsReactive` so a
		 * child-declared `react:false` path stays inert.
		 */
		if (changedPath.length <= this.prefixLength) {
			return;
		}
		const relativePath = changedPath.slice(this.prefixLength);
		if (pathIsReactive(this.childComponent, relativePath)) {
			notifyStateChange(this.childComponent, relativePath);
		}
	}
}
/**
 * Bridge a child's reactive bus to the SOURCE realm of a shared object passed
 * via `.state=`, so deep mutations made through the source proxy reach the
 * child's spots. Idempotent per (child, source bus + path): re-applying the same
 * `.state=` value reuses the live bridge; a different source (or a bridge torn
 * down by a disconnect) replaces it. The carrier subscription lives on the
 * FOREIGN source bus, NOT in the child's own-state `stateUnsubs` path-tracker —
 * co-mingling the two keyspaces let an `unobserve(key)` on a same-named child
 * key tear the bridge down as collateral (`removeByKey` is path-keyed and the
 * carrier was bucketed under the SOURCE path). It is stored on
 * `childComponent.stateCarrier` and released by `unlinkStateCarrier` in the
 * disconnect sweep. The stored carrier also records the `sourceComponent` so the
 * REVERSE leg (forwardSharedWriteToSource) can mirror a child-origin top-level write
 * back onto the source — the carrier is the single home for both directions.
 * @param {WebComponent} childComponent - The component receiving `.state=`.
 * @param {object} carrier - The incoming proxy's `{realm, path}` carrier.
 */
export function linkStateCarrier(childComponent, carrier) {
	const sourceBus = carrier.realm?.bus;
	const sourcePath = carrier.path;
	/*
	 * A ROOT carrier — `.state=${this.state}` passes the WHOLE state, path ''.
	 * There is no subtree prefix to strip, and by `pathsOverlap` semantics a ''
	 * subscription never matches a deep changed path, so the bridge could not
	 * fire anyway. Skip it: whole-state sharing keeps its existing double-proxy +
	 * `.state=` re-merge behavior. Only a NAMED subtree (`.state=${this.state.dock}`)
	 * gets the bridge — the carry-down pattern this targets.
	 */
	if (!sourceBus || sourcePath === '') {
		return;
	}
	const existing = childComponent.stateCarrier;
	const existingLive = existing && existing.subscription.handler;
	if (existingLive && existing.sourceBus === sourceBus && existing.sourcePath === sourcePath) {
		return;
	}
	if (existingLive) {
		existing.subscription.unsubscribe();
	}
	const forwarder = new StateCarrierForwarder(childComponent, sourcePath);
	const subscription = sourceBus.subscribe(sourcePath, StateCarrierForwarder.prototype.forward, forwarder, true);
	childComponent.stateCarrier = {
		sourceBus,
		sourcePath,
		subscription,
		sourceComponent: carrier.realm.component,
	};
}
/**
 * Release a child's `.state=` carrier bridge. The carrier subscription lives on
 * a FOREIGN bus (the source component's), so it is deliberately absent from this
 * component's `stateUnsubs` path-tracker and the disconnect sweep would miss it —
 * the disconnect lifecycle calls this alongside `stateUnsubs.clear()`. Idempotent:
 * a child that never received a shared `.state=` has no carrier; a re-disconnect
 * finds the subscription already torn down (`unsubscribe` is itself idempotent).
 * @param {WebComponent} component - The component whose carrier to release.
 */
export function unlinkStateCarrier(component) {
	const carrier = component.stateCarrier;
	if (!carrier) {
		return;
	}
	carrier.subscription.unsubscribe();
	component.stateCarrier = null;
}
function throwCollectionMutate() {
	throw new Error('Do not mutate Map/Set proxy properties directly. Use .set() or .add() instead.');
}
function throwCollectionDelete() {
	throw new Error('Do not delete Map/Set proxy properties directly. Use .delete() instead.');
}
/**
 * Reactive facade for a Set/Map stored under STATE. Every operation lives on
 * the prototype — one function shape across every collection in the app,
 * zero closures + zero `.bind` per instance. Per-instance cost is the four
 * fields below. Mutating methods notify the component bus via the joined
 * (path + key) path; pass-throughs forward to the underlying target.
 *
 * Why a facade behind a Proxy: keeping the Proxy lets us reject foreign
 * `set` / `deleteProperty` and intercept the STATE_PATH symbol read; making
 * the facade the proxy target (instead of the raw Set/Map) means the proxy's
 * `get` dispatches via the facade's prototype chain. The handler overrides
 * `getPrototypeOf` to return `Set.prototype` / `Map.prototype` so external
 * `instanceof Set/Map` checks (e.g. Template.js list-rendering) still pass.
 */
class ReactiveCollection {
	constructor(target, component, path, asMap) {
		this.target = target;
		this.component = component;
		this.path = path;
		this.asMap = asMap;
		this.carrier = null;
	}
	notifyKey(key) {
		notifyStateChange(this.component, joinPath(this.path, key));
	}
	add(item) {
		if (this.target.has(item)) {
			return this.target;
		}
		this.target.add(item);
		this.notifyKey(item);
		return this.target;
	}
	set(key, value) {
		if (this.target.has(key) && this.target.get(key) === value) {
			return this.target;
		}
		this.target.set(key, value);
		this.notifyKey(key);
		return this.target;
	}
	delete(key) {
		if (!this.target.has(key)) {
			return false;
		}
		this.target.delete(key);
		this.notifyKey(key);
		return true;
	}
	clear() {
		if (!this.target.size) {
			return;
		}
		const keys = this.asMap ? [...this.target.keys()] : [...this.target];
		this.target.clear();
		const keysLength = keys.length;
		for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
			this.notifyKey(keys[keyIndex]);
		}
	}
	has(key) {
		return this.target.has(key);
	}
	get(key) {
		return this.target.get(key);
	}
	forEach(callback) {
		return this.target.forEach(callback);
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
		return this.target.size;
	}
	[Symbol.iterator]() {
		return this.target[Symbol.iterator]();
	}
}
/**
 * Stateless proxy handler shared by every reactive collection — all four
 * traps live on the prototype, no per-proxy state. `get` defers to the
 * facade's prototype dispatch so methods invoked via the proxy receive the
 * proxy as their receiver, which then forwards their `this.target` /
 * `this.component` reads back through the same trap. `getPrototypeOf`
 * reports Set/Map's prototype so `instanceof Set/Map` keeps working.
 */
class CollectionProxyHandler {
	static instance = new CollectionProxyHandler();
	static create(target, component, path, asMap) {
		return cachedProxy(component.proxyCache, target, path, CollectionProxyHandler, component, asMap);
	}
	static build(target, path, component, asMap) {
		const facade = new ReactiveCollection(target, component, path, asMap);
		return new Proxy(facade, CollectionProxyHandler.instance);
	}
	get(facade, key, receiver) {
		if (key === STATE_PATH) {
			/*
			 * Singleton handler → cache the carrier on the per-(target,path)
			 * facade. localRealm(component) and path are stable for its life.
			 */
			facade.carrier ??= {
				realm: localRealm(facade.component),
				path: facade.path,
			};
			return facade.carrier;
		}
		return Reflect.get(facade, key, receiver);
	}
	set() {
		throwCollectionMutate();
	}
	deleteProperty() {
		throwCollectionDelete();
	}
	getPrototypeOf(facade) {
		return facade.asMap ? Map.prototype : Set.prototype;
	}
}
function makeCollectionProxy(target, component, path, asMap) {
	return CollectionProxyHandler.create(target, component, path, asMap);
}
function reportWastedStateSet(target, key, value, fullPath, component) {
	if (!plainEqual(target[key], value)) {
		return null;
	}
	return `[${component.tagName}] wasted set on "${fullPath}" — new value is structurally equal to current but a different reference; reuse the existing reference to avoid re-render.`;
}
/**
 * Reverse leg of the `.state=` carrier. A child that received a shared object via
 * `.state=${parent.state.foo}` holds the source's NESTED objects by reference — so a
 * deep write already reaches the parent through the shared proxy. But a TOP-LEVEL
 * PRIMITIVE (e.g. `activeIndex`) was copied by VALUE at merge time and cannot be shared by
 * reference, so a child-origin write to it would otherwise never reach the parent's
 * object. Mirror such a write back onto the source proxy so the shared object stays in
 * sync from EITHER origin. Three constraints keep it safe and loop-free. Only TOP-LEVEL
 * writes reach here (the set trap gates on `path === ''`); nested keys already share via
 * the double-proxy, so they need no mirror. Only keys the SOURCE already owns are mirrored
 * — a child-private key (declared in the child's own `static state`, absent from the
 * passed object) stays local. And the mirror is skipped when the source already holds the
 * value: a no-op, and the echo break — the mirror write notifies the source bus, whose
 * forward carrier only re-NOTIFIES the child (no write back through the child proxy), so
 * the exchange converges. The initial `.state=` merge writes raw `STATE` via `assignState`
 * (not through the proxy), so it never triggers this leg — only genuine
 * `child.state.key = value` writes do.
 * @param {WebComponent} childComponent - The component whose state was written.
 * @param {string} key - The top-level state key that changed.
 * @param {*} value - The newly written value.
 */
function forwardSharedWriteToSource(childComponent, key, value) {
	const carrier = childComponent.stateCarrier;
	if (!carrier || !carrier.sourceComponent) {
		return;
	}
	const sourceComponent = carrier.sourceComponent;
	const sourceObject = getValueAtPath(sourceComponent.STATE, carrier.sourcePath);
	if (!sourceObject || !hasOwn(sourceObject, key) || sourceObject[key] === value) {
		return;
	}
	setValueAtPath(sourceComponent.stateProxy, joinPath(carrier.sourcePath, key), value);
}
/**
 * Top-level accessor dispatch for the state set-trap — a `set foo(v)` declared in
 * `static state`, fired with `this === component`. Notifies the path so spots / renderDeps
 * subscribed to the key re-evaluate (the new getter value is read on next access). A
 * getter-only declaration silently rejects the write — matching `Reflect.set` on a
 * getter-only accessor descriptor. Returns true when the key was an accessor (the write
 * is fully handled here); false to fall through to plain state assignment.
 * @param {WebComponent} component - The owning component.
 * @param {string} key - The top-level key being written.
 * @param {*} value - The value to pass to the setter.
 * @returns {boolean} True when the key is an accessor and the write is handled.
 */
function applyTopLevelAccessor(component, key, value) {
	const propertyIndex = component.propertyIndex;
	if (!propertyIndex?.hasAccessors) {
		return false;
	}
	const setter = propertyIndex.setters.get(key);
	if (setter) {
		setter.call(component, value);
		const accessorPath = String(key);
		if (pathIsReactive(component, accessorPath)) {
			notifyStateChange(component, accessorPath);
		}
		return true;
	}
	return propertyIndex.getters.has(key);
}
/**
 * Single trap shape shared by every state proxy. Methods live on the prototype
 * so JIT can monomorphize get/set/deleteProperty across all instances; each
 * proxy only pays for a 2-field handler instance, not 3 fresh closures.
 * Recursion goes through StateProxyHandler.create (a static factory) instead
 * of a free function so the class avoids forward references.
 */
class StateProxyHandler {
	constructor(component, path) {
		this.component = component;
		this.path = path;
		this.carrier = null;
		// Per-key child-proxy cache — skips joinPath + WeakMap/Map on hot re-reads.
		this.children = null;
	}
	static create(target, component, path = '') {
		return cachedProxy(component.proxyCache, target, path, StateProxyHandler, component);
	}
	static build(target, path, component) {
		return new Proxy(target, new StateProxyHandler(component, path));
	}
	/*
	 * Resolve a nested container to its proxy. Handler-local Map keyed by
	 * property key; hit when the raw source identity is unchanged. Miss still
	 * goes through cachedProxy so cross-handler aliasing stays correct.
	 */
	childProxy(key, propertyValue) {
		const entry = this.children?.get(key);
		if (entry && entry.source === propertyValue) {
			return entry.proxy;
		}
		const nestedPath = entry?.path ?? joinPath(this.path, key);
		let proxy;
		if (isArray(propertyValue) || isPlainObject(propertyValue)) {
			proxy = StateProxyHandler.create(propertyValue, this.component, nestedPath);
		} else if (isSet(propertyValue)) {
			proxy = makeCollectionProxy(propertyValue, this.component, nestedPath, false);
		} else if (isMap(propertyValue)) {
			proxy = makeCollectionProxy(propertyValue, this.component, nestedPath, true);
		} else {
			return propertyValue;
		}
		(this.children ??= new Map()).set(key, {
			source: propertyValue,
			path: nestedPath,
			proxy,
		});
		return proxy;
	}
	get(target, key) {
		// Live path meta for ensure/collection(this.state.itemsConfig) and tooling.
		if (key === STATE_PATH) {
			// Per-(target,path) handler — path/component immutable, cache once.
			this.carrier ??= {
				path: this.path,
				component: this.component,
			};
			return this.carrier;
		}
		if (isSymbol(key)) {
			return Reflect.get(target, key);
		}
		/**
		 * Top-level accessor dispatch — declared via `get foo()` in `static
		 * state`. Fires with `this === component` so the getter can read
		 * sibling state through this.state.x and call instance methods.
		 */
		if (this.path === '') {
			const propertyIndex = this.component.propertyIndex;
			if (propertyIndex?.hasAccessors && propertyIndex.getters.has(key)) {
				return propertyIndex.getters.get(key).call(this.component);
			}
		}
		const propertyValue = Reflect.get(target, key);
		/*
		 * Primitive leaf (the common `this.state.user.name` case): bail before
		 * container checks + joinPath. Only objects reach the branches below.
		 */
		if (!isObject(propertyValue)) {
			return propertyValue;
		}
		return this.childProxy(key, propertyValue);
	}
	set(target, key, value) {
		const isTopLevel = this.path === '';
		if (isTopLevel && applyTopLevelAccessor(this.component, key, value)) {
			return true;
		}
		if (target[key] === value) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		if (defaultLogger.perfOn) {
			defaultLogger.perf('state', reportWastedStateSet, target, key, value, fullPath, this.component);
		}
		Reflect.set(target, key, value);
		if (pathIsReactive(this.component, fullPath)) {
			notifyStateChange(this.component, fullPath);
		}
		/*
		 * A top-level write may mirror back to a `.state=` source (see
		 * forwardSharedWriteToSource). Gated on the top-level flag so nested writes —
		 * already shared by reference — skip the carrier lookup entirely.
		 */
		if (isTopLevel) {
			forwardSharedWriteToSource(this.component, key, value);
		}
		return true;
	}
	deleteProperty(target, key) {
		/**
		 * `delete state.foo` is translated to null-assignment to preserve the
		 * STATE object's hidden class — using the `delete` keyword would force
		 * V8 to abandon the hot shape. Callers that need true "absent"
		 * semantics should model the field with a Map or use a sentinel.
		 */
		if (!hasOwn(target, key) || target[key] === null) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		target[key] = null;
		if (pathIsReactive(this.component, fullPath)) {
			notifyStateChange(this.component, fullPath);
		}
		return true;
	}
}
export function initState() {
	this.proxyCache = new WeakMap();
	this.stateProxy = StateProxyHandler.create(this.STATE, this);
}
export function replaceState(state = {}) {
	if (plainEqual(this.STATE, state)) {
		return Promise.resolve();
	}
	this.STATE = isPlainObject(state) ? {
		...state,
	} : {};
	this.proxyCache = new WeakMap();
	this.stateProxy = StateProxyHandler.create(this.STATE, this);
	/**
	 * The bus is intentionally preserved across a state replacement. Its
	 * `getValue(path)` closure resolves against `component.STATE` by
	 * reference, so every existing subscription automatically reads the new
	 * STATE on the next flush — including the computed-spot subscriptions
	 * behind function-expression bindings (e.g. `.state=${this.indicatorState}`)
	 * and the renderDep watches behind raw `${this.state.foo}` reads.
	 * Tearing the bus down — or wiping `tplState` to force a full template
	 * rebuild — orphans every one of those subscriptions and silently
	 * recreates every child custom element on each parent update (badge
	 * constructors fire over and over) and yanks focus out of any focused
	 * input. Re-firing every live subscription is enough: the bus coalesces
	 * into a single microtask flush and each spot patches its DOM in place
	 * against the fresh STATE. `notifyAll()` is the bus's replacement
	 * primitive — one flag, one O(subs) dispatch pass with each bucket fired
	 * at its own path (the old per-path notify walk made the flush match
	 * N changed paths against N subscriptions, quadratic on spot-heavy
	 * components).
	 * NOT a diff check (evaluated + rejected — see render-performance.private.md #2):
	 * `assignState` already IS the per-key-diff partial path (`if (STATE[key] ===
	 * next) continue;` → notify only changed keys) and is what keyed-list reuse
	 * calls. `replaceState` is the deliberate WHOLESALE swap; usage is full-
	 * replacement-dominated (bench "replace", list-row whole-item), where every key
	 * changes — so `dispatchAll` (fire each bucket once, NO overlap trie) is already
	 * optimal. A top-level ref-diff would route that all-changed case through the
	 * costlier `dispatchChanged` trie build, slow the very "replace" benchmark, AND
	 * risk dropping a reused-nested-ref-mutated-in-place update that `dispatchAll`
	 * catches. Callers wanting partial semantics use `assignState`.
	 */
	/*
	 * Notify-ONLY when a reactive bus exists (mirrors assignState) — the flush's
	 * `onFlush → updateView` renders AND fires `onStateChange` exactly once.
	 * `flush()` calls `onFlush()` UNCONDITIONALLY (after its subs-gated dispatch
	 * block), so even a bus with zero live subscriptions still drives that one
	 * updateView — that is what guarantees onStateChange fires once, not zero
	 * (do NOT move onFlush inside the subs guard). The old shape ALSO called
	 * updateView() here, double-invoking both: the immediate call renders nothing
	 * (notifyAll only SCHEDULES the flush, so templateBuilt is still true), it
	 * merely re-fired onStateChange. Two intentional shifts fall out: onStateChange
	 * is now async on the `.state=` path (patch already is — they now match), and
	 * N replaceState calls in one tick coalesce to a SINGLE onStateChange
	 * (notifyAll early-returns on pendingAll). The flush microtask is queued
	 * above, so an awaiting caller still resumes after the reflected view.
	 */
	if (this.stateBus) {
		this.stateBus.notifyAll();
		return Promise.resolve();
	}
	/*
	 * No reactive bus (render never read state, no observers) — nothing will
	 * flush, so drive the single updateView directly; it fires onStateChange
	 * once and renders. Rare: most components create a bus on first state use.
	 * updateView returns undefined when it finished inline; replaceState's
	 * contract is a thenable either way (the bus branch above returns one), so
	 * normalize rather than leak the fast path's undefined to `.then` callers.
	 */
	return this.updateView() ?? Promise.resolve();
}
/**
 * Shallow-merge a partial patch into top-level state. Bypasses the per-key
 * proxy `set` trap so N writes cost N strict-equality compares instead of N
 * trap invocations. Notifies only the paths that actually changed; the path
 * bus coalesces the batch into a single flush + updateView. Nested writes
 * inside `partial.foo.bar` are NOT tracked — pass a top-level patch object.
 * @param {object} partial - Top-level keys to merge into STATE.
 * @param {object} [options] - `{ silent: true }` suppresses notification (hydration paths that trigger render themselves).
 * @returns {boolean} True if any key changed, false otherwise.
 */
export function assignState(partial, options) {
	if (!isPlainObject(partial)) {
		return false;
	}
	const silent = options?.silent === true;
	const keys = Object.keys(partial);
	let touched = false;
	const keysLength = keys.length;
	for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
		const key = keys[keyIndex];
		const next = partial[key];
		if (this.STATE[key] === next) {
			continue;
		}
		this.STATE[key] = next;
		touched = true;
		if (!silent && pathIsReactive(this, key)) {
			notifyStateChange(this, key);
		}
	}
	return touched;
}
/**
 * Sync state-key observer. Wraps the user handler with previousValue tracking
 * so the bus's 2-arg `(value, changedPath)` contract delivers the 3-arg
 * `(nextValue, previousValue, changedPath)` shape callers expect. Subscribed
 * via bus `target` — one shared prototype method serves every observer; no
 * per-subscription closure, stable hidden class for JIT monomorphization.
 */
export class StateKeyObserver {
	constructor(component, handler, previousValue, options) {
		this.component = component;
		this.handler = handler;
		this.previousValue = previousValue;
		this.fireOnce = options?.once === true;
		this.subscription = null;
	}
	handle(nextValue, changedPath) {
		const result = this.handler.call(this.component, nextValue, this.previousValue, changedPath);
		this.previousValue = nextValue;
		/* `{ once: true }` — detach after the first fire. The subscription is
		 * idempotent on unsubscribe, so the disconnect sweep re-clearing it no-ops. */
		if (this.fireOnce && this.subscription) {
			this.subscription.unsubscribe();
		}
		return result;
	}
}
/**
 * Subscribe one path to a handler that fires synchronously inside the state
 * write-trap. Internal helper for `observe` — returns the bare `Subscription`
 * instance so callers can wire it into their own tracker.
 * @param {WebComponent} component - The owning component.
 * @param {string} key - State path to observe.
 * @param {Function} handler - Called as `(nextValue, previousValue, changedPath)`.
 * @param {object} [options] - `{ immediate, once }`.
 * @returns {Subscription} The bare subscription.
 */
function observeStateKey(component, key, handler, options) {
	const statePath = String(key ?? '');
	const bus = ensureStateBus(component);
	const previousValue = getValueAtPath(component.STATE, statePath);
	const observer = new StateKeyObserver(component, handler, previousValue, options);
	const subscription = bus.subscribe(statePath, StateKeyObserver.prototype.handle, observer);
	observer.subscription = subscription;
	/* `{ immediate: true }` — seed the handler now with the current value; there
	 * is no prior value yet, so previousValue is undefined on this first call.
	 * The immediate fire COUNTS toward `once` (Vue parity): the combo means
	 * "fire exactly once, right now". */
	if (options?.immediate === true) {
		handler.call(component, previousValue, undefined, statePath);
		if (options.once === true) {
			subscription.unsubscribe();
		}
	}
	return subscription;
}
/**
 * Subscribe to component-state changes. Accepts a single key, an array of keys
 * sharing one callback, or a `{ key: callback }` map. Every resulting
 * `Subscription` registers in `this.stateUnsubs` so `unobserve(key)` can tear
 * it down by path and the disconnect lifecycle cleans danglers automatically.
 * @param {string|string[]|object} keys - A path, an array of paths, or a `{ path: cb }` map.
 * @param {Function|object} [handler] - Callback for the single-key/array forms; for the
 * `{ path: cb }` map form this slot is the optional `options` bag instead.
 * @param {object} [options] - `{ immediate, once }`. `immediate` fires the handler now with
 * the current value (previousValue undefined); `once` detaches after the first fire.
 * @returns {Subscription|TrackedBundle} Single-key → a Subscription; array/object → a TrackedBundle.
 * @example
 * this.observe('user.name', cb, { immediate: true });
 * this.observe(['a', 'b', 'c'], cb, { once: true });
 * this.observe({ a: cb1, b: cb2 }, { immediate: true });
 */
export function observe(keys, handler, options) {
	const stateUnsubs = this.stateUnsubs ??= new ComponentSubscriptionTracker();
	if (isPlainObject(keys)) {
		// Map form: the 2nd arg, when a plain object, is the shared options bag.
		const mapOptions = isPlainObject(handler) ? handler : options;
		const objKeys = Object.keys(keys);
		const subscriptions = [];
		const objKeysLength = objKeys.length;
		for (let keyIndex = 0; keyIndex < objKeysLength; keyIndex += 1) {
			const key = objKeys[keyIndex];
			const objectSub = observeStateKey(this, key, keys[key], mapOptions);
			stateUnsubs.add(objectSub);
			subscriptions.push(objectSub);
		}
		return new TrackedBundle(stateUnsubs, subscriptions);
	}
	if (isArray(keys)) {
		const subscriptions = [];
		const keysLength = keys.length;
		for (let keyIndex = 0; keyIndex < keysLength; keyIndex += 1) {
			const arraySub = observeStateKey(this, keys[keyIndex], handler, options);
			stateUnsubs.add(arraySub);
			subscriptions.push(arraySub);
		}
		return new TrackedBundle(stateUnsubs, subscriptions);
	}
	const subscription = observeStateKey(this, keys, handler, options);
	stateUnsubs.add(subscription);
	return subscription;
}
/**
 * Tear down every observer this component has on `key`. Looks up the tracker
 * by path in O(1) and unsubscribes each matching `Subscription` — callers
 * don't need to retain the original handler reference. No-op if nothing on
 * this component observes the given key.
 */
export function unobserve(key) {
	this.stateUnsubs?.removeByKey(String(key ?? ''));
}
/**
 * Kick this component's view for one flush. Returns undefined when everything
 * completed synchronously — an eligible patch pass (renderView's fast path) with
 * no async onStateChange never yields, so allocating a promise to represent
 * finished work was pure waste on the dominant re-render path. Callers already
 * gate on `isPromiseLike` (the bus onFlush below, context.js, privateState.js,
 * scheduler.js), and `await undefined` is harmless at the two await sites, so
 * the undefined-or-Promise contract costs them nothing.
 * @returns {Promise<void>|undefined} A Promise when async work is pending, else undefined.
 */
export function updateView() {
	const perfMark = Perf.mark('updateView');
	/*
	 * Start both side-effects synchronously (preserving call order), then await
	 * only what is actually pending. The first-render hot path is a single
	 * task (renderView, no onStateChange) — awaiting it directly skips the
	 * per-child `Promise.all([…])` array + wrapper microtask the batch form
	 * otherwise pays N times during a list create. `onStateChange` runs through
	 * runHook so a throwing hook routes to the 'lifecycleError' event instead of
	 * killing this flush's render; renderView never REJECTS. Its sync fast path may
	 * THROW raw when an app render() body throws — the failure contract: that
	 * is an app bug and unwinds to its origin, no framework laundering.
	 */
	const stateChangeOutcome = runHook(this, 'onStateChange');
	const stateChangePending = isPromiseLike(stateChangeOutcome) ? stateChangeOutcome : null;
	/*
	 * The FIRST render must not outrun the connect pipeline. `isConnected` is
	 * the native DOM flag — true the instant the parent inserts the element,
	 * long before handleConnect's awaited steps (style/theme-sheet fetches)
	 * finish. An external state write landing in that window used to render
	 * here, firing render/onMount BEFORE onConnect — inverting the documented
	 * order and stranding the phase ladder (every promotion in renderView
	 * guards on the previous phase, so the component stayed un-MOUNTED
	 * forever). Gate on the pipeline phase instead: pre-CONNECTED writes just
	 * mutate STATE, and handleConnect's tail updateView (which runs after
	 * `phase = CONNECTED`) renders them — nothing is lost, order is restored.
	 */
	const renderPending = (this.isConnected && !this.templateBuilt && this.atPhase(PHASE.CONNECTED)) ? this.renderView() : null;
	/*
	 * renderView returns undefined when it took the synchronous patch-pass fast
	 * path — the render is already DONE, not pending. With no async onStateChange
	 * either, the whole flush finished inline and there is nothing to await.
	 */
	if (!stateChangePending && !renderPending) {
		Perf.measure('updateView', perfMark);
		return undefined;
	}
	return settleUpdateView(stateChangePending, renderPending, perfMark);
}
async function settleUpdateView(stateChangePending, renderPending, perfMark) {
	if (stateChangePending && renderPending) {
		await Promise.all([stateChangePending, renderPending]);
	} else if (renderPending) {
		await renderPending;
	} else {
		await stateChangePending;
	}
	Perf.measure('updateView', perfMark);
}
/**
 * Custom Elements lazy-property rescue. When a parent template assigns a prop
 * on a child element (`.state=${...}`, or any `.foo=` whose class declares
 * `set foo(v)`) BEFORE that child's class is imported and upgraded, JS silently
 * creates an own data property that shadows the prototype accessor. This walks
 * the prototype chain to find that shadowed setter descriptor so the stashed
 * value can be migrated back through the proper channel.
 * @param {object} instance - The element instance to inspect.
 * @param {string} key - The shadowed property name.
 * @returns {PropertyDescriptor|null} The setter descriptor, or null if none found.
 */
// @engram em:network/code/tk-33-shipped-profile-ranked-startup-fast-paths-s3-rescue-ma — this walk was ~30% of a 300-row list create before the per-class cache
/*
 * Per-class rescue map: prototype → Map<key, setterDescriptor|null>. The
 * prototype chain is static after module load (all accessors land at class
 * definition), so the answer to "does own key K shadow a chain setter?" is a
 * per-class constant — walking the chain with getOwnPropertyDescriptor per own
 * key per CONSTRUCT was the single largest JS cost of a 300-row list create.
 * Nearest-proto-level-wins is preserved by first-seen-wins during the single
 * walk; a nearest data property (a method) maps to null exactly like the old
 * walk returning null. An accessor added to a prototype AFTER the first
 * construct would be missed — none exist, and the fold is module-load-time.
 */
const ACCESSOR_RESCUE_MAPS = new WeakMap();
function ensureAccessorRescueMap(instance) {
	const prototype = Object.getPrototypeOf(instance);
	let rescueMap = ACCESSOR_RESCUE_MAPS.get(prototype);
	if (rescueMap !== undefined) {
		return rescueMap;
	}
	rescueMap = new Map();
	let currentPrototype = prototype;
	while (currentPrototype && currentPrototype !== HTMLElement.prototype) {
		const names = Object.getOwnPropertyNames(currentPrototype);
		const namesLength = names.length;
		for (let nameIndex = 0; nameIndex < namesLength; nameIndex += 1) {
			const key = names[nameIndex];
			if (rescueMap.has(key)) {
				continue;
			}
			const descriptor = Object.getOwnPropertyDescriptor(currentPrototype, key);
			rescueMap.set(key, descriptor.set ? descriptor : null);
		}
		currentPrototype = Object.getPrototypeOf(currentPrototype);
	}
	ACCESSOR_RESCUE_MAPS.set(prototype, rescueMap);
	return rescueMap;
}
export function upgradeShadowedProperties() {
	const rescueMap = ensureAccessorRescueMap(this);
	const ownKeys = Object.getOwnPropertyNames(this);
	const ownKeysLength = ownKeys.length;
	for (let keyIndex = 0; keyIndex < ownKeysLength; keyIndex += 1) {
		const key = ownKeys[keyIndex];
		/*
		 * Deep-state pre-init rescue. A parent's `.state.x=` that committed while
		 * this element was still an undefined custom element (no live `.state`)
		 * landed as a dotted own property `element['state.x']` via the commit
		 * fallthrough. The dotted key has no prototype setter, so the accessor
		 * rescue below would skip it — route it into reactive state now that the
		 * proxy is live. Mirrors the auto-router's own-prop rescue so a lazily
		 * upgraded child never drops a parent's first-render deep write.
		 */
		if (key.charCodeAt(0) === 115 && key.startsWith('state.')) {
			setValueAtPath(this.state, key.slice(6), this[key]);
			continue;
		}
		const descriptor = rescueMap.get(key);
		if (!descriptor) {
			continue;
		}
		const shadowValue = this[key];
		Object.defineProperty(this, key, descriptor);
		if (key === 'state' && isPlainObject(shadowValue)) {
			this.assignState(shadowValue);
			continue;
		}
		this[key] = shadowValue;
	}
}
