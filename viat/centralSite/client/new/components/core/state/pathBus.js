import { getOrInit, isPromiseLike, pathsOverlap, queueAsyncError } from '../utilities.js';
export function makePathBus({ getValue, onFlush, schedule = queueMicrotask }) {
	const subs = new Map();
	const pending = new Set();
	let flushScheduled = false;
	function flush() {
		flushScheduled = false;
		const changed = [...pending];
		pending.clear();
		if (subs.size) {
			subs.forEach((handlers, subscriptionPath) => {
				if (!handlers.size) {
					return;
				}
				for (let i = 0; i < changed.length; i++) {
					if (!pathsOverlap(subscriptionPath, changed[i])) {
						continue;
					}
					const value = getValue(subscriptionPath);
					const list = [...handlers];
					for (let j = 0; j < list.length; j++) {
						const result = list[j](value, changed[i]);
						if (isPromiseLike(result)) {
							result.catch(queueAsyncError);
						}
					}
					break;
				}
			});
		}
		onFlush?.();
	}
	function notify(path) {
		pending.add(path);
		if (flushScheduled) {
			return;
		}
		flushScheduled = true;
		schedule(flush);
	}
	function subscribe(path, handler) {
		const handlers = getOrInit(subs, path, () => new Set());
		handlers.add(handler);
		return () => {
			handlers.delete(handler);
			if (!handlers.size) {
				subs.delete(path);
			}
		};
	}
	return {
		notify,
		subscribe,
		subs,
	};
}
