import { isSymbol } from '../utilities.js';
export let currentTracking = null;
export class Binding {
	static isBinding(value) {
		return value instanceof Binding;
	}
	constructor(key, value) {
		this.key = key;
		this.value = value;
	}
	toString() {
		return String(this.value ?? '');
	}
	valueOf() {
		return this.value;
	}
}
// Used during template expression evaluation — returns Binding objects so the
// html tag can identify which state key each expression slot belongs to.
export function makeRenderProxy(state) {
	return new Proxy(state ?? {}, {
		get(target, key) {
			if (isSymbol(key)) {
				return target[key];
			}
			return new Binding(String(key), target[key]);
		},
	});
}
// Used when evaluating arrow-function expressions — returns actual values so
// conditional logic works correctly, while recording accessed keys.
export function makeTrackingProxy(state) {
	return new Proxy(state ?? {}, {
		get(target, key) {
			if (isSymbol(key)) {
				return target[key];
			}
			if (currentTracking) {
				currentTracking.add(String(key));
			}
			return target[key];
		},
	});
}
export function track(fn) {
	const deps = new Set();
	currentTracking = deps;
	const value = fn();
	currentTracking = null;
	return {
		value,
		deps,
	};
}
