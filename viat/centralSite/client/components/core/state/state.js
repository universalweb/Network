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
import { makePathBus } from './pathBus.js';
export const STATE_PATH = Symbol('statePath');
function ensureBus(component) {
	if (component.stateBus) {
		return component.stateBus;
	}
	const bus = makePathBus({
		getValue: (path) => {
			return getValueAtPath(component.STATE, path);
		},
		onFlush: () => {
			const result = component.updateView();
			if (isPromiseLike(result)) {
				result.catch(queueAsyncError);
			}
		},
	});
	component.stateBus = bus;
	return bus;
}
function notifyStateChange(component, changedPath) {
	ensureBus(component).notify(changedPath);
}
function buildCollectionMethods(target, component, path, asMap) {
	function notify(key) {
		notifyStateChange(component, joinPath(path, key));
	}
	function mutateAdd(item) {
		if (target.has(item)) {
			return target;
		}
		target.add(item);
		notify(item);
		return target;
	}
	function mutateSet(mapKey, mapValue) {
		if (target.has(mapKey) && target.get(mapKey) === mapValue) {
			return target;
		}
		target.set(mapKey, mapValue);
		notify(mapKey);
		return target;
	}
	function mutateDelete(key) {
		if (!target.has(key)) {
			return false;
		}
		target.delete(key);
		notify(key);
		return true;
	}
	function mutateClear() {
		if (!target.size) {
			return;
		}
		const keys = asMap ? [...target.keys()] : [...target];
		target.clear();
		for (let i = 0; i < keys.length; i++) {
			notify(keys[i]);
		}
	}
	const shared = {
		delete: mutateDelete,
		clear: mutateClear,
		has: target.has.bind(target),
		forEach: target.forEach.bind(target),
		keys: target.keys.bind(target),
		values: target.values.bind(target),
		entries: target.entries.bind(target),
		[Symbol.iterator]: target[Symbol.iterator].bind(target),
	};
	if (asMap) {
		shared.set = mutateSet;
		shared.get = target.get.bind(target);
		return shared;
	}
	shared.add = mutateAdd;
	return shared;
}
function throwCollectionMutate() {
	throw new Error('Do not mutate Map/Set proxy properties directly. Use .set() or .add() instead.');
}
function throwCollectionDelete() {
	throw new Error('Do not delete Map/Set proxy properties directly. Use .delete() instead.');
}
// Prototype-shared trap methods; per-proxy state is just (path, methods).
// Mutating + bound passthrough methods are still built per-collection (their
// closures over target/component/path are unavoidable), but the proxy traps
// themselves are no longer fresh closures per Map/Set.
class CollectionProxyHandler {
	constructor(path, methods) {
		this.path = path;
		this.methods = methods;
	}
	static create(target, component, path, asMap) {
		return cachedProxy(component.proxyCache, target, path, () => {
			const methods = buildCollectionMethods(target, component, path, asMap);
			return new Proxy(target, new CollectionProxyHandler(path, methods));
		});
	}
	get(target, key) {
		if (key === STATE_PATH) {
			return this.path;
		}
		const method = this.methods[key];
		if (method !== undefined) {
			return method;
		}
		const value = Reflect.get(target, key);
		if (typeof value !== 'function' || key === 'constructor') {
			return value;
		}
		return value.bind(target);
	}
	set() {
		throwCollectionMutate();
	}
	deleteProperty() {
		throwCollectionDelete();
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
		return cachedProxy(component.proxyCache, obj, path, () => {
			return new Proxy(obj, new StateProxyHandler(component, path));
		});
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
		notifyStateChange(this.component, fullPath);
		return true;
	}
	deleteProperty(target, key) {
		if (!hasOwn(target, key)) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		Reflect.deleteProperty(target, key);
		notifyStateChange(this.component, fullPath);
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
		if (!silent) {
			notifyStateChange(this, key);
		}
	}
	return touched;
}
export function watchState(key, handler) {
	const statePath = String(key ?? '');
	const bus = ensureBus(this);
	let previousValue = getValueAtPath(this.STATE, statePath);
	return bus.subscribe(statePath, (nextValue, changedPath) => {
		const result = handler(nextValue, previousValue, changedPath);
		previousValue = nextValue;
		return result;
	});
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
// creates an own data property — there is no prototype accessor yet to
// intercept the write. After upgrade, that data property permanently
// shadows the prototype getter/setter pair: every read returns the pre-
// upgrade literal, every write mutates that literal, and the reactive
// proxy is bypassed forever. Symptom: `el.state.foo = bar` looks like it
// works but nothing re-renders. Detect the situation once at construction
// time and re-route each shadowed value through the proper channel. For
// `state` specifically, merge into the already-populated STATE so static
// defaults survive (matches the constructor-arg state semantics). For any
// other accessor-backed prop, run plain assignment so the subclass setter
// fires naturally.
function hasPrototypeSetter(instance, key) {
	let proto = Object.getPrototypeOf(instance);
	while (proto && proto !== HTMLElement.prototype) {
		const descriptor = Object.getOwnPropertyDescriptor(proto, key);
		if (descriptor) {
			return Boolean(descriptor.set);
		}
		proto = Object.getPrototypeOf(proto);
	}
	return false;
}
export function upgradeShadowedProperties() {
	const ownKeys = Object.getOwnPropertyNames(this);
	for (let i = 0; i < ownKeys.length; i += 1) {
		const key = ownKeys[i];
		if (!hasPrototypeSetter(this, key)) {
			continue;
		}
		const shadowValue = this[key];
		Reflect.deleteProperty(this, key);
		if (key === 'state' && isPlainObject(shadowValue)) {
			this.assignState(shadowValue);
			continue;
		}
		this[key] = shadowValue;
	}
}
