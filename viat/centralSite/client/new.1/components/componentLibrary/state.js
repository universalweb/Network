import { isObject, isPromiseLike } from '../utilities.js';
export function setState(state = {}) {
	this.STATE = isObject(state) ? {
		...state,
	} : {};
	return this.applyState();
}
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
function updateStatePath(path, patch) {
	if (!this.STATE) {
		this.STATE = {};
	}
	const parts = path.split('.');
	const rootKey = parts[0];
	const idx = parts[1];
	if (idx) {
		let root = this.STATE[rootKey];
		if (Array.isArray(root)) {
			root = [...root];
			const n = Number(idx);
			root[n] = isObject(root[n]) && isObject(patch) ? Object.assign({}, root[n], patch) : patch;
		} else if (isObject(root)) {
			root = Object.assign({}, root, {
				[idx]: isObject(root[idx]) && isObject(patch) ? Object.assign({}, root[idx], patch) : patch,
			});
		}
		this.STATE[rootKey] = root;
	} else {
		const cur = this.STATE[rootKey];
		this.STATE[rootKey] = isObject(cur) && isObject(patch) ? Object.assign({}, cur, patch) : patch;
	}
	this.dispatchEvent(new CustomEvent('state-change', {
		bubbles: true,
		cancelable: true,
		composed: true,
		detail: {
			path,
			patch,
		},
	}));
	return flushPending.call(this);
}
export function updateState(keyOrState = {}, patch) {
	if (typeof keyOrState === 'string') {
		return updateStatePath.call(this, keyOrState, patch);
	}
	if (!this.STATE) {
		this.STATE = {};
	}
	if (isObject(keyOrState) && keyOrState !== this.STATE) {
		const entries = Object.entries(keyOrState).filter(([, v]) => {
			return v !== undefined;
		});
		if (entries.length) {
			Object.assign(this.STATE, Object.fromEntries(entries));
		}
	}
	return flushPending.call(this);
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
	if (!this.STATE) {
		return Promise.resolve();
	}
	const prev = this.prevState;
	this.prevState = {
		...this.STATE,
	};
	const promises = [];
	if (prev && this.stateWatchers.size) {
		for (const [
			key,
			cbs,
		] of this.stateWatchers) {
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
