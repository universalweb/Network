/*
 * Keyed-list machinery — the list half of the template engine: light rows
 * (`componentHTML` plain bags / `componentPartial` feature bags), shared
 * `Partial` renderers (define once → pass as list/each renderFn), `LiveList` +
 * `each()` / `list()` / `filter()` factories, the LIS-based keyed diff
 * (`patchList`), and `ListSpot`. Split out of template.js; the two modules
 * form a DELIBERATE import cycle — the runtime core dispatches LIST content
 * to `patchListKind` / `patchListAnchored` (hoisted function declarations,
 * cycle-safe), while this module calls back into the core's generic patch
 * path (`patchSpot`, `updateTemplateSpots`, `installSpotFromPlan`) at
 * runtime only. Anything BOTH sides need at eval time lives in the leaves
 * (`template/spot.js`, `template/planner.js`).
 */
import {
	BehaviorTeardown,
	getBehavior,
} from '../behaviors/index.js';
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
import { SPOT_KIND, SPOT_TYPE } from './constants.js';
import { resolveListOptions } from './listOptions.js';
import { ListVirtualController } from './listVirtual.js';
import { Partial } from './partial.js';
import { getRecipe, resolveRecipeNodes } from './planner.js';
import {
	cleanupTemplateNode, clearRange, Spot, TEMPLATE_CLEANUP,
} from './spot.js';
export { Partial } from './partial.js';
/**
 * ── Plain light (`componentHTML` / `this.plainHTML`) ───────────────────────
 * Multi-instance list cells without CE cost. Returns a bag {strings, values,
 * owner?}; list materializes via shared recipe clone + retained spots.
 * Never call-site cached. No behaviors / @events / #refs / two-way.
 */
export class ComponentHTMLTemplate {
	constructor(strings, values, owner = null) {
		this.strings = strings;
		this.values = values;
		this.owner = owner;
	}
	static is(source) {
		return source instanceof ComponentHTMLTemplate;
	}
}
/** @deprecated Use ComponentHTMLTemplate — kept for instanceof at old call sites. */
export class LightTemplate extends ComponentHTMLTemplate {
	static is(source) {
		return source instanceof ComponentHTMLTemplate;
	}
}
/**
 * ── Feature light (`componentPartial` / `this.partial`) ────────────────────
 * Same multi-instance bag shape + host-owned tooltip= / @events at materialize.
 * Never call-site cached (unlike this.htmlElement).
 */
export class ComponentPartialTemplate {
	constructor(strings, values, owner = null) {
		this.strings = strings;
		this.values = values;
		this.owner = owner;
	}
	static is(source) {
		return source instanceof ComponentPartialTemplate;
	}
}
function createRenderableElement(value, component, item, itemIndex) {
	if (ComponentPartialTemplate.is(value)) {
		return instantiatePartialRow(value, component, item, itemIndex);
	}
	if (ComponentHTMLTemplate.is(value)) {
		return instantiateLightRow(value);
	}
	if (isString(value)) {
		return createElementFromHTML(value);
	}
	if (isElement(value)) {
		return value;
	}
	throw new TypeError('List render functions must return componentHTML/componentPartial, an Element, or an HTML string.');
}
export function isCustomElementConstructor(source) {
	return isFunction(source) && source.prototype instanceof HTMLElement;
}
/**
 * Free plain-light factory (rename of free `html`). Same behavior as before.
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {ComponentHTMLTemplate}
 */
export function componentHTML(strings, ...values) {
	return new ComponentHTMLTemplate(strings, values, null);
}
/** @deprecated Use componentHTML — temporary alias (same function reference). */
export const html = componentHTML;
/**
 * Free feature-light factory — multi-instance; behaviors install when list
 * materializes with a host.
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {ComponentPartialTemplate}
 */
export function componentPartial(strings, ...values) {
	return new ComponentPartialTemplate(strings, values, null);
}
/**
 * Method twin of componentHTML — stamps owner = this (optional optimisations).
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {ComponentHTMLTemplate}
 */
export function templatePlainHTML(strings, ...values) {
	return new ComponentHTMLTemplate(strings, values, this);
}
/**
 * Method twin of componentPartial — stamps owner = this.
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {ComponentPartialTemplate}
 */
export function templatePartial(strings, ...values) {
	return new ComponentPartialTemplate(strings, values, this);
}
const LIGHT_ROW_INSTANCES = new WeakMap();
/** @type {WeakMap<Element, {spots:Array, prevExprs:Array, unsubs:Array, host:*, item:*, itemIndex:number}>} */
export const PARTIAL_ROW_INSTANCES = new WeakMap();
function assertLightTemplate(recipe, values) {
	const valuesLength = values.length;
	for (let valueIndex = 0; valueIndex < valuesLength; valueIndex++) {
		const value = values[valueIndex];
		if (isFunction(value) || isBindingType(value)) {
			throw new TypeError('componentHTML expressions must be plain values — compute inline (`${item.x * 2}`), not `${() => …}` or a binding. For tooltip=/@events use componentPartial.');
		}
	}
	if ((recipe?.refPlans?.length) || (recipe?.dataBindPlans?.length) || (recipe?.subeventPlans?.length)) {
		throw new TypeError('componentHTML does not support #refs, two-way bindings, or behaviors — use componentPartial for tooltip=/@events or a component class row.');
	}
}
function assertPartialTemplate(recipe, values) {
	if (recipe?.refPlans?.length) {
		throw new TypeError('componentPartial does not support #refs — use a component class row.');
	}
	if (recipe?.dataBindPlans?.length) {
		throw new TypeError('componentPartial does not support two-way bindings — use a component class row.');
	}
	const subeventPlans = recipe?.subeventPlans;
	if (subeventPlans) {
		const subeventCount = subeventPlans.length;
		for (let subeventIndex = 0; subeventIndex < subeventCount; subeventIndex++) {
			const attrName = subeventPlans[subeventIndex].attrName;
			if (attrName !== 'tooltip') {
				throw new TypeError(`componentPartial only allows tooltip= among behaviors (got "${attrName}").`);
			}
		}
	}
	const spotPlans = recipe?.spotPlans;
	if (!spotPlans) {
		return;
	}
	const spotCount = spotPlans.length;
	for (let spotIndex = 0; spotIndex < spotCount; spotIndex++) {
		const plan = spotPlans[spotIndex];
		if (plan.type === SPOT_TYPE.MULTI_ATTR || plan.type === SPOT_TYPE.CLASS_LIST) {
			continue;
		}
		const value = values[plan.slotIndex];
		if (plan.type === SPOT_TYPE.EVENT) {
			if (value != null && !isFunction(value)) {
				throw new TypeError('componentPartial @event handlers must be functions (host method refs).');
			}
			continue;
		}
		if (isFunction(value) || isBindingType(value)) {
			throw new TypeError('componentPartial non-event expressions must be plain values — no `${() => …}` or bindings.');
		}
	}
}
function resolveLightFragment(strings, values, component, assertFn) {
	const recipe = getRecipe(strings);
	assertFn(recipe, values);
	const fragment = recipe.fragment.cloneNode(true);
	const spotPlans = recipe.spotPlans;
	const spots = [];
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
		const spot = installSpotFromPlan(spotPlans[spotIndex], spotResolved[spotIndex], values, component);
		if (spot) {
			spots.push(spot);
		}
	}
	if (fragment.children.length !== 1) {
		throw new TypeError('componentHTML/componentPartial must have exactly one root element.');
	}
	return {
		recipe,
		root: fragment.firstElementChild,
		spots,
		resolvedNodes,
	};
}
function instantiateLightRow(lightTemplate) {
	const values = lightTemplate.values;
	const built = resolveLightFragment(lightTemplate.strings, values, null, assertLightTemplate);
	LIGHT_ROW_INSTANCES.set(built.root, {
		spots: built.spots,
		prevExprs: values.slice(),
	});
	return built.root;
}
function patchLightRow(element, lightTemplate) {
	const instance = LIGHT_ROW_INSTANCES.get(element);
	if (!instance) {
		return false;
	}
	updateTemplateSpots(instance, lightTemplate.values, null);
	return true;
}
function cleanupPartialRow(node) {
	const instance = PARTIAL_ROW_INSTANCES.get(node);
	if (!instance) {
		return;
	}
	if (instance.unsubs) {
		const unsubs = instance.unsubs;
		const unsubCount = unsubs.length;
		for (let unsubIndex = 0; unsubIndex < unsubCount; unsubIndex++) {
			const entry = unsubs[unsubIndex];
			if (entry && isFunction(entry.unsubscribe)) {
				entry.unsubscribe();
			}
		}
	}
	const spots = instance.spots;
	const spotCount = spots.length;
	for (let spotIndex = 0; spotIndex < spotCount; spotIndex++) {
		const spot = spots[spotIndex];
		if (spot && isFunction(spot.unsubscribe)) {
			spot.unsubscribe();
		}
	}
	PARTIAL_ROW_INSTANCES.delete(node);
}
function installPartialBehaviors(recipe, resolvedNodes, host, unsubs) {
	const subeventPlans = recipe.subeventPlans;
	if (!subeventPlans || !subeventPlans.length) {
		return;
	}
	const subeventCount = subeventPlans.length;
	for (let subeventIndex = 0; subeventIndex < subeventCount; subeventIndex++) {
		const plan = subeventPlans[subeventIndex];
		const element = resolvedNodes[plan.nodeSlot];
		if (!element) {
			continue;
		}
		const behavior = getBehavior(plan.attrName);
		if (behavior?.install) {
			behavior.install(element, plan.value, host);
			if (behavior.uninstall) {
				unsubs.push(new BehaviorTeardown(behavior, element));
			}
		}
	}
}
function stampPartialEventRoots(spots, root) {
	const spotCount = spots.length;
	for (let spotIndex = 0; spotIndex < spotCount; spotIndex++) {
		const spot = spots[spotIndex];
		if (spot && spot.type === SPOT_TYPE.EVENT) {
			spot.partialRoot = root;
		}
	}
}
function instantiatePartialRow(partialTemplate, component, item, itemIndex) {
	const host = partialTemplate.owner || component;
	if (!host) {
		throw new TypeError('componentPartial requires a host component at list materialize (use this.partial or a list on a component).');
	}
	const values = partialTemplate.values;
	const built = resolveLightFragment(partialTemplate.strings, values, host, assertPartialTemplate);
	const unsubs = [];
	installPartialBehaviors(built.recipe, built.resolvedNodes, host, unsubs);
	stampPartialEventRoots(built.spots, built.root);
	const instance = {
		spots: built.spots,
		prevExprs: values.slice(),
		unsubs,
		host,
		item,
		itemIndex: itemIndex ?? 0,
	};
	PARTIAL_ROW_INSTANCES.set(built.root, instance);
	built.root[TEMPLATE_CLEANUP] = cleanupPartialRow;
	return built.root;
}
function patchPartialRow(element, partialTemplate, component, item, itemIndex) {
	const instance = PARTIAL_ROW_INSTANCES.get(element);
	if (!instance) {
		return false;
	}
	const host = partialTemplate.owner || component || instance.host;
	updateTemplateSpots(instance, partialTemplate.values, host);
	instance.item = item;
	instance.itemIndex = itemIndex ?? instance.itemIndex;
	instance.host = host;
	return true;
}
function resolveRenderKind(renderFn) {
	if (isString(renderFn)) {
		return 'tag';
	}
	if (Partial.is(renderFn)) {
		return 'partial';
	}
	if (isCustomElementConstructor(renderFn)) {
		return 'class';
	}
	return 'fn';
}
/**
 * Invoke a list row renderer. `'fn'` uses host as `this` (bare method ref).
 * `'partial'` is a shared Partial — same host-as-this, via Partial.render.
 * @param {*} renderFn - LiveList.renderFn (function or Partial).
 * @param {string} kind - resolveRenderKind result (`fn` | `partial`).
 * @param {object|null|undefined} component - List host.
 * @param {*} item - Current row item.
 * @param {number} [itemIndex] - Absolute row index when known.
 * @returns {*} - Row bag, Element, or HTML string.
 */
function invokeListRenderFn(renderFn, kind, component, item, itemIndex) {
	if (kind === 'partial') {
		return renderFn.render(item, component, itemIndex);
	}
	/*
	 * A `'fn'` row renderer is called with the owning component as `this`, so a
	 * bare method ref (`this.txRow`) reads component state/helpers — same
	 * semantics as a bare-method-ref content spot. `.call(undefined, …)` when
	 * the list has no connected spot yet is just a plain call.
	 */
	return renderFn.call(component, item, itemIndex);
}
function createListElementByKind(kind, renderFn, item, component, itemIndex) {
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
	return createRenderableElement(
		invokeListRenderFn(renderFn, kind, component, item, itemIndex),
		component,
		item,
		itemIndex
	);
}
function liveListItemKey(item, index) {
	return index;
}
export class LiveList {
	items = [];
	renderFn;
	keyFn;
	/** Absolute index base for keyFn (virtual window start); 0 for full lists. */
	keyIndexOffset = 0;
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
	createElement(item, itemIndex = 0) {
		return createListElementByKind(this.kind, this.renderFn, item, this.spot?.component, itemIndex);
	}
	/** keyFn with absolute index (keyIndexOffset + relative). */
	resolveKey(item, relativeIndex) {
		return this.keyFn(item, this.keyIndexOffset + relativeIndex);
	}
	splice(start, deleteCount = 0, ...newItems) {
		if (this.spot?.virtual) {
			throw new TypeError('virtual list does not support imperative splice/push/pop/shift/unshift — mutate the bound state array and let list() re-diff');
		}
		if (!this.ownsItems) {
			this.items = this.items.slice();
			this.ownsItems = true;
		}
		const currentLength = this.items.length;
		const normalStart = start < 0 ? Math.max(0, currentLength + start) : Math.min(start, currentLength);
		const refItem = this.items[normalStart + deleteCount];
		const refKey = refItem === undefined ? null : this.resolveKey(refItem, normalStart + deleteCount);
		const refElement = this.spot && refKey !== null ? (this.spot.keyMap?.get(refKey) ?? null) : null;
		if (this.spot) {
			for (let deleteIndex = normalStart; deleteIndex < normalStart + deleteCount && deleteIndex < currentLength; deleteIndex++) {
				const itemKey = this.resolveKey(this.items[deleteIndex], deleteIndex);
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
				const itemKey = this.resolveKey(newItem, normalStart + insertIndex);
				const element = this.createElement(newItem, normalStart + insertIndex);
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
/**
 * Imperative / static keyed list. 3rd arg is keyFn or options `{ keyFn }`.
 * `virtual` is rejected — `${each(…)}` installs a StaticSpot with no refresh loop.
 */
export function each(items, renderFn, keyFnOrOpts) {
	const options = resolveListOptions(keyFnOrOpts, defaultEachKeyFn, {
		allowVirtual: false,
	});
	const listItem = new LiveList(renderFn, options.keyFn);
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
/**
 * State-bound keyed list. 3rd arg is keyFn or options `{ keyFn?, virtual? }`.
 * Options are install-frozen on ListSpot (updateSpot only swaps expr).
 */
export function list(key, renderFn, keyFnOrOpts) {
	const options = resolveListOptions(keyFnOrOpts, defaultListKeyFn);
	return new ListBinding(key, renderFn, {
		keyFn: options.keyFn,
		filterFn: null,
		virtual: options.virtual,
	});
}
/**
 * `filter(stateKey, ChildClass, test, keyFnOrOpts?)` — `list()` plus a predicate.
 * 3rd arg is the keep-test only (function or flag name); options are 4th.
 */
export function filter(key, renderFn, test, keyFnOrOpts) {
	if (isPlainObject(test)) {
		throw new TypeError('filter(key, renderFn, test, options?) — 3rd arg is the keep-test (function or flag name); pass options as the 4th argument.');
	}
	const options = resolveListOptions(keyFnOrOpts, defaultListKeyFn);
	return new ListBinding(key, renderFn, {
		keyFn: options.keyFn,
		filterFn: resolveListFilter(test),
		virtual: options.virtual,
	});
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
function updateReusedElement(element, item, itemList, itemIndex = 0) {
	const component = itemList.spot?.component;
	/*
	 * Exclusive branches — a partial root must not fall through to light patch
	 * or re-instantiate (double EventSpot / tooltip install).
	 */
	if (PARTIAL_ROW_INSTANCES.has(element)) {
		const bag = invokeListRenderFn(itemList.renderFn, itemList.kind, component, item, itemIndex);
		if (ComponentPartialTemplate.is(bag)) {
			patchPartialRow(element, bag, component, item, itemIndex);
			return element;
		}
		const partialReplacement = itemList.createElement(item, itemIndex);
		cleanupTemplateNode(element);
		element.replaceWith(partialReplacement);
		return partialReplacement;
	}
	if (LIGHT_ROW_INSTANCES.has(element)) {
		const lightBag = invokeListRenderFn(itemList.renderFn, itemList.kind, component, item, itemIndex);
		patchLightRow(element, lightBag);
		return element;
	}
	if (isFunction(element.assignState)) {
		element.assignState(item);
		return element;
	}
	const replacement = itemList.createElement(item, itemIndex);
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
function sameKeyOrder(items, itemList, oldMap) {
	const keyIterator = oldMap.keys();
	const itemsLength = items.length;
	for (let index = 0; index < itemsLength; index++) {
		if (itemList.resolveKey(items[index], index) !== keyIterator.next().value) {
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
	const { items } = itemList;
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
			const key = itemList.resolveKey(item, itemIndex);
			const element = itemList.createElement(item, itemIndex);
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
	if (itemCount === oldMap.size && sameKeyOrder(items, itemList, oldMap)) {
		const keyIterator = oldMap.keys();
		for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
			const item = items[itemIndex];
			const key = keyIterator.next().value;
			if (item !== prevItemMap.get(key)) {
				oldMap.set(key, updateReusedElement(oldMap.get(key), item, itemList, itemIndex));
				prevItemMap.set(key, item);
			} else if (PARTIAL_ROW_INSTANCES.has(oldMap.get(key))) {
				const partialMeta = PARTIAL_ROW_INSTANCES.get(oldMap.get(key));
				partialMeta.item = item;
				partialMeta.itemIndex = itemIndex;
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
		const key = itemList.resolveKey(item, itemIndex);
		let element = oldMap.get(key);
		if (element) {
			oldMap.delete(key);
			if (item !== prevItemMap.get(key)) {
				element = updateReusedElement(element, item, itemList, itemIndex);
			} else if (PARTIAL_ROW_INSTANCES.has(element)) {
				const partialMeta = PARTIAL_ROW_INSTANCES.get(element);
				partialMeta.item = item;
				partialMeta.itemIndex = itemIndex;
			}
			const source = oldOrder.get(key);
			sources[itemIndex] = source;
			if (source < highestOldSeen) {
				reordered = true;
			} else {
				highestOldSeen = source;
			}
		} else {
			element = itemList.createElement(item, itemIndex);
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
 * Keyed list — `list(key, …)` / `filter(…)`. Owns `keyMap` (key → element)
 * and `liveList` handle. Row options (renderFn/keyFn/filterFn/virtual) are
 * install-frozen from `expr` — updateSpot only swaps the binding identity.
 */
export class ListSpot extends Spot {
	constructor(element, slotIndex, spotType, expr, component, bindingKey) {
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
		// Install-frozen — never re-read from this.expr after construct.
		this.renderFn = expr.renderFn;
		this.keyFn = expr.keyFn;
		this.filterFn = expr.filterFn;
		this.virtual = expr.virtual ?? null;
		this.virtualController = null;
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
		if (this.virtual) {
			this.virtualController = new ListVirtualController(this, this.virtual);
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
	/** Scroll/resize re-entry from ListVirtualController (no changedPath). */
	requestVirtualRefresh() {
		this.refresh(null);
	}
	refresh(changedPath = null) {
		const {
			component, bindingKey, renderFn, keyFn, filterFn, virtual,
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
		 *
		 * Under virtual, keyMap is window-sized so length===keyMap.size is
		 * always false — membership of the key replaces that gate.
		 */
		const mapSizeOk = virtual ? Boolean(this.keyMap) : this.keyMap && viewItems.length === this.keyMap.size;
		if (
			!filterFn &&
			changedPath &&
			changedPath !== bindingKey &&
			changedPath.startsWith(this.bindingKeyPrefix) &&
			mapSizeOk
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
							 * rows take assignState. Light html + feature partial rows keep
							 * the SAME item ref, so patchList's `item !== prev` gate would
							 * skip them — force re-run of the row fn (carousel dots,
							 * legend muted, detail-list copied flash).
							 * Store the return — a partial-to-non-partial swap replaces the node.
							 */
							if (isFunction(element.assignState)) {
								element.assignState(itemAtIndex);
								return;
							}
							if (
								this.liveList &&
								(LIGHT_ROW_INSTANCES.has(element) || PARTIAL_ROW_INSTANCES.has(element))
							) {
								this.keyMap.set(itemKey, updateReusedElement(element, itemAtIndex, this.liveList, index));
								return;
							}
						} else if (virtual) {
							// Offscreen under the window — state already holds the write.
							return;
						}
					}
				}
			}
		}
		if (virtual) {
			this.patchVirtual(viewItems, renderFn, keyFn);
			return;
		}
		patchSpot(this, each(viewItems, renderFn, keyFn));
	}
	/**
	 * Window slice + absolute key offset → patchList, then measure mounted rows.
	 * @param {Array} viewItems - Full view array.
	 * @param {*} renderFn - Row render.
	 * @param {Function} keyFn - Absolute-index keyFn (spot.keyFn).
	 */
	patchVirtual(viewItems, renderFn, keyFn) {
		const controller = this.virtualController;
		if (!controller) {
			patchSpot(this, each(viewItems, renderFn, keyFn));
			return;
		}
		if (!controller.attached) {
			controller.attach();
		}
		const slice = controller.recompute(viewItems, keyFn);
		const live = each(slice.items, renderFn, keyFn);
		live.keyIndexOffset = slice.start;
		patchSpot(this, live);
		// After DOM is in place, measure heights (rAF-coalesced self-heal path also runs).
		controller.measureMounted(this.keyMap);
		// Optional host hook (e.g. ui-collection visible-page URL sync).
		const onWindow = this.onVirtualWindow;
		if (typeof onWindow === 'function') {
			onWindow.call(this.component, slice.start, slice.end);
		}
	}
	unsubscribe() {
		if (this.virtualController) {
			this.virtualController.detach();
			this.virtualController = null;
		}
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
