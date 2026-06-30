import {
	hasValue, isFunction, isString,
	resolveTarget,
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
	const buckets = getHostChildren(this);
	for (const list of buckets.values()) {
		const listLength = list.length;
		for (let index = 0; index < listLength; index++) {
			out.push(list[index]);
		}
	}
	return out;
}
/**
 * Walk every child bucket and return the first component the search accepts,
 * without allocating a flat array. Stops at the first match.
 * @param {WebComponent} host - Host whose child buckets are scanned.
 * @param {(component: WebComponent) => boolean} search - Match test.
 * @returns {WebComponent|null} The first match, or null.
 */
function firstComponentInBuckets(host, search) {
	const children = getHostChildren(host);
	for (const list of children.values()) {
		const listLength = list.length;
		for (let index = 0; index < listLength; index++) {
			if (search(list[index])) {
				return list[index];
			}
		}
	}
	return null;
}
/**
 * Walk every child bucket and collect every component the search accepts into a
 * fresh array, without allocating an intermediate flat array first.
 * @param {WebComponent} host - Host whose child buckets are scanned.
 * @param {(component: WebComponent) => boolean} search - Match test.
 * @returns {WebComponent[]} A fresh array of every match (empty when none).
 */
function collectComponentsInBuckets(host, search) {
	const results = [];
	const children = getHostChildren(host);
	for (const list of children.values()) {
		const listLength = list.length;
		for (let index = 0; index < listLength; index++) {
			if (search(list[index])) {
				results.push(list[index]);
			}
		}
	}
	return results;
}
/**
 * Find the first child component matching `predicate`. Tag-narrowed: linear
 * scan of the matching bucket. No-tag: iterates every bucket without
 * allocating a flat array, stopping at the first match.
 * @param {string|((component: WebComponent) => boolean)} tag - Element tag to
 * narrow by, or a search function to run against every component.
 * @param {(component: WebComponent) => boolean} [predicate] - Match test, used
 * when `tag` narrows by element tag.
 * @returns {WebComponent|null} The first match, or null.
 */
export function findComponent(tag, predicate) {
	if (isString(tag)) {
		const list = liveChildren(this, tag.toLowerCase());
		if (!list) {
			return;
		} else if (!predicate) {
			return list[0];
		}
		const listLength = list.length;
		for (let index = 0; index < listLength; index++) {
			if (predicate(list[index])) {
				return list[index];
			}
		}
		return;
	}
	if (isFunction(tag)) {
		return firstComponentInBuckets(this, tag);
	}
}
/**
 * Find every child component matching the search. Tag-narrowed: linear scan of
 * the matching bucket. No-tag: iterates every bucket without allocating a flat
 * array first, collecting all matches.
 * @param {string|((component: WebComponent) => boolean)} tag - Element tag to
 * narrow by, or a search function to run against every component.
 * @param {(component: WebComponent) => boolean} [predicate] - Match test, used
 * when `tag` narrows by element tag.
 * @returns {WebComponent[]} A fresh array of every match (empty when none).
 */
export function findComponents(tag, predicate) {
	if (isString(tag)) {
		const list = liveChildren(this, tag.toLowerCase());
		if (!list) {
			return [];
		} else if (!predicate) {
			return list.slice();
		}
		const results = [];
		const listLength = list.length;
		for (let index = 0; index < listLength; index++) {
			if (predicate(list[index])) {
				results.push(list[index]);
			}
		}
		return results;
	}
	if (isFunction(tag)) {
		return collectComponentsInBuckets(this, tag);
	}
	return [];
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
	const keys = Object.keys(target);
	const keysLength = keys.length;
	for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
		const key = keys[keyIndex];
		if (hasValue(this.state[key])) {
			this.state[key] = target[key];
		}
	}
	return target;
}
