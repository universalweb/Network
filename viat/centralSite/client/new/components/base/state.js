import { isObject, isPromiseLike, isSymbol } from './utilities.js';
function queueAsyncError(error) {
	queueMicrotask(() => {
		throw error;
	});
}
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
function pathsOverlap(currentPath, changedPath) {
	return currentPath === changedPath || currentPath.startsWith(`${changedPath}.`) || changedPath.startsWith(`${currentPath}.`);
}
function getValueAtPath(source, path) {
	if (!path) {
		return source;
	}
	return path.split('.').reduce((value, key) => {
		return value?.[key];
	}, source);
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
	const statePath = String(key ?? '');
	let previousValue = getValueAtPath(this.STATE, statePath);
	const component = this;
	function handleStateChange(stateEvent) {
		const changedPath = stateEvent.detail?.path;
		if (!changedPath || !pathsOverlap(statePath, changedPath)) {
			return;
		}
		const nextValue = getValueAtPath(component.STATE, statePath);
		const result = handler(nextValue, previousValue, changedPath);
		previousValue = nextValue;
		if (isPromiseLike(result)) {
			result.catch(queueAsyncError);
		}
	}
	component.addEventListener('state-change', handleStateChange);
	return () => {
		component.removeEventListener('state-change', handleStateChange);
	};
}
export function onStateChange() {}
export async function updateView() {
	const pendingTasks = [];
	const stateChangeResult = await this.onStateChange();
	if (isPromiseLike(stateChangeResult)) {
		pendingTasks.push(stateChangeResult);
	}
	if (this.isConnected && !this.templateBuilt) {
		pendingTasks.push(this.refresh());
	}
	if (!pendingTasks.length) {
		return Promise.resolve();
	}
	await Promise.all(pendingTasks);
}
