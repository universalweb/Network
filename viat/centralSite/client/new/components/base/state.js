import { isObject, isPromiseLike, isSymbol } from '../utilities.js';
function deepEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (Number.isNaN(a) && Number.isNaN(b)) {
		return true;
	}
	if (isObject(a) && isObject(b)) {
		if (Array.isArray(a) !== Array.isArray(b)) {
			return false;
		}
		const keys = Object.keys(a);
		if (keys.length !== Object.keys(b).length) {
			return false;
		}
		return keys.every((k) => {
			return deepEqual(a[k], b[k]);
		});
	}
	return false;
}
function flushPending() {
	if (!this.pendingFlush) {
		this.pendingFlush = new Promise((resolve) => {
			queueMicrotask(() => {
				this.pendingFlush = null;
				resolve(this.updateView());
			});
		});
	}
	return this.pendingFlush;
}
function makeStateProxy(obj, component, path = '') {
	return new Proxy(obj, {
		get(target, key) {
			if (isSymbol(key)) {
				return Reflect.get(target, key);
			}
			const propertyValue = Reflect.get(target, key);
			const nestedPath = path ? `${path}.${String(key)}` : String(key);
			if (isObject(propertyValue) || Array.isArray(propertyValue)) {
				return makeStateProxy(propertyValue, component, nestedPath);
			}
			return propertyValue;
		},
		set(target, key, value) {
			if (deepEqual(target[key], value)) {
				return true;
			}
			const fullPath = path ? `${path}.${String(key)}` : String(key);
			Reflect.set(target, key, value);
			const detail = {
				path: fullPath,
				value,
			};
			const init = {
				bubbles: true,
				cancelable: true,
				composed: true,
				detail,
			};
			component.dispatchEvent(new CustomEvent('state-change', init));
			// For now disable granular events to avoid overhead, we can re-enable if needed
			// component.dispatchEvent(new CustomEvent(`state:${fullPath}`, init));
			console.log(`State changed: ${fullPath}`, value);
			flushPending.call(component);
			return true;
		},
	});
}
export function initState() {
	this.stateProxy = makeStateProxy(this.STATE, this);
}
export function replaceState(state = {}) {
	if (deepEqual(this.STATE, state)) {
		return Promise.resolve();
	}
	this.STATE = {};
	if (isObject(state)) {
		Object.assign(this.STATE, state);
	}
	this.stateProxy = makeStateProxy(this.STATE, this);
	return this.updateView();
}
export function watchState(key, handler) {
	if (!this.stateWatchers) {
		this.stateWatchers = new Map();
	}
	if (!this.stateWatchers.has(key)) {
		this.stateWatchers.set(key, new Set());
	}
	this.stateWatchers.get(key).add(handler);
	return () => {
		this.stateWatchers?.get(key)?.delete(handler);
	};
}
export function onStateChange() {}
export function updateView() {
	const previousState = this.prevState;
	this.prevState = {
		...this.STATE,
	};
	const pendingWatchers = [];
	if (previousState && this.stateWatchers?.size) {
		for (const [
			key,
			handlers,
		] of this.stateWatchers) {
			if (previousState[key] !== this.STATE[key]) {
				for (const handler of handlers) {
					const result = handler(this.STATE[key], previousState[key]);
					if (isPromiseLike(result)) {
						pendingWatchers.push(result);
					}
				}
			}
		}
	}
	this.onStateChange();
	if (this.isConnected && !this.templateBuilt) {
		this.refresh();
	}
	return pendingWatchers.length ? Promise.all(pendingWatchers) : Promise.resolve();
}
