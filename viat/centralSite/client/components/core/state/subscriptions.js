import { TrackedBundle } from './pathSubscriptions.js';
import { globalState } from './globalState.js';
import { isArray } from '../utilities.js';
import { schedule } from '../lifecycle/scheduler.js';
function toList(keys) {
	return isArray(keys) ? keys : [keys];
}
function trackUnsubs(set, subscriptions) {
	for (let i = 0; i < subscriptions.length; i += 1) {
		set.add(subscriptions[i]);
	}
	return new TrackedBundle(set, subscriptions);
}
export function observeAsync(keys, callback) {
	const component = this;
	// Defer through the render scheduler so the callback fires AFTER any
	// list/spot patches in the same batch have updated the DOM.
	// This can't be making random new functions need a better solution here
	const deferred = function deferredObserver(nextValue, previousValue, changedPath) {
		schedule(() => {
			return callback.call(component, nextValue, previousValue, changedPath);
		});
	};
	const subscriptions = toList(keys).map((key) => {
		return this.observe(key, deferred);
	});
	return trackUnsubs(this.stateUnsubs, subscriptions);
}
export function observeGlobal(keys, callback) {
	const subscriptions = toList(keys).map((key) => {
		let previousValue = globalState.get(key);
		return globalState.bus.subscribe(key, (nextValue, changedPath) => {
			const result = callback(nextValue, previousValue, changedPath);
			previousValue = nextValue;
			return result;
		});
	});
	return trackUnsubs(this.globalUnsubs, subscriptions);
}
/**
 * Tear down every globalState observer this component has on `key`. Same
 * contract as `unobserve` but scoped to the `globalUnsubs` tracker. Other
 * components observing the same key are untouched.
 */
export function unobserveGlobal(key) {
	this.globalUnsubs.removeByKey(String(key ?? ''));
}
