import {
	eachObject, hasValue, isFunction, isString,
} from '../utilities.js';
import { getHostChildren, liveChildren } from './children.js';
export function getComponent(tag) {
	return liveChildren(this, tag?.toLowerCase())[0] ?? null;
}
export function getComponents(tag) {
	return liveChildren(this, tag?.toLowerCase());
}
// Tag-narrowed: copy the live array so callers can't mutate the registry.
// No-tag: walk every bucket and copy components into a fresh array.
export function getComponentsArray(tag) {
	if (tag) {
		const list = liveChildren(this, tag.toLowerCase());
		return list ? list.slice() : [];
	}
	const out = [];
	getHostChildren(this).forEach((list) => {
		for (let i = 0; i < list.length; i++) {
			out.push(list[i]);
		}
	});
	return out;
}
// Tag-narrowed: linear scan of the matching bucket (small list).
// No-tag: iterate every bucket without allocating a flat array; stop at first match.
export function findComponent(tag, predicate) {
	if (!isFunction(predicate)) {
		return null;
	}
	if (tag) {
		const list = liveChildren(this, tag.toLowerCase());
		if (!list) {
			return null;
		}
		for (let i = 0; i < list.length; i++) {
			if (predicate(list[i])) {
				return list[i];
			}
		}
		return null;
	}
	let match = null;
	getHostChildren(this).forEach((list) => {
		if (match) {
			return;
		}
		for (let i = 0; i < list.length; i++) {
			if (predicate(list[i])) {
				match = list[i];
				return;
			}
		}
	});
	return match;
}
export function getComponentRoot() {
	return this.shadowRoot;
}
export function findElement(target) {
	return isString(target) ? document.querySelector(target) : target;
}
export function appendTo(target) {
	return this.findElement(target)?.appendChild(this);
}
export function prependTo(target) {
	return this.findElement(target)?.prepend(this);
}
export function ifAssign(target) {
	eachObject(target, (key, value) => {
		if (hasValue(this.state[key])) {
			this.state[key] = value;
		}
	});
	return target;
}
