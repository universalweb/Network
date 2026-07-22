/*
 * Keyed-list machinery — the list half of the template engine: light rows
 * (`html` tagged rows without a component), `LiveList` + `each()` / `list()` /
 * `filter()` factories, the LIS-based keyed diff
 * (`patchList`), and `ListSpot`. Split out of template.js; the two modules
 * form a DELIBERATE import cycle — the runtime core dispatches LIST content
 * to `patchListKind` / `patchListAnchored` (hoisted function declarations,
 * cycle-safe), while this module calls back into the core's generic patch
 * path (`patchSpot`, `updateTemplateSpots`, `installSpotFromPlan`) at
 * runtime only. Anything BOTH sides need at eval time lives in the leaves
 * (`template/spot.js`, `template/planner.js`).
 */
import {
	bind,
	isBindingType,
	ListBinding,
} from '../state/binding.js';
import { resolveListFilter } from '../state/listFilter.js';
import { registerListHandle, unregisterListHandle } from '../state/listHandle.js';
import {
	installSpotFromPlan,
	patchSpot,
	realmForBinding,
	resolveBindingValueForBinding,
	updateTemplateSpots,
} from '../template.js';
import {
	createElementFromHTML,
	isElement,
	isFunction,
	isPlainObject,
	isString,
} from '../utilities.js';
import { SPOT_KIND } from './constants.js';
import { getRecipe, resolveRecipeNodes } from './planner.js';
import { cleanupTemplateNode, clearRange, Spot } from './spot.js';
/**
 * ── Lightweight list rows ───────────────────────────────────────────────────
 * A list row that does NOT pay for a custom element + shadow root + async
 * lifecycle. The standalone `html` tag returns a LightTemplate {strings,
 * values}; the list clones the SHARED recipe (parsed once via getRecipe, same
 * as a component) into plain DOM and RETAINS the spots, so updates are surgical
 * textContent/attr writes — no component, no subscription, no re-parse, no
 * rebuild. ~10× cheaper to create than a full component row. For data lists
 * that need no per-row encapsulation or state; rows needing those keep the
 * `class` component kind of each()/list().
 *
 * Constraints (thrown loud, never silent):
 *   • exactly one root element per row;
 *   • value-only expressions — compute inline (`${item.value * 2}`), never
 *     `${() => …}` or a binding (those need a component's reactive graph);
 *   • no `#ref`, `$two-way`, behaviors, or `@event` spots.
 * String values render as textContent by default (XSS-safe, like everywhere in
 * UWC); opt into markup per-spot with `^html${str}` only for trusted HTML.
 */
class LightTemplate {
	constructor(strings, values) {
		this.strings = strings;
		this.values = values;
	}
	static is(source) {
		return source instanceof LightTemplate;
	}
}
function createRenderableElement(value) {
	if (LightTemplate.is(value)) {
		return instantiateLightRow(value);
	}
	if (isString(value)) {
		return createElementFromHTML(value);
	}
	if (isElement(value)) {
		return value;
	}
	throw new TypeError('List render functions must return an Element or HTML string.');
}
export function isCustomElementConstructor(source) {
	return isFunction(source) && source.prototype instanceof HTMLElement;
}
export function html(strings, ...values) {
	return new LightTemplate(strings, values);
}
/*
 * root element → { spots, prevExprs }. WeakMap so a removed row's retained
 * spots clear on GC with zero bookkeeping.
 */
const LIGHT_ROW_INSTANCES = new WeakMap();
function assertLightTemplate(recipe, values) {
	const valuesLength = values.length;
	for (let valueIndex = 0; valueIndex < valuesLength; valueIndex++) {
		const value = values[valueIndex];
		if (isFunction(value) || isBindingType(value)) {
			throw new TypeError('each() html row expressions must be plain values — compute inline (`${item.x * 2}`), not `${() => …}` or a binding.');
		}
	}
	if ((recipe?.refPlans?.length) || (recipe?.dataBindPlans?.length) || (recipe?.subeventPlans?.length)) {
		throw new TypeError('each() html row does not support #refs, two-way bindings, or behaviors — use the component (class) kind for those.');
	}
}
function instantiateLightRow(lightTemplate) {
	const recipe = getRecipe(lightTemplate.strings);
	const values = lightTemplate.values;
	assertLightTemplate(recipe, values);
	const fragment = recipe.fragment.cloneNode(true);
	const spotPlans = recipe.spotPlans;
	const spots = [];
	/*
	 * Two-phase (see instantiateRecipe): resolve all nodes on the pristine clone
	 * before any anchored install shifts child indices, then install.
	 */
	const resolvedNodes = resolveRecipeNodes(fragment, recipe.resolveTargets);
	const spotResolved = new Array(spotPlans.length);
	const spotPlansLength = spotPlans.length;
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		const plan = spotPlans[spotIndex];
		if (plan.anchored) {
			spotResolved[spotIndex] = {
				startComment: resolvedNodes[plan.startSlot],
				endComment: resolvedNodes[plan.endSlot],
			};
		} else {
			spotResolved[spotIndex] = resolvedNodes[plan.nodeSlot];
		}
	}
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		const spot = installSpotFromPlan(spotPlans[spotIndex], spotResolved[spotIndex], values, null);
		if (spot) {
			spots.push(spot);
		}
	}
	if (fragment.children.length !== 1) {
		throw new TypeError('each() html row must have exactly one root element.');
	}
	const root = fragment.firstElementChild;
	LIGHT_ROW_INSTANCES.set(root, {
		spots,
		prevExprs: values.slice(),
	});
	return root;
}
function patchLightRow(element, lightTemplate) {
	const instance = LIGHT_ROW_INSTANCES.get(element);
	if (!instance) {
		return false;
	}
	updateTemplateSpots(instance, lightTemplate.values, null);
	return true;
}
function resolveRenderKind(renderFn) {
	if (isString(renderFn)) {
		return 'tag';
	}
	if (isCustomElementConstructor(renderFn)) {
		return 'class';
	}
	return 'fn';
}
function createListElementByKind(kind, renderFn, item, component) {
	if (kind === 'tag') {
		const element = document.createElement(renderFn);
		element.state = item;
		return element;
	}
	if (kind === 'class') {
		/*
		 * `renderFn` is the caller-supplied list constructor (the `each()` render
		 * arg) — a dynamic class whose lowercase binding name we don't control.
		 */
		// eslint-disable-next-line new-cap
		return new renderFn(item);
	}
	/*
	 * A `'fn'` row renderer is called with the owning component as `this`, so a
	 * bare method ref (`this.txRow`) reads component state/helpers — same
	 * semantics as a bare-method-ref content spot. `.call(undefined, …)` when
	 * the list has no connected spot yet is just a plain call.
	 */
	return createRenderableElement(renderFn.call(component, item));
}
function liveListItemKey(item, index) {
	return index;
}
export class LiveList {
	items = [];
	renderFn;
	keyFn;
	kind = null;
	spot = null;
	/*
	 * false while `items` is shared by reference with the each() caller's
	 * array — the first imperative mutation (splice and its wrappers) takes a
	 * private copy. Keeps the refresh hot path allocation-free without ever
	 * mutating a caller-owned array.
	 */
	ownsItems = true;
	constructor(renderFn, keyFn = liveListItemKey) {
		this.renderFn = renderFn;
		this.keyFn = keyFn;
		this.kind = resolveRenderKind(renderFn);
	}
	get length() {
		return this.items.length;
	}
	static isLiveList(source) {
		return source instanceof LiveList;
	}
	connectSpot(spot) {
		this.spot = spot;
	}
	disconnectSpot() {
		this.spot = null;
	}
	createElement(item) {
		return createListElementByKind(this.kind, this.renderFn, item, this.spot?.component);
	}
	splice(start, deleteCount = 0, ...newItems) {
		if (!this.ownsItems) {
			this.items = this.items.slice();
			this.ownsItems = true;
		}
		const currentLength = this.items.length;
		const normalStart = start < 0 ? Math.max(0, currentLength + start) : Math.min(start, currentLength);
		const refItem = this.items[normalStart + deleteCount];
		const refKey = refItem === undefined ? null : this.keyFn(refItem, normalStart + deleteCount);
		const refElement = this.spot && refKey !== null ? (this.spot.keyMap?.get(refKey) ?? null) : null;
		if (this.spot) {
			for (let deleteIndex = normalStart; deleteIndex < normalStart + deleteCount && deleteIndex < currentLength; deleteIndex++) {
				const itemKey = this.keyFn(this.items[deleteIndex], deleteIndex);
				const element = this.spot.keyMap?.get(itemKey);
				cleanupTemplateNode(element);
				element?.remove();
				this.spot.keyMap?.delete(itemKey);
				this.spot.prevItemMap?.delete(itemKey);
			}
		}
		this.items.splice(normalStart, deleteCount, ...newItems);
		if (newItems.length && this.spot) {
			const fragment = document.createDocumentFragment();
			this.spot.keyMap ??= new Map();
			this.spot.prevItemMap ??= new Map();
			const newItemsLength = newItems.length;
			for (let insertIndex = 0; insertIndex < newItemsLength; insertIndex++) {
				const newItem = newItems[insertIndex];
				const itemKey = this.keyFn(newItem, normalStart + insertIndex);
				const element = this.createElement(newItem);
				this.spot.keyMap.set(itemKey, element);
				this.spot.prevItemMap.set(itemKey, newItem);
				fragment.append(element);
			}
			const container = this.spot.anchored ? this.spot.startComment.parentNode : this.spot.element;
			const tail = this.spot.anchored ? this.spot.endComment : null;
			container.insertBefore(fragment, refElement ?? tail);
		}
		return this;
	}
	push(...items) {
		return this.splice(this.items.length, 0, ...items);
	}
	unshift(...items) {
		return this.splice(0, 0, ...items);
	}
	pop() {
		return this.items.length ? this.splice(this.items.length - 1, 1) : this;
	}
	shift() {
		return this.items.length ? this.splice(0, 1) : this;
	}
	[Symbol.iterator]() {
		return this.items[Symbol.iterator]();
	}
}
function defaultEachKeyFn(item, index) {
	return index;
}
export function each(items, renderFn, keyFn = defaultEachKeyFn) {
	const listItem = new LiveList(renderFn, keyFn);
	if (Array.isArray(items) && items.length) {
		/*
		 * Share by reference, copy on first mutation. ListSpot.refresh mints a
		 * LiveList per patch (hot), and its view array is either a fresh
		 * buildListView product or the raw state array patchList only reads —
		 * an eager defensive slice per refresh bought nothing. The splice()
		 * gate takes the private copy the moment an imperative mutation
		 * arrives, so a caller's array is never mutated through the LiveList.
		 */
		listItem.items = items;
		listItem.ownsItems = false;
	}
	return listItem;
}
function defaultListKeyFn(item, index) {
	return item?.key ?? item?.id ?? index;
}
export function list(key, renderFn, keyFn = defaultListKeyFn) {
	return new ListBinding(key, renderFn, keyFn);
}
/**
 * `filter(stateKey, ChildClass, test, keyFn?)` — `list()` plus a predicate. Only
 * the items `test` keeps are rendered; the filtered view is recomputed whenever
 * the bound array changes. `test` is a keep-predicate `(item) => boolean` or a
 * string flag name to hide on (`'hidden'`). Auto-keys by `key ?? id ?? index`,
 * exactly like `list`; `list` itself stays filter-free and light.
 */
export function filter(key, renderFn, test, keyFn = defaultListKeyFn) {
	return new ListBinding(key, renderFn, keyFn, resolveListFilter(test));
}
/*
 * `bind.list` — typed LIST variant of the bind family. Wired here, where the
 * list machinery lives, onto the shared `bind` callable (no import circular).
 */
bind.list = list;
/**
 * Longest increasing subsequence over `sources` (each entry is a reused
 * element's OLD dom-order index, or -1 for a freshly created element). Returns
 * the Set of array indices that form the LIS — those elements are already in
 * correct relative order and need NO dom move. O(n log n). This is the core
 * that turns a 2-item swap from O(n) insertBefore calls into O(1) moves.
 */
function lisIndexSet(sources) {
	const sourceCount = sources.length;
	const predecessor = new Array(sourceCount);
	const tails = [];
	for (let sourceIndex = 0; sourceIndex < sourceCount; sourceIndex++) {
		const value = sources[sourceIndex];
		if (value < 0) {
			continue;
		}
		let low = 0;
		let high = tails.length;
		while (low < high) {
			const mid = (low + high) >> 1;
			if (sources[tails[mid]] < value) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		predecessor[sourceIndex] = low > 0 ? tails[low - 1] : -1;
		if (low === tails.length) {
			tails.push(sourceIndex);
		} else {
			tails[low] = sourceIndex;
		}
	}
	const stable = new Set();
	let walk = tails.length ? tails[tails.length - 1] : -1;
	while (walk >= 0) {
		stable.add(walk);
		walk = predecessor[walk];
	}
	return stable;
}
/**
 * Patch a retained element to `item` in place — the per-element update used by the
 * keyed diff. Light rows re-run their row fn and repatch retained spots; components
 * take `assignState`; anything else is replaced (returns the replacement so the
 * caller refreshes its key map).
 */
function updateReusedElement(element, item, itemList) {
	if (LIGHT_ROW_INSTANCES.has(element)) {
		patchLightRow(element, itemList.renderFn.call(itemList.spot?.component, item));
		return element;
	}
	if (isFunction(element.assignState)) {
		element.assignState(item);
		return element;
	}
	const replacement = itemList.createElement(item);
	cleanupTemplateNode(element);
	element.replaceWith(replacement);
	return replacement;
}
/**
 * True when `items` produces exactly the existing keys in the existing DOM order
 * (a Map's insertion order == its DOM order here). Caller guarantees equal counts.
 * The cheap gate for patchList's no-structural-change fast path; each key is
 * computed once (the general path would too), so a hit pays no extra keyFn work.
 */
function sameKeyOrder(items, keyFn, oldMap) {
	const keyIterator = oldMap.keys();
	const itemsLength = items.length;
	for (let index = 0; index < itemsLength; index++) {
		if (keyFn(items[index], index) !== keyIterator.next().value) {
			return false;
		}
	}
	return true;
}
export function patchList(spot, itemList) {
	if (spot.liveList && spot.liveList !== itemList && spot.liveList.disconnectSpot) {
		spot.liveList.disconnectSpot();
	}
	if (itemList.connectSpot) {
		itemList.connectSpot(spot);
	}
	spot.liveList = itemList;
	const {
		items, keyFn,
	} = itemList;
	/*
	 * Container + tail boundary. Tier-1 / wrapper: the element itself, append at
	 * its end (tail = null). Anchored partial: the parent shared with statics,
	 * inserting before the end comment so the list stays inside its range.
	 */
	const anchor = spot.anchored ? spot.startComment.parentNode : spot.element;
	const tail = spot.anchored ? spot.endComment : null;
	const oldMap = spot.keyMap ?? new Map();
	const prevItemMap = spot.prevItemMap ?? new Map();
	const newMap = new Map();
	const itemCount = items.length;
	/**
	 * Fast path — first mount (no existing keyed children): straight append, one
	 * fragment for the multi-item case.
	 */
	if (oldMap.size === 0) {
		const fragment = itemCount > 1 ? document.createDocumentFragment() : null;
		for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
			const item = items[itemIndex];
			const key = keyFn(item, itemIndex);
			const element = itemList.createElement(item);
			newMap.set(key, element);
			prevItemMap.set(key, item);
			if (fragment) {
				fragment.append(element);
			} else {
				anchor.insertBefore(element, tail);
			}
		}
		if (fragment) {
			anchor.insertBefore(fragment, tail);
		}
		spot.keyMap = newMap;
		spot.prevItemMap = prevItemMap;
		return;
	}
	/*
	 * Fast path — no structural change: identical key set in identical order (the
	 * common update / in-place-mutation case). Skips the whole reorder apparatus
	 * (oldOrder map, sources / elements / staleEntries arrays, LIS) and patches each
	 * retained element in place — strictly fewer ops, same DOM work (only changed
	 * rows touch the DOM). Any add / remove / move breaks sameKeyOrder and falls
	 * through to the general keyed diff. oldMap stays the keyMap (Map.set on an
	 * existing key keeps insertion / DOM order, so a replaced element just updates
	 * its slot). Strictly fewer ops than the general path; the saving is noise at
	 * small N but grows with N (measured: +0.5ms @5k, +0.9ms @10k on the pure-
	 * bookkeeping signal), and `sameKeyOrder` bails on the first mismatch so a
	 * reorder / add / remove pays ~nothing before falling through.
	 */
	if (itemCount === oldMap.size && sameKeyOrder(items, keyFn, oldMap)) {
		const keyIterator = oldMap.keys();
		for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
			const item = items[itemIndex];
			const key = keyIterator.next().value;
			if (item !== prevItemMap.get(key)) {
				oldMap.set(key, updateReusedElement(oldMap.get(key), item, itemList));
				prevItemMap.set(key, item);
			}
		}
		spot.keyMap = oldMap;
		spot.prevItemMap = prevItemMap;
		return;
	}
	// @engram em:network/code/tk-42-shipped-tri-state-lazy-lifecycle-epoch-guard-list-bulk — why bulk removal replaced per-row remove() and what must still run per row
	/*
	 * Fast path — full clear: every existing row goes. Per-row `remove()` made
	 * the browser pay one mutation + style-invalidation pass PER ROW for what is
	 * a single logical operation — at 300 rows that was nearly the entire clear
	 * cost. One bulk removal (replaceChildren on a wrapper spot, which owns all
	 * of its element's children by construction; range.deleteContents between
	 * the comment anchors) collapses it to a single pass. Per-row teardown
	 * bookkeeping (cleanupTemplateNode) still runs for every removed element,
	 * and removal from the tree still fires each row's disconnectedCallback.
	 */
	if (itemCount === 0) {
		oldMap.forEach(cleanupTemplateNode);
		if (spot.anchored) {
			const rowRange = document.createRange();
			rowRange.setStartAfter(spot.startComment);
			rowRange.setEndBefore(spot.endComment);
			rowRange.deleteContents();
		} else {
			anchor.replaceChildren();
		}
		oldMap.clear();
		prevItemMap.clear();
		spot.keyMap = oldMap;
		spot.prevItemMap = prevItemMap;
		return;
	}
	/*
	 * Snapshot old dom order (Map insertion order == dom order) so each reused
	 * element carries its previous index for the LIS.
	 */
	const oldKeys = [...oldMap.keys()];
	const oldOrder = new Map();
	const oldKeysLength = oldKeys.length;
	for (let oldIndex = 0; oldIndex < oldKeysLength; oldIndex++) {
		oldOrder.set(oldKeys[oldIndex], oldIndex);
	}
	/*
	 * Phase 1 — resolve every new item to an element (reuse / update-in-place /
	 * create), recording each reused element's old index. `reordered` stays
	 * false for a pure in-order update or a tail trim, letting phase 2 bail.
	 */
	const elements = new Array(itemCount);
	const sources = new Array(itemCount);
	let reordered = false;
	let highestOldSeen = -1;
	for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
		const item = items[itemIndex];
		const key = keyFn(item, itemIndex);
		let element = oldMap.get(key);
		if (element) {
			oldMap.delete(key);
			if (item !== prevItemMap.get(key)) {
				element = updateReusedElement(element, item, itemList);
			}
			const source = oldOrder.get(key);
			sources[itemIndex] = source;
			if (source < highestOldSeen) {
				reordered = true;
			} else {
				highestOldSeen = source;
			}
		} else {
			element = itemList.createElement(item);
			sources[itemIndex] = -1;
			reordered = true;
		}
		elements[itemIndex] = element;
		newMap.set(key, element);
		prevItemMap.set(key, item);
	}
	// Remove the old elements that were not reused.
	const staleEntries = [...oldMap.entries()];
	const staleEntriesLength = staleEntries.length;
	for (let staleIndex = 0; staleIndex < staleEntriesLength; staleIndex++) {
		const staleElement = staleEntries[staleIndex][1];
		cleanupTemplateNode(staleElement);
		staleElement.remove();
		prevItemMap.delete(staleEntries[staleIndex][0]);
	}
	/**
	 * Phase 2 — minimal-move positioning, walking backwards so each element's
	 * final next-sibling is already placed. Elements inside the LIS of `sources`
	 * keep their slot; only reordered or new elements are inserted.
	 */
	if (reordered) {
		const stable = lisIndexSet(sources);
		/*
		 * Atomic, state-preserving reorder for RETAINED rows: moveBefore relocates
		 * a still-connected element WITHOUT firing disconnect/connect, so the row
		 * keeps its lifecycle phase, reactive subscriptions, focus and in-flight
		 * animations across the move. A plain insertBefore on a connected node
		 * tears it down and rebuilds it — every lifecycle hook (onConnect / onMount
		 * / onLive) re-fires on a simple swap. New rows (source -1) are detached, so
		 * they can ONLY insertBefore (moveBefore requires a connected node). Falls
		 * back to insertBefore when the platform lacks moveBefore or the anchor
		 * detached mid-patch (moveBefore throws on a disconnected receiver). Mirrors
		 * portal.js's movePortalChildren.
		 */
		const canMove = isFunction(anchor.moveBefore) && anchor.isConnected;
		let nextSibling = tail;
		for (let itemIndex = itemCount - 1; itemIndex >= 0; itemIndex--) {
			const element = elements[itemIndex];
			if (sources[itemIndex] === -1) {
				/*
				 * Freshly created and still detached — its `nextSibling` is null and
				 * can't signal "already placed", so always insert at the slot
				 * (covers append-at-end, where the target nextSibling is also null).
				 */
				anchor.insertBefore(element, nextSibling);
			} else if (!stable.has(itemIndex) && element.nextSibling !== nextSibling) {
				if (canMove) {
					anchor.moveBefore(element, nextSibling);
				} else {
					anchor.insertBefore(element, nextSibling);
				}
			}
			nextSibling = element;
		}
	}
	spot.keyMap = newMap;
	spot.prevItemMap = prevItemMap;
}
/**
 * Text-position LIST patcher (wrapper/elided spots). Registered in the core's
 * CONTENT_PATCHERS table — a hoisted function declaration, so the reference
 * survives either evaluation order of the template ↔ list cycle.
 */
export function patchListKind(spot, value) {
	if (!spot.keyMap && spot.element.firstChild) {
		spot.element.textContent = '';
	}
	patchList(spot, value);
}
/**
 * Anchored mirror of patchListKind — operates on the comment-bounded range.
 */
export function patchListAnchored(spot, value) {
	/**
	 * If the range still holds leftover text/html from a prior kind, drop it
	 * before the keyed build (the wrapper path relied on `element.textContent=''`).
	 */
	if (!spot.keyMap && spot.startComment.nextSibling !== spot.endComment) {
		clearRange(spot.startComment, spot.endComment);
	}
	spot.textNode = null;
	patchList(spot, value);
}
/**
 * Resolve a list spot's bound state into the array the keyed diff renders.
 * Replaces `Array.prototype.filter` on the refresh hot path: an unfiltered
 * array passes through by reference (the LiveList shares it copy-on-write),
 * while a filter or a plain-object source is collected in a single named pass.
 * Plain objects render their values in key order — previously dropped entirely
 * (`Array.isArray(…) ? … : []`). The predicate is the documented keep-form
 * `(item, index) => boolean`; the source index is passed so flag/keyed tests
 * stay stable, not the post-filter view index.
 * @param {*} rawItems - The bound state value (array, plain object, or other).
 * @param {(item: any, index: number) => boolean | null} filterFn - Keep-predicate, or null to keep all.
 * @returns {Array} The items to hand to the keyed diff.
 */
function buildListView(rawItems, filterFn) {
	if (Array.isArray(rawItems)) {
		if (!filterFn) {
			return rawItems;
		}
		const view = [];
		const rawItemsLength = rawItems.length;
		for (let index = 0; index < rawItemsLength; index++) {
			const item = rawItems[index];
			if (filterFn(item, index)) {
				view.push(item);
			}
		}
		return view;
	}
	if (isPlainObject(rawItems)) {
		const keys = Object.keys(rawItems);
		const view = [];
		const keysLength = keys.length;
		for (let index = 0; index < keysLength; index++) {
			const item = rawItems[keys[index]];
			if (!filterFn || filterFn(item, index)) {
				view.push(item);
			}
		}
		return view;
	}
	return [];
}
/**
 * Keyed list — `each(items, render, keyFn)` / `list(key, …)` /
 * `liveList(…)`. Owns `keyMap` (key → element) and `liveList` handle.
 */
export class ListSpot extends Spot {
	constructor(element, slotIndex, spotType, expr, component, bindingKey, renderFn, keyFn, filterFn = null) {
		super();
		this.kind = SPOT_KIND.LIST;
		this.type = spotType;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.bindingKeyPrefix = `${bindingKey}.`;
		/*
		 * The bound realm is callsite-constant (updateSpot swaps `expr` only for
		 * an identically-keyed binding), so resolve it ONCE at install — every
		 * refresh was re-running the store lookup + realm object build.
		 */
		if (component && isBindingType(expr)) {
			const keyRealm = realmForBinding(expr, component);
			this.realm = keyRealm.realm;
			this.realmPath = keyRealm.path;
		} else {
			this.realm = null;
			this.realmPath = null;
		}
		this.renderFn = renderFn;
		this.keyFn = keyFn;
		this.filterFn = filterFn;
		this.keyMap = null;
		this.liveList = null;
		this.prevItemMap = null;
		this.patch = null;
		// anchored partial list: patchList targets (startComment.parentNode, endComment).
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
		// Imperative handle: this.list(key) after mount.
		if (component && bindingKey) {
			registerListHandle(component, this);
		}
	}
	/** Drains `pendingPaths` and replays the refresh once per accumulated path
	 *  (since each path may take different branches between full re-diff and
	 *  per-item assignState — see comment in refresh()). */
	drain() {
		const paths = this.pendingPaths;
		this.pendingPaths = null;
		if (paths && paths.length > 1) {
			let lastResult;
			const pathsLength = paths.length;
			for (let pathIndex = 0; pathIndex < pathsLength; pathIndex++) {
				lastResult = this.refresh(paths[pathIndex]);
			}
			return lastResult;
		}
		return this.refresh(paths ? paths[0] : null);
	}
	refresh(changedPath = null) {
		const {
			component, bindingKey, renderFn, keyFn, filterFn,
		} = this;
		const rawItems = this.realm === null ? resolveBindingValueForBinding(component, this.expr) : this.realm.read(this.realmPath);
		const viewItems = buildListView(rawItems, filterFn);
		/*
		 * Partial in-place update is only safe when the change is a *deep*
		 * path inside an existing item (`items.i.foo`), meaning the array
		 * shape is unchanged. Top-level changes (`items.i`) can be array-
		 * shape ops (unshift/push/splice/swap) that fire multiple sub-paths,
		 * but the subscription only sees the first one — taking the partial
		 * branch then would skip the rest of the changes. A filtered list is
		 * excluded entirely: a deep change may flip a filtered flag (a
		 * membership change), and the filtered view's indices no longer line
		 * up with the source array's — so it always takes the full keyed diff.
		 */
		if (
			!filterFn &&
			changedPath &&
			changedPath !== bindingKey &&
			changedPath.startsWith(this.bindingKeyPrefix) &&
			this.keyMap &&
			viewItems.length === this.keyMap.size
		) {
			const subPath = changedPath.slice(bindingKey.length + 1);
			const firstDot = subPath.indexOf('.');
			if (firstDot !== -1) {
				const index = Number(subPath.slice(0, firstDot));
				if (!Number.isNaN(index)) {
					const itemAtIndex = viewItems[index];
					if (itemAtIndex !== undefined) {
						const itemKey = keyFn(itemAtIndex, index);
						const element = this.keyMap.get(itemKey);
						if (element) {
							/*
							 * Deep write on an existing item (`items.i.foo`). Component
							 * rows take assignState. Light html rows keep the SAME item
							 * ref, so patchList's `item !== prev` gate would skip them —
							 * force re-run of the row fn (carousel dots, stepper flags).
							 */
							if (isFunction(element.assignState)) {
								element.assignState(itemAtIndex);
								return;
							}
							if (LIGHT_ROW_INSTANCES.has(element) && this.liveList) {
								updateReusedElement(element, itemAtIndex, this.liveList);
								return;
							}
						}
					}
				}
			}
		}
		patchSpot(this, each(viewItems, renderFn, keyFn));
	}
	unsubscribe() {
		if (this.component && this.bindingKey) {
			unregisterListHandle(this.component, this);
		}
		if (this.liveList && this.liveList.disconnectSpot) {
			this.liveList.disconnectSpot();
		}
		this.liveList = null;
		this.keyMap = null;
		this.prevItemMap = null;
		super.unsubscribe();
	}
}
