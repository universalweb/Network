import { getOrInit, noValue } from '../utilities.js';
const childrenMap = new WeakMap();
const EMPTY_CHILDREN = Object.freeze([]);
/*
 * Flat roster of every CONNECTED component, in connect order — the substrate
 * for the class-level search (`WebComponent.findComponent`), which answers
 * "find X, I don't know where it lives" without needing a starting point.
 * Insertion-ordered Set: O(1) add/delete, one linear pass to scan, and a
 * disconnected component leaves it immediately (no stale hits, no GC pin —
 * every member is live by construction).
 */
const connectedComponents = new Set();
export function trackComponent(component) {
	connectedComponents.add(component);
}
export function untrackComponent(component) {
	connectedComponents.delete(component);
}
export function allConnectedComponents() {
	return connectedComponents;
}
export function getHostChildren(host) {
	return getOrInit(childrenMap, host, createTagMap);
}
function createTagMap() {
	return new Map();
}
function createTagSet() {
	return new Set();
}
function getTagChildren(host, tag) {
	return getOrInit(getHostChildren(host), tag, createTagSet);
}
/*
 * Register `element` under `host` by tag. O(1) Set.add; idempotent.
 * Identity for unregister is stored on the element (no per-connect closure).
 */
export function registerChild(host, element) {
	const tag = element.tagName.toLowerCase();
	getTagChildren(host, tag).add(element);
	element.childRegistryHost = host;
	element.childRegistryTag = tag;
}
/*
 * Drop `element` from its host's tag bucket. O(1) Set.delete. Idempotent —
 * safe when the element was never registered or already unregistered.
 */
export function unregisterChild(element) {
	const host = element.childRegistryHost;
	if (!host) {
		return;
	}
	const tag = element.childRegistryTag;
	childrenMap.get(host)?.get(tag)?.delete(element);
	element.childRegistryHost = null;
	element.childRegistryTag = null;
}
export function allChildren(host) {
	const children = childrenMap.get(host);
	if (!children) {
		return EMPTY_CHILDREN;
	}
	const out = [];
	for (const bucket of children.values()) {
		for (const child of bucket) {
			out.push(child);
		}
	}
	return out;
}
/*
 * Tag-narrowed: materializes a fresh array from the Set bucket (consumers
 * index / slice). No-tag: returns the live Map<tag, Set>.
 */
export function liveChildren(host, tag) {
	if (noValue(tag)) {
		return getHostChildren(host);
	}
	const bucket = getTagChildren(host, tag);
	if (!bucket.size) {
		return EMPTY_CHILDREN;
	}
	return [...bucket];
}
