import {
	eachObject, hasValue, isFunction, resolveTarget,
} from '../utilities.js';
import { getHostChildren, liveChildren } from './children.js';
export function getComponent(tag) {
	return liveChildren(this, tag?.toLowerCase())[0] ?? null;
}
export function getComponents(tag) {
	return liveChildren(this, tag?.toLowerCase());
}
/**
 * Snapshot child components into a fresh array (callers can't mutate the live
 * registry). Tag-narrowed: copies the matching bucket. No-tag: walks every
 * bucket and copies all components.
 * @param {string} [tag] - Optional element tag to narrow by.
 * @returns {WebComponent[]} A fresh array of matching child components.
 */
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
/**
 * Find the first child component matching `predicate`. Tag-narrowed: linear
 * scan of the matching bucket. No-tag: iterates every bucket without
 * allocating a flat array, stopping at the first match.
 * @param {string} tag - Element tag to narrow by (falsy = search all).
 * @param {(component: WebComponent) => boolean} predicate - Match test.
 * @returns {WebComponent|null} The first match, or null.
 */
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
	// Light-DOM (no-shadow) components render into the host element itself.
	return this.shadowRoot ?? this;
}
export function appendTo(target) {
	return resolveTarget(target)?.appendChild(this);
}
export function prependTo(target) {
	return resolveTarget(target)?.prepend(this);
}
export function ifAssign(target) {
	eachObject(target, (key, value) => {
		if (hasValue(this.state[key])) {
			this.state[key] = value;
		}
	});
	return target;
}
