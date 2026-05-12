import { delegate as delegateChannel, removeDelegate as removeDelegateChannel } from '../dom/delegate.js';
import { getGlobal, subscribeGlobal } from './globalState.js';
import { getOrInit, isArray } from '../utilities.js';
import { schedule } from '../lifecycle/scheduler.js';
function toList(keys) {
	return isArray(keys) ? keys : [keys];
}
function trackUnsubs(set, unsubscribers) {
	for (let i = 0; i < unsubscribers.length; i++) {
		set.add(unsubscribers[i]);
	}
	return () => {
		for (let i = 0; i < unsubscribers.length; i++) {
			unsubscribers[i]();
			set.delete(unsubscribers[i]);
		}
	};
}
function trackUnsub(set, unsubscribe) {
	set.add(unsubscribe);
	return () => {
		unsubscribe();
		set.delete(unsubscribe);
	};
}
export function observe(keys, callback) {
	const component = this;
	// Defer through the render scheduler so the callback fires AFTER any
	// list/spot patches in the same batch have updated the DOM.
	const deferred = function deferredObserver(nextValue, previousValue, changedPath) {
		schedule(() => {
			return callback.call(component, nextValue, previousValue, changedPath);
		});
	};
	const unsubscribers = toList(keys).map((key) => {
		return this.watchState(key, deferred);
	});
	return trackUnsubs(this.stateUnsubs, unsubscribers);
}
export function observeAttr(keys, callback) {
	const keyList = toList(keys);
	if (!this.attrObservers) {
		this.attrObservers = new Map();
	}
	const observerMap = this.attrObservers;
	keyList.forEach((key) => {
		getOrInit(observerMap, key, () => new Set()).add(callback);
	});
	return () => {
		if (!this.attrObservers) {
			return;
		}
		keyList.forEach((key) => {
			const subscriberSet = this.attrObservers.get(key);
			if (!subscriberSet) {
				return;
			}
			subscriberSet.delete(callback);
			if (subscriberSet.size === 0) {
				this.attrObservers.delete(key);
			}
		});
	};
}
export function observeGlobal(keys, callback) {
	const unsubscribers = toList(keys).map((key) => {
		let previousValue = getGlobal(key);
		return subscribeGlobal(key, (nextValue, globalState, changedPath) => {
			const result = callback(nextValue, previousValue, changedPath);
			previousValue = nextValue;
			return result;
		});
	});
	return trackUnsubs(this.globalUnsubs, unsubscribers);
}
export function delegate(channel, handler, options) {
	return trackUnsub(this.delegateUnsubs, delegateChannel(channel, handler, options));
}
export function removeDelegate(channel, handler) {
	removeDelegateChannel(channel, handler);
}
