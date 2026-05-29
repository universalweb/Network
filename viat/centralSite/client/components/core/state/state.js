import {
	PathSubscriptions,
	TrackedBundle,
} from './pathSubscriptions.js';
import {
	cachedProxy,
	getValueAtPath,
	hasOwn,
	isArray,
	isMap,
	isPlainObject,
	isPromiseLike,
	isSet,
	isSymbol,
	joinPath,
	plainEqual,
	queueAsyncError,
} from '../utilities.js';
import { Logger } from '../debug/logger.js';
export const STATE_PATH = Symbol('statePath');
/**
 * Concrete bus for a single component's reactive state. Owns a reference to
 * the component so `getValue` and `onFlush` are prototype methods — zero
 * per-component arrow allocations, monomorphic shape across every bus.
 * The render pipeline integration lives on `onFlush`: each flush kicks the
 * component's `updateView` and forwards any async rejection to the global
 * error queue (matching the pre-refactor config-arrow behavior).
 */
// TODO: Consider manual class / prototype upgrading of existing objects to avoid creating new ones
class ComponentStateBus extends PathSubscriptions {
	constructor(component) {
		super();
		this.component = component;
	}
	getValue(path) {
		return getValueAtPath(this.component.STATE, path);
	}
	onFlush() {
		const result = this.component.updateView();
		if (isPromiseLike(result)) {
			result.catch(queueAsyncError);
		}
	}
}
/**
 * Lazy-init for a component's reactive bus. Single chokepoint so engine
 * callers (render.js subscribeRenderDeps, template.js subscribeStatePath)
 * don't each open-code the `??= new ComponentStateBus(...)` pattern.
 */
export function ensureStateBus(component) {
	if (!component.stateBus) {
		component.stateBus = new ComponentStateBus(component);
	}
	return component.stateBus;
}
function notifyStateChange(component, changedPath) {
	ensureStateBus(component).notify(changedPath);
}
// `static types` may declare a path `react: false` — a non-reactive path is
// written straight through to STATE but fires no notification, so it never
// schedules a render or a spot patch. Default (no entry) is reactive.
function pathIsReactive(component, fullPath) {
	const typeIndex = component.typeIndex;
	if (!typeIndex || !typeIndex.hasNonReactive) {
		return true;
	}
	return !typeIndex.nonReactivePaths.has(fullPath);
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
		for (let i = 0; i < keys.length; i++) {
			this.notifyKey(keys[i]);
		}
	}
	has(key) {
		return this.target.has(key);
	}
	get(key) {
		return this.target.get(key);
	}
	forEach(cb) {
		return this.target.forEach(cb);
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
			return facade.path;
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
// Single trap shape shared by every state proxy. Methods live on the prototype
// so JIT can monomorphize get/set/deleteProperty across all instances; each
// proxy only pays for a 2-field handler instance, not 3 fresh closures.
// Recursion goes through StateProxyHandler.create (a static factory) instead
// of a free function so the class avoids forward references.
class StateProxyHandler {
	constructor(component, path) {
		this.component = component;
		this.path = path;
	}
	static create(obj, component, path = '') {
		return cachedProxy(component.proxyCache, obj, path, StateProxyHandler, component);
	}
	static build(target, path, component) {
		return new Proxy(target, new StateProxyHandler(component, path));
	}
	get(target, key) {
		if (isSymbol(key)) {
			return Reflect.get(target, key);
		}
		const propertyValue = Reflect.get(target, key);
		const nestedPath = joinPath(this.path, key);
		if (isPlainObject(propertyValue) || isArray(propertyValue)) {
			return StateProxyHandler.create(propertyValue, this.component, nestedPath);
		}
		if (isSet(propertyValue)) {
			return makeCollectionProxy(propertyValue, this.component, nestedPath, false);
		}
		if (isMap(propertyValue)) {
			return makeCollectionProxy(propertyValue, this.component, nestedPath, true);
		}
		return propertyValue;
	}
	set(target, key, value) {
		if (target[key] === value) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		Logger.perf('state', reportWastedStateSet, target, key, value, fullPath, this.component);
		Reflect.set(target, key, value);
		if (pathIsReactive(this.component, fullPath)) {
			notifyStateChange(this.component, fullPath);
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
	// The bus is intentionally preserved across a state replacement. Its
	// `getValue(path)` closure resolves against `component.STATE` by
	// reference, so every existing subscription automatically reads the new
	// STATE on the next flush — including the computed-spot subscriptions
	// behind function-expression bindings (e.g. `.state=${this.indicatorState}`)
	// and the renderDep watches behind raw `${this.state.foo}` reads.
	// Tearing the bus down — or wiping `tplState` to force a full template
	// rebuild — orphans every one of those subscriptions and silently
	// recreates every child custom element on each parent update (badge
	// constructors fire over and over) and yanks focus out of any focused
	// input. Re-firing each currently-subscribed path is enough: the bus
	// coalesces them into a single microtask flush and each spot patches
	// its DOM in place against the fresh STATE. There is no native
	// "notify-all" path (`pathsOverlap('', x)` matches only the literal
	// empty string), hence the explicit walk over `subs`.
	// TODO: Consider a diff check instead of blind notify-all, but that has to be balanced against the cost of the diff itself and the fact that many updates are full replacements where every path changes.
	if (this.stateBus) {
		this.stateBus.subs.forEach((_handlers, subscribedPath) => {
			this.stateBus.notify(subscribedPath);
		});
	}
	return this.updateView();
}
// Shallow-merge a partial patch into top-level state. Bypasses the per-key
// proxy `set` trap so N writes cost N strict-equality compares instead of N
// trap invocations. Notifies only the paths that actually changed; the path
// bus coalesces the batch into a single flush + updateView. Nested writes
// inside `partial.foo.bar` are NOT tracked — pass a top-level patch object.
// Pass `{ silent: true }` to suppress notification entirely (hydration paths
// where you intend to trigger render yourself).
// Returns true if any key changed, false otherwise.
export function assignState(partial, options) {
	if (!isPlainObject(partial)) {
		return false;
	}
	const silent = options?.silent === true;
	const keys = Object.keys(partial);
	let touched = false;
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
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
 * Subscribe one path to a handler that fires synchronously inside the state
 * write-trap. Internal helper for `observe` — returns the bare `Subscription`
 * instance so callers can wire it into their own tracker.
 */
function observeStateKey(component, key, handler) {
	const statePath = String(key ?? '');
	const bus = ensureStateBus(component);
	let previousValue = getValueAtPath(component.STATE, statePath);
	return bus.subscribe(statePath, (nextValue, changedPath) => {
		const result = handler.call(component, nextValue, previousValue, changedPath);
		previousValue = nextValue;
		return result;
	});
}
/**
 * Subscribe to component-state changes. Three call shapes:
 *
 *   this.observe('user.name', cb)            // single key
 *   this.observe(['a', 'b', 'c'], cb)        // array of keys, one cb
 *   this.observe({ 'a': cb1, 'b': cb2 })     // object form, per-key cb
 *
 * Every resulting `Subscription` is registered in `this.stateUnsubs` so
 * `this.unobserve(key)` can find and tear it down by path, and so the
 * disconnect lifecycle cleans every dangling subscription automatically.
 * Single-key form returns the `Subscription` directly; multi-key / object
 * forms return a `TrackedBundle` whose `.unsubscribe()` clears the lot.
 */
export function observe(keys, handler) {
	const stateUnsubs = this.stateUnsubs;
	if (isPlainObject(keys) && handler === undefined) {
		const objKeys = Object.keys(keys);
		const subscriptions = [];
		for (let i = 0; i < objKeys.length; i += 1) {
			const key = objKeys[i];
			const objectSub = observeStateKey(this, key, keys[key]);
			stateUnsubs.add(objectSub);
			subscriptions.push(objectSub);
		}
		return new TrackedBundle(stateUnsubs, subscriptions);
	}
	if (isArray(keys)) {
		const subscriptions = [];
		for (let i = 0; i < keys.length; i += 1) {
			const arraySub = observeStateKey(this, keys[i], handler);
			stateUnsubs.add(arraySub);
			subscriptions.push(arraySub);
		}
		return new TrackedBundle(stateUnsubs, subscriptions);
	}
	const sub = observeStateKey(this, keys, handler);
	stateUnsubs.add(sub);
	return sub;
}
/**
 * Tear down every observer this component has on `key`. Looks up the tracker
 * by path in O(1) and unsubscribes each matching `Subscription` — callers
 * don't need to retain the original handler reference. No-op if nothing on
 * this component observes the given key.
 */
export function unobserve(key) {
	this.stateUnsubs.removeByKey(String(key ?? ''));
}
export async function updateView() {
	const pendingTasks = [];
	const stateChangeResult = this.onStateChange?.();
	if (isPromiseLike(stateChangeResult)) {
		pendingTasks.push(stateChangeResult);
	}
	if (this.isConnected && !this.templateBuilt) {
		pendingTasks.push(this.renderView());
	}
	if (!pendingTasks.length) {
		return Promise.resolve();
	}
	await Promise.all(pendingTasks);
}
// Custom Elements lazy-property rescue. When a parent template assigns a
// prop on a child element (e.g. `.state=${...}`, or any future `.foo=` whose
// class declares `set foo(v)`) BEFORE that child's class has been imported
// and customElements.define() upgrades the element, JavaScript silently
// creates an own data property
function findPrototypeSetterDescriptor(instance, key) {
	let proto = Object.getPrototypeOf(instance);
	while (proto && proto !== HTMLElement.prototype) {
		const descriptor = Object.getOwnPropertyDescriptor(proto, key);
		if (descriptor) {
			return descriptor.set ? descriptor : null;
		}
		proto = Object.getPrototypeOf(proto);
	}
	return null;
}
export function upgradeShadowedProperties() {
	const ownKeys = Object.getOwnPropertyNames(this);
	for (let i = 0; i < ownKeys.length; i += 1) {
		const key = ownKeys[i];
		const descriptor = findPrototypeSetterDescriptor(this, key);
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
