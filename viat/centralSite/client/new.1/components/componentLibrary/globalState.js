const STATE = {};
const subs = new Map();
const pending = {};
let flushScheduled = false;
export function getGlobalState(key) {
	return (key === undefined) ? Object.assign({}, STATE) : STATE[key];
}
export function setGlobalState(updates) {
	Object.assign(STATE, updates);
	Object.assign(pending, updates);
	if (!flushScheduled) {
		flushScheduled = true;
		queueMicrotask(() => {
			flushScheduled = false;
			const keys = Object.keys(pending);
			keys.forEach((k) => {
				delete pending[k];
			});
			for (const key of keys) {
				subs.get(key)?.forEach((cb) => {
					cb(STATE[key], STATE);
				});
			}
		});
	}
}
export function subscribeGlobal(key, cb) {
	if (!subs.has(key)) {
		subs.set(key, new Set());
	}
	subs.get(key).add(cb);
	return () => {
		subs.get(key).delete(cb);
	};
}
export function watchGlobal(key, cb) {
	const unsub = subscribeGlobal(key, cb ?? (() => {
		return this.refresh();
	}));
	this.globalUnsubs.add(unsub);
	return unsub;
}
export function getGlobal(key) {
	return getGlobalState(key);
}
export function setGlobal(updates) {
	setGlobalState(updates);
}
