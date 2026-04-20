import { isObject, isPromiseLike } from '../utilities.js';
function flushPending() {
	if (!this.pendingFlush) {
		this.pendingFlush = new Promise((resolve) => {
			queueMicrotask(() => {
				this.pendingFlush = null;
				resolve(this.applyState());
			});
		});
	}
	return this.pendingFlush;
}
function makeStateProxy(obj, component, path = '') {
	return new Proxy(obj, {
		get(target, key) {
			if (typeof key === 'symbol') {
				return Reflect.get(target, key);
			}
			const val = Reflect.get(target, key);
			const p = path ? `${path}.${String(key)}` : String(key);
			if (isObject(val) || Array.isArray(val)) {
				return makeStateProxy(val, component, p);
			}
			return val;
		},
		set(target, key, value) {
			Reflect.set(target, key, value);
			component.dispatchEvent(new CustomEvent('state-change', {
				bubbles: true,
				cancelable: true,
				composed: true,
				detail: {
					path: path ? `${path}.${String(key)}` : String(key),
					value,
				},
			}));
			flushPending.call(component);
			return true;
		},
	});
}
export function initState() {
	this.stateProxy = makeStateProxy(this.STATE, this);
}
export function setState(state = {}) {
	for (const key of Object.keys(this.STATE)) {
		delete this.STATE[key];
	}
	if (isObject(state)) {
		Object.assign(this.STATE, state);
	}
	return this.applyState();
}
export function watchState(key, cb) {
	if (!this.stateWatchers.has(key)) {
		this.stateWatchers.set(key, new Set());
	}
	this.stateWatchers.get(key).add(cb);
	return () => {
		this.stateWatchers.get(key).delete(cb);
	};
}
export function onStateChange() {}
export function applyState() {
	const prev = this.prevState;
	this.prevState = {
		...this.STATE,
	};
	const promises = [];
	if (prev && this.stateWatchers.size) {
		for (const [key, cbs] of this.stateWatchers) {
			if (prev[key] !== this.STATE[key]) {
				for (const cb of cbs) {
					const p = cb(this.STATE[key], prev[key], this.STATE);
					if (isPromiseLike(p)) {
						promises.push(p);
					}
				}
			}
		}
	}
	this.onStateChange();
	if (this.isConnected && !this.templateBuilt) {
		this.refresh();
	}
	return promises.length ? Promise.all(promises) : Promise.resolve();
}
