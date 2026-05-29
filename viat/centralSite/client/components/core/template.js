/* eslint-disable no-restricted-syntax */
import {
	Binding,
	CONTENT_KIND,
	bind,
	makeGlobalProxy,
	makeProxy,
	track,
} from './state/binding.js';
import {
	createElementFromHTML,
	disposeItem,
	eachArray,
	eachNodeList,
	getValueAtPath,
	isElement,
	isFunction,
	isString,
	setValueAtPath,
	syncSubsByDiff,
} from './utilities.js';
import { isValidRefName, registerRef } from './dom/refs.js';
import { ensureStateBus, STATE_PATH } from './state/state.js';
import { schedule } from './lifecycle/scheduler.js';
import { globalState } from './state/globalState.js';
import { behaviorAttrNames, getBehavior } from './behaviors/index.js';
/**
 * Spot type vocabulary. Single source of truth for every `spot.type` /
 * `plan.type` / `entry.type` literal the template runtime reads or writes.
 * Use `SPOT_TYPE.X` everywhere — never a bare string literal. The parser
 * (extractor) emits these on entries, the planner copies them into plans,
 * and the Spot subclasses store them for the patch dispatch in `patchSpot` /
 * `updateSpot` / `updateTemplateSpots`.
 */
export const SPOT_TYPE = Object.freeze({
	TEXT: 'text',
	BARE_ATTR: 'bare-attr',
	ATTR: 'attr',
	BOOL_ATTR: 'bool-attr',
	PROP: 'prop',
	MULTI_ATTR: 'multi-attr',
	CLASS_LIST: 'class-list',
	EVENT: 'event',
	BIND: 'bind',
});
/**
 * Spot kind vocabulary. Identifies the Spot subclass family — set in each
 * subclass constructor, read by `Spot.handle` to gate list-only bookkeeping
 * (the only cross-class branch on kind today). Cleared to `null` by the
 * non-reactive one-shot path in `installBindingSpot`.
 */
export const SPOT_KIND = Object.freeze({
	BINDING: 'binding',
	LIST: 'list',
	COMPUTED: 'computed',
	MULTI: 'multi',
	CLASS: 'class',
});
const SUBEVENT_ATTRS = behaviorAttrNames();
// Behavior-attribute attribute application. The template extractor strips the
// raw `tooltip="…"` / `hotkey="…"` etc. attributes; this function reflects the
// (possibly dynamic) value into a sibling `data-<name>` attribute that the
// behavior implementations read on demand. Pure write — install/uninstall of
// the actual per-element listeners is owned by `behavior.install`, wired in
// the fragment build path (further down). Subevent map / `registerSubevent`
// machinery removed in Phase 8 — dataset is now the single store.
function applySubeventAttr(el, attrName, value) {
	if (!SUBEVENT_ATTRS.has(attrName)) {
		return false;
	}
	if (el.hasAttribute(attrName)) {
		el.removeAttribute(attrName);
	}
	const isEmpty = value == null || value === false || value === '';
	if (isEmpty) {
		el.removeAttribute(`data-${attrName}`);
		return true;
	}
	const next = value === true ? '' : String(value);
	el.setAttribute(`data-${attrName}`, next);
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
function addTokens(source, target) {
	if (typeof source !== 'string') {
		return;
	}
	const tokens = source.split(/\s+/);
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token) {
			target.add(token);
		}
	}
}
function applyClassListItems(items, desired, deps, component) {
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const t = typeof item;
		if (t === 'string') {
			addTokens(item, desired);
			continue;
		}
		if (item == null || item === false) {
			continue;
		}
		if (t === 'function') {
			let evalValue;
			if (component) {
				const evaluated = evaluateTrackedExpression(component, item);
				evaluated.deps.forEach(deps.add, deps);
				evalValue = evaluated.value;
			} else {
				evalValue = item();
			}
			if (typeof evalValue === 'string') {
				addTokens(evalValue, desired);
			} else if (evalValue) {
				applyClassListItems([evalValue], desired, deps, component);
			}
			continue;
		}
		if (isBindingType(item)) {
			deps.add(item.key);
			const value = component ? resolveBindingValue(component, item.key) : item.value;
			if (typeof value === 'string') {
				addTokens(value, desired);
			} else if (value) {
				applyClassListItems([value], desired, deps, component);
			}
			continue;
		}
		if (item instanceof Set) {
			item.forEach((v) => {
				if (typeof v === 'string') {
					desired.add(v);
				}
			});
			const path = item[STATE_PATH];
			if (path) {
				deps.add(path);
			}
			continue;
		}
		if (Array.isArray(item)) {
			applyClassListItems(item, desired, deps, component);
			const path = item[STATE_PATH];
			if (path) {
				deps.add(path);
			}
			continue;
		}
		if (item instanceof Map) {
			item.forEach((v, k) => {
				if (v && typeof k === 'string') {
					desired.add(k);
				}
			});
			const path = item[STATE_PATH];
			if (path) {
				deps.add(path);
			}
			continue;
		}
		const keys = Object.keys(item);
		for (let j = 0; j < keys.length; j++) {
			const key = keys[j];
			const value = item[key];
			let resolved = value;
			if (typeof value === 'function') {
				if (component) {
					const evaluated = evaluateTrackedExpression(component, value);
					evaluated.deps.forEach(deps.add, deps);
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
function diffClassList(el, current, desired) {
	current.forEach((token) => {
		if (!desired.has(token)) {
			el.classList.remove(token);
		}
	});
	desired.forEach((token) => {
		if (!current.has(token)) {
			el.classList.add(token);
		}
	});
}
const SPOT = 'data-expr';
const TEMPLATE_CLEANUP = Symbol('templateCleanup');
const BIND_MARKER = 'data-bind-expr';
const BINDABLE_TAGS = new Set([
	'INPUT', 'SELECT', 'TEXTAREA',
]);
const BINDABLE_ATTRS = new Set(['value', 'checked']);
const ATTR_NAME_RE = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;
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
function createRenderableElement(value) {
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
function resolveRenderKind(renderFn) {
	if (isString(renderFn)) {
		return 'tag';
	}
	if (isCustomElementConstructor(renderFn)) {
		return 'class';
	}
	return 'fn';
}
function createListElementByKind(kind, renderFn, item) {
	if (kind === 'tag') {
		const el = document.createElement(renderFn);
		el.state = item;
		return el;
	}
	if (kind === 'class') {
		return new renderFn(item);
	}
	return createRenderableElement(renderFn(item));
}
function createListElement(renderFn, item) {
	return createListElementByKind(resolveRenderKind(renderFn), renderFn, item);
}
export class ListBinding extends Binding {
	static isListBinding(source) {
		return source instanceof ListBinding;
	}
	constructor(key, renderFn, keyFn) {
		super(key, null);
		this.renderFn = renderFn;
		this.keyFn = keyFn;
	}
}
function isBindingType(x) {
	if (!x) {
		return false;
	}
	const c = x.constructor;
	return c === Binding || c === ListBinding;
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
export class LiveList {
	items = [];
	renderFn;
	keyFn;
	kind = null;
	spot = null;
	constructor(renderFn, keyFn = (item, index) => {
		return index;
	}) {
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
		return createListElementByKind(this.kind, this.renderFn, item);
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
			for (let insertIndex = 0; insertIndex < newItems.length; insertIndex++) {
				const newItem = newItems[insertIndex];
				const itemKey = this.keyFn(newItem, normalStart + insertIndex);
				const element = this.createElement(newItem);
				this.spot.keyMap.set(itemKey, element);
				this.spot.prevItemMap.set(itemKey, newItem);
				fragment.append(element);
			}
			this.spot.el.insertBefore(fragment, refElement ?? null);
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
export function each(items, renderFn, keyFn = (item, index) => {
	return index;
}) {
	const listItem = new LiveList(renderFn, keyFn);
	if (Array.isArray(items) && items.length) {
		listItem.push(...items);
	}
	return listItem;
}
export function liveList(items, renderTarget, keyFn = (item, index) => {
	return item?.key ?? item?.id ?? index;
}) {
	return each(items, renderTarget, keyFn);
}
export function list(key, renderFn, keyFn = (item, index) => {
	return item?.key ?? item?.id ?? index;
}) {
	return new ListBinding(key, renderFn, keyFn);
}
// `bind.list` — typed LIST variant of the bind family. Wired here, where the
// list machinery lives, onto the shared `bind` callable (no import circular).
bind.list = list;
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
	const anchor = spot.el;
	const oldMap = spot.keyMap ?? new Map();
	const prevItemMap = spot.prevItemMap ?? new Map();
	const newMap = new Map();
	const isBatchInsert = oldMap.size === 0 && items.length > 1;
	const fragment = isBatchInsert ? document.createDocumentFragment() : null;
	let cursor = null;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const key = keyFn(item, i);
		let element = oldMap.get(key);
		if (element) {
			oldMap.delete(key);
			if (item !== prevItemMap.get(key)) {
				if (isFunction(element.assignState)) {
					element.assignState(item);
				} else {
					const replacement = itemList.createElement(item);
					cleanupTemplateNode(element);
					element.replaceWith(replacement);
					element = replacement;
				}
			}
		} else {
			element = itemList.createElement(item);
			if (fragment) {
				fragment.append(element);
			}
		}
		if (!fragment) {
			const referenceNode = cursor ? cursor.nextSibling : anchor.firstChild;
			if (element !== referenceNode) {
				anchor.insertBefore(element, referenceNode ?? null);
			}
			cursor = element;
		}
		newMap.set(key, element);
		prevItemMap.set(key, item);
	}
	oldMap.forEach((element, key) => {
		cleanupTemplateNode(element);
		element.remove();
		prevItemMap.delete(key);
	});
	if (fragment) {
		anchor.append(fragment);
	}
	spot.keyMap = newMap;
	spot.prevItemMap = prevItemMap;
}
function attrContext(templateString) {
	const attrMatch = templateString.match(/([?.])?([\w:-]+)=(["']?)$/);
	if (!attrMatch) {
		return null;
	}
	return {
		sigil: attrMatch[1] ?? null,
		name: attrMatch[2],
		quote: attrMatch[3],
	};
}
function eventContext(templateString) {
	const eventMatch = templateString.match(/^(?<prefix>[\s\S]*?)@(?<eventName>[\w:-]+)=["']?$/);
	if (eventMatch?.groups?.eventName) {
		return {
			eventName: eventMatch.groups.eventName,
			prefix: eventMatch.groups.prefix,
			deduceFromExpr: false,
		};
	}
	const shorthandMatch = templateString.match(/^(?<prefix>[\s\S]*?\s)@$/);
	if (shorthandMatch) {
		return {
			eventName: null,
			prefix: shorthandMatch.groups.prefix,
			deduceFromExpr: true,
		};
	}
	return null;
}
function eventMarkerAttribute(eventName) {
	return `data-event-${String(eventName).toLowerCase().replace(/[^a-z0-9:-]/g, '-')}`;
}
function bindMarkerAttribute(index) {
	return `${BIND_MARKER}-${index}`;
}
function bindContext(templateString) {
	const m = (/^(?<prefix>[\s\S]*?)@bind=["']?$/).exec(templateString);
	return m ? m.groups.prefix : null;
}
function bareAttrMarkerAttribute(index) {
	return `data-attr-expr-${index}`;
}
function multiAttrMarkerAttribute(index) {
	return `data-multi-attr-${index}`;
}
const ATTR_OPEN_RE = /([?.])?([\w:-]+)=(["'])([^"']*)$/;
function detectAttrOpen(currentString, nextString) {
	const match = ATTR_OPEN_RE.exec(currentString);
	if (!match) {
		return null;
	}
	const [
		, sigil,
		attrName,
		quote,
		prefix,
	] = match;
	if (prefix.length === 0 && nextString.startsWith(quote)) {
		return null;
	}
	if (sigil) {
		throw new SyntaxError(`${sigil}${attrName}="..." cannot have interpolated string content. Use ${sigil}${attrName}="\${expr}" with a single expression.`);
	}
	return {
		name: attrName,
		quote,
		prefix,
		totalLength: attrName.length + 2 + prefix.length,
	};
}
function bareAttrContext(currentString, nextString = '') {
	const lastOpen = currentString.lastIndexOf('<');
	const lastClose = currentString.lastIndexOf('>');
	if (lastOpen <= lastClose) {
		return false;
	}
	const trailingChar = currentString.at(-1);
	if (![
		' ',
		'\t',
		'\n',
		'\r',
	].includes(trailingChar)) {
		return false;
	}
	const leadingChar = nextString[0];
	if (leadingChar && ![
		' ',
		'\t',
		'\n',
		'\r',
		'/',
		'>',
	].includes(leadingChar)) {
		return false;
	}
	return true;
}
function inferBareAttrName(expr) {
	if (!isBindingType(expr)) {
		return null;
	}
	const attrName = String(expr.key ?? '')
		.split('.')
		.pop()
		?.trim();
	if (attrName && ATTR_NAME_RE.test(attrName)) {
		return attrName;
	}
	return null;
}
function buildHTML(strings, exprs) {
	let html = '';
	const meta = [];
	let attrAccum = null;
	for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
		let effectiveString = strings[stringIndex];
		const nextString = strings[stringIndex + 1] ?? '';
		if (attrAccum) {
			const closeIdx = effectiveString.indexOf(attrAccum.quote);
			if (closeIdx === -1) {
				if (effectiveString.length > 0) {
					attrAccum.parts.push({
						literal: effectiveString,
					});
				}
				if (stringIndex < exprs.length) {
					attrAccum.parts.push({
						exprIndex: stringIndex,
						expr: exprs[stringIndex],
					});
				}
				continue;
			}
			if (closeIdx > 0) {
				attrAccum.parts.push({
					literal: effectiveString.slice(0, closeIdx),
				});
			}
			meta.push({
				i: attrAccum.markerIdx,
				type: SPOT_TYPE.MULTI_ATTR,
				attr: attrAccum.name,
				parts: attrAccum.parts,
			});
			html += ` data-uwc ${multiAttrMarkerAttribute(attrAccum.markerIdx)}=""`;
			attrAccum = null;
			effectiveString = effectiveString.slice(closeIdx + 1);
		}
		const open = detectAttrOpen(effectiveString, nextString);
		if (open) {
			const beforeOpener = effectiveString.slice(0, effectiveString.length - open.totalLength);
			html += beforeOpener;
			attrAccum = {
				name: open.name,
				quote: open.quote,
				parts: open.prefix.length > 0 ? [
					{
						literal: open.prefix,
					},
				] : [],
				markerIdx: stringIndex,
			};
			if (stringIndex < exprs.length) {
				attrAccum.parts.push({
					exprIndex: stringIndex,
					expr: exprs[stringIndex],
				});
			}
			continue;
		}
		const bindPrefix = bindContext(effectiveString);
		const eventBinding = bindPrefix === null ? eventContext(effectiveString) : null;
		html += (bindPrefix !== null) ? bindPrefix : (eventBinding?.prefix ?? effectiveString);
		if (stringIndex >= exprs.length) {
			continue;
		}
		const expr = exprs[stringIndex];
		if (bindPrefix !== null) {
			html += `data-uwc ${bindMarkerAttribute(stringIndex)}=""`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.BIND,
				expr,
			});
			continue;
		}
		if (eventBinding) {
			if (eventBinding.deduceFromExpr) {
				html += `data-uwc data-uwc-evfn-${stringIndex}=""`;
				meta.push({
					i: stringIndex,
					type: SPOT_TYPE.EVENT,
					eventName: null,
					deduceFromExpr: true,
					expr,
				});
			} else {
				html += `data-uwc ${eventMarkerAttribute(eventBinding.eventName)}="expr${stringIndex}"`;
				meta.push({
					i: stringIndex,
					type: SPOT_TYPE.EVENT,
					eventName: eventBinding.eventName,
					deduceFromExpr: false,
					expr,
				});
			}
			continue;
		}
		const attr = attrContext(effectiveString);
		if (attr) {
			html += attr.quote === ''
				? `expr${stringIndex} data-uwc`
				: `expr${stringIndex}${attr.quote} data-uwc=${attr.quote}`;
			const baseMeta = {
				i: stringIndex,
				attr: attr.name,
				sigil: attr.sigil,
				expr,
			};
			if (attr.sigil === '?') {
				meta.push({
					...baseMeta,
					type: SPOT_TYPE.BOOL_ATTR,
				});
			} else if (attr.sigil === '.') {
				meta.push({
					...baseMeta,
					type: SPOT_TYPE.PROP,
				});
			} else {
				meta.push({
					...baseMeta,
					type: SPOT_TYPE.ATTR,
				});
			}
		} else if (bareAttrContext(effectiveString, nextString)) {
			const inferredAttr = inferBareAttrName(expr);
			if (inferredAttr) {
				html += `data-uwc ${bareAttrMarkerAttribute(stringIndex)}=""`;
				meta.push({
					i: stringIndex,
					type: SPOT_TYPE.BARE_ATTR,
					attr: inferredAttr,
					expr,
				});
				continue;
			}
		} else {
			html += `<span data-uwc ${SPOT}="${stringIndex}"></span>`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.TEXT,
				expr,
			});
		}
	}
	return {
		html,
		meta,
	};
}
function clearSubscriptions(subscriptions = []) {
	eachArray(subscriptions, disposeItem);
	return [];
}
function resolveBindingValue(component, bindingKey) {
	if (bindingKey.startsWith('global.')) {
		return getValueAtPath(globalState.proxy, bindingKey.slice(7));
	}
	return getValueAtPath(component.STATE, bindingKey);
}
function ensureRenderProxies(component) {
	const currentState = component.STATE ?? {};
	if (!component.renderProxy || component.renderProxyState !== currentState) {
		component.renderProxy = makeProxy(currentState, component);
		component.renderProxyState = currentState;
	}
	const currentGlobal = globalState.proxy;
	if (!component.globalRenderProxy || component.globalRenderProxyState !== currentGlobal) {
		component.globalRenderProxy = makeGlobalProxy(currentGlobal, component);
		component.globalRenderProxyState = currentGlobal;
	}
}
function evaluateTrackedExpression(component, expr) {
	ensureRenderProxies(component);
	const previousRenderTracking = component.renderTracking;
	component.renderTracking = true;
	const result = track(() => {
		return expr.call(component);
	});
	component.renderTracking = previousRenderTracking;
	return result;
}
function subscribeStatePath(component, statePath, handler, target) {
	return ensureStateBus(component).subscribe(statePath, handler, target);
}
function subscribeGlobalPath(statePath, handler, target) {
	return globalState.bus.subscribe(statePath, handler, target);
}
// Module-scope subscribe callback for syncSubsByDiff — receives `(dep, spot)`
// per the `subscribe(key, context)` contract. The handler is `spot.handle`,
// which resolves to `Spot.prototype.handle` via the prototype chain (same
// function value for every spot instance — no per-instance allocation). The
// spot is passed as the bus `target`, so the bus dispatches
// `handle.call(spot, …)` with zero per-spot closure (no `.bind`,
// no per-subscription wrapper).
function subscribeSpotDep(dep, spot) {
	if (dep.startsWith('global.')) {
		return subscribeGlobalPath(dep.slice(7), spot.handle, spot);
	}
	return subscribeStatePath(spot.component, dep, spot.handle, spot);
}
function syncSpotSubscriptions(spot, deps) {
	if (!spot.depMap) {
		spot.depMap = new Map();
	}
	syncSubsByDiff(spot.depMap, deps, subscribeSpotDep, spot);
}
// Text-position spots cache a specialized patcher in spot.patch so subsequent
// patches skip kind detection. Hot path is one virtual call per patch.
function patchListKind(spot, value) {
	if (!spot.keyMap && spot.el.firstChild) {
		spot.el.textContent = '';
	}
	patchList(spot, value);
}
function patchComponentKind(spot, value) {
	const node = ComponentBinding.is(value) ? value.value : value;
	if (spot.el.firstChild === node) {
		return;
	}
	spot.el.textContent = '';
	if (node) {
		spot.el.appendChild(node);
	}
}
function patchHtmlKind(spot, value) {
	spot.el.innerHTML = String(value ?? '');
}
// Strict text patcher — straight textContent, no markup scan. Used when the
// content kind is DECLARED (a typed bind or a `static types` entry): the dev
// has promised plain text, so skip the per-patch `<` / `&` detection.
function patchTextStrict(spot, value) {
	const str = String(value ?? '');
	if (spot.el.textContent !== str) {
		spot.el.textContent = str;
	}
}
// Auto text patcher — self-correcting. An auto-classified text spot may later
// receive a value carrying markup; on the first such value it upgrades itself
// to the HTML patcher and stays there.
function patchTextKind(spot, value) {
	const str = String(value ?? '');
	if (str.includes('<')) {
		spot.el.style.pointerEvents = '';
		spot.patch = patchHtmlKind;
		patchHtmlKind(spot, str);
		return;
	}
	if (str.includes('&')) {
		spot.patch = patchHtmlKind;
		patchHtmlKind(spot, str);
		return;
	}
	if (spot.el.textContent !== str) {
		spot.el.textContent = str;
	}
}
// ── Content-kind classification ──────────────────────────────────────
// classifyContentKind() is the SINGLE decision point that answers
// "what kind of content is this ${…}?". Every text-position value
// resolves to exactly one CONTENT_KIND (defined in binding.js);
// CONTENT_PATCHERS maps each kind to its patch routine. To add a kind:
// extend CONTENT_KIND, this function, and CONTENT_PATCHERS.
//
//   EMPTY      null | undefined | ''          → cleared via patchTextStrict
//   LIST       a LiveList (each() / list())   → patchListKind     keyed diff
//   COMPONENT  a comp() binding or a Node     → patchComponentKind  adopt node
//   HTML       a string with markup (< or &) → patchHtmlKind     innerHTML
//   TEXT       a plain string / number       → patchTextKind     textContent
// ─────────────────────────────────────────────────────────────────────
function classifyContentKind(value) {
	if (value === null || value === undefined || value === '') {
		return CONTENT_KIND.EMPTY;
	}
	if (LiveList.isLiveList(value)) {
		return CONTENT_KIND.LIST;
	}
	if (ComponentBinding.is(value) || value instanceof Node) {
		return CONTENT_KIND.COMPONENT;
	}
	const str = String(value);
	if (str.includes('<') || str.includes('&')) {
		return CONTENT_KIND.HTML;
	}
	return CONTENT_KIND.TEXT;
}
// Kind → patcher for a DECLARED kind. EMPTY and declared TEXT both use the
// strict patcher (the auto path below substitutes the self-correcting
// patchTextKind for an UNdeclared text spot).
const CONTENT_PATCHERS = {
	[CONTENT_KIND.EMPTY]: patchTextStrict,
	[CONTENT_KIND.TEXT]: patchTextStrict,
	[CONTENT_KIND.HTML]: patchHtmlKind,
	[CONTENT_KIND.COMPONENT]: patchComponentKind,
	[CONTENT_KIND.LIST]: patchListKind,
};
// A spot's contents-wrapper stays hit-testable only when it holds real
// elements (a list, a component, or markup with tags). Pure text and
// entity-only HTML opt out so the wrapper never intercepts pointer events.
function spotKeepsInteractive(kind, value) {
	if (kind === CONTENT_KIND.LIST || kind === CONTENT_KIND.COMPONENT) {
		return true;
	}
	if (kind === CONTENT_KIND.HTML) {
		return String(value ?? '').includes('<');
	}
	return false;
}
// Resolve and cache the patcher for a text-position spot. `spot.declaredKind`
// (set from a typed bind or `static types`) short-circuits classification.
function bindSpotKind(spot, value) {
	const declared = spot.declaredKind;
	const kind = declared ?? classifyContentKind(value);
	spot.contentKind = kind;
	// Auto-classified text OR empty stays self-correcting: a spot that is
	// empty (or plain text) now may later receive markup, and must be free to
	// upgrade itself to the HTML patcher. Only a DECLARED kind trusts itself.
	if ((kind === CONTENT_KIND.TEXT || kind === CONTENT_KIND.EMPTY) && !declared) {
		spot.patch = patchTextKind;
	} else {
		spot.patch = CONTENT_PATCHERS[kind];
	}
	spot.el.style.pointerEvents = spotKeepsInteractive(kind, value) ? '' : 'none';
}
function patchSpot(spot, value) {
	if (value instanceof Promise) {
		const token = (spot.patchToken ?? 0) + 1;
		spot.patchToken = token;
		value.then((v) => {
			if (spot.patchToken !== token) {
				return;
			}
			patchSpot(spot, v);
		}).catch((error) => {
			console.error('[template] async spot error:', error);
		});
		return;
	}
	if (spot.type === SPOT_TYPE.TEXT) {
		if (spot.keyMap && !LiveList.isLiveList(value)) {
			spot.keyMap.forEach(cleanupTemplateNode);
			spot.keyMap = null;
			spot.prevItemMap = null;
			spot.patch = null;
		}
		if (!spot.patch) {
			bindSpotKind(spot, value);
		}
		spot.patch(spot, value);
		return;
	}
	if (spot.type === SPOT_TYPE.BARE_ATTR) {
		if (applySubeventAttr(spot.el, spot.attr, value)) {
			return;
		}
		if (value === false || value === null || value === undefined || value === '') {
			if (spot.el.hasAttribute(spot.attr)) {
				spot.el.removeAttribute(spot.attr);
			}
			return;
		}
		if (value === true) {
			if (!spot.el.hasAttribute(spot.attr)) {
				spot.el.setAttribute(spot.attr, '');
			}
			return;
		}
		const bareStr = String(value);
		if (spot.el.getAttribute(spot.attr) !== bareStr) {
			spot.el.setAttribute(spot.attr, bareStr);
		}
		return;
	}
	if (spot.type === SPOT_TYPE.BOOL_ATTR) {
		const has = spot.el.hasAttribute(spot.attr);
		if (value && !has) {
			spot.el.setAttribute(spot.attr, '');
		} else if (!value && has) {
			spot.el.removeAttribute(spot.attr);
		}
		return;
	}
	if (spot.type === SPOT_TYPE.PROP) {
		if (spot.el[spot.attr] !== value) {
			spot.el[spot.attr] = value;
		}
		return;
	}
	if (applySubeventAttr(spot.el, spot.attr, value)) {
		return;
	}
	if (value === '' || value === null || value === undefined || value === false) {
		if (spot.el.hasAttribute(spot.attr)) {
			spot.el.removeAttribute(spot.attr);
		}
		return;
	}
	let str;
	if (spot.attr === 'class' && ClassList.isClassList(value)) {
		const desired = new Set();
		applyClassListItems(value.items, desired, new Set(), null);
		str = [...desired].join(' ');
	} else {
		str = String(value ?? '');
	}
	if (spot.el.getAttribute(spot.attr) !== str) {
		spot.el.setAttribute(spot.attr, str);
	}
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
	return spot.component.runEventHandler(spot.expr, domEvent, this, domEvent.type);
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
		this.pendingTask = null;
		this.pendingPaths = null;
	}
	/** Bus handler. List spots accumulate changed paths so a multi-path flush
	 *  can decide between per-item assignState (partial) and full re-diff. */
	handle(_nextValue, _prevOrGlobal, changedPath) {
		if (this.kind === SPOT_KIND.LIST) {
			if (!this.pendingPaths) {
				this.pendingPaths = [];
			}
			this.pendingPaths.push(changedPath);
		}
		if (this.pendingTask) {
			return this.pendingTask;
		}
		// Scheduler dedups by target identity (the spot). One prototype-method
		// reference + per-spot target = zero `.bind` and no per-flush
		// collisions across spots.
		this.pendingTask = schedule(Spot.prototype.runTask, this);
		return this.pendingTask;
	}
	runTask() {
		this.pendingTask = null;
		return this.refresh();
	}
	/** Virtual. Subclasses with reactive deps override. */
	refresh() {
		return undefined;
	}
	unsubscribe() {
		if (this.depMap) {
			this.depMap.forEach(disposeItem);
			this.depMap.clear();
			this.depMap = null;
		}
		if (this.unsubs && this.unsubs.length) {
			this.unsubs = clearSubscriptions(this.unsubs);
		}
		this.pendingTask = null;
		this.pendingPaths = null;
	}
}
/**
 * One-way state-path watcher. `this.bind('foo')` / `${this.state.foo}` /
 * any `${bindingExpr}` whose expr resolves to a single state path.
 */
class BindingSpot extends Spot {
	constructor(el, slotIndex, type, attr, expr, component, bindingKey, declaredKind) {
		super();
		this.kind = SPOT_KIND.BINDING;
		this.type = type;
		this.attr = attr;
		this.el = el;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.declaredKind = declaredKind;
		this.contentKind = null;
		this.patch = null;
	}
	refresh() {
		patchSpot(this, resolveBindingValue(this.component, this.bindingKey));
	}
}
/**
 * Keyed list — `each(items, render, keyFn)` / `list(key, …)` /
 * `liveList(…)`. Owns `keyMap` (key → element) and `liveList` handle.
 */
class ListSpot extends Spot {
	constructor(el, slotIndex, type, expr, component, bindingKey, renderFn, keyFn) {
		super();
		this.kind = SPOT_KIND.LIST;
		this.type = type;
		this.el = el;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.renderFn = renderFn;
		this.keyFn = keyFn;
		this.keyMap = null;
		this.liveList = null;
		this.prevItemMap = null;
		this.patch = null;
	}
	/** Drains `pendingPaths` and replays the refresh once per accumulated path
	 *  (since each path may take different branches between full re-diff and
	 *  per-item assignState — see comment in refresh()). */
	runTask() {
		this.pendingTask = null;
		const paths = this.pendingPaths;
		this.pendingPaths = null;
		if (paths && paths.length > 1) {
			let lastResult;
			for (let i = 0; i < paths.length; i++) {
				lastResult = this.refresh(paths[i]);
			}
			return lastResult;
		}
		return this.refresh(paths ? paths[0] : null);
	}
	refresh(changedPath = null) {
		const {
			component, bindingKey, renderFn, keyFn,
		} = this;
		const rawItems = resolveBindingValue(component, bindingKey);
		const itemsArray = Array.isArray(rawItems) ? rawItems : [];
		// Partial in-place update is only safe when the change is a *deep*
		// path inside an existing item (`items.i.foo`), meaning the array
		// shape is unchanged. Top-level changes (`items.i`) can be array-
		// shape ops (unshift/push/splice/swap) that fire multiple sub-paths,
		// but the subscription only sees the first one — taking the partial
		// branch then would skip the rest of the changes.
		if (
			changedPath &&
			changedPath !== bindingKey &&
			changedPath.startsWith(`${bindingKey}.`) &&
			this.keyMap &&
			itemsArray.length === this.keyMap.size
		) {
			const subPath = changedPath.slice(bindingKey.length + 1);
			const firstDot = subPath.indexOf('.');
			if (firstDot !== -1) {
				const index = Number(subPath.slice(0, firstDot));
				if (!Number.isNaN(index)) {
					const itemAtIndex = itemsArray[index];
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
		patchSpot(this, each(itemsArray, renderFn, keyFn));
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
	constructor(el, slotIndex, type, attr, expr, component, declaredKind) {
		super();
		this.kind = SPOT_KIND.COMPUTED;
		this.type = type;
		this.attr = attr;
		this.el = el;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.declaredKind = declaredKind;
		this.contentKind = null;
		this.patch = null;
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
	constructor(el, slotIndex, attr, parts, component) {
		super();
		this.kind = SPOT_KIND.MULTI;
		this.type = SPOT_TYPE.MULTI_ATTR;
		this.attr = attr;
		this.el = el;
		this.slotIndex = slotIndex;
		this.parts = parts;
		this.component = component;
	}
	refresh() {
		const component = this.component;
		const parts = this.parts;
		const allDeps = new Set();
		let result = '';
		for (let partIndex = 0; partIndex < parts.length; partIndex++) {
			const part = parts[partIndex];
			if (part.literal !== undefined) {
				result += part.literal;
				continue;
			}
			const expr = part.expr;
			if (isBindingType(expr)) {
				allDeps.add(expr.key);
				result += resolveBindingValue(component, expr.key) ?? '';
				continue;
			}
			if (isFunction(expr)) {
				const evaluated = evaluateTrackedExpression(component, expr);
				const evaluatedDeps = evaluated.deps;
				const depArr = [...evaluatedDeps];
				for (let depIndex = 0; depIndex < depArr.length; depIndex++) {
					allDeps.add(depArr[depIndex]);
				}
				result += evaluated.value ?? '';
				continue;
			}
			result += expr ?? '';
		}
		if (!applySubeventAttr(this.el, this.attr, result)) {
			if (this.el.getAttribute(this.attr) !== result) {
				this.el.setAttribute(this.attr, result);
			}
		}
		syncSpotSubscriptions(this, allDeps);
	}
}
/** `class=` binding — token-level diff via `applyClassListItems`. */
class ClassListSpot extends Spot {
	constructor(el, slotIndex, parts, component) {
		super();
		this.kind = SPOT_KIND.CLASS;
		this.type = SPOT_TYPE.CLASS_LIST;
		this.attr = 'class';
		this.el = el;
		this.slotIndex = slotIndex;
		this.parts = parts;
		this.component = component;
		this.classListCurrent = null;
	}
	refresh() {
		const component = this.component;
		const parts = this.parts;
		const desired = new Set();
		const deps = new Set();
		for (let partIndex = 0; partIndex < parts.length; partIndex++) {
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
		diffClassList(this.el, current, desired);
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
	constructor(el, slotIndex, eventName, expr, component) {
		super();
		this.type = SPOT_TYPE.EVENT;
		this.el = el;
		this.slotIndex = slotIndex;
		this.eventName = eventName;
		this.expr = expr;
		this.component = component;
	}
	unsubscribe() {
		const map = EVENT_SPOTS.get(this.el);
		if (map) {
			map.delete(this.eventName);
		}
		this.el.removeEventListener(this.eventName, dispatchEventSpotListener);
		super.unsubscribe();
	}
}
function installBindingSpot(plan, el, expr, component) {
	const bindingKey = expr.key;
	if (ListBinding.isListBinding(expr)) {
		const listSpot = new ListSpot(el, plan.slotIndex, plan.type, expr, component, bindingKey, expr.renderFn, expr.keyFn);
		listSpot.refresh(null);
		syncSpotSubscriptions(listSpot, new Set([bindingKey]));
		return listSpot;
	}
	const typeIndex = component.typeIndex;
	const declaredKind = expr.kind ?? typeIndex?.kinds.get(bindingKey) ?? null;
	const spot = new BindingSpot(el, plan.slotIndex, plan.type, plan.attr, expr, component, bindingKey, declaredKind);
	// A path declared `react: false` in `static types` is a static one-shot —
	// patch once now, never subscribe.
	if (typeIndex?.hasNonReactive && typeIndex.nonReactivePaths.has(bindingKey)) {
		spot.kind = null;
		spot.refresh();
		return spot;
	}
	spot.refresh();
	syncSpotSubscriptions(spot, new Set([bindingKey]));
	return spot;
}
function installComputedSpot(plan, el, expr, component) {
	// A typed bind given a function (`this.bind.text(() => …)`) tags the
	// function with its declared content kind; a plain `${() => …}` leaves it
	// undefined → auto-classified at patch time.
	const declaredKind = expr.contentKind ?? null;
	const spot = new ComputedSpot(el, plan.slotIndex, plan.type, plan.attr, expr, component, declaredKind);
	spot.refresh();
	return spot;
}
function installClassListSpot(plan, el, parts, component) {
	const spot = new ClassListSpot(el, plan.slotIndex, parts, component);
	spot.refresh();
	return spot;
}
function installMultiAttrSpot(plan, el, parts, component) {
	const spot = new MultiAttrSpot(el, plan.slotIndex, plan.attr, parts, component);
	spot.refresh();
	return spot;
}
function installEventSpot(plan, el, eventName, expr, component) {
	const spot = new EventSpot(el, plan.slotIndex, eventName, expr, component);
	let map = EVENT_SPOTS.get(el);
	if (!map) {
		map = new Map();
		EVENT_SPOTS.set(el, map);
	}
	map.set(eventName, spot);
	el.addEventListener(eventName, dispatchEventSpotListener);
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
	constructor(el, slotIndex, type, attr, expr) {
		super();
		this.type = type;
		this.attr = attr;
		this.el = el;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.patch = null;
	}
}
function domAttrForElement(el) {
	if (el.type === 'checkbox' || el.type === 'radio') {
		return 'checked';
	}
	if (el.tagName === 'SELECT') {
		return 'selectedIndex';
	}
	return 'value';
}
function readDomProp(el, attr) {
	if (attr === 'checked') {
		return el.checked;
	}
	if (attr === 'selectedIndex') {
		return el.selectedIndex;
	}
	return el.value;
}
function setDomProp(el, attr, value) {
	if (attr === 'checked') {
		el.checked = Boolean(value);
	} else if (attr === 'selectedIndex') {
		el.selectedIndex = Number(value ?? -1);
	} else {
		el.value = String(value ?? '');
	}
}
function domInputEvent(el) {
	if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') {
		return 'change';
	}
	return 'input';
}
function writeBoundValue(component, key, value) {
	if (key.startsWith('global.')) {
		globalState.set({
			[key.slice(7)]: value,
		});
	} else {
		setValueAtPath(component.stateProxy, key, value);
	}
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
	constructor(el, slotIndex, type, attr, expr, component, bindingKey, twoWayAttr, twoWayEvent) {
		super();
		this.type = type;
		this.attr = attr;
		this.el = el;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.twoWayAttr = twoWayAttr;
		this.twoWayEvent = twoWayEvent;
	}
	handle(nextValue) {
		setDomProp(this.el, this.twoWayAttr, nextValue);
	}
	unsubscribe() {
		const map = TWO_WAY_SPOTS.get(this.el);
		if (map) {
			map.delete(this.twoWayEvent);
		}
		this.el.removeEventListener(this.twoWayEvent, dispatchTwoWayInput);
		super.unsubscribe();
	}
}
function installTwoWaySpot(plan, el, expr, component, explicitKey) {
	const key = explicitKey ?? expr.key;
	const attr = plan.attr ?? domAttrForElement(el);
	const eventType = domInputEvent(el);
	const spot = new TwoWaySpot(el, plan.slotIndex, plan.type, attr, expr, component, key, attr, eventType);
	setDomProp(el, attr, resolveBindingValue(component, key));
	if (el.hasAttribute('value')) {
		el.removeAttribute('value');
	}
	if (el.hasAttribute('checked')) {
		el.removeAttribute('checked');
	}
	if (key.startsWith('global.')) {
		spot.unsubs.push(subscribeGlobalPath(key.slice(7), TwoWaySpot.prototype.handle, spot));
	} else {
		spot.unsubs.push(subscribeStatePath(component, key, TwoWaySpot.prototype.handle, spot));
	}
	let map = TWO_WAY_SPOTS.get(el);
	if (!map) {
		map = new Map();
		TWO_WAY_SPOTS.set(el, map);
	}
	map.set(eventType, spot);
	el.addEventListener(eventType, dispatchTwoWayInput);
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
	for (let i = 0; i < path.length; i++) {
		node = node.childNodes[path[i]];
	}
	return node;
}
// Only the patterns below are lookup keys — anything else on a [data-uwc]
// node is a static attribute that no spot will ever query, so storing it
// just bloats the map. Filtering at index time saves the entries and the
// per-entry composite-string allocation.
//   data-*=""                — void markers (bind/multi/bare-attr/uwc-evfn)
//   data-expr="<digits>"     — text-spot marker
//   <any-name>="expr<digits>" — interpolated attr / bool-attr / prop / named event
function isAllDigitsFrom(value, from) {
	if (value.length === from) {
		return false;
	}
	for (let i = from; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code < 48 || code > 57) {
			return false;
		}
	}
	return true;
}
function isMarkerAttr(name, value) {
	if (value === '') {
		return name.startsWith('data-');
	}
	if (value.charCodeAt(0) === 101 && value.startsWith('expr')) {
		return isAllDigitsFrom(value, 4);
	}
	if (name === 'data-expr') {
		return isAllDigitsFrom(value, 0);
	}
	return false;
}
function buildMarkerMap(fragment) {
	const map = new Map();
	eachNodeList(fragment.querySelectorAll('[data-uwc]'), (node) => {
		const path = getNodePath(node, fragment);
		if (!path) {
			return;
		}
		node.removeAttribute('data-uwc');
		const attrs = node.attributes;
		for (let i = 0; i < attrs.length; i++) {
			const attrName = attrs[i].name;
			const attrValue = attrs[i].value;
			if (!isMarkerAttr(attrName, attrValue)) {
				continue;
			}
			map.set(`${attrName}|${attrValue}`, {
				el: node,
				path,
			});
		}
	});
	return map;
}
function lookupMarker(map, attrName, attrValue) {
	return map.get(`${attrName}|${attrValue}`);
}
function buildSpotPlan(map, entry) {
	if (entry.type === SPOT_TYPE.BIND) {
		const markerAttr = bindMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(markerAttr);
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
		lookup.el.removeAttribute(markerAttr);
		const parts = entry.parts.map((part) => {
			if (part.literal !== undefined) {
				return {
					literal: part.literal,
				};
			}
			return {
				exprIndex: part.exprIndex,
			};
		});
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
		lookup.el.removeAttribute(markerAttr);
		return {
			type: SPOT_TYPE.EVENT,
			slotIndex: entry.i,
			path: lookup.path,
			eventName: isDeduce ? null : entry.eventName,
			deduceFromExpr: isDeduce,
		};
	}
	if (entry.type === SPOT_TYPE.TEXT) {
		const lookup = lookupMarker(map, SPOT, String(entry.i));
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(SPOT);
		lookup.el.style.display = 'contents';
		return {
			type: SPOT_TYPE.TEXT,
			slotIndex: entry.i,
			path: lookup.path,
		};
	}
	if (entry.type === SPOT_TYPE.BARE_ATTR) {
		const markerAttr = bareAttrMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(markerAttr);
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
		lookup.el.removeAttribute(entry.attr);
		return {
			type: SPOT_TYPE.ATTR,
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
		};
	}
	if (entry.type === SPOT_TYPE.BOOL_ATTR || entry.type === SPOT_TYPE.PROP) {
		const sigilChar = entry.type === SPOT_TYPE.BOOL_ATTR ? '?' : '.';
		const domAttr = sigilChar + entry.attr;
		const lookup = lookupMarker(map, domAttr, `expr${entry.i}`);
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(domAttr);
		return {
			type: entry.type,
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
		};
	}
	return null;
}
const DOLLAR_BIND_ATTR_RE = /^\$(\w+)$/;
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
	eachNodeList(fragment.querySelectorAll('[data-bind]'), (el) => {
		const stateKey = el.dataset.bind;
		if (!stateKey) {
			return;
		}
		const path = getNodePath(el, fragment);
		if (!path) {
			return;
		}
		plans.push({
			path,
			key: normalizeBindKey(stateKey),
		});
		el.removeAttribute('data-bind');
	});
	eachNodeList(fragment.querySelectorAll('*'), (el) => {
		const stateKey = el.getAttribute('@bind');
		if (!stateKey) {
			return;
		}
		const path = getNodePath(el, fragment);
		if (!path) {
			return;
		}
		plans.push({
			path,
			key: normalizeBindKey(stateKey),
		});
		el.removeAttribute('@bind');
	});
	eachNodeList(fragment.querySelectorAll('*'), (el) => {
		const attrs = el.attributes;
		for (let i = attrs.length - 1; i >= 0; i--) {
			const attrName = attrs[i].name;
			const match = DOLLAR_BIND_ATTR_RE.exec(attrName);
			if (!match) {
				continue;
			}
			const rawKey = attrs[i].value;
			if (!rawKey) {
				el.removeAttribute(attrName);
				continue;
			}
			const path = getNodePath(el, fragment);
			if (path) {
				plans.push({
					path,
					key: normalizeBindKey(rawKey),
				});
			}
			el.removeAttribute(attrName);
		}
	});
	return plans;
}
function extractSubeventPlans(fragment) {
	const plans = [];
	SUBEVENT_ATTRS.forEach((attrName) => {
		const elements = fragment.querySelectorAll(`[${attrName}]`);
		eachNodeList(elements, (el) => {
			const value = el.getAttribute(attrName);
			el.removeAttribute(attrName);
			const path = getNodePath(el, fragment);
			if (path) {
				plans.push({
					path,
					attrName,
					value,
				});
			}
		});
	});
	return plans;
}
function extractRefPlans(fragment) {
	const plans = [];
	eachNodeList(fragment.querySelectorAll('*'), (el) => {
		const attrs = el.attributes;
		for (let i = attrs.length - 1; i >= 0; i--) {
			const attrName = attrs[i].name;
			if (attrName.charCodeAt(0) !== 35) {
				continue;
			}
			const refName = attrName.slice(1);
			el.removeAttribute(attrName);
			if (!isValidRefName(refName)) {
				throw new SyntaxError(
					`Invalid #ref name "${refName}". Use lowercase letters, digits, and underscore only ("_" not "-" for word separators). Example: <input #email_field>.`
				);
			}
			const path = getNodePath(el, fragment);
			if (path) {
				plans.push({
					path,
					name: refName,
				});
			}
		}
	});
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
	eachArray(meta, (entry) => {
		const plan = buildSpotPlan(markerMap, entry);
		if (plan) {
			spotPlans.push(plan);
		}
	});
	const dataBindPlans = extractDataBindPlans(fragment);
	const subeventPlans = extractSubeventPlans(fragment);
	const refPlans = extractRefPlans(fragment);
	return {
		fragment,
		spotPlans,
		dataBindPlans,
		subeventPlans,
		refPlans,
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
	setValueAtPath(spot.component.stateProxy, spot.bindingKey, spot.isCheck ? this.checked : this.value);
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
	constructor(el, stateKey, component) {
		this.el = el;
		this.component = component;
		this.bindingKey = stateKey;
		this.eventType = domInputEvent(el);
		this.isCheck = el.type === 'checkbox' || el.type === 'radio';
		this.busSubscription = null;
	}
	handle(nextValue) {
		if (this.isCheck) {
			this.el.checked = Boolean(nextValue);
		} else {
			this.el.value = String(nextValue ?? '');
		}
	}
	unsubscribe() {
		DATA_BIND_SPOTS.delete(this.el);
		this.el.removeEventListener(this.eventType, dispatchDataBindInput);
		if (this.busSubscription) {
			this.busSubscription.unsubscribe();
			this.busSubscription = null;
		}
	}
}
function installDataBind(el, stateKey, component, unsubs) {
	const spot = new DataBindSpot(el, stateKey, component);
	DATA_BIND_SPOTS.set(el, spot);
	el.addEventListener(spot.eventType, dispatchDataBindInput);
	spot.busSubscription = subscribeStatePath(component, stateKey, DataBindSpot.prototype.handle, spot);
	unsubs.push(spot);
	const currentValue = getValueAtPath(component.STATE, stateKey);
	if (currentValue !== undefined) {
		spot.handle(currentValue);
	}
}
function buildMultiParts(planParts, exprs) {
	const parts = new Array(planParts.length);
	for (let i = 0; i < planParts.length; i++) {
		const part = planParts[i];
		if (part.literal === undefined) {
			parts[i] = {
				exprIndex: part.exprIndex,
				expr: exprs[part.exprIndex],
			};
		} else {
			parts[i] = {
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
	if (inferredKey.startsWith('global.')) {
		return getValueAtPath(globalState.proxy, inferredKey.slice(7));
	}
	return getValueAtPath(component.STATE ?? {}, inferredKey);
}
function inferTwoWayBindingKey(component, expr, type, el, attr) {
	const isBindableField = (type === SPOT_TYPE.ATTR || type === SPOT_TYPE.BARE_ATTR) &&
		BINDABLE_TAGS.has(el.tagName) &&
		BINDABLE_ATTRS.has(attr);
	if (!isBindableField) {
		return null;
	}
	const evaluated = evaluateTrackedExpression(component, expr);
	if (evaluated.deps.size !== 1) {
		return null;
	}
	const [inferredKey] = evaluated.deps;
	const sourceValue = resolveTwoWaySourceValue(component, inferredKey);
	return sourceValue === evaluated.value ? inferredKey : null;
}
function installSpotFromPlan(plan, fragment, exprs, component) {
	const el = walkPath(fragment, plan.path);
	if (!el) {
		return null;
	}
	if (plan.type === SPOT_TYPE.MULTI_ATTR) {
		const parts = buildMultiParts(plan.parts, exprs);
		// `class=` always uses the class-list spot so updates diff individual
		// tokens (preserving any class added externally), and every input
		// type — string, function, ClassList, Set, Array, Map, Binding — is
		// handled by the same machinery in `applyClassListItems`.
		if (plan.attr === 'class') {
			return installClassListSpot(plan, el, parts, component);
		}
		return installMultiAttrSpot(plan, el, parts, component);
	}
	const expr = exprs[plan.slotIndex];
	if (plan.type === SPOT_TYPE.BIND) {
		if (!isBindingType(expr)) {
			return null;
		}
		return installTwoWaySpot(plan, el, expr, component);
	}
	if (plan.type === SPOT_TYPE.EVENT) {
		if (plan.deduceFromExpr && (expr === undefined || expr === null || expr === false)) {
			return null;
		}
		const eventName = deduceEventName(plan, expr);
		return installEventSpot(plan, el, eventName, expr, component);
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
			return installClassListSpot(plan, el, singletonParts, component);
		}
	} else if (plan.type === SPOT_TYPE.BOOL_ATTR || plan.type === SPOT_TYPE.PROP) {
		// passthrough — resolvedType/attr already set
	} else {
		return null;
	}
	const resolvedPlan = resolvedAttr === plan.attr ? plan : {
		...plan,
		attr: resolvedAttr,
	};
	if (isBindingType(expr)) {
		const autoTwoWay = (resolvedType === SPOT_TYPE.ATTR || resolvedType === SPOT_TYPE.BARE_ATTR) &&
			BINDABLE_TAGS.has(el.tagName) &&
			BINDABLE_ATTRS.has(resolvedAttr);
		if (autoTwoWay) {
			return installTwoWaySpot(resolvedPlan, el, expr, component);
		}
		return installBindingSpot(resolvedPlan, el, expr, component);
	}
	if (isFunction(expr)) {
		const inferredKey = inferTwoWayBindingKey(component, expr, resolvedType, el, resolvedAttr);
		if (inferredKey) {
			return installTwoWaySpot(resolvedPlan, el, expr, component, inferredKey);
		}
		return installComputedSpot(resolvedPlan, el, expr, component);
	}
	// Static literal value — patch once now; updateTemplateSpots will repatch
	// on re-render if the expr changes.
	const staticSpot = new StaticSpot(el, plan.slotIndex, resolvedType, resolvedAttr, expr);
	if (resolvedType === SPOT_TYPE.TEXT) {
		if (ListBinding.isListBinding(expr)) {
			staticSpot.patch = patchListKind;
			el.style.pointerEvents = '';
		} else if (ComponentBinding.is(expr)) {
			staticSpot.patch = patchComponentKind;
			el.style.pointerEvents = '';
		}
	}
	patchSpot(staticSpot, expr);
	return staticSpot;
}
function cleanupSpots(spots) {
	if (!spots || !spots.length) {
		return;
	}
	for (let i = 0; i < spots.length; i++) {
		spots[i].unsubscribe();
	}
}
function collectBoundKeys(spots, dataBindPlans) {
	const keys = new Set();
	for (let i = 0; i < spots.length; i++) {
		const spot = spots[i];
		if (spot.type === SPOT_TYPE.MULTI_ATTR || spot.type === SPOT_TYPE.CLASS_LIST) {
			for (let j = 0; j < spot.parts.length; j++) {
				const part = spot.parts[j];
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
		for (let i = 0; i < dataBindPlans.length; i++) {
			const plan = dataBindPlans[i];
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
	const fragment = recipe.fragment.cloneNode(true);
	const spots = [];
	const unsubs = [];
	eachArray(recipe.spotPlans, (plan) => {
		const spot = installSpotFromPlan(plan, fragment, exprs, component);
		if (spot) {
			spots.push(spot);
		}
	});
	eachArray(recipe.dataBindPlans, (plan) => {
		const el = walkPath(fragment, plan.path);
		if (!el) {
			return;
		}
		installDataBind(el, plan.key, component, unsubs);
	});
	if (recipe.subeventPlans) {
		eachArray(recipe.subeventPlans, (plan) => {
			const el = walkPath(fragment, plan.path);
			if (!el) {
				return;
			}
			// Reflect the static value into the data attribute so behaviors
			// reading `el.dataset.<name>` see the initial value before any
			// dynamic spot refresh fires. Dynamic updates flow through
			// `applySubeventAttr` (further up).
			if (plan.value != null && plan.value !== false && plan.value !== '') {
				el.setAttribute(`data-${plan.attrName}`, plan.value === true ? '' : String(plan.value));
			}
			const behavior = getBehavior(plan.attrName);
			if (behavior?.install) {
				const cleanup = behavior.install(el, plan.value, component);
				if (typeof cleanup === 'function') {
					unsubs.push(cleanup);
				}
			}
		});
	}
	if (recipe.refPlans) {
		eachArray(recipe.refPlans, (plan) => {
			const el = walkPath(fragment, plan.path);
			if (!el) {
				return;
			}
			unsubs.push(registerRef(component, plan.name, el));
		});
	}
	return {
		fragment,
		spots,
		unsubs,
		boundKeys: collectBoundKeys(spots, recipe.dataBindPlans),
	};
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
	if (spot.type === SPOT_TYPE.ATTR) {
		const str = String(newExpr ?? '');
		if (!applySubeventAttr(spot.el, spot.attr, str)) {
			if (spot.el.getAttribute(spot.attr) !== str) {
				spot.el.setAttribute(spot.attr, str);
			}
		}
		spot.expr = newExpr;
		return;
	}
	if (spot.type === SPOT_TYPE.TEXT || spot.type === SPOT_TYPE.BARE_ATTR || spot.type === SPOT_TYPE.BOOL_ATTR || spot.type === SPOT_TYPE.PROP) {
		patchSpot(spot, newExpr);
		spot.expr = newExpr;
	}
}
function isStateProxyValue(value) {
	// Both `StateProxyHandler` and `TrackingProxyHandler` answer the
	// `STATE_PATH` symbol with a non-undefined dotted path. Plain objects
	// return undefined because symbols can only be looked up by identity.
	// We use this to distinguish "a value that may have mutated in place"
	// (state proxy whose underlying object got patched) from a true static
	// value, so `updateTemplateSpots` knows not to bail on the same-
	// reference skip for the proxy case.
	return value !== null && typeof value === 'object' && value[STATE_PATH] !== undefined;
}
function updateTemplateSpots(state, newExprs, component) {
	const {
		spots, prevExprs,
	} = state;
	for (let i = 0; i < spots.length; i++) {
		const spot = spots[i];
		if (spot.type === SPOT_TYPE.MULTI_ATTR) {
			let changed = false;
			eachArray(spot.parts, (part) => {
				if (part.exprIndex === undefined) {
					return;
				}
				const partVal = newExprs[part.exprIndex];
				if (part.expr !== partVal) {
					part.expr = partVal;
					changed = true;
				}
			});
			if (changed) {
				spot.refresh();
			}
			continue;
		}
		if (spot.type === SPOT_TYPE.CLASS_LIST) {
			let changed = false;
			eachArray(spot.parts, (part) => {
				if (part.exprIndex === undefined) {
					return;
				}
				const partVal = newExprs[part.exprIndex];
				if (part.expr !== partVal) {
					part.expr = partVal;
					changed = true;
				}
			});
			if (changed) {
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
		// The reference-equality skip is correct for static values and
		// function refs (computed spots own their own subscription path).
		// It is INCORRECT for a live state proxy: the proxy reference is
		// cached per underlying object, so `parent.state.foo` returns the
		// same proxy across renders even when the underlying object's
		// properties have mutated. Bailing here would freeze any child
		// `.state=${this.state.foo}` binding on the first render's
		// snapshot. Detect the proxy and let `updateSpot` patch through —
		// the child's `replaceState` does its own plainEqual check, so
		// genuinely unchanged proxies still cost only a deep compare.
		if (newVal === prevVal && !isStateProxyValue(newVal)) {
			continue;
		}
		updateSpot(spot, newVal, component);
	}
	state.prevExprs = newExprs.slice();
}
// Per-instance template runtime: plain fields, no closures. All template
// methods are first-class functions on WebComponent.prototype so the JIT can
// monomorphize them across every component instance. `tplCleanupNodes` is the
// only set of nodes we must visit on teardown — populated by templateHtmlElement.
// Other DOM nodes' WeakMap entries (HTML_ELEMENT_INSTANCES) auto-clean on GC
// once `replaceChildren` detaches them; we don't pay for a full subtree walk.
export function initTemplateRuntime(component) {
	component.tplUnsubs = [];
	component.tplState = null;
	component.tplBoundKeys = new Set();
	component.tplCleanupNodes = new Set();
	// One entry per `this.htmlElement` call site. Keyed by the tagged-
	// template strings array so re-entering the same call site returns the
	// same root element with its spots patched in place. Without this,
	// patterns like `${this.renderBody}` (computed spot → `htmlElement`)
	// would mint a fresh subtree on every dep change, ripping focus out of
	// any focused input every time the user typed.
	component.htmlElementCache = new Map();
}
function runCleanupOnNode(node) {
	cleanupTemplateNode(node);
}
function runTemplateCleanup(component) {
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
	(this.shadowRoot ?? this).replaceChildren(instance.fragment);
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
	// Stable identity across calls from the same site: the tagged-template
	// `strings` array is a per-call-site singleton, so we cache the root
	// element + tplState there. Repeated calls (e.g. a `${this.renderBody}`
	// computed spot refreshing on every typed character) patch the existing
	// subtree's spots in place via `updateTemplateSpots` and return the
	// same root, which lets `patchComponentKind`'s `firstChild === node`
	// short-circuit fire and leaves focus, selection, and IME state alone.
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
