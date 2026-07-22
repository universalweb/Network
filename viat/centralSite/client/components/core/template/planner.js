/* eslint-disable no-restricted-syntax */
/*
 * Template PLANNER — the parse-time half of the template engine. Owns the
 * per-template-literal RECIPE: `getRecipe(strings)` parses the tagged
 * template once (buildHTML → inert <template> → marker map → spot plans →
 * data-bind / subevent / ref plans) and caches the result keyed by the
 * `strings` array identity. Recipes are pure parse artifacts — node paths and
 * plan descriptors only, zero component/state coupling — consumed by the
 * runtime half (template.js `instantiateRecipe` / light rows), which resolves
 * plans against a fresh clone via `resolveSpotNode` / `walkPath`.
 */
import { behaviorAttrNames } from '../behaviors/index.js';
import { isValidRefName } from '../dom/refs.js';
import {
	ANCHOR_END_PREFIX,
	ANCHOR_START_PREFIX,
	SPOT,
	SPOT_TYPE,
} from './constants.js';
import {
	bareAttrMarkerAttribute,
	bindMarkerAttribute,
	buildHTML,
	eventMarkerAttribute,
	methodMarkerAttribute,
	multiAttrMarkerAttribute,
} from './parser.js';
const SUBEVENT_ATTRS = behaviorAttrNames();
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
/*
 * Single-sweep plan resolution. The old shape walked a child-index path from
 * the clone ROOT per plan (resolveSpotNode/walkPath per instantiation) — a
 * live-NodeList hop per path segment per plan per row. cloneNode(true)
 * preserves the exact node sequence, so every plan target is instead resolved
 * by its PRE-ORDER INDEX: the recipe stores one sorted `resolveTargets` array
 * (computed once at parse time), each plan carries slot positions into it, and
 * instantiation runs ONE TreeWalker sweep that early-exits after the last
 * target. Callers still resolve every node before installing any plan — an
 * anchored install shifts later siblings, so indices are only valid on the
 * pristine clone.
 */
// @engram em:network/concept/pre-order-slot-plan-resolution-one-treewalker-sweep-replaces — one TreeWalker sweep replaces per-plan root walks; slots assigned at parse via temp preIndex then remapped to the sorted targets
export function resolveRecipeNodes(fragment, targets) {
	const targetsLength = targets.length;
	const resolved = new Array(targetsLength);
	if (targetsLength === 0) {
		return resolved;
	}
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ALL);
	let cursor = 0;
	let preIndex = 0;
	for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
		if (preIndex === targets[cursor]) {
			resolved[cursor] = node;
			cursor += 1;
			if (cursor === targetsLength) {
				return resolved;
			}
		}
		preIndex += 1;
	}
	return resolved;
}
function planPreIndex(fragment, preIndexByNode, path) {
	return preIndexByNode.get(walkPath(fragment, path));
}
/*
 * Parse-time slot assignment (two passes over the plans): pass A stamps each
 * plan's slot fields with the RAW pre-order index of its target; the unique
 * indices are then sorted into `resolveTargets`; pass B rewrites every stamp
 * to its position in that sorted array. Duplicate targets (several attr spots
 * on one element) share a slot.
 */
function assignResolveSlots(fragment, spotPlans, dataBindPlans, subeventPlans, refPlans) {
	const preIndexByNode = new Map();
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ALL);
	let preIndex = 0;
	for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
		preIndexByNode.set(node, preIndex);
		preIndex += 1;
	}
	const uniqueTargets = new Set();
	const spotPlansLength = spotPlans.length;
	for (let planIndex = 0; planIndex < spotPlansLength; planIndex++) {
		const plan = spotPlans[planIndex];
		if (plan.anchored) {
			plan.startSlot = planPreIndex(fragment, preIndexByNode, plan.startPath);
			plan.endSlot = planPreIndex(fragment, preIndexByNode, plan.endPath);
			uniqueTargets.add(plan.startSlot);
			uniqueTargets.add(plan.endSlot);
		} else {
			plan.nodeSlot = planPreIndex(fragment, preIndexByNode, plan.path);
			uniqueTargets.add(plan.nodeSlot);
		}
	}
	const dataBindPlansLength = dataBindPlans.length;
	for (let planIndex = 0; planIndex < dataBindPlansLength; planIndex++) {
		const plan = dataBindPlans[planIndex];
		plan.nodeSlot = planPreIndex(fragment, preIndexByNode, plan.path);
		uniqueTargets.add(plan.nodeSlot);
	}
	const subeventPlansLength = subeventPlans.length;
	for (let planIndex = 0; planIndex < subeventPlansLength; planIndex++) {
		const plan = subeventPlans[planIndex];
		plan.nodeSlot = planPreIndex(fragment, preIndexByNode, plan.path);
		uniqueTargets.add(plan.nodeSlot);
	}
	const refPlansLength = refPlans.length;
	for (let planIndex = 0; planIndex < refPlansLength; planIndex++) {
		const plan = refPlans[planIndex];
		plan.nodeSlot = planPreIndex(fragment, preIndexByNode, plan.path);
		uniqueTargets.add(plan.nodeSlot);
	}
	const resolveTargets = [...uniqueTargets].sort(compareTargetIndices);
	const slotByTarget = new Map();
	const resolveTargetsLength = resolveTargets.length;
	for (let slotIndex = 0; slotIndex < resolveTargetsLength; slotIndex++) {
		slotByTarget.set(resolveTargets[slotIndex], slotIndex);
	}
	for (let planIndex = 0; planIndex < spotPlansLength; planIndex++) {
		const plan = spotPlans[planIndex];
		if (plan.anchored) {
			plan.startSlot = slotByTarget.get(plan.startSlot);
			plan.endSlot = slotByTarget.get(plan.endSlot);
		} else {
			plan.nodeSlot = slotByTarget.get(plan.nodeSlot);
		}
	}
	for (let planIndex = 0; planIndex < dataBindPlansLength; planIndex++) {
		dataBindPlans[planIndex].nodeSlot = slotByTarget.get(dataBindPlans[planIndex].nodeSlot);
	}
	for (let planIndex = 0; planIndex < subeventPlansLength; planIndex++) {
		subeventPlans[planIndex].nodeSlot = slotByTarget.get(subeventPlans[planIndex].nodeSlot);
	}
	for (let planIndex = 0; planIndex < refPlansLength; planIndex++) {
		refPlans[planIndex].nodeSlot = slotByTarget.get(refPlans[planIndex].nodeSlot);
	}
	return resolveTargets;
}
function compareTargetIndices(first, second) {
	return first - second;
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
		const markerAttr = isDeduce ? `data-uwc-evfn-${entry.i}` : eventMarkerAttribute(entry.eventName, entry.i);
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
	const resolveTargets = assignResolveSlots(fragment, spotPlans, dataBindPlans, subeventPlans, refPlans);
	return {
		fragment,
		spotPlans,
		dataBindPlans,
		subeventPlans,
		refPlans,
		resolveTargets,
		/* Detect a <portal> ONCE per template literal (recipe is cached), so the
		 * per-render relocation pass is gated to templates that actually use it —
		 * every portal-free component pays zero query cost on each build. */
		hasPortal: Boolean(fragment.querySelector('portal')),
		isStatic: !spotPlans.length && !dataBindPlans.length && !subeventPlans.length && !refPlans.length,
	};
}
export function getRecipe(strings) {
	let recipe = TEMPLATE_RECIPES.get(strings);
	if (!recipe) {
		recipe = prepareRecipe(strings);
		TEMPLATE_RECIPES.set(strings, recipe);
	}
	return recipe;
}
