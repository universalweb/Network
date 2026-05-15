import { getOrInit, isPromiseLike, pathsOverlap, queueAsyncError } from '../utilities.js';
export function makePathBus({ getValue, onFlush, schedule = queueMicrotask }) {
	const subs = new Map();
	const pending = new Set();
	let flushScheduled = false;
	function fireHandler(handler, value, changedPath) {
		const result = handler(value, changedPath);
		if (isPromiseLike(result)) {
			result.catch(queueAsyncError);
		}
	}
	function flush() {
		flushScheduled = false;
		const changed = [...pending];
		pending.clear();
		if (subs.size) {
			subs.forEach((handlers, subscriptionPath) => {
				if (!handlers.size) {
					return;
				}
				// Coalesced contract: each subscriber fires at most once per
				// batch, with the latest value at its path and the first
				// overlapping change path. Set.forEach is safe under
				// self-mutation (handlers added mid-fire are not visited).
				for (let i = 0; i < changed.length; i++) {
					if (!pathsOverlap(subscriptionPath, changed[i])) {
						continue;
					}
					const value = getValue(subscriptionPath);
					const changedPath = changed[i];
					handlers.forEach((handler) => {
						fireHandler(handler, value, changedPath);
					});
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
