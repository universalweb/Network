import { isFunction, isString } from '../utilities.js';
import { allConnectedComponents, getHostChildren } from './children.js';
/*
 * ── Component search ─────────────────────────────────────────────────
 * Deep lookup over the CHILD REGISTRY, never the DOM. The registry already
 * spans shadow boundaries — `registerChild` keys every component under
 * `resolveParentHost`, which hops `getRootNode().host` — so recursing it is a
 * shadow-piercing search for free: no `querySelectorAll`, no per-level
 * shadowRoot probing, and closed shadow roots are visible too (a DOM walk
 * cannot see into those at all). Cost is O(descendant components), not O(all
 * DOM elements).
 *
 * Two scopes, both in first-match and all-matches form:
 *   instance — BREADTH-FIRST from a host: every child, then every
 *              grandchild, and so on. Layer order means the first match is
 *              the SHALLOWEST one, which is what "find the nearest X" wants;
 *              a depth-first walk would dive one branch to the bottom and
 *              return a deeper match while a closer one sat unvisited.
 *   static   — one linear pass over the flat connected roster, for "find X,
 *              I have no idea where it lives" (developer console, agent
 *              tooling). No starting point, no traversal.
 *
 * Search arguments are the same everywhere: `(tag, predicate)` narrows by tag
 * first and then tests the predicate; `(predicate)` alone tests every
 * component; `(tag)` alone takes the first of that tag.
 */
/**
 * Normalize the first search argument to a lowercased tag, or null when it is
 * a predicate / absent. Shared with the direct-child lookups in dom.js so one
 * argument grammar covers the whole search surface.
 * @param {string|Function} [tagOrPredicate] - The first search argument.
 * @returns {string|null} The lowercased tag, or null for "any tag".
 */
export function searchTag(tagOrPredicate) {
	return isString(tagOrPredicate) ? tagOrPredicate.toLowerCase() : null;
}
/**
 * Resolve the predicate from either argument position — `(predicate)` alone or
 * `(tag, predicate)`.
 * @param {string|Function} [tagOrPredicate] - The first search argument.
 * @param {Function} [predicate] - The second search argument.
 * @returns {Function|null} The match test, or null for "any component".
 */
export function searchPredicate(tagOrPredicate, predicate) {
	if (isFunction(tagOrPredicate)) {
		return tagOrPredicate;
	}
	return isFunction(predicate) ? predicate : null;
}
/**
 * Tag is compared against `localName` rather than the registry's stored tag:
 * a root component (no parent host) is never registered as a child, so its
 * `childRegistryTag` is null while `localName` is always correct.
 * @param {WebComponent} component - Candidate to test.
 * @param {string|null} tag - Lowercased tag to require, or null for any.
 * @param {Function|null} predicate - Match test, or null for any.
 * @returns {boolean} True when the candidate satisfies both constraints.
 */
export function matchesSearch(component, tag, predicate) {
	if (tag !== null && component.localName !== tag) {
		return false;
	}
	return predicate === null || predicate(component) === true;
}
/*
 * Push one host's direct children onto the frontier being built for the next
 * layer. Appends in place — a per-host intermediate array would allocate once
 * per visited component instead of once per layer.
 */
function pushChildren(host, frontier) {
	const buckets = getHostChildren(host);
	for (const bucket of buckets.values()) {
		for (const child of bucket) {
			frontier.push(child);
		}
	}
}
/**
 * Breadth-first descendant search. `visited` guards the walk: the registry is
 * a tree by construction (a parent host is always a real DOM ancestor), but a
 * stale entry left by a move that skipped `connectedMoveCallback` could make
 * one component appear under two parents — which would double-report in
 * collect mode and, in the pathological two-way case, never terminate. One
 * Set per search buys termination and dedup outright.
 * @param {WebComponent} host - Component whose subtree is searched.
 * @param {string|null} tag - Lowercased tag to narrow by, or null for any.
 * @param {Function|null} predicate - Match test, or null for any.
 * @param {boolean} collectAll - True to return every match, false to stop at the first.
 * @returns {WebComponent|WebComponent[]|null} All matches, the first match, or null.
 */
function searchDescendants(host, tag, predicate, collectAll) {
	const results = collectAll ? [] : null;
	const visited = new Set();
	let frontier = [];
	pushChildren(host, frontier);
	while (frontier.length) {
		const nextFrontier = [];
		const frontierLength = frontier.length;
		for (let index = 0; index < frontierLength; index++) {
			const component = frontier[index];
			if (visited.has(component)) {
				continue;
			}
			visited.add(component);
			if (matchesSearch(component, tag, predicate)) {
				if (!collectAll) {
					return component;
				}
				results.push(component);
			}
			pushChildren(component, nextFrontier);
		}
		frontier = nextFrontier;
	}
	return results;
}
/**
 * Find the first descendant matching the search, at any depth. Breadth-first,
 * so the shallowest match wins.
 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every component.
 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
 * @returns {WebComponent|null} The shallowest match, or null.
 */
export function findComponent(tag, predicate) {
	return searchDescendants(this, searchTag(tag), searchPredicate(tag, predicate), false);
}
/**
 * Find every descendant matching the search, at any depth. Results are in
 * breadth-first order — shallowest layer first.
 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every component.
 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
 * @returns {WebComponent[]} A fresh array of every match (empty when none).
 */
export function findComponents(tag, predicate) {
	return searchDescendants(this, searchTag(tag), searchPredicate(tag, predicate), true);
}
/**
 * Class-level search: the first CONNECTED component anywhere in the document
 * matching the search, scanning the flat roster in connect order. Use when
 * there is no sensible starting component — a console probe or an agent tool
 * locating a component it cannot navigate to.
 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every component.
 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
 * @returns {WebComponent|null} The first match in connect order, or null.
 */
export function findComponentGlobal(tag, predicate) {
	const searchedTag = searchTag(tag);
	const searchedPredicate = searchPredicate(tag, predicate);
	for (const component of allConnectedComponents()) {
		if (matchesSearch(component, searchedTag, searchedPredicate)) {
			return component;
		}
	}
	return null;
}
/**
 * Class-level search: every CONNECTED component in the document matching the
 * search, in connect order.
 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every component.
 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
 * @returns {WebComponent[]} A fresh array of every match (empty when none).
 */
export function findComponentsGlobal(tag, predicate) {
	const searchedTag = searchTag(tag);
	const searchedPredicate = searchPredicate(tag, predicate);
	const results = [];
	for (const component of allConnectedComponents()) {
		if (matchesSearch(component, searchedTag, searchedPredicate)) {
			results.push(component);
		}
	}
	return results;
}
