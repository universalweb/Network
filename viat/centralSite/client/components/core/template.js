/* eslint-disable no-restricted-syntax */
import { resolveStores } from './attrs/staticConfig.js';
import { behaviorAttrNames, BehaviorTeardown, getBehavior } from './behaviors/index.js';
import { defaultLogger, IS_PRODUCTION } from './debug/logger.js';
import { Perf } from './debug/perf.js';
import { projectPortals, removePortals } from './dom/portal.js';
import { captureLightChildren, projectLightChildren } from './dom/projection.js';
import { isValidRefName, registerRef } from './dom/refs.js';
import { markSpotDirty } from './lifecycle/scheduler.js';
import {
	addDep,
	bind,
	CONTENT_KIND,
	isBindingType,
	ListBinding,
	makeProxy,
	RemoteListBinding,
	track,
} from './state/binding.js';
import { globalRealm, storeRealm } from './state/globalState.js';
import { resolveListFilter } from './state/listFilter.js';
import { mountRemoteController } from './state/remoteList.js';
import {
	ensureStateBus,
	linkStateCarrier,
	localRealm,
	STATE_PATH,
} from './state/state.js';
import {
	ANCHOR_END_PREFIX,
	ANCHOR_START_PREFIX,
	SPOT,
	SPOT_KIND,
	SPOT_TYPE,
} from './template/constants.js';
import {
	bareAttrMarkerAttribute,
	bindMarkerAttribute,
	buildHTML,
	eventMarkerAttribute,
	inferBareAttrName,
	methodMarkerAttribute,
	multiAttrMarkerAttribute,
} from './template/parser.js';
import {
	clearRealmUnsubs,
	clearUnsubs,
	createElementFromHTML,
	disposeItem,
	eachArray,
	getValueAtPath,
	isArrayBuffer,
	isElement,
	isFunction,
	isMap,
	isNode,
	isPlainObject,
	isPromise,
	isSet,
	isString,
	setValueAtPath,
	syncSubsByDiff,
	toBase64Url,
} from './utilities.js';
const SUBEVENT_ATTRS = behaviorAttrNames();
/**
 * Behavior-attribute attribute application. The template extractor strips the
 * raw `tooltip="…"` / `hotkey="…"` etc. attributes; this function reflects the
 * (possibly dynamic) value to the behavior. If the behavior exposes an
 * `applyValue(element, value)` hook, it owns the update — typically by writing a
 * WeakMap registry instead of mutating the DOM (tooltip lives here). For
 * legacy behaviors with no hook the value is reflected into a sibling
 * `data-<name>` attribute that the behavior reads on demand.
 */
function applySubeventAttr(element, attrName, value) {
	if (!SUBEVENT_ATTRS.has(attrName)) {
		return false;
	}
	if (element.hasAttribute(attrName)) {
		element.removeAttribute(attrName);
	}
	const behavior = getBehavior(attrName);
	if (behavior && isFunction(behavior.applyValue)) {
		behavior.applyValue(element, value);
		return true;
	}
	const isEmpty = value == null || value === false || value === '';
	if (isEmpty) {
		element.removeAttribute(`data-${attrName}`);
		return true;
	}
	const next = value === true ? '' : String(value);
	element.setAttribute(`data-${attrName}`, next);
	return true;
}
export class ClassList {
	static isClassList(value) {
		return value instanceof ClassList;
	}
	isClassList = true;
	constructor(...items) {
		this.items = items;
	}
	async create(...args) {
		const source = new ClassList(...args);
		return source;
	}
}
export function classList(...items) {
	return new ClassList(...items);
}
const STYLE_CAMEL_BOUNDARY = /[A-Z]/g;
function kebabStyleReplacer(match) {
	return `-${match.toLowerCase()}`;
}
function styleProp(prop) {
	if (prop.startsWith('--')) {
		return prop;
	}
	return prop.replace(STYLE_CAMEL_BOUNDARY, kebabStyleReplacer);
}
/**
 * Inline-style object → cssText, for `style=${...}` or `.style=${...}`. Keys are
 * kebab-cased automatically (`fontSize` → `font-size`); `--custom-prop` keys pass
 * through; null / undefined / false values drop the declaration. A pure helper —
 * no spot machinery — so reactivity comes from a thunk:
 * `style=${() => styles({ color: state.c })}`.
 * @param {object} styleObject - Map of CSS properties to values.
 * @returns {string} The serialized cssText (`prop:value;` joined).
 */
export function styles(styleObject) {
	if (!styleObject || typeof styleObject !== 'object') {
		return '';
	}
	let cssText = '';
	const keys = Object.keys(styleObject);
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index++) {
		const prop = keys[index];
		const value = styleObject[prop];
		if (value === null || value === undefined || value === false) {
			continue;
		}
		cssText += `${styleProp(prop)}:${value};`;
	}
	return cssText;
}
function addTokens(source, target) {
	if (!isString(source)) {
		return;
	}
	const tokens = source.split(/\s+/);
	const tokensLength = tokens.length;
	for (let index = 0; index < tokensLength; index++) {
		const token = tokens[index];
		if (token) {
			target.add(token);
		}
	}
}
function applyClassListItems(items, desired, deps, component) {
	const itemsLength = items.length;
	for (let index = 0; index < itemsLength; index++) {
		const item = items[index];
		if (isString(item)) {
			addTokens(item, desired);
			continue;
		}
		if (item == null || item === false) {
			continue;
		}
		if (isFunction(item)) {
			let evalValue;
			if (component) {
				const evaluated = evaluateTrackedExpression(component, item);
				mergeDepMap(deps, evaluated.deps);
				evalValue = evaluated.value;
			} else {
				evalValue = item();
			}
			if (isString(evalValue)) {
				addTokens(evalValue, desired);
			} else if (evalValue) {
				applyClassListItems([evalValue], desired, deps, component);
			}
			continue;
		}
		if (isBindingType(item)) {
			if (component) {
				const keyRealm = realmForBinding(item, component);
				addDep(deps, keyRealm.realm, keyRealm.path);
			}
			const value = component ? resolveBindingValueForBinding(component, item) : item.value;
			if (isString(value)) {
				addTokens(value, desired);
			} else if (value) {
				applyClassListItems([value], desired, deps, component);
			}
			continue;
		}
		if (isSet(item)) {
			for (const token of item) {
				if (isString(token)) {
					desired.add(token);
				}
			}
			const carrier = item[STATE_PATH];
			if (carrier) {
				addDep(deps, carrier.realm, carrier.path);
			}
			continue;
		}
		if (Array.isArray(item)) {
			applyClassListItems(item, desired, deps, component);
			const carrier = item[STATE_PATH];
			if (carrier) {
				addDep(deps, carrier.realm, carrier.path);
			}
			continue;
		}
		if (isMap(item)) {
			for (const [
				token,
				enabled,
			] of item) {
				if (enabled && isString(token)) {
					desired.add(token);
				}
			}
			const carrier = item[STATE_PATH];
			if (carrier) {
				addDep(deps, carrier.realm, carrier.path);
			}
			continue;
		}
		const keys = Object.keys(item);
		const keysLength = keys.length;
		for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
			const key = keys[keyIndex];
			const value = item[key];
			let resolved = value;
			if (isFunction(value)) {
				if (component) {
					const evaluated = evaluateTrackedExpression(component, value);
					mergeDepMap(deps, evaluated.deps);
					resolved = evaluated.value;
				} else {
					resolved = value();
				}
			}
			if (resolved) {
				desired.add(key);
			}
		}
	}
}
function diffClassList(element, current, desired) {
	for (const token of current) {
		if (!desired.has(token)) {
			element.classList.remove(token);
		}
	}
	for (const token of desired) {
		if (!current.has(token)) {
			element.classList.add(token);
		}
	}
}
const TEMPLATE_CLEANUP = Symbol('templateCleanup');
const BINDABLE_TAGS = new Set([
	'INPUT', 'SELECT', 'TEXTAREA',
]);
const BINDABLE_ATTRS = new Set(['value', 'checked']);
function cleanupTemplateNode(node) {
	if (!node) {
		return;
	}
	const cleanup = node[TEMPLATE_CLEANUP];
	if (!isFunction(cleanup)) {
		return;
	}
	node[TEMPLATE_CLEANUP] = null;
	cleanup(node);
}
/**
 * Remove every node strictly BETWEEN an anchored spot's two comment markers,
 * leaving the comments themselves in place. The anchored counterpart to a
 * wrapper's `element.textContent = ''` / `element.innerHTML =` wipe — it touches only the
 * spot's own range, never the static siblings that share the parent element.
 * `cleanupTemplateNode` runs per removed node (idempotent) so nested template
 * instances (list rows, html fragments) release their spots/subscriptions.
 */
function clearRange(startComment, endComment) {
	let node = startComment.nextSibling;
	while (node && node !== endComment) {
		const next = node.nextSibling;
		cleanupTemplateNode(node);
		node.remove();
		node = next;
	}
}
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
function isCustomElementConstructor(source) {
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
	const spotResolved = new Array(spotPlans.length);
	const spotPlansLength = spotPlans.length;
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		spotResolved[spotIndex] = resolveSpotNode(spotPlans[spotIndex], fragment);
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
class ComponentBinding {
	constructor(value) {
		this.value = value;
	}
	static is(source) {
		return source instanceof ComponentBinding;
	}
}
export function comp(value) {
	return new ComponentBinding(value);
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
		 * Own a shallow copy directly. The fresh LiveList has no spot yet, so
		 * `push(...items)` would only populate `items` anyway — but the spread
		 * passes N args through splice (cost scales with N: ~10µs/call @5k); a
		 * native slice is far cheaper and the copy keeps imperative liveList
		 * mutations off the caller's array.
		 */
		listItem.items = items.slice();
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
function autoKey(item, index) {
	return item?.key ?? item?.id ?? index;
}
/**
 * `remoteList(key, renderFn, config)` — `list()` plus an async load controller
 * (infinite-scroll and/or a load-more button + spinner). Renders identically to
 * `list()`/`filter()` (same `ListSpot`; `renderFn` is a bare method ref or a
 * component class; `config.filter` reuses the `filter()` predicate verbatim). The
 * template mount-hook attaches a `RemoteListController` that drives `config.loader`
 * ({reset, cursor, signal}) → {items, nextCursor, hasMore}), appends pages into
 * `state[key]`, and exposes `this.remote(key)` for `reset()` / `loadMore()`.
 * @param {string} key - State key holding the items array.
 * @param {Function|CustomElementConstructor} renderFn - Row method ref or component class.
 * @param {object} config - `{ loader, mode, auto, filter, keyFn, spinner, loadMore, prefetch, dedupe, scroller, scrollReport }`.
 * @returns {RemoteListBinding} The binding to interpolate in the template.
 */
export function remoteList(key, renderFn, config = {}) {
	const keyFn = config.keyFn ?? autoKey;
	const filterFn = config.filter === undefined ? null : resolveListFilter(config.filter);
	return new RemoteListBinding(key, renderFn, keyFn, filterFn, config);
}
/* Resolve an `ifThen` branch to a value the content-kind dispatch understands. A
   value passes straight through (text/empty, equality-guarded by patchTextStrict);
   a component class is instantiated ONCE and cached, so a re-evaluation that did
   NOT flip returns the SAME node and `patchComponentKind` no-ops — no rebuild, no
   lifecycle churn. Only an actual flip swaps the subtree. Defined before `ifThen`
   so the factory references a hoisted leaf. */
function resolveIfThenBranch(branch, branchNodes) {
	if (branch === null || branch === undefined) {
		return null;
	}
	if (isString(branch) || typeof branch === 'number' || typeof branch === 'boolean') {
		return branch;
	}
	if (isCustomElementConstructor(branch)) {
		let node = branchNodes.get(branch);
		if (!node) {
			const BranchComponent = branch;
			node = new BranchComponent();
			branchNodes.set(branch, node);
		}
		return node;
	}
	if (isNode(branch) || ComponentBinding.is(branch) || LiveList.isLiveList(branch)) {
		return branch;
	}
	throw new TypeError('ifThen() branch must be a value (string/number/boolean/null), a component class, or built content (Node/comp()/list). For reactive branch markup, use a component class — a raw inline html`` block is not a reactive branch.');
}
/**
 * `ifThen(condition, thenBranch, elseBranch?)` — fine-reactive conditional (named
 * `ifThen` because `when` shadows the `window.when` browser global). Returns a
 * thunk the engine installs as a per-spot `ComputedSpot` (NO whole-component
 * re-render): it tracks only what `condition` reads and patches just this spot
 * when the result flips.
 *
 *   condition  — a state-key STRING (truthy `state[key]`) OR a fn (`() => cond`,
 *                called with the component as `this`).
 *   then/else  — a VALUE (string / number / boolean / null → text or empty,
 *                equality-guarded) OR a component CLASS (instantiated on first
 *                activation, then cached + reused; the component owns its own
 *                reactive graph, so its inner content updates independently). A
 *                pre-built Node / `comp()` / list value is also passed through.
 *
 * A flip mounts the entering branch and unmounts the leaving one — a correct
 * disconnect/reconnect, NOT churn. A raw inline `` html`` `` block is NOT a
 * reactive branch: it is a value-only `LightTemplate` with no per-spot graph (it
 * would go stale or rebuild wholesale). Use a component class for reactive markup.
 * @param {string|Function} condition - State-key, or a boolean-returning fn.
 * @param {*} thenBranch - Branch shown when the condition is truthy.
 * @param {*} [elseBranch] - Branch shown otherwise (default: render nothing).
 * @returns {Function} A thunk to interpolate in a content position: `${ifThen(...)}`.
 */
export function ifThen(condition, thenBranch, elseBranch = null) {
	const conditionIsKey = isString(condition);
	const branchNodes = new Map();
	return function ifThenSpot() {
		const active = conditionIsKey ? Boolean(getValueAtPath(this.state, condition)) : Boolean(condition.call(this));
		return resolveIfThenBranch(active ? thenBranch : elseBranch, branchNodes);
	};
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
function patchList(spot, itemList) {
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
function clearSubscriptions(subscriptions = []) {
	eachArray(subscriptions, disposeItem);
	return [];
}
function resolveBindingValue(component, bindingKey) {
	const resolved = realmForKey(bindingKey, component);
	return resolved.realm.read(resolved.path);
}
function ensureRenderProxies(component) {
	const currentState = component.STATE ?? {};
	if (!component.renderProxy || component.renderProxyState !== currentState) {
		component.renderProxy = makeProxy(currentState, component);
		component.renderProxyState = currentState;
	}
}
function evaluateTrackedExpression(component, expr) {
	ensureRenderProxies(component);
	const previousRenderTracking = component.renderTracking;
	component.renderTracking = true;
	const result = track(expr, component);
	component.renderTracking = previousRenderTracking;
	return result;
}
function subscribeStatePath(component, statePath, handler, target) {
	return ensureStateBus(component).subscribe(statePath, handler, target);
}
/**
 * Resolve the realm + bare path for a keyed binding. The `global.` prefix is
 * the only string parsed (authoring-time origin), and only at spot setup — the
 * returned realm object then carries bus / read / write so nothing downstream
 * re-parses.
 */
function realmForKey(key, component) {
	if (key.startsWith('global.')) {
		return {
			realm: globalRealm,
			path: key.slice(7),
		};
	}
	return {
		realm: localRealm(component),
		path: key,
	};
}
/*
 * Channel-carry realm resolution for a Binding — the read-side twin of
 * `parseBindingChannel` in the Binding constructor. The channel was resolved
 * ONCE at authoring into `.global` / `.storeName` + a BARE `.key`, so the realm
 * comes from the carried data; downstream never re-parses the key string (using
 * `realmForKey` on a binding's bare key would silently resolve it LOCAL). A
 * `stores.<name>.` binding resolves the Store instance against the component
 * CLASS's merged `static stores` table here, at spot install — an undeclared
 * name is an authoring error and throws with the offending key.
 */
function realmForBinding(binding, component) {
	if (binding.storeName !== null) {
		const store = resolveStores(component.constructor)[binding.storeName];
		if (!store) {
			throw new Error(`<${component.localName}> binds "stores.${binding.storeName}.${binding.key}" but declares no store "${binding.storeName}" in static stores.`);
		}
		return {
			realm: storeRealm(store),
			path: binding.key,
		};
	}
	return {
		realm: binding.global ? globalRealm : localRealm(component),
		path: binding.key,
	};
}
function resolveBindingValueForBinding(component, binding) {
	const resolved = realmForBinding(binding, component);
	return resolved.realm.read(resolved.path);
}
// A one-entry dependency Map<realm, Set<path>> for a single keyed binding.
function singleDepMap(realm, path) {
	const depMap = new Map();
	depMap.set(realm, new Set([path]));
	return depMap;
}
/**
 * One-entry dep Map straight from a Binding + component (bind / list spots whose
 * single key is fixed at install). Flag-aware — routes a global bind to the
 * global realm even though the key string is prefix-stripped.
 */
function bindingDepMap(binding, component) {
	const resolved = realmForBinding(binding, component);
	return singleDepMap(resolved.realm, resolved.path);
}
/**
 * If a dep Map<realm, Set<path>> holds EXACTLY ONE path total, return its
 * {realm, path}; else null. Used by two-way inference (a single unambiguous dep
 * makes the expression a valid bind source).
 */
function singleDepOf(depMap) {
	let found = null;
	let count = 0;
	for (const [
		realm,
		paths,
	] of depMap) {
		for (const path of paths) {
			count += 1;
			if (count > 1) {
				return null;
			}
			found = {
				realm,
				path,
			};
		}
	}
	return count === 1 ? found : null;
}
// Fold one Map<realm, Set<path>> into another (computed-spot / classList merge).
function mergeDepMap(target, source) {
	for (const [
		realm,
		paths,
	] of source) {
		for (const path of paths) {
			addDep(target, realm, path);
		}
	}
}
/**
 * Subscribe one bare path to its realm's bus, dispatching `spot.handle` (a
 * shared prototype method — no per-spot closure). `ctx` carries the realm (its
 * bus) and the spot (bus target). Routing is by realm reference, no parsing.
 * LIST spots subscribe `multiPath` so the flush delivers every overlapping
 * changed path (a batch of sibling `items.N.x` mutations), not just the first —
 * `Spot.handle` accumulates them and `ListSpot.drain` replays per path.
 */
function subscribeRealmSpotDep(path, ctx) {
	return ctx.realm.bus.subscribe(path, ctx.spot.handle, ctx.spot, ctx.spot.kind === SPOT_KIND.LIST);
}
/**
 * `deps` is a Map<realm, Set<path>>; `spot.depMap` is the 2-level unsub store
 * Map<realm, Map<path, unsub>>. Diff each realm's paths against its own submap,
 * disposing realms that vanished from this evaluation.
 */
function syncSpotSubscriptions(spot, deps) {
	let store = spot.depMap;
	if (!store) {
		store = new Map();
		spot.depMap = store;
	}
	if (store.size) {
		const realms = [...store.keys()];
		const realmsLength = realms.length;
		for (let realmIndex = 0; realmIndex < realmsLength; realmIndex++) {
			const realm = realms[realmIndex];
			if (!deps.has(realm)) {
				clearUnsubs(store.get(realm));
				store.delete(realm);
			}
		}
	}
	for (const [
		realm,
		paths,
	] of deps) {
		let submap = store.get(realm);
		if (!submap) {
			submap = new Map();
			store.set(realm, submap);
		}
		syncSubsByDiff(submap, paths, subscribeRealmSpotDep, {
			realm,
			spot,
		});
	}
}
/**
 * Text-position spots cache a specialized patcher in spot.patch so subsequent
 * patches skip kind detection. Hot path is one virtual call per patch.
 */
function patchListKind(spot, value) {
	if (!spot.keyMap && spot.element.firstChild) {
		spot.element.textContent = '';
	}
	patchList(spot, value);
}
function patchComponentKind(spot, value) {
	const node = ComponentBinding.is(value) ? value.value : value;
	if (spot.element.firstChild === node) {
		return;
	}
	spot.element.textContent = '';
	if (node) {
		spot.element.appendChild(node);
	}
}
function patchHtmlKind(spot, value) {
	spot.element.innerHTML = String(value ?? '');
}
/*
 * JSON-for-display replacer: BigInt-safe (stringified — wallet amounts survive)
 * and circular-safe (`[Circular]`), so an object/array spot never throws. The
 * `seen` set lives at module scope (reset per `jsonDisplay` call) so the
 * replacer stays a first-class declaration with no per-call closure.
 */
let jsonDisplaySeen = null;
function jsonDisplayReplacer(replacerKey, replacerValue) {
	if (typeof replacerValue === 'bigint') {
		return String(replacerValue);
	}
	if (replacerValue !== null && typeof replacerValue === 'object') {
		if (jsonDisplaySeen.has(replacerValue)) {
			return '[Circular]';
		}
		jsonDisplaySeen.add(replacerValue);
	}
	return replacerValue;
}
function jsonDisplay(value) {
	jsonDisplaySeen = new WeakSet();
	const result = JSON.stringify(value, jsonDisplayReplacer) ?? '';
	jsonDisplaySeen = null;
	return result;
}
/**
 * Render any non-HTML value as a plain display string for textContent:
 *   number / bigint / boolean / (string)  → String()
 *   TypedArray / DataView / ArrayBuffer    → base64url (display form)
 *   plain object / array                   → JSON (BigInt- & circular-safe)
 */
function valueToText(value) {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value !== 'object') {
		return String(value);
	}
	if (ArrayBuffer.isView(value) || isArrayBuffer(value)) {
		return toBase64Url(value);
	}
	return jsonDisplay(value);
}
/*
 * Migration / safety net (dev-only). A text-position spot that receives a
 * markup-bearing STRING now renders it as escaped textContent — the safe,
 * fast default (see classifyContentKind below). If the author intended HTML
 * they must opt in (`^html` / bind.html / `static properties {kind:'html'}`).
 * Warn ONCE per spot (WeakSet dedup — keeps the Spot shape monomorphic and a
 * list render loop can't flood the console) and only on a TAG-LIKE string
 * (`/<[a-z!/]/i` ignores lone `<` in prose like "1 < 2"). Hard-noop in
 * production: `AUDIT_TEXT_HTML` is a build-time false there, so the guarded
 * call folds away and never pays the scan.
 */
const AUDIT_TEXT_HTML = !IS_PRODUCTION;
const HTML_TAGLIKE_RE = /<[a-z!/]/i;
const htmlInTextWarned = new WeakSet();
function formatHtmlInTextWarning(spot, value) {
	const tag = spot.component?.tagName ?? 'text-spot';
	return `[${tag}] markup string rendered as TEXT (escaped). If HTML is intended use ^html / bind.html / static properties {kind:'html'}. value="${value.slice(0, 80)}"`;
}
function warnHtmlInText(spot, value) {
	if (spot.declaredKind || !isString(value) || htmlInTextWarned.has(spot)) {
		return;
	}
	if (!HTML_TAGLIKE_RE.test(value)) {
		return;
	}
	htmlInTextWarned.add(spot);
	defaultLogger.warn('template', formatHtmlInTextWarning, spot, value);
}
/**
 * The text patcher — straight textContent (via `valueToText`), no markup scan.
 * The DEFAULT for every text-position string (XSS-safe, ~2.7–10.9× faster than
 * innerHTML — measured), plus numbers / bigints / buffers / objects and any
 * spot DECLARED `text` (`^text` / `static properties` `kind:'text'` / bind.text).
 * HTML is reached only by an explicit `html` declaration. Equality-guarded so an
 * unchanged value short-circuits.
 */
function patchTextStrict(spot, value) {
	if (AUDIT_TEXT_HTML) {
		warnHtmlInText(spot, value);
	}
	const str = valueToText(value);
	if (spot.element.textContent !== str) {
		spot.element.textContent = str;
	}
}
/**
 * ── Content-kind classification ──────────────────────────────────────
 * classifyContentKind() is the SINGLE decision point that answers
 * "what kind of content is this ${…}?". Every text-position value
 * resolves to exactly one CONTENT_KIND (defined in binding.js);
 * CONTENT_PATCHERS maps each kind to its patch routine. To add a kind:
 * extend CONTENT_KIND, this function, and CONTENT_PATCHERS.
 *
 *   EMPTY      null | undefined | ''          → cleared via patchTextStrict
 *   LIST       a LiveList (each() / list())   → patchListKind     keyed diff
 *   COMPONENT  a comp() binding or a Node     → patchComponentKind  adopt node
 *   TEXT       string / number / non-object   → patchTextStrict   textContent (DEFAULT)
 *   HTML       only via explicit declaration  → patchHtmlKind     innerHTML
 * ─────────────────────────────────────────────────────────────────────
 */
function classifyContentKind(value) {
	if (value === null || value === undefined || value === '') {
		return CONTENT_KIND.EMPTY;
	}
	if (LiveList.isLiveList(value)) {
		return CONTENT_KIND.LIST;
	}
	if (ComponentBinding.is(value) || isNode(value)) {
		return CONTENT_KIND.COMPONENT;
	}
	/*
	 * Strings DEFAULT to textContent (TEXT) — XSS-safe, correct for arbitrary
	 * text (no `<`/`&` mangling), and ~2.7–10.9× faster than innerHTML (measured).
	 * HTML is NEVER auto-classified: render markup only by opting IN per-spot via
	 * `^html` / bind.html / `static properties {kind:'html'}` (→ spot.declaredKind,
	 * which short-circuits this function in bindSpotKind). The dev-only
	 * `warnHtmlInText` net flags any markup string that slips through undeclared.
	 */
	return CONTENT_KIND.TEXT;
}
/*
 * Kind → patcher. EMPTY and TEXT (the string default + numbers / bigints /
 * non-strings) use the strict textContent patcher; HTML (declared-only) uses
 * innerHTML. No auto / self-correcting path — `bindSpotKind` dispatches straight
 * through this table.
 */
const CONTENT_PATCHERS = {
	[CONTENT_KIND.EMPTY]: patchTextStrict,
	[CONTENT_KIND.TEXT]: patchTextStrict,
	[CONTENT_KIND.HTML]: patchHtmlKind,
	[CONTENT_KIND.COMPONENT]: patchComponentKind,
	[CONTENT_KIND.LIST]: patchListKind,
};
/**
 * Anchored mirror of CONTENT_PATCHERS. Every routine operates on the comment-
 * bounded range (startComment … endComment) inside a parent shared with static
 * siblings — so it NEVER reads/writes the parent's whole textContent/innerHTML.
 * `spot.textNode` caches the single managed text node for the hot TEXT path.
 */
function patchTextAnchored(spot, value) {
	const str = valueToText(value);
	const textNode = spot.textNode;
	// Fast path: our text node still solely occupies the range — mutate its data.
	if (textNode !== null && textNode.parentNode !== null &&
		textNode.previousSibling === spot.startComment && textNode.nextSibling === spot.endComment) {
		if (textNode.data !== str) {
			textNode.data = str;
		}
		return;
	}
	// Range held other content (or first patch) — clear it, drop in a fresh node.
	clearRange(spot.startComment, spot.endComment);
	const fresh = document.createTextNode(str);
	spot.textNode = fresh;
	spot.startComment.parentNode.insertBefore(fresh, spot.endComment);
}
function patchHtmlAnchored(spot, value) {
	clearRange(spot.startComment, spot.endComment);
	spot.textNode = null;
	const str = String(value ?? '');
	if (str === '') {
		return;
	}
	/*
	 * Parse via an INERT <template> — script-inert, matching the wrapper path's
	 * `element.innerHTML` semantics. NOT `Range.createContextualFragment`, which is an
	 * XSS sink that EXECUTES embedded <script>. Then splice the parsed nodes into
	 * the comment-bounded range. (Also drops the per-patch Range allocation.)
	 */
	const parsed = document.createElement('template');
	parsed.innerHTML = str;
	spot.startComment.parentNode.insertBefore(parsed.content, spot.endComment);
}
function patchComponentAnchored(spot, value) {
	const node = ComponentBinding.is(value) ? value.value : value;
	if (spot.startComment.nextSibling === node &&
		(node === null || node.nextSibling === spot.endComment)) {
		return;
	}
	clearRange(spot.startComment, spot.endComment);
	spot.textNode = null;
	if (node) {
		spot.startComment.parentNode.insertBefore(node, spot.endComment);
	}
}
function patchListAnchored(spot, value) {
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
const CONTENT_PATCHERS_ANCHORED = {
	[CONTENT_KIND.EMPTY]: patchTextAnchored,
	[CONTENT_KIND.TEXT]: patchTextAnchored,
	[CONTENT_KIND.HTML]: patchHtmlAnchored,
	[CONTENT_KIND.COMPONENT]: patchComponentAnchored,
	[CONTENT_KIND.LIST]: patchListAnchored,
};
/**
 * A spot's contents-wrapper stays hit-testable only when it holds real
 * elements (a list, a component, or markup with tags). Pure text and
 * entity-only HTML opt out so the wrapper never intercepts pointer events.
 */
function spotKeepsInteractive(kind, value) {
	if (kind === CONTENT_KIND.LIST || kind === CONTENT_KIND.COMPONENT) {
		return true;
	}
	if (kind === CONTENT_KIND.HTML) {
		return String(value ?? '').includes('<');
	}
	return false;
}
/**
 * Resolve and cache the patcher for a text-position spot. `spot.declaredKind`
 * (set from a typed bind or `static properties`) short-circuits classification.
 */
function bindSpotKind(spot, value) {
	let kind = spot.declaredKind ?? classifyContentKind(value);
	/**
	 * A declared HTML kind means "a STRING here is trusted markup" — but the same
	 * slot may also receive a Node / LiveList (e.g. Panel's `renderBody` returns a
	 * markup string OR an `htmlElement` element, depending on the subclass).
	 * Forcing innerHTML on those would stringify them to "[object HTMLDivElement]"
	 * or defeat keyed list-diffing, so a NON-string value at a declared-HTML spot
	 * falls back to normal classification (COMPONENT adopts the node, LIST diffs).
	 * The common case — a string at a declared-HTML spot — skips this branch and
	 * stays on the fast cached path with no re-classification.
	 */
	if (kind === CONTENT_KIND.HTML && value !== null && value !== undefined && !isString(value)) {
		kind = classifyContentKind(value);
	}
	spot.contentKind = kind;
	/*
	 * No auto-detection: each kind maps straight to its patcher. A string is
	 * TEXT (textContent — the safe default), HTML is reached only via an explicit
	 * `^html` / bind.html / `static properties {kind:'html'}` declaration on
	 * `spot.declaredKind` above (and even then only strings render as innerHTML —
	 * see the polymorphic-slot guard immediately above).
	 */
	spot.patch = (spot.anchored ? CONTENT_PATCHERS_ANCHORED : CONTENT_PATCHERS)[kind];
	if (!spot.elided && !spot.anchored) {
		/*
		 * Wrapper <span> only: a folded marker (elided) or a comment range
		 * (anchored) lives on/around a real element whose pointer behavior
		 * belongs to the app — never force it (keeps text selectable / copyable,
		 * fixes the unclickable `<button>${x}</button>`).
		 */
		spot.element.style.pointerEvents = spotKeepsInteractive(kind, value) ? '' : 'none';
	}
}
/**
 * Module-scope error reporter — replaces the per-fire `.catch((error) => …)`
 * arrow. The `.then` callback still allocates a closure per fire (it MUST
 * capture `spot` + the per-fire `token` to reject stale resolutions, and
 * `.then` callbacks have no `this` binding). One closure saved out of two.
 */
function reportAsyncSpotError(error) {
	console.error('[template] async spot error:', error);
}
/**
 * Apply an object-valued `style=${{...}}` binding (styleMap parity) per-property
 * instead of stringifying it to `[object Object]`. Dashed (`background-color`)
 * and custom (`--gap`) keys go through `setProperty`; camelCase / single-word
 * keys assign directly (`style.color`). `null` / `undefined` / `false` values
 * drop the property. Keys present last patch but absent now are removed, so the
 * binding is diff-driven across updates. `spot.prevStyleKeys` tracks the applied
 * set on the spot (no per-element WeakMap needed — one spot owns one style attr).
 * Called from BOTH value-application paths: first render / BindingSpot drain
 * (patchSpotBody) and the patch-pass re-render (updateSpot's ATTR branch).
 * @param {object} spot - The ATTR spot whose element receives the styles.
 * @param {object} value - The plain-object style map.
 */
function applyStyleObject(spot, value) {
	const elementStyle = spot.element.style;
	/*
	 * Mixed-form binding (string last patch, object now): the string apply
	 * replaced the WHOLE attribute, so its properties aren't in prevStyleKeys and
	 * would linger under per-key diffing. Wipe the inline styles first — the
	 * string already clobbered any externally-set inline styles, so the wipe
	 * loses nothing the binding didn't already own.
	 */
	if (spot.styleWasString) {
		elementStyle.cssText = '';
		spot.styleWasString = false;
	}
	const previousKeys = spot.prevStyleKeys;
	const nextKeys = new Set();
	const keys = Object.keys(value);
	const keysLength = keys.length;
	for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
		const styleKey = keys[keyIndex];
		const styleValue = value[styleKey];
		if (styleValue === null || styleValue === undefined || styleValue === false) {
			continue;
		}
		nextKeys.add(styleKey);
		if (styleKey.includes('-')) {
			elementStyle.setProperty(styleKey, String(styleValue));
		} else {
			elementStyle[styleKey] = styleValue;
		}
	}
	if (previousKeys) {
		const staleKeys = [...previousKeys];
		const staleKeysLength = staleKeys.length;
		for (let staleIndex = 0; staleIndex < staleKeysLength; staleIndex++) {
			const staleKey = staleKeys[staleIndex];
			if (nextKeys.has(staleKey)) {
				continue;
			}
			if (staleKey.includes('-')) {
				elementStyle.removeProperty(staleKey);
			} else {
				elementStyle[staleKey] = '';
			}
		}
	}
	spot.prevStyleKeys = nextKeys;
}
async function patchSpotBodyPromise(value, spot, token) {
	value.catch(reportAsyncSpotError);
	const item = await value;
	if (spot.patchToken !== token) {
		return;
	}
	patchSpot(spot, item);
}
function patchSpotBody(spot, value) {
	if (isPromise(value)) {
		const token = (spot.patchToken ?? 0) + 1;
		spot.patchToken = token;
		patchSpotBodyPromise(value, spot, token);
		return;
	}
	if (spot.type === SPOT_TYPE.TEXT) {
		if (spot.keyMap && !LiveList.isLiveList(value)) {
			spot.keyMap.forEach(cleanupTemplateNode);
			spot.keyMap = null;
			spot.prevItemMap = null;
			spot.patch = null;
			if (spot.anchored) {
				// No follow-up parent-wipe to detach the old rows — clear the range.
				clearRange(spot.startComment, spot.endComment);
				spot.textNode = null;
			}
		}
		if (!spot.patch) {
			/*
			 * Undeclared + still empty (null/undefined/''): clear, but DON'T lock
			 * a patcher yet — the kind (string→HTML vs number→text) isn't known
			 * until a real value arrives, so defer classification to the next
			 * patch. Without this a spot whose state inits to '' would lock to
			 * textContent and then render later HTML strings as inert text.
			 */
			if (!spot.declaredKind && (value === null || value === undefined || value === '')) {
				if (spot.anchored) {
					if (spot.startComment.nextSibling !== spot.endComment) {
						clearRange(spot.startComment, spot.endComment);
					}
					spot.textNode = null;
				} else if (spot.element.textContent !== '') {
					spot.element.textContent = '';
				}
				return;
			}
			bindSpotKind(spot, value);
		}
		spot.patch(spot, value);
		return;
	}
	if (spot.type === SPOT_TYPE.BARE_ATTR) {
		if (applySubeventAttr(spot.element, spot.attr, value)) {
			return;
		}
		if (value === false || value === null || value === undefined || value === '') {
			if (spot.element.hasAttribute(spot.attr)) {
				spot.element.removeAttribute(spot.attr);
			}
			return;
		}
		if (value === true) {
			if (!spot.element.hasAttribute(spot.attr)) {
				spot.element.setAttribute(spot.attr, '');
			}
			return;
		}
		const bareStr = String(value);
		if (spot.element.getAttribute(spot.attr) !== bareStr) {
			spot.element.setAttribute(spot.attr, bareStr);
		}
		return;
	}
	if (spot.type === SPOT_TYPE.BOOL_ATTR) {
		const has = spot.element.hasAttribute(spot.attr);
		if (value && !has) {
			spot.element.setAttribute(spot.attr, '');
		} else if (!value && has) {
			spot.element.removeAttribute(spot.attr);
		}
		return;
	}
	if (spot.type === SPOT_TYPE.PROP) {
		/*
		 * `.state=` on a child component MERGES through the child's own
		 * `assignState` instead of REPLACING through its `set state` →
		 * replaceState. Replace rebuilt the child's STATE from only the passed
		 * keys, so any post-upgrade re-application of the binding (e.g. a modal
		 * whose parent re-renders) silently wiped the child's own `static state`
		 * chain defaults — e.g. ui-modal's `classes: Set(['modal'])` that styles
		 * the dialog, leaving a bare white, top-anchored native <dialog> plus a
		 * throw on close. Merge preserves those defaults and matches the keyed-
		 * list path, which already feeds retained component rows via assignState.
		 * `assignState` no-ops on a non-object value, so non-object `.state=` is
		 * safe; every other property still assigns directly.
		 */
		if (spot.attr === 'state' && isFunction(spot.element.assignState)) {
			const childElement = spot.element;
			childElement.assignState(value);
			/*
			 * `.state=` carry-down. When the passed value is a SHARED reactive
			 * proxy, a deep mutation made through the owner's proxy notifies only
			 * the OWNER's bus — the child holds the same object by reference but
			 * its own bus never hears the deep path, so the shallow merge above
			 * no-ops and nothing below re-reads. Bridge the child's bus to the
			 * source realm so each deep change is re-delivered as a child-relative
			 * path. A plain literal carries no realm, so it is left as a one-shot.
			 */
			if (isStateProxyValue(value)) {
				linkStateCarrier(childElement, value[STATE_PATH]);
			}
			return;
		}
		/*
		 * `.state.path=` is the explicit deep-state channel — the one sanctioned
		 * way a parent writes into a child's reactive state. Writing through the
		 * child's state proxy (not a bare element property) routes the assignment
		 * to the proxy set trap so the nested key notifies and re-patches. The
		 * proxy already no-ops an unchanged leaf, so no extra arg-diff is needed.
		 */
		if (spot.element.state && spot.attr.startsWith('state.')) {
			setValueAtPath(spot.element.state, spot.attr.slice(6), value);
			return;
		}
		if (spot.element[spot.attr] !== value) {
			spot.element[spot.attr] = value;
		}
		return;
	}
	if (spot.type === SPOT_TYPE.METHOD) {
		/*
		 * `.method(${value})` — invoke the element method with the resolved arg.
		 * Skip an unchanged arg after the first call so a side-effecting method
		 * does not fire on every unrelated patch pass (mirrors the PROP guard).
		 * A non-function name is a silent no-op rather than a throw.
		 */
		if (spot.methodCalled === true && value === spot.lastMethodArg) {
			return;
		}
		spot.methodCalled = true;
		spot.lastMethodArg = value;
		if (isFunction(spot.element[spot.attr])) {
			spot.element[spot.attr](value);
		}
		return;
	}
	if (applySubeventAttr(spot.element, spot.attr, value)) {
		return;
	}
	if (value === '' || value === null || value === undefined || value === false) {
		if (spot.element.hasAttribute(spot.attr)) {
			spot.element.removeAttribute(spot.attr);
		}
		return;
	}
	if (spot.attr === 'style' && isPlainObject(value)) {
		applyStyleObject(spot, value);
		return;
	}
	let str;
	if (spot.attr === 'class' && ClassList.isClassList(value)) {
		const desired = new Set();
		applyClassListItems(value.items, desired, new Map(), null);
		str = [...desired].join(' ');
	} else {
		str = String(value ?? '');
	}
	if (spot.attr === 'style') {
		/* String apply replaces the whole attribute — reset the object-key
		 * tracking and mark so the next object apply wipes string residue. */
		spot.prevStyleKeys = null;
		spot.styleWasString = true;
	}
	if (spot.element.getAttribute(spot.attr) !== str) {
		spot.element.setAttribute(spot.attr, str);
	}
}
function patchSpot(spot, value) {
	const perfMark = Perf.mark('patch');
	const result = patchSpotBody(spot, value);
	Perf.measure('patch', perfMark);
	return result;
}
const EVENT_SPOTS = new WeakMap();
function dispatchEventSpotListener(domEvent) {
	const map = EVENT_SPOTS.get(this);
	if (!map) {
		return undefined;
	}
	const spot = map.get(domEvent.type);
	if (!spot) {
		return undefined;
	}
	/*
	 * `.self` — fire only when the event originated on THIS element (the listener
	 * host = currentTarget = `this`), not bubbled up from a descendant.
	 */
	if (spot.modSelf && domEvent.target !== this) {
		return undefined;
	}
	if (spot.modStop) {
		domEvent.stopPropagation();
	}
	if (spot.modPrevent) {
		domEvent.preventDefault();
	}
	const result = spot.component.runEventHandler(spot.expr, domEvent, this, domEvent.type);
	/*
	 * `.once` — detach after the first dispatch. Done manually (not native
	 * `{ once: true }`) so the EVENT_SPOTS map entry is removed in lockstep with
	 * the listener; a native once would strand the map entry.
	 */
	if (spot.modOnce) {
		spot.unsubscribe();
	}
	return result;
}
/**
 * Abstract base for every template spot. Spots are the per-DOM-node patchers
 * built from a recipe plan. The class hierarchy below replaces the old plain-
 * object spot shapes — `this`-using prototype methods eliminate the per-spot
 * `.bind(null, spot)` allocations that used to back `updateHandler` /
 * `refreshTask`. Subscribed via the bus's `target` arg → bus dispatches
 * `Spot.prototype.handle.call(spot, …)` with zero per-spot closure.
 */
class Spot {
	constructor() {
		this.unsubs = [];
		this.depMap = null;
		this.pendingPaths = null;
	}
	/** Bus handler. Marks the spot dirty for the single per-microtask drain
	 *  (drainSpots at the tail of masterFlush) — Set membership is the dedup, so
	 *  N deps firing for one spot in a flush still drain it once. List spots
	 *  accumulate changed paths so the drain can decide between per-item
	 *  assignState (partial) and full re-diff.
	 *
	 *  The signature must match the bus's 2-arg dispatch: fireSubscription calls
	 *  `handler.call(target, value, changedPath)`. List spots read `changedPath`
	 *  from the second parameter — a 3-arg shape would park it in the wrong slot
	 *  and feed `undefined`, collapsing every in-place deep mutation onto the
	 *  same-ref-skipping full re-diff and never reaching the DOM. */
	handle(_value, changedPath) {
		if (this.kind === SPOT_KIND.LIST) {
			if (!this.pendingPaths) {
				this.pendingPaths = [];
			}
			this.pendingPaths.push(changedPath);
		}
		markSpotDirty(this);
	}
	/** Drain hook — runs once per microtask in drainSpots. Default re-evaluates
	 *  via refresh(); BindingSpot overrides to apply its captured value. */
	drain() {
		return this.refresh();
	}
	/** Virtual. Subclasses with reactive deps override. */
	refresh() {
		return undefined;
	}
	unsubscribe() {
		if (this.depMap) {
			clearRealmUnsubs(this.depMap);
			this.depMap = null;
		}
		if (this.unsubs && this.unsubs.length) {
			this.unsubs = clearSubscriptions(this.unsubs);
		}
		this.pendingPaths = null;
	}
}
/**
 * One-way state-path watcher. `this.bind('foo')` / `${this.state.foo}` /
 * any `${bindingExpr}` whose expr resolves to a single state path.
 */
class BindingSpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, component, bindingKey, declaredKind) {
		super();
		this.kind = SPOT_KIND.BINDING;
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.declaredKind = declaredKind;
		this.contentKind = null;
		this.patch = null;
		this.pendingValue = undefined;
		/*
		 * true when the marker is folded onto a real parent element (no wrapper);
		 * `bindSpotKind` then leaves pointer-events/display untouched.
		 */
		this.elided = false;
		// anchored partial: comment-bounded range in a parent shared with statics.
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
	}
	/** A BindingSpot subscribes to EXACTLY `bindingKey`, so the value the bus
	 *  hands us is provably identical to re-reading the path — capture it and
	 *  skip the redundant getValueAtPath walk at drain time. Measured 1.28x
	 *  faster than the re-read + task-dispatch path (see _batcherBench). */
	handle(nextValue) {
		this.pendingValue = nextValue;
		markSpotDirty(this);
	}
	drain() {
		patchSpot(this, this.pendingValue);
	}
	refresh() {
		patchSpot(this, resolveBindingValueForBinding(this.component, this.expr));
	}
}
/**
 * Resolve a list spot's bound state into the array the keyed diff renders.
 * Replaces `Array.prototype.filter` on the refresh hot path: an unfiltered
 * array passes through by reference (the LiveList copies it once downstream),
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
class ListSpot extends Spot {
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
		const rawItems = resolveBindingValueForBinding(component, this.expr);
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
						if (isFunction(element?.assignState)) {
							element.assignState(itemAtIndex);
							return;
						}
					}
				}
			}
		}
		patchSpot(this, each(viewItems, renderFn, keyFn));
	}
	unsubscribe() {
		if (this.liveList && this.liveList.disconnectSpot) {
			this.liveList.disconnectSpot();
		}
		this.liveList = null;
		this.keyMap = null;
		this.prevItemMap = null;
		super.unsubscribe();
	}
}
/**
 * Function-valued expression with auto-tracked deps — `${() => …}` and
 * `bind.text(() => …)`. Re-evaluates inside a tracking session every
 * refresh so deps stay accurate.
 */
class ComputedSpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, component, declaredKind) {
		super();
		this.kind = SPOT_KIND.COMPUTED;
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.declaredKind = declaredKind;
		this.contentKind = null;
		this.patch = null;
		this.elided = false;
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
	}
	refresh() {
		const {
			value,
			deps,
		} = evaluateTrackedExpression(this.component, this.expr);
		patchSpot(this, value);
		syncSpotSubscriptions(this, deps);
	}
}
/** Multi-interpolation attribute: `<div data-x="a${b}c${d}e">`. */
class MultiAttrSpot extends Spot {
	constructor(element, slotIndex, attr, parts, component) {
		super();
		this.kind = SPOT_KIND.MULTI;
		this.type = SPOT_TYPE.MULTI_ATTR;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.parts = parts;
		this.component = component;
	}
	refresh() {
		const component = this.component;
		const parts = this.parts;
		const allDeps = new Map();
		let result = '';
		const partsLength = parts.length;
		for (let partIndex = 0; partIndex < partsLength; partIndex++) {
			const part = parts[partIndex];
			if (part.literal !== undefined) {
				result += part.literal;
				continue;
			}
			const expr = part.expr;
			if (isBindingType(expr)) {
				const keyRealm = realmForBinding(expr, component);
				addDep(allDeps, keyRealm.realm, keyRealm.path);
				result += resolveBindingValueForBinding(component, expr) ?? '';
				continue;
			}
			if (isFunction(expr)) {
				const evaluated = evaluateTrackedExpression(component, expr);
				mergeDepMap(allDeps, evaluated.deps);
				result += evaluated.value ?? '';
				continue;
			}
			result += expr ?? '';
		}
		if (!applySubeventAttr(this.element, this.attr, result)) {
			if (this.element.getAttribute(this.attr) !== result) {
				this.element.setAttribute(this.attr, result);
			}
		}
		syncSpotSubscriptions(this, allDeps);
	}
}
/** `class=` binding — token-level diff via `applyClassListItems`. */
class ClassListSpot extends Spot {
	constructor(element, slotIndex, parts, component) {
		super();
		this.kind = SPOT_KIND.CLASS;
		this.type = SPOT_TYPE.CLASS_LIST;
		this.attr = 'class';
		this.element = element;
		this.slotIndex = slotIndex;
		this.parts = parts;
		this.component = component;
		this.classListCurrent = null;
	}
	refresh() {
		const component = this.component;
		const parts = this.parts;
		const desired = new Set();
		const deps = new Map();
		const partsLength = parts.length;
		for (let partIndex = 0; partIndex < partsLength; partIndex++) {
			const part = parts[partIndex];
			if (part.literal !== undefined) {
				addTokens(part.literal, desired);
				continue;
			}
			const expr = part.expr;
			if (ClassList.isClassList(expr)) {
				applyClassListItems(expr.items, desired, deps, component);
				continue;
			}
			applyClassListItems([expr], desired, deps, component);
		}
		const current = this.classListCurrent ?? new Set();
		diffClassList(this.element, current, desired);
		this.classListCurrent = desired;
		syncSpotSubscriptions(this, deps);
	}
}
/**
 * DOM event handler spot (`@click=${fn}` / `@${namedFn}`). No bus
 * subscription — the WeakMap-keyed listener pattern dispatches through
 * `dispatchEventSpotListener` looking up the spot by element + event type.
 */
class EventSpot extends Spot {
	constructor(element, slotIndex, eventName, expr, component, modifiers) {
		super();
		this.type = SPOT_TYPE.EVENT;
		this.element = element;
		this.slotIndex = slotIndex;
		this.eventName = eventName;
		this.expr = expr;
		this.component = component;
		/*
		 * `@click.stop.prevent.once.self.capture.passive` modifiers, resolved once
		 * to boolean fields read on the dispatch hot path. `capture` and `passive`
		 * are native addEventListener options (capture also keys add/remove — see
		 * unsubscribe); `stop`/`prevent`/`self`/`once` are applied at dispatch.
		 * `mod`-prefixed so the field never reads as a global (`stop`/`self`).
		 */
		this.modifiers = modifiers ?? null;
		this.modStop = false;
		this.modPrevent = false;
		this.modSelf = false;
		this.modOnce = false;
		this.modCapture = false;
		this.modPassive = false;
		if (modifiers) {
			const modifiersLength = modifiers.length;
			for (let modIndex = 0; modIndex < modifiersLength; modIndex++) {
				const modifier = modifiers[modIndex];
				if (modifier === 'stop') {
					this.modStop = true;
				} else if (modifier === 'prevent') {
					this.modPrevent = true;
				} else if (modifier === 'self') {
					this.modSelf = true;
				} else if (modifier === 'once') {
					this.modOnce = true;
				} else if (modifier === 'capture') {
					this.modCapture = true;
				} else if (modifier === 'passive') {
					this.modPassive = true;
				} else if (defaultLogger.debugOn) {
					defaultLogger.debug('Template EventSpot', `[event] unknown @${eventName} modifier ".${modifier}" — ignored`);
				}
			}
		}
	}
	/**
	 * Native addEventListener options. `undefined` for the common no-modifier
	 * spot so the listener is registered exactly as before. `capture`/`passive`
	 * only ride here; `once` is handled manually in the dispatcher (the shared
	 * listener must stay consistent with the EVENT_SPOTS map).
	 * @returns {AddEventListenerOptions|undefined} Listener options or undefined.
	 */
	listenerOptions() {
		if (!this.modifiers) {
			return undefined;
		}
		return {
			capture: this.modCapture,
			passive: this.modPassive,
		};
	}
	unsubscribe() {
		const map = EVENT_SPOTS.get(this.element);
		if (map) {
			map.delete(this.eventName);
		}
		/*
		 * removeEventListener matches on (type, listener, capture) — pass the same
		 * capture flag used at add time or the listener leaks (capture-mismatched
		 * removal silently no-ops).
		 */
		this.element.removeEventListener(this.eventName, dispatchEventSpotListener, this.modCapture);
		super.unsubscribe();
	}
}
function installBindingSpot(plan, element, expr, component) {
	const bindingKey = expr.key;
	if (ListBinding.isListBinding(expr)) {
		const listSpot = new ListSpot(element, plan.slotIndex, plan.type, expr, component, bindingKey, expr.renderFn, expr.keyFn, expr.filterFn);
		listSpot.refresh(null);
		syncSpotSubscriptions(listSpot, bindingDepMap(expr, component));
		if (RemoteListBinding.isRemoteListBinding(expr)) {
			mountRemoteController(component, element, expr);
		}
		return listSpot;
	}
	const propertyIndex = component.propertyIndex;
	/*
	 * Precedence: a `^text`/`^html` sigil on the spot (explicit at the call site)
	 * beats a typed bind's own kind, which beats the inferred `static properties`
	 * kind for the path.
	 */
	const declaredKind = plan.declaredKind ?? expr.kind ?? propertyIndex?.kinds.get(bindingKey) ?? null;
	const spot = new BindingSpot(element, plan.slotIndex, plan.type, plan.attr, expr, component, bindingKey, declaredKind);
	spot.elided = plan.elided === true;
	/*
	 * A path declared `react: false` in `static properties` is a static one-shot —
	 * patch once now, never subscribe.
	 */
	if (propertyIndex?.hasNonReactive && propertyIndex.nonReactivePaths.has(bindingKey)) {
		spot.kind = null;
		spot.refresh();
		return spot;
	}
	spot.refresh();
	syncSpotSubscriptions(spot, bindingDepMap(expr, component));
	return spot;
}
function installComputedSpot(plan, element, expr, component) {
	/*
	 * A `^text`/`^html` sigil on the spot wins; else a typed bind given a
	 * function (`this.bind.text(() => …)`) tags it with a content kind; a plain
	 * `${() => …}` leaves it undefined → auto-classified at patch time.
	 */
	const declaredKind = plan.declaredKind ?? expr.contentKind ?? null;
	const spot = new ComputedSpot(element, plan.slotIndex, plan.type, plan.attr, expr, component, declaredKind);
	spot.elided = plan.elided === true;
	spot.refresh();
	return spot;
}
function installClassListSpot(plan, element, parts, component) {
	const spot = new ClassListSpot(element, plan.slotIndex, parts, component);
	spot.refresh();
	return spot;
}
function installMultiAttrSpot(plan, element, parts, component) {
	const spot = new MultiAttrSpot(element, plan.slotIndex, plan.attr, parts, component);
	spot.refresh();
	return spot;
}
function installEventSpot(plan, element, eventName, expr, component) {
	const spot = new EventSpot(element, plan.slotIndex, eventName, expr, component, plan.modifiers);
	let map = EVENT_SPOTS.get(element);
	if (!map) {
		map = new Map();
		EVENT_SPOTS.set(element, map);
	}
	map.set(eventName, spot);
	element.addEventListener(eventName, dispatchEventSpotListener, spot.listenerOptions());
	return spot;
}
/**
 * Inert spot — used for `text`/`bare-attr`/`attr`/`bool-attr`/`prop`
 * positions whose expression is a literal value (no Binding, no function).
 * Patched once on install and again from `updateTemplateSpots` on re-render
 * if the expr changes; never subscribes to state. `unsubscribe()` inherits
 * the base behavior (no-op for empty unsubs/depMap).
 */
class StaticSpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, declaredKind) {
		super();
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		/*
		 * Set only by a `^text`/`^html` sigil on a bare-read text spot — read by
		 * `bindSpotKind` to skip content classification. null = auto-classify.
		 */
		this.declaredKind = declaredKind ?? null;
		this.contentKind = null;
		this.patch = null;
		this.elided = false;
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
	}
}
function domAttrForElement(element) {
	if (element.type === 'checkbox' || element.type === 'radio') {
		return 'checked';
	}
	if (element.tagName === 'SELECT') {
		return 'selectedIndex';
	}
	return 'value';
}
function readDomProp(element, attr) {
	if (attr === 'checked') {
		return element.checked;
	}
	if (attr === 'selectedIndex') {
		return element.selectedIndex;
	}
	return element.value;
}
function setDomProp(element, attr, value) {
	if (attr === 'checked') {
		element.checked = Boolean(value);
	} else if (attr === 'selectedIndex') {
		element.selectedIndex = Number(value ?? -1);
	} else {
		element.value = String(value ?? '');
	}
}
function domInputEvent(element) {
	if (element.tagName === 'SELECT' || element.type === 'checkbox' || element.type === 'radio') {
		return 'change';
	}
	return 'input';
}
function writeBoundValue(component, key, value) {
	const resolved = realmForKey(key, component);
	resolved.realm.write(resolved.path, value);
}
const TWO_WAY_SPOTS = new WeakMap();
function dispatchTwoWayInput() {
	const map = TWO_WAY_SPOTS.get(this);
	if (!map) {
		return;
	}
	const spot = map.get(this.eventTypeKey ?? 'input') ?? map.get('input') ?? map.get('change');
	if (!spot) {
		return;
	}
	writeBoundValue(spot.component, spot.bindingKey, readDomProp(this, spot.twoWayAttr));
}
/**
 * Two-way `<input>`/`<select>`/`<textarea>` binding. `handle(value)` is the
 * bus callback — a direct DOM write, no scheduling (write is synchronous and
 * idempotent). The DOM-side `input`/`change` listener stays as the module-
 * scope `dispatchTwoWayInput` dispatched via the `TWO_WAY_SPOTS` WeakMap.
 */
class TwoWaySpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, component, bindingKey, twoWayAttr, twoWayEvent) {
		super();
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.twoWayAttr = twoWayAttr;
		this.twoWayEvent = twoWayEvent;
	}
	handle(nextValue) {
		setDomProp(this.element, this.twoWayAttr, nextValue);
	}
	unsubscribe() {
		const map = TWO_WAY_SPOTS.get(this.element);
		if (map) {
			map.delete(this.twoWayEvent);
		}
		this.element.removeEventListener(this.twoWayEvent, dispatchTwoWayInput);
		super.unsubscribe();
	}
}
function installTwoWaySpot(plan, element, expr, component, explicitKey) {
	const key = explicitKey ?? expr.key;
	const attr = plan.attr ?? domAttrForElement(element);
	const eventType = domInputEvent(element);
	const spot = new TwoWaySpot(element, plan.slotIndex, plan.type, attr, expr, component, key, attr, eventType);
	setDomProp(element, attr, resolveBindingValue(component, key));
	if (element.hasAttribute('value')) {
		element.removeAttribute('value');
	}
	if (element.hasAttribute('checked')) {
		element.removeAttribute('checked');
	}
	const boundRealm = realmForKey(key, component);
	spot.unsubs.push(boundRealm.realm.bus.subscribe(boundRealm.path, TwoWaySpot.prototype.handle, spot));
	let map = TWO_WAY_SPOTS.get(element);
	if (!map) {
		map = new Map();
		TWO_WAY_SPOTS.set(element, map);
	}
	map.set(eventType, spot);
	element.addEventListener(eventType, dispatchTwoWayInput);
	return spot;
}
const TEMPLATE_RECIPES = new WeakMap();
function getNodePath(node, root) {
	const path = [];
	let current = node;
	while (current !== root) {
		const parentNode = current.parentNode;
		if (!parentNode) {
			return null;
		}
		let index = 0;
		let sibling = parentNode.firstChild;
		while (sibling && sibling !== current) {
			sibling = sibling.nextSibling;
			index += 1;
		}
		path.push(index);
		current = parentNode;
	}
	path.reverse();
	return path;
}
function walkPath(root, path) {
	let node = root;
	const pathLength = path.length;
	for (let pathIndex = 0; pathIndex < pathLength; pathIndex++) {
		node = node.childNodes[path[pathIndex]];
	}
	return node;
}
/**
 * Resolve a plan's DOM node(s) on the (still-pristine) clone. Anchored plans
 * resolve BOTH comment markers; every other plan resolves its single element.
 * Callers MUST resolve every plan before installing any of them — an anchored
 * install inserts content between its comments, shifting later markers' child
 * indices, so paths are only valid before the first insertion.
 */
function resolveSpotNode(plan, fragment) {
	if (plan.anchored) {
		return {
			startComment: walkPath(fragment, plan.startPath),
			endComment: walkPath(fragment, plan.endPath),
		};
	}
	return walkPath(fragment, plan.path);
}
/**
 * Only the patterns below are lookup keys — anything else on a [data-uwc]
 * node is a static attribute that no spot will ever query, so storing it
 * just bloats the map. Filtering at index time saves the entries and the
 * per-entry composite-string allocation.
 *   data-*=""                — void markers (bind/multi/bare-attr/uwc-evfn)
 *   data-expr="<digits>"     — text-spot marker
 *   <any-name>="expr<digits>" — interpolated attr / bool-attr / prop / named event
 */
function isAllDigitsFrom(value, from) {
	if (value.length === from) {
		return false;
	}
	const valueLength = value.length;
	for (let charIndex = from; charIndex < valueLength; charIndex++) {
		const code = value.charCodeAt(charIndex);
		if (code < 48 || code > 57) {
			return false;
		}
	}
	return true;
}
function isMarkerAttr(attrName, value) {
	if (value === '') {
		return attrName.startsWith('data-');
	}
	if (value.charCodeAt(0) === 101 && value.startsWith('expr')) {
		return isAllDigitsFrom(value, 4);
	}
	if (attrName === 'data-expr') {
		return isAllDigitsFrom(value, 0);
	}
	return false;
}
function buildMarkerMap(fragment) {
	const map = new Map();
	const markedNodes = fragment.querySelectorAll('[data-uwc]');
	const markedNodesLength = markedNodes.length;
	for (let nodeIndex = 0; nodeIndex < markedNodesLength; nodeIndex++) {
		const node = markedNodes[nodeIndex];
		const path = getNodePath(node, fragment);
		if (!path) {
			continue;
		}
		node.removeAttribute('data-uwc');
		const attrs = node.attributes;
		const attrsLength = attrs.length;
		for (let attrIndex = 0; attrIndex < attrsLength; attrIndex++) {
			const attrName = attrs[attrIndex].name;
			const attrValue = attrs[attrIndex].value;
			if (!isMarkerAttr(attrName, attrValue)) {
				continue;
			}
			map.set(`${attrName}|${attrValue}`, {
				element: node,
				path,
			});
		}
	}
	/*
	 * Second pass: anchored text-spot comment markers (`uwc:N` / `uwc/N`).
	 * querySelectorAll only sees elements, so comments need their own walk. Keyed
	 * by raw comment data (contains no `|`, so never collides with attr keys).
	 */
	const commentWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
	let commentNode = commentWalker.nextNode();
	while (commentNode) {
		const data = commentNode.data;
		if ((data.startsWith(ANCHOR_START_PREFIX) || data.startsWith(ANCHOR_END_PREFIX)) && isAllDigitsFrom(data, ANCHOR_START_PREFIX.length)) {
			const path = getNodePath(commentNode, fragment);
			if (path) {
				map.set(data, {
					element: commentNode,
					path,
				});
			}
		}
		commentNode = commentWalker.nextNode();
	}
	return map;
}
function lookupMarker(map, attrName, attrValue) {
	return map.get(`${attrName}|${attrValue}`);
}
function mapSpotPart(part) {
	if (part.literal !== undefined) {
		return {
			literal: part.literal,
		};
	}
	return {
		exprIndex: part.exprIndex,
	};
}
function buildSpotPlan(map, entry) {
	if (entry.type === SPOT_TYPE.BIND) {
		const markerAttr = bindMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(markerAttr);
		return {
			type: SPOT_TYPE.BIND,
			slotIndex: entry.i,
			path: lookup.path,
		};
	}
	if (entry.type === SPOT_TYPE.MULTI_ATTR) {
		const markerAttr = multiAttrMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(markerAttr);
		const parts = entry.parts.map(mapSpotPart);
		return {
			type: SPOT_TYPE.MULTI_ATTR,
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
			parts,
		};
	}
	if (entry.type === SPOT_TYPE.EVENT) {
		const isDeduce = entry.deduceFromExpr === true;
		const markerAttr = isDeduce ? `data-uwc-evfn-${entry.i}` : eventMarkerAttribute(entry.eventName);
		const markerValue = isDeduce ? '' : `expr${entry.i}`;
		const lookup = lookupMarker(map, markerAttr, markerValue);
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(markerAttr);
		return {
			type: SPOT_TYPE.EVENT,
			slotIndex: entry.i,
			path: lookup.path,
			eventName: isDeduce ? null : entry.eventName,
			modifiers: isDeduce ? null : (entry.modifiers ?? null),
			deduceFromExpr: isDeduce,
		};
	}
	if (entry.type === SPOT_TYPE.TEXT) {
		if (entry.anchored) {
			const startLookup = map.get(`${ANCHOR_START_PREFIX}${entry.i}`);
			const endLookup = map.get(`${ANCHOR_END_PREFIX}${entry.i}`);
			if (!startLookup || !endLookup) {
				return null;
			}
			return {
				type: SPOT_TYPE.TEXT,
				slotIndex: entry.i,
				anchored: true,
				startPath: startLookup.path,
				endPath: endLookup.path,
				declaredKind: entry.declaredKind ?? null,
			};
		}
		const lookup = lookupMarker(map, SPOT, String(entry.i));
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(SPOT);
		if (!entry.elided) {
			/*
			 * Wrapper <span> only — a folded marker sits on a real element that
			 * already lays itself out; `display:contents` would wrongly collapse it.
			 */
			lookup.element.style.display = 'contents';
		}
		return {
			type: SPOT_TYPE.TEXT,
			slotIndex: entry.i,
			path: lookup.path,
			declaredKind: entry.declaredKind ?? null,
			elided: entry.elided === true,
		};
	}
	if (entry.type === SPOT_TYPE.BARE_ATTR) {
		const markerAttr = bareAttrMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(markerAttr);
		return {
			type: SPOT_TYPE.BARE_ATTR,
			slotIndex: entry.i,
			path: lookup.path,
		};
	}
	if (entry.type === SPOT_TYPE.ATTR) {
		const lookup = lookupMarker(map, entry.attr, `expr${entry.i}`);
		if (!lookup) {
			return null;
		}
		/*
		 * Subevent attrs (tooltip, hotkey, …) must stay on the element so
		 * the later `extractSubeventPlans` pass can capture them and emit
		 * the install plan that runs the behavior's install hook. Removing
		 * here was the bug: `tooltip=${expr}` produced an ATTR spot but no
		 * subeventPlan, so the behavior never installed. extractSubeventPlans
		 * removes the attribute itself after recording the plan; for non-
		 * subevent attrs we still strip it here so the marker text never
		 * leaks into the rendered DOM.
		 */
		if (!SUBEVENT_ATTRS.has(entry.attr)) {
			lookup.element.removeAttribute(entry.attr);
		}
		return {
			type: SPOT_TYPE.ATTR,
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
		};
	}
	if (entry.type === SPOT_TYPE.METHOD) {
		const markerAttr = methodMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, `expr${entry.i}`);
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(markerAttr);
		/*
		 * The method name rides in the `attr` slot so the existing binding /
		 * computed / static install dispatch needs no METHOD-specific arm — only
		 * the patch step branches, calling `element[method](value)` instead of assigning.
		 */
		return {
			type: SPOT_TYPE.METHOD,
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.method,
		};
	}
	if (entry.type === SPOT_TYPE.BOOL_ATTR || entry.type === SPOT_TYPE.PROP) {
		const sigilChar = entry.type === SPOT_TYPE.BOOL_ATTR ? '?' : '.';
		/*
		 * The HTML parser lowercases attribute names, so a camelCase binding
		 * (`.textContent`, `.importStyles`, `?ariaHidden`) lands in the DOM as a
		 * lowercase marker. Look up / remove by the lowercased name, but KEEP the
		 * original-case `entry.attr` in the plan — `element[attr]` must hit the real
		 * case-sensitive DOM/JS property. Without this, camelCase `.prop=` /
		 * `?attr=` bindings silently produced no spot.
		 */
		const domAttr = `${sigilChar}${entry.attr}`.toLowerCase();
		const lookup = lookupMarker(map, domAttr, `expr${entry.i}`);
		if (!lookup) {
			return null;
		}
		lookup.element.removeAttribute(domAttr);
		return {
			type: entry.type,
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
		};
	}
	return null;
}
/* `$value.number.trim.lazy` — optional dotted modifiers after the bound attr
   name. Without the trailing group a modifier chain fails the match entirely
   and the whole two-way binding is silently dropped. */
const DOLLAR_BIND_ATTR_RE = /^\$(\w+)((?:\.\w+)*)$/;
function normalizeBindKey(rawKey) {
	if (rawKey.startsWith('state.')) {
		return rawKey.slice(6);
	}
	if (rawKey.startsWith('globalState.')) {
		return `global.${rawKey.slice(12)}`;
	}
	return rawKey;
}
function extractDataBindPlans(fragment) {
	const plans = [];
	const dataBindNodes = fragment.querySelectorAll('[data-bind]');
	const dataBindNodesLength = dataBindNodes.length;
	for (let nodeIndex = 0; nodeIndex < dataBindNodesLength; nodeIndex++) {
		const element = dataBindNodes[nodeIndex];
		const stateKey = element.dataset.bind;
		if (!stateKey) {
			continue;
		}
		const path = getNodePath(element, fragment);
		if (!path) {
			continue;
		}
		plans.push({
			path,
			key: normalizeBindKey(stateKey),
		});
		element.removeAttribute('data-bind');
	}
	const atBindNodes = fragment.querySelectorAll('*');
	const atBindNodesLength = atBindNodes.length;
	for (let nodeIndex = 0; nodeIndex < atBindNodesLength; nodeIndex++) {
		const element = atBindNodes[nodeIndex];
		const stateKey = element.getAttribute('@bind');
		if (!stateKey) {
			continue;
		}
		const path = getNodePath(element, fragment);
		if (!path) {
			continue;
		}
		plans.push({
			path,
			key: normalizeBindKey(stateKey),
		});
		element.removeAttribute('@bind');
	}
	const dollarBindNodes = fragment.querySelectorAll('*');
	const dollarBindNodesLength = dollarBindNodes.length;
	for (let nodeIndex = 0; nodeIndex < dollarBindNodesLength; nodeIndex++) {
		const element = dollarBindNodes[nodeIndex];
		const attrs = element.attributes;
		for (let attrIndex = attrs.length - 1; attrIndex >= 0; attrIndex--) {
			const attrName = attrs[attrIndex].name;
			const match = DOLLAR_BIND_ATTR_RE.exec(attrName);
			if (!match) {
				continue;
			}
			const rawKey = attrs[attrIndex].value;
			if (!rawKey) {
				element.removeAttribute(attrName);
				continue;
			}
			const path = getNodePath(element, fragment);
			if (path) {
				const rawModifiers = match[2];
				plans.push({
					path,
					key: normalizeBindKey(rawKey),
					modifiers: rawModifiers ? rawModifiers.slice(1).split('.') : null,
				});
			}
			element.removeAttribute(attrName);
		}
	}
	return plans;
}
/*
 * A parser-emitted spot marker — `expr0`, `expr1`, … — encodes "this attr
 * is interpolated; the real value comes from an ATTR spot patch." Used to
 * distinguish static subevent values from placeholder markers in
 * extractSubeventPlans so the install path doesn't stomp the patch.
 */
const SPOT_MARKER_RE = /^expr\d+$/;
function extractSubeventPlans(fragment) {
	const plans = [];
	for (const attrName of SUBEVENT_ATTRS) {
		const elements = fragment.querySelectorAll(`[${attrName}]`);
		const elementsLength = elements.length;
		for (let nodeIndex = 0; nodeIndex < elementsLength; nodeIndex++) {
			const element = elements[nodeIndex];
			const rawValue = element.getAttribute(attrName);
			element.removeAttribute(attrName);
			const path = getNodePath(element, fragment);
			if (!path) {
				continue;
			}
			/*
			 * Interpolated subevent attr (`tooltip=${expr}`): the captured
			 * value is a marker like "expr3" — the corresponding ATTR spot
			 * will patch the real value into `data-<attrName>` at first
			 * render. Skip the install-time dataset write by passing
			 * undefined so the patch wins.
			 */
			const isMarker = SPOT_MARKER_RE.test(rawValue);
			plans.push({
				path,
				attrName,
				value: isMarker ? undefined : rawValue,
			});
		}
	}
	return plans;
}
function extractRefPlans(fragment) {
	const plans = [];
	const refNodes = fragment.querySelectorAll('*');
	const refNodesLength = refNodes.length;
	for (let nodeIndex = 0; nodeIndex < refNodesLength; nodeIndex++) {
		const element = refNodes[nodeIndex];
		const attrs = element.attributes;
		for (let attrIndex = attrs.length - 1; attrIndex >= 0; attrIndex--) {
			const attrName = attrs[attrIndex].name;
			if (attrName.charCodeAt(0) !== 35) {
				continue;
			}
			const refName = attrName.slice(1);
			element.removeAttribute(attrName);
			if (!isValidRefName(refName)) {
				throw new SyntaxError(`Invalid #ref name "${refName}". Use lowercase letters, digits, and underscore only ("_" not "-" for word separators). Example: <input #email_field>.`);
			}
			const path = getNodePath(element, fragment);
			if (path) {
				plans.push({
					path,
					name: refName,
				});
			}
		}
	}
	return plans;
}
function prepareRecipe(strings) {
	const placeholderExprs = new Array(Math.max(0, strings.length - 1));
	const {
		html: markup,
		meta,
	} = buildHTML(strings, placeholderExprs);
	const template = document.createElement('template');
	template.innerHTML = markup;
	const fragment = template.content;
	const markerMap = buildMarkerMap(fragment);
	const spotPlans = [];
	const metaLength = meta.length;
	for (let entryIndex = 0; entryIndex < metaLength; entryIndex++) {
		const plan = buildSpotPlan(markerMap, meta[entryIndex]);
		if (plan) {
			spotPlans.push(plan);
		}
	}
	const dataBindPlans = extractDataBindPlans(fragment);
	const subeventPlans = extractSubeventPlans(fragment);
	const refPlans = extractRefPlans(fragment);
	return {
		fragment,
		spotPlans,
		dataBindPlans,
		subeventPlans,
		refPlans,
		/* Detect a <portal> ONCE per template literal (recipe is cached), so the
		 * per-render relocation pass is gated to templates that actually use it —
		 * every portal-free component pays zero query cost on each build. */
		hasPortal: Boolean(fragment.querySelector('portal')),
		isStatic: !spotPlans.length && !dataBindPlans.length && !subeventPlans.length && !refPlans.length,
	};
}
function getRecipe(strings) {
	let recipe = TEMPLATE_RECIPES.get(strings);
	if (!recipe) {
		recipe = prepareRecipe(strings);
		TEMPLATE_RECIPES.set(strings, recipe);
	}
	return recipe;
}
const DATA_BIND_SPOTS = new WeakMap();
function dispatchDataBindInput() {
	const spot = DATA_BIND_SPOTS.get(this);
	if (!spot) {
		return;
	}
	if (spot.isCheck) {
		setValueAtPath(spot.component.stateProxy, spot.bindingKey, this.checked);
		return;
	}
	let domValue = this.value;
	if (spot.modTrim) {
		domValue = domValue.trim();
	}
	if (spot.modNumber) {
		// `.number` — coerce to a float; keep the raw string on NaN (Vue parity).
		const parsed = parseFloat(domValue);
		domValue = Number.isNaN(parsed) ? domValue : parsed;
	}
	setValueAtPath(spot.component.stateProxy, spot.bindingKey, domValue);
}
/**
 * `data-bind="key"` HTML-attribute two-way binding (cousin of TwoWaySpot —
 * activated by markup, not by template interpolation). Lives outside the
 * `tplState.spots` array; pushed directly into the template's `unsubs` array
 * because it is its own Disposable. `handle(value)` writes the next value
 * into the DOM property; `unsubscribe()` tears down both the bus
 * subscription (already an `unsubs` entry) and the WeakMap / DOM listener.
 */
class DataBindSpot {
	constructor(element, stateKey, component, modifiers) {
		this.element = element;
		this.component = component;
		this.bindingKey = stateKey;
		this.isCheck = element.type === 'checkbox' || element.type === 'radio';
		/*
		 * `$value` modifiers: `.number`/`.trim` transform the DOM→state write
		 * (dispatchDataBindInput); `.lazy` listens on `change` instead of `input`
		 * so state updates on blur/commit, not per keystroke.
		 */
		this.modNumber = false;
		this.modTrim = false;
		let lazy = false;
		if (modifiers) {
			const modifiersLength = modifiers.length;
			for (let modIndex = 0; modIndex < modifiersLength; modIndex++) {
				const modifier = modifiers[modIndex];
				if (modifier === 'number') {
					this.modNumber = true;
				} else if (modifier === 'trim') {
					this.modTrim = true;
				} else if (modifier === 'lazy') {
					lazy = true;
				} else if (defaultLogger.debugOn) {
					defaultLogger.debug('Template DataBindSpot', `[databind] unknown $-bind modifier ".${modifier}" on "${stateKey}" — ignored`);
				}
			}
		}
		this.eventType = lazy ? 'change' : domInputEvent(element);
		this.busSubscription = null;
	}
	handle(nextValue) {
		if (this.isCheck) {
			this.element.checked = Boolean(nextValue);
		} else {
			this.element.value = String(nextValue ?? '');
		}
	}
	unsubscribe() {
		DATA_BIND_SPOTS.delete(this.element);
		this.element.removeEventListener(this.eventType, dispatchDataBindInput);
		if (this.busSubscription) {
			this.busSubscription.unsubscribe();
			this.busSubscription = null;
		}
	}
}
function installDataBind(element, stateKey, component, unsubs, modifiers) {
	const spot = new DataBindSpot(element, stateKey, component, modifiers);
	DATA_BIND_SPOTS.set(element, spot);
	element.addEventListener(spot.eventType, dispatchDataBindInput);
	spot.busSubscription = subscribeStatePath(component, stateKey, DataBindSpot.prototype.handle, spot);
	unsubs.push(spot);
	const currentValue = getValueAtPath(component.STATE, stateKey);
	if (currentValue !== undefined) {
		spot.handle(currentValue);
	}
}
function buildMultiParts(planParts, exprs) {
	const parts = new Array(planParts.length);
	const planPartsLength = planParts.length;
	for (let partIndex = 0; partIndex < planPartsLength; partIndex++) {
		const part = planParts[partIndex];
		if (part.literal === undefined) {
			parts[partIndex] = {
				exprIndex: part.exprIndex,
				expr: exprs[part.exprIndex],
			};
		} else {
			parts[partIndex] = {
				literal: part.literal,
			};
		}
	}
	return parts;
}
function deduceEventName(plan, expr) {
	if (!plan.deduceFromExpr) {
		return plan.eventName;
	}
	if (!isFunction(expr)) {
		throw new TypeError('Template event handler must be a function.');
	}
	const fnName = expr.name;
	if (!fnName || fnName.startsWith('bound ')) {
		throw new TypeError(`@\${fn} requires a named function reference; got "${fnName || 'anonymous'}". Pass a class method, named function, or class arrow field; not an anonymous arrow or .bind() result.`);
	}
	return fnName;
}
function resolveTwoWaySourceValue(component, inferredKey) {
	const resolved = realmForKey(inferredKey, component);
	return resolved.realm.read(resolved.path);
}
function inferTwoWayBindingKey(component, expr, type, element, attr) {
	const isBindableField = (type === SPOT_TYPE.ATTR || type === SPOT_TYPE.BARE_ATTR) &&
		BINDABLE_TAGS.has(element.tagName) &&
		BINDABLE_ATTRS.has(attr);
	if (!isBindableField) {
		return null;
	}
	const evaluated = evaluateTrackedExpression(component, expr);
	const single = singleDepOf(evaluated.deps);
	if (!single) {
		return null;
	}
	const inferredKey = single.realm.global ? `global.${single.path}` : single.path;
	const sourceValue = resolveTwoWaySourceValue(component, inferredKey);
	return sourceValue === evaluated.value ? inferredKey : null;
}
function markAnchored(spot, startComment, endComment) {
	spot.anchored = true;
	spot.startComment = startComment;
	spot.endComment = endComment;
	spot.textNode = null;
}
/**
 * Install path for a PARTIAL (anchored) text spot. Mirrors the text-position
 * branch of installSpotFromPlan (list-binding / binding / function / static) but
 * resolves the two comment markers and flags the spot anchored BEFORE its first
 * patch, so every refresh dispatches through CONTENT_PATCHERS_ANCHORED and never
 * touches the parent's whole content. Kept separate so the hot tier-1 / wrapper
 * install stays byte-identical.
 */
function installAnchoredTextSpot(plan, resolved, exprs, component) {
	const startComment = resolved.startComment;
	const endComment = resolved.endComment;
	if (!startComment || !endComment) {
		return null;
	}
	const parentEl = startComment.parentNode;
	const expr = exprs[plan.slotIndex];
	if (ListBinding.isListBinding(expr)) {
		const listSpot = new ListSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, expr, component, expr.key, expr.renderFn, expr.keyFn, expr.filterFn);
		markAnchored(listSpot, startComment, endComment);
		listSpot.refresh(null);
		syncSpotSubscriptions(listSpot, bindingDepMap(expr, component));
		if (RemoteListBinding.isRemoteListBinding(expr)) {
			mountRemoteController(component, parentEl, expr);
		}
		return listSpot;
	}
	if (isBindingType(expr)) {
		const bindingKey = expr.key;
		const propertyIndex = component?.propertyIndex;
		const declaredKind = plan.declaredKind ?? expr.kind ?? propertyIndex?.kinds.get(bindingKey) ?? null;
		const spot = new BindingSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, undefined, expr, component, bindingKey, declaredKind);
		markAnchored(spot, startComment, endComment);
		if (propertyIndex?.hasNonReactive && propertyIndex.nonReactivePaths.has(bindingKey)) {
			spot.kind = null;
			spot.refresh();
			return spot;
		}
		spot.refresh();
		syncSpotSubscriptions(spot, bindingDepMap(expr, component));
		return spot;
	}
	if (isFunction(expr)) {
		const declaredKind = plan.declaredKind ?? expr.contentKind ?? null;
		const spot = new ComputedSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, undefined, expr, component, declaredKind);
		markAnchored(spot, startComment, endComment);
		spot.refresh();
		return spot;
	}
	const staticSpot = new StaticSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, undefined, expr, plan.declaredKind);
	markAnchored(staticSpot, startComment, endComment);
	patchSpot(staticSpot, expr);
	return staticSpot;
}
function installSpotFromPlan(plan, resolved, exprs, component) {
	if (plan.anchored) {
		return installAnchoredTextSpot(plan, resolved, exprs, component);
	}
	const element = resolved;
	if (!element) {
		return null;
	}
	if (plan.type === SPOT_TYPE.MULTI_ATTR) {
		const parts = buildMultiParts(plan.parts, exprs);
		/**
		 * `class=` always uses the class-list spot so updates diff individual
		 * tokens (preserving any class added externally), and every input
		 * type — string, function, ClassList, Set, Array, Map, Binding — is
		 * handled by the same machinery in `applyClassListItems`.
		 */
		if (plan.attr === 'class') {
			return installClassListSpot(plan, element, parts, component);
		}
		return installMultiAttrSpot(plan, element, parts, component);
	}
	const expr = exprs[plan.slotIndex];
	if (plan.type === SPOT_TYPE.BIND) {
		if (!isBindingType(expr)) {
			return null;
		}
		return installTwoWaySpot(plan, element, expr, component);
	}
	if (plan.type === SPOT_TYPE.EVENT) {
		if (plan.deduceFromExpr && (expr === undefined || expr === null || expr === false)) {
			return null;
		}
		const eventName = deduceEventName(plan, expr);
		return installEventSpot(plan, element, eventName, expr, component);
	}
	const resolvedType = plan.type;
	let resolvedAttr = plan.attr;
	if (plan.type === SPOT_TYPE.TEXT) {
		// `text`/`bare-attr` etc. flow through below — text starts with no attr.
	} else if (plan.type === SPOT_TYPE.BARE_ATTR) {
		const inferredAttr = inferBareAttrName(expr);
		if (!inferredAttr) {
			return null;
		}
		resolvedAttr = inferredAttr;
	} else if (plan.type === SPOT_TYPE.ATTR) {
		if (plan.attr === 'class') {
			const singletonParts = [
				{
					exprIndex: plan.slotIndex,
					expr,
				},
			];
			return installClassListSpot(plan, element, singletonParts, component);
		}
	} else if (plan.type === SPOT_TYPE.BOOL_ATTR || plan.type === SPOT_TYPE.PROP || plan.type === SPOT_TYPE.METHOD) {
		/*
		 * METHOD rides the same binding/computed/static dispatch as PROP — a static
		 * arg calls once and repatches on re-render, a `bind()` arg re-calls
		 * surgically, a `() =>` arg re-calls on dep change. Only the patch step
		 * differs (call vs assign), keyed off `resolvedType`.
		 */
	} else {
		return null;
	}
	const resolvedPlan = resolvedAttr === plan.attr ? plan : {
		...plan,
		attr: resolvedAttr,
	};
	if (isBindingType(expr)) {
		const autoTwoWay = (resolvedType === SPOT_TYPE.ATTR || resolvedType === SPOT_TYPE.BARE_ATTR) &&
			BINDABLE_TAGS.has(element.tagName) &&
			BINDABLE_ATTRS.has(resolvedAttr);
		if (autoTwoWay) {
			return installTwoWaySpot(resolvedPlan, element, expr, component);
		}
		return installBindingSpot(resolvedPlan, element, expr, component);
	}
	if (isFunction(expr)) {
		const inferredKey = inferTwoWayBindingKey(component, expr, resolvedType, element, resolvedAttr);
		if (inferredKey) {
			return installTwoWaySpot(resolvedPlan, element, expr, component, inferredKey);
		}
		return installComputedSpot(resolvedPlan, element, expr, component);
	}
	/*
	 * Static literal value — patch once now; updateTemplateSpots will repatch
	 * on re-render if the expr changes.
	 */
	const staticSpot = new StaticSpot(element, plan.slotIndex, resolvedType, resolvedAttr, expr, plan.declaredKind);
	staticSpot.elided = plan.elided === true;
	if (resolvedType === SPOT_TYPE.TEXT) {
		if (ListBinding.isListBinding(expr)) {
			staticSpot.patch = patchListKind;
			if (!staticSpot.elided) {
				element.style.pointerEvents = '';
			}
		} else if (ComponentBinding.is(expr)) {
			staticSpot.patch = patchComponentKind;
			if (!staticSpot.elided) {
				element.style.pointerEvents = '';
			}
		}
	}
	patchSpot(staticSpot, expr);
	return staticSpot;
}
function cleanupSpots(spots) {
	if (!spots || !spots.length) {
		return;
	}
	const spotsLength = spots.length;
	for (let spotIndex = 0; spotIndex < spotsLength; spotIndex++) {
		spots[spotIndex].unsubscribe();
	}
}
function collectBoundKeys(spots, dataBindPlans) {
	const keys = new Set();
	const spotsLength = spots.length;
	for (let spotIndex = 0; spotIndex < spotsLength; spotIndex++) {
		const spot = spots[spotIndex];
		if (spot.type === SPOT_TYPE.MULTI_ATTR || spot.type === SPOT_TYPE.CLASS_LIST) {
			const partsLength = spot.parts.length;
			for (let partIndex = 0; partIndex < partsLength; partIndex++) {
				const part = spot.parts[partIndex];
				if (isBindingType(part.expr)) {
					keys.add(part.expr.key);
				}
			}
			continue;
		}
		if (spot.bindingKey) {
			keys.add(spot.bindingKey);
			continue;
		}
		if (isBindingType(spot.expr)) {
			keys.add(spot.expr.key);
		}
	}
	if (dataBindPlans) {
		const dataBindPlansLength = dataBindPlans.length;
		for (let planIndex = 0; planIndex < dataBindPlansLength; planIndex++) {
			const plan = dataBindPlans[planIndex];
			if (plan.key) {
				keys.add(plan.key);
			}
		}
	}
	return keys;
}
const EMPTY_SPOTS = Object.freeze([]);
const EMPTY_UNSUBS = Object.freeze([]);
const EMPTY_KEYS = new Set();
function instantiateRecipe(recipe, exprs, component) {
	if (recipe.isStatic) {
		return {
			fragment: recipe.fragment.cloneNode(true),
			spots: EMPTY_SPOTS,
			unsubs: EMPTY_UNSUBS,
			boundKeys: EMPTY_KEYS,
		};
	}
	const instantiateMark = Perf.mark('instantiate');
	const fragment = recipe.fragment.cloneNode(true);
	const spots = [];
	const unsubs = [];
	const spotPlans = recipe.spotPlans;
	const dataBindPlans = recipe.dataBindPlans;
	const subeventPlans = recipe.subeventPlans;
	const refPlans = recipe.refPlans;
	/*
	 * PHASE 1 — resolve every plan's node(s) on the PRISTINE clone, before any
	 * install runs. An anchored spot install inserts content between its comment
	 * markers, shifting the child indices of every later marker; capturing all
	 * references up front keeps paths valid. Phase 2 only moves captured refs.
	 */
	const spotInstallMark = Perf.mark('spotInstall');
	const spotResolved = new Array(spotPlans.length);
	const spotPlansLength = spotPlans.length;
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		spotResolved[spotIndex] = resolveSpotNode(spotPlans[spotIndex], fragment);
	}
	const dataBindEls = new Array(dataBindPlans.length);
	const dataBindPlansLength = dataBindPlans.length;
	for (let bindIndex = 0; bindIndex < dataBindPlansLength; bindIndex++) {
		dataBindEls[bindIndex] = walkPath(fragment, dataBindPlans[bindIndex].path);
	}
	const subeventEls = subeventPlans ? new Array(subeventPlans.length) : null;
	if (subeventPlans) {
		const subeventPlansLength = subeventPlans.length;
		for (let subeventIndex = 0; subeventIndex < subeventPlansLength; subeventIndex++) {
			subeventEls[subeventIndex] = walkPath(fragment, subeventPlans[subeventIndex].path);
		}
	}
	const refEls = refPlans ? new Array(refPlans.length) : null;
	if (refPlans) {
		const refPlansLength = refPlans.length;
		for (let refIndex = 0; refIndex < refPlansLength; refIndex++) {
			refEls[refIndex] = walkPath(fragment, refPlans[refIndex].path);
		}
	}
	// PHASE 2 — install. Anchored insertions are now safe (every node captured).
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		const spot = installSpotFromPlan(spotPlans[spotIndex], spotResolved[spotIndex], exprs, component);
		if (spot) {
			spots.push(spot);
		}
	}
	Perf.measure('spotInstall', spotInstallMark);
	for (let bindIndex = 0; bindIndex < dataBindPlansLength; bindIndex++) {
		const element = dataBindEls[bindIndex];
		if (!element) {
			continue;
		}
		installDataBind(element, dataBindPlans[bindIndex].key, component, unsubs, dataBindPlans[bindIndex].modifiers);
	}
	if (subeventPlans) {
		const subeventPlansLength = subeventPlans.length;
		for (let subeventIndex = 0; subeventIndex < subeventPlansLength; subeventIndex++) {
			const element = subeventEls[subeventIndex];
			if (!element) {
				continue;
			}
			/*
			 * Behavior install owns the initial value end-to-end — passed as the
			 * `value` arg directly. The tooltip behavior stores `value` in a
			 * WeakMap; legacy behaviors only need it at install time. Dynamic
			 * updates flow through `applySubeventAttr` → `behavior.applyValue`.
			 */
			const plan = subeventPlans[subeventIndex];
			const behavior = getBehavior(plan.attrName);
			if (behavior?.install) {
				behavior.install(element, plan.value, component);
				if (behavior.uninstall) {
					unsubs.push(new BehaviorTeardown(behavior, element));
				}
			}
		}
	}
	if (refPlans) {
		const refPlansLength = refPlans.length;
		for (let refIndex = 0; refIndex < refPlansLength; refIndex++) {
			const element = refEls[refIndex];
			if (!element) {
				continue;
			}
			unsubs.push(registerRef(component, refPlans[refIndex].name, element));
		}
	}
	const instance = {
		fragment,
		spots,
		unsubs,
		boundKeys: collectBoundKeys(spots, recipe.dataBindPlans),
	};
	Perf.measure('instantiate', instantiateMark);
	return instance;
}
function updateSpot(spot, newExpr, component) {
	if (spot.type === SPOT_TYPE.EVENT) {
		spot.expr = newExpr;
		return;
	}
	if (spot.type === SPOT_TYPE.BIND) {
		return;
	}
	if (isBindingType(newExpr) || isFunction(newExpr)) {
		spot.expr = newExpr;
		return;
	}
	/*
	 * ATTR routes through patchSpot like every other patchable type — the old
	 * inline ATTR copy here DRIFTED from patchSpotBody (String()-ified falsy
	 * values first render removes, fed subevent behaviors the stringified value
	 * instead of the raw one, clobbered style objects). One application path =
	 * parity with first render by construction.
	 */
	if (
		spot.type === SPOT_TYPE.TEXT ||
		spot.type === SPOT_TYPE.ATTR ||
		spot.type === SPOT_TYPE.BARE_ATTR ||
		spot.type === SPOT_TYPE.BOOL_ATTR ||
		spot.type === SPOT_TYPE.PROP ||
		spot.type === SPOT_TYPE.METHOD
	) {
		patchSpot(spot, newExpr);
		spot.expr = newExpr;
	}
}
function isStateProxyValue(value) {
	/*
	 * Both `StateProxyHandler` and `TrackingProxyHandler` answer the
	 * `STATE_PATH` symbol with a non-undefined dotted path. Plain objects
	 * return undefined because symbols can only be looked up by identity.
	 * We use this to distinguish "a value that may have mutated in place"
	 * (state proxy whose underlying object got patched) from a true static
	 * value, so `updateTemplateSpots` knows not to bail on the same-
	 * reference skip for the proxy case.
	 */
	return value !== null && typeof value === 'object' && value[STATE_PATH] !== undefined;
}
/**
 * Shared between MULTI_ATTR and CLASS_LIST spot re-render paths. Walks the
 * spot's `parts` array, updates any expression slots whose value changed
 * against the latest `newExprs`, and returns whether any slot changed. Pure
 * indexed for-loop, no per-call closure — was previously two near-identical
 * `eachArray(spot.parts, (part) => {…})` blocks allocating an arrow per
 * multi/class spot per re-render.
 */
function syncSpotParts(parts, newExprs) {
	let changed = false;
	const partsLength = parts.length;
	for (let partIndex = 0; partIndex < partsLength; partIndex++) {
		const part = parts[partIndex];
		if (part.exprIndex === undefined) {
			continue;
		}
		const partVal = newExprs[part.exprIndex];
		if (part.expr !== partVal) {
			part.expr = partVal;
			changed = true;
		}
	}
	return changed;
}
function updateTemplateSpots(state, newExprs, component) {
	const {
		spots, prevExprs,
	} = state;
	const spotsLength = spots.length;
	for (let spotIndex = 0; spotIndex < spotsLength; spotIndex++) {
		const spot = spots[spotIndex];
		if (spot.type === SPOT_TYPE.MULTI_ATTR) {
			if (syncSpotParts(spot.parts, newExprs)) {
				spot.refresh();
			}
			continue;
		}
		if (spot.type === SPOT_TYPE.CLASS_LIST) {
			if (syncSpotParts(spot.parts, newExprs)) {
				spot.refresh();
			}
			continue;
		}
		const slotIndex = spot.slotIndex;
		if (slotIndex === undefined) {
			continue;
		}
		const newVal = newExprs[slotIndex];
		const prevVal = prevExprs[slotIndex];
		/*
		 * The reference-equality skip is correct for static values and
		 * function refs (computed spots own their own subscription path).
		 * It is INCORRECT for a live state proxy: the proxy reference is
		 * cached per underlying object, so `parent.state.foo` returns the
		 * same proxy across renders even when the underlying object's
		 * properties have mutated. Bailing here would freeze any child
		 * `.state=${this.state.foo}` binding on the first render's
		 * snapshot. Detect the proxy and let `updateSpot` patch through —
		 * the child's `replaceState` does its own plainEqual check, so
		 * genuinely unchanged proxies still cost only a deep compare.
		 */
		if (newVal === prevVal && !isStateProxyValue(newVal)) {
			continue;
		}
		updateSpot(spot, newVal, component);
	}
	/*
	 * Retain the exprs array directly — no copy. Every caller on the patch path
	 * (templateHtml / templateHtmlElement / patchLightRow) passes a freshly minted
	 * single-use array and returns before any instantiate, and prevExprs is only
	 * ever read — so there is nothing to alias against. (The INSTALL sites still
	 * `.slice()` because there the array is shared with instantiateRecipe.)
	 */
	state.prevExprs = newExprs;
}
/**
 * Per-instance template runtime: plain fields, no closures. All template
 * methods are first-class functions on WebComponent.prototype so the JIT can
 * monomorphize them across every component instance. `tplCleanupNodes` is the
 * only set of nodes we must visit on teardown — populated by templateHtmlElement.
 * Other DOM nodes' WeakMap entries (HTML_ELEMENT_INSTANCES) auto-clean on GC
 * once `replaceChildren` detaches them; we don't pay for a full subtree walk.
 */
export function initTemplateRuntime(component) {
	component.tplUnsubs = [];
	component.tplState = null;
	component.tplBoundKeys = new Set();
	component.tplCleanupNodes = new Set();
	/*
	 * One entry per `this.htmlElement` call site. Keyed by the tagged-
	 * template strings array so re-entering the same call site returns the
	 * same root element with its spots patched in place. Without this,
	 * patterns like `${this.renderBody}` (computed spot → `htmlElement`)
	 * would mint a fresh subtree on every dep change, ripping focus out of
	 * any focused input every time the user typed.
	 */
	component.htmlElementCache = new Map();
}
function runCleanupOnNode(node) {
	cleanupTemplateNode(node);
}
function runTemplateCleanup(component) {
	/* Detach relocated <portal> wrappers first — fires on rebuild (before
	 * re-projection) AND disconnect (cleanupTemplate), so a portal never outlives
	 * its owner. A patch pass skips this path, leaving moved content to patch in place. */
	removePortals(component);
	if (component.tplState) {
		cleanupSpots(component.tplState.spots);
	}
	eachArray(component.tplUnsubs, disposeItem);
	component.tplUnsubs = [];
	if (component.tplCleanupNodes.size) {
		component.tplCleanupNodes.forEach(runCleanupOnNode);
		component.tplCleanupNodes.clear();
	}
	component.tplState = null;
	component.tplBoundKeys = new Set();
	component.htmlElementCache?.clear();
}
export function templateCleanup() {
	runTemplateCleanup(this);
}
export function templateHtml(strings, ...exprs) {
	const state = this.tplState;
	if (state && state.strings === strings) {
		updateTemplateSpots(state, exprs, this);
		this.templateBuilt = true;
		return;
	}
	runTemplateCleanup(this);
	const recipe = getRecipe(strings);
	const instance = instantiateRecipe(recipe, exprs, this);
	this.tplUnsubs = instance.unsubs;
	this.tplBoundKeys = instance.boundKeys;
	const renderRoot = this.shadowRoot ?? this;
	/*
	 * Light DOM (renderRoot === this): capture the host's authored children before
	 * replaceChildren detaches them, then redistribute into the template's <slot>
	 * markers. Shadow DOM projects natively — skipped. Both helpers self-guard, so
	 * a light component with no authored children pays only a WeakMap lookup.
	 */
	if (renderRoot === this) {
		captureLightChildren(this);
	}
	renderRoot.replaceChildren(instance.fragment);
	if (renderRoot === this) {
		projectLightChildren(this);
	}
	/* Relocate any <portal> markers AFTER mount — both shadow and light, since a
	 * portal escapes the render root in either mode. Gated on the recipe flag so
	 * portal-free templates skip the query; spots already point at the moved nodes,
	 * so reactivity follows for free. */
	if (recipe.hasPortal) {
		projectPortals(this, renderRoot);
	}
	this.templateBuilt = true;
	this.tplState = {
		strings,
		spots: instance.spots,
		prevExprs: exprs.slice(),
	};
}
const HTML_ELEMENT_INSTANCES = new WeakMap();
function cleanupHtmlElementInstance(node) {
	const instance = HTML_ELEMENT_INSTANCES.get(node);
	if (!instance) {
		return;
	}
	HTML_ELEMENT_INSTANCES.delete(node);
	cleanupSpots(instance.spots);
	clearSubscriptions(instance.unsubs);
}
export function templateHtmlElement(strings, ...exprs) {
	/*
	 * Stable identity across calls from the same site: the tagged-template
	 * `strings` array is a per-call-site singleton, so we cache the root
	 * element + tplState there. Repeated calls (e.g. a `${this.renderBody}`
	 * computed spot refreshing on every typed character) patch the existing
	 * subtree's spots in place via `updateTemplateSpots` and return the
	 * same root, which lets `patchComponentKind`'s `firstChild === node`
	 * short-circuit fire and leaves focus, selection, and IME state alone.
	 */
	const cache = this.htmlElementCache;
	if (cache) {
		const cached = cache.get(strings);
		if (cached) {
			updateTemplateSpots(cached.tplState, exprs, this);
			return cached.element;
		}
	}
	const recipe = getRecipe(strings);
	const instance = instantiateRecipe(recipe, exprs, this);
	if (instance.fragment.children.length !== 1) {
		cleanupSpots(instance.spots);
		clearSubscriptions(instance.unsubs);
		throw new TypeError('htmlElement requires exactly one root element.');
	}
	const element = instance.fragment.firstElementChild;
	HTML_ELEMENT_INSTANCES.set(element, instance);
	element[TEMPLATE_CLEANUP] = cleanupHtmlElementInstance;
	this.tplCleanupNodes?.add(element);
	if (cache) {
		cache.set(strings, {
			element,
			tplState: {
				strings,
				spots: instance.spots,
				prevExprs: exprs.slice(),
			},
		});
	}
	return element;
}
