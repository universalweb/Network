import {
	hasValue, isString,
	resolveTarget,
} from '../utilities.js';
import { allChildren, getHostChildren, liveChildren } from './children.js';
import { matchesSearch, searchPredicate } from './search.js';
/*
 * ── Direct-child lookup ──────────────────────────────────────────────
 * Every lookup in this file searches ONE level: the host's directly registered
 * children. For a search that descends the whole subtree (children, their
 * children, and so on) use findComponent / findComponents from dom/search.js.
 * The scope is in the name — "child" is one level, "component" is any depth.
 *
 * All four share the search-argument shape used by the deep and class-level
 * searches: `(tag, predicate)` narrows by tag then tests the predicate,
 * `(predicate)` alone tests every child, `(tag)` alone takes the first of that
 * tag. One grammar across the whole surface.
 */
/**
 * Walk every child bucket, stopping at the first match. Avoids the flat-array
 * materialization the tag-narrowed path gets from `liveChildren`.
 * @param {WebComponent} host - Host whose child buckets are scanned.
 * @param {string|null} tag - Lowercased tag to narrow by, or null for any.
 * @param {Function|null} predicate - Match test, or null for any.
 * @returns {WebComponent|null} The first match, or null.
 */
function firstChildInBuckets(host, tag, predicate) {
	const buckets = getHostChildren(host);
	for (const bucket of buckets.values()) {
		for (const child of bucket) {
			if (matchesSearch(child, tag, predicate)) {
				return child;
			}
		}
	}
	return null;
}
/**
 * Walk every child bucket and collect every match into a fresh array.
 * @param {WebComponent} host - Host whose child buckets are scanned.
 * @param {string|null} tag - Lowercased tag to narrow by, or null for any.
 * @param {Function|null} predicate - Match test, or null for any.
 * @returns {WebComponent[]} A fresh array of every match (empty when none).
 */
function collectChildrenInBuckets(host, tag, predicate) {
	const results = [];
	const buckets = getHostChildren(host);
	for (const bucket of buckets.values()) {
		for (const child of bucket) {
			if (matchesSearch(child, tag, predicate)) {
				results.push(child);
			}
		}
	}
	return results;
}
/**
 * First direct child with this tag.
 * @param {string} [tag] - Element tag to narrow by; omitted returns the first child of any tag.
 * @returns {WebComponent|null} The first matching child, or null.
 */
export function getChild(tag) {
	if (!isString(tag)) {
		return firstChildInBuckets(this, null, null);
	}
	return liveChildren(this, tag.toLowerCase())[0] ?? null;
}
/**
 * Direct children with this tag, as a fresh array. ALWAYS an array — the
 * no-tag case collects every bucket instead of leaking the live tag Map, which
 * silently broke `.length` / index loops on the caller side.
 * @param {string} [tag] - Element tag to narrow by; omitted returns every direct child.
 * @returns {WebComponent[]} A fresh array of matching children (empty when none).
 */
export function getChildren(tag) {
	if (!isString(tag)) {
		return allChildren(this);
	}
	return liveChildren(this, tag.toLowerCase());
}
/**
 * First direct child matching the search.
 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every child.
 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
 * @returns {WebComponent|null} The first match, or null — never undefined.
 */
export function findChild(tag, predicate) {
	const searchedPredicate = searchPredicate(tag, predicate);
	if (!isString(tag)) {
		return firstChildInBuckets(this, null, searchedPredicate);
	}
	const list = liveChildren(this, tag.toLowerCase());
	if (searchedPredicate === null) {
		return list[0] ?? null;
	}
	const listLength = list.length;
	for (let index = 0; index < listLength; index++) {
		if (searchedPredicate(list[index]) === true) {
			return list[index];
		}
	}
	return null;
}
/**
 * Every direct child matching the search.
 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every child.
 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
 * @returns {WebComponent[]} A fresh array of every match (empty when none).
 */
export function findChildren(tag, predicate) {
	const searchedPredicate = searchPredicate(tag, predicate);
	if (!isString(tag)) {
		return collectChildrenInBuckets(this, null, searchedPredicate);
	}
	const list = liveChildren(this, tag.toLowerCase());
	if (searchedPredicate === null) {
		return list;
	}
	const results = [];
	const listLength = list.length;
	for (let index = 0; index < listLength; index++) {
		if (searchedPredicate(list[index]) === true) {
			results.push(list[index]);
		}
	}
	return results;
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
