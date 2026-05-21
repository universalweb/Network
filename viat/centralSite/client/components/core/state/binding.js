import {
	cachedProxy,
	isFunction,
	isMap,
	isObject,
	isSet,
	isSymbol,
	joinPath,
	setValueAtPath,
} from '../utilities.js';
import { STATE_PATH } from './state.js';
// ── Content kinds ────────────────────────────────────────────────────
// Classification of any value that lands in a TEXT-position ${…} spot.
// One value → exactly one kind. The template engine's classifyContentKind()
// is the single decision point and CONTENT_PATCHERS maps each kind to its
// patch routine. A typed bind (this.bind.text / .html / …) or a matching
// `static types` entry DECLARES the kind up front, skipping classification.
//
//   TEXT       plain string / number          → textContent (fast path)
//   HTML       string containing markup (< &) → innerHTML
//   COMPONENT  a comp() binding or a DOM Node  → adopt the node
//   LIST       a LiveList (each() / list())    → keyed element diff
//   EMPTY      null | undefined | ''           → cleared
// ─────────────────────────────────────────────────────────────────────
export const CONTENT_KIND = {
	TEXT: 'text',
	HTML: 'html',
	COMPONENT: 'component',
	LIST: 'list',
	EMPTY: 'empty',
};
export let currentTracking = null;
export function setCurrentTracking(value) {
	currentTracking = value;
}
export class Binding {
	constructor(key, value, kind = null) {
		this.key = key;
		this.value = value;
		// Declared CONTENT_KIND from a typed bind — null means auto-classify
		// (or resolve from the component's `static types`).
		this.kind = kind;
	}
	toString() {
		return String(this.value ?? '');
	}
	valueOf() {
		return this.value;
	}
}
function makeDependencyKey(prefix, path) {
	if (!prefix) {
		return path;
	}
	return path ? `${prefix}.${path}` : prefix;
}
function makeSetter(source) {
	if (!source) {
		return null;
	}
	return (path, value) => {
		setValueAtPath(source, path, value);
	};
}
// One TrackingFactory per (setValue, prefix) pair holds the per-factory cache;
// each TrackingProxyHandler is a thin per-proxy instance that points back at
// the factory. Trap methods live on the prototype for JIT monomorphization.
class TrackingFactory {
	constructor(setValue, prefix, typeIndex) {
		this.setValue = setValue;
		this.prefix = prefix;
		this.cache = new WeakMap();
		// `static types` index — lets the render proxy skip dep-tracking for
		// paths declared `react: false`. Null for the global proxy.
		this.typeIndex = typeIndex ?? null;
	}
	create(value, path = '') {
		if (!isObject(value)) {
			return value;
		}
		return cachedProxy(this.cache, value, path, () => {
			const collection = isSet(value) || isMap(value);
			return new Proxy(value, new TrackingProxyHandler(this, path, collection));
		});
	}
}
class TrackingProxyHandler {
	constructor(factory, path, isCollection) {
		this.factory = factory;
		this.path = path;
		this.isCollection = isCollection;
	}
	get(target, key) {
		const factory = this.factory;
		if (key === STATE_PATH) {
			return makeDependencyKey(factory.prefix, this.path);
		}
		const propertyValue = Reflect.get(target, key);
		if (this.isCollection && isFunction(propertyValue) && key !== 'constructor') {
			return propertyValue.bind(target);
		}
		if (isSymbol(key)) {
			return propertyValue;
		}
		const nestedPath = joinPath(this.path, key);
		if (!isFunction(propertyValue) && currentTracking) {
			const typeIndex = factory.typeIndex;
			if (!typeIndex || !typeIndex.hasNonReactive || !typeIndex.nonReactivePaths.has(nestedPath)) {
				currentTracking.add(makeDependencyKey(factory.prefix, nestedPath));
			}
		}
		if (isObject(propertyValue) && !this.isCollection) {
			return factory.create(propertyValue, nestedPath);
		}
		return propertyValue;
	}
	set(target, key, nextValue) {
		const nestedPath = joinPath(this.path, key);
		const setValue = this.factory.setValue;
		if (setValue) {
			setValue(nestedPath, nextValue);
			return true;
		}
		return Reflect.set(target, key, nextValue);
	}
}
export function makeProxy(state, component) {
	const setValue = makeSetter(component?.stateProxy ?? state);
	return new TrackingFactory(setValue, '', component?.typeIndex ?? null).create(state ?? {}, '');
}
export function makeGlobalProxy(globalState) {
	const setValue = makeSetter(globalState);
	return new TrackingFactory(setValue, 'global', null).create(globalState ?? {}, '');
}
// One-way reactive reference to a state path — a surgical binding spot that
// patches in place without re-running render(). `bind('a.b')` auto-classifies
// its content kind (or reads it from the component's `static types`); the
// typed variants DECLARE the kind so the engine skips classification:
//   this.bind.text(key)       — declared TEXT  (strict textContent)
//   this.bind.html(key)       — declared HTML  (innerHTML)
//   this.bind.component(key)  — declared COMPONENT
//   this.bind.list(key, Comp) — declared LIST  (wired in template.js)
// Each variant also accepts a function → a computed spot carrying the kind.
// Exposed on every component as `this.bind` — no import needed.
export function bind(stateKey, currentValue) {
	return new Binding(String(stateKey ?? ''), currentValue, null);
}
function makeTypedBinding(stateKeyOrFn, currentValue, kind) {
	if (isFunction(stateKeyOrFn)) {
		stateKeyOrFn.contentKind = kind;
		return stateKeyOrFn;
	}
	return new Binding(String(stateKeyOrFn ?? ''), currentValue, kind);
}
function bindText(stateKeyOrFn, currentValue) {
	return makeTypedBinding(stateKeyOrFn, currentValue, CONTENT_KIND.TEXT);
}
function bindHtml(stateKeyOrFn, currentValue) {
	return makeTypedBinding(stateKeyOrFn, currentValue, CONTENT_KIND.HTML);
}
function bindComponent(stateKeyOrFn, currentValue) {
	return makeTypedBinding(stateKeyOrFn, currentValue, CONTENT_KIND.COMPONENT);
}
bind.text = bindText;
bind.html = bindHtml;
bind.component = bindComponent;
export function track(fn) {
	const deps = new Set();
	const previousTracking = currentTracking;
	currentTracking = deps;
	const value = fn();
	currentTracking = previousTracking;
	return {
		value,
		deps,
	};
}
