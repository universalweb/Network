/* eslint-disable no-restricted-syntax */
import {
	Binding,
	makeGlobalProxy,
	makeProxy,
	track,
} from './state/binding.js';
import {
	callFn,
	createElementFromHTML,
	eachArray,
	eachNodeList,
	getValueAtPath,
	isElement,
	isFunction,
	isString,
	setValueAtPath,
	syncSubsByDiff,
} from './utilities.js';
import {
	registerSubevent,
	unregisterAllSubevents,
	unregisterSubevent,
} from './dom/delegate.js';
import { isValidRefName, registerRef } from './dom/refs.js';
import { STATE_PATH } from './state/state.js';
import { schedule } from './lifecycle/scheduler.js';
import { setGlobal } from './state/globalState.js';
import { behaviorAttrNames, getBehavior } from './behaviors/index.js';
const SUBEVENT_ATTRS = behaviorAttrNames();
const SUBEVENT_LAST_VALUES = new WeakMap();
function applySubeventAttr(el, attrName, value) {
	if (!SUBEVENT_ATTRS.has(attrName)) {
		return false;
	}
	if (el.hasAttribute(attrName)) {
		el.removeAttribute(attrName);
	}
	let perElement = SUBEVENT_LAST_VALUES.get(el);
	const previous = perElement?.get(attrName);
	const isEmpty = value == null || value === false || value === '';
	if (isEmpty) {
		if (previous === undefined) {
			return true;
		}
		unregisterSubevent(el, attrName);
		perElement.delete(attrName);
		if (!perElement.size) {
			SUBEVENT_LAST_VALUES.delete(el);
		}
		return true;
	}
	const next = value === true ? '' : String(value);
	if (previous === next) {
		return true;
	}
	registerSubevent(el, attrName, next);
	if (!perElement) {
		perElement = new Map();
		SUBEVENT_LAST_VALUES.set(el, perElement);
	}
	perElement.set(attrName, next);
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
	unregisterAllSubevents(node);
	const cleanup = node[TEMPLATE_CLEANUP];
	if (!isFunction(cleanup)) {
		return;
	}
	node[TEMPLATE_CLEANUP] = null;
	cleanup.call(node);
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
				type: 'multi-attr',
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
				type: 'bind',
				expr,
			});
			continue;
		}
		if (eventBinding) {
			if (eventBinding.deduceFromExpr) {
				html += `data-uwc data-uwc-evfn-${stringIndex}=""`;
				meta.push({
					i: stringIndex,
					type: 'event',
					eventName: null,
					deduceFromExpr: true,
					expr,
				});
			} else {
				html += `data-uwc ${eventMarkerAttribute(eventBinding.eventName)}="expr${stringIndex}"`;
				meta.push({
					i: stringIndex,
					type: 'event',
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
					type: 'bool-attr',
				});
			} else if (attr.sigil === '.') {
				meta.push({
					...baseMeta,
					type: 'prop',
				});
			} else {
				meta.push({
					...baseMeta,
					type: 'attr',
				});
			}
		} else if (bareAttrContext(effectiveString, nextString)) {
			const inferredAttr = inferBareAttrName(expr);
			if (inferredAttr) {
				html += `data-uwc ${bareAttrMarkerAttribute(stringIndex)}=""`;
				meta.push({
					i: stringIndex,
					type: 'bare-attr',
					attr: inferredAttr,
					expr,
				});
				continue;
			}
		} else {
			html += `<span data-uwc ${SPOT}="${stringIndex}"></span>`;
			meta.push({
				i: stringIndex,
				type: 'text',
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
	eachArray(subscriptions, callFn);
	return [];
}
function getGlobalSource(component) {
	if (component.getGlobal) {
		return component.getGlobal();
	}
	return component.globalState;
}
function resolveBindingValue(component, bindingKey) {
	if (bindingKey.startsWith('global.')) {
		return getValueAtPath(getGlobalSource(component), bindingKey.slice(7));
	}
	return getValueAtPath(component.STATE, bindingKey);
}
function ensureRenderProxies(component) {
	const currentState = component.STATE ?? {};
	if (!component.renderProxy || component.renderProxyState !== currentState) {
		component.renderProxy = makeProxy(currentState, component);
		component.renderProxyState = currentState;
	}
	const currentGlobal = getGlobalSource(component);
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
function subscribeStatePath(component, statePath, handler) {
	if (!component.watchState) {
		return () => {};
	}
	return component.watchState(statePath, handler);
}
function subscribeGlobalPath(component, statePath, handler) {
	if (!component.watchGlobal) {
		return () => {};
	}
	return component.watchGlobal(statePath, handler);
}
function syncSpotSubscriptions(spot, component, deps, handler) {
	if (!spot.depMap) {
		spot.depMap = new Map();
	}
	syncSubsByDiff(spot.depMap, deps, (dep) => {
		if (dep.startsWith('global.')) {
			return subscribeGlobalPath(component, dep.slice(7), handler);
		}
		return subscribeStatePath(component, dep, handler);
	});
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
function bindSpotKind(spot, value) {
	if (LiveList.isLiveList(value)) {
		spot.el.style.pointerEvents = '';
		spot.patch = patchListKind;
		return;
	}
	if (ComponentBinding.is(value) || value instanceof Node) {
		spot.el.style.pointerEvents = '';
		spot.patch = patchComponentKind;
		return;
	}
	const str = String(value ?? '');
	if (str.includes('<')) {
		spot.el.style.pointerEvents = '';
		spot.patch = patchHtmlKind;
		return;
	}
	spot.el.style.pointerEvents = 'none';
	spot.patch = str.includes('&') ? patchHtmlKind : patchTextKind;
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
	if (spot.type === 'text') {
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
	if (spot.type === 'bare-attr') {
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
	if (spot.type === 'bool-attr') {
		const has = spot.el.hasAttribute(spot.attr);
		if (value && !has) {
			spot.el.setAttribute(spot.attr, '');
		} else if (!value && has) {
			spot.el.removeAttribute(spot.attr);
		}
		return;
	}
	if (spot.type === 'prop') {
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
function refreshBindingSpot(spot) {
	patchSpot(spot, resolveBindingValue(spot.component, spot.bindingKey));
}
function refreshListSpot(spot, changedPath) {
	const {
		component, bindingKey, renderFn, keyFn,
	} = spot;
	const rawItems = resolveBindingValue(component, bindingKey);
	const itemsArray = Array.isArray(rawItems) ? rawItems : [];
	// Partial in-place update is only safe when the change is a *deep* path
	// inside an existing item (`items.i.foo`), meaning the array shape is
	// unchanged. Top-level changes (`items.i`) can be array-shape ops
	// (unshift/push/splice/swap) that fire multiple sub-paths, but the
	// subscription only sees the first one — taking the partial branch then
	// would skip the rest of the changes.
	if (
		changedPath &&
		changedPath !== bindingKey &&
		changedPath.startsWith(`${bindingKey}.`) &&
		spot.keyMap &&
		itemsArray.length === spot.keyMap.size
	) {
		const subPath = changedPath.slice(bindingKey.length + 1);
		const firstDot = subPath.indexOf('.');
		if (firstDot !== -1) {
			const index = Number(subPath.slice(0, firstDot));
			if (!Number.isNaN(index)) {
				const item = itemsArray[index];
				if (item !== undefined) {
					const itemKey = keyFn(item, index);
					const element = spot.keyMap.get(itemKey);
					if (isFunction(element?.assignState)) {
						element.assignState(item);
						return;
					}
				}
			}
		}
	}
	patchSpot(spot, each(itemsArray, renderFn, keyFn));
}
function refreshComputedSpot(spot) {
	const {
		value,
		deps,
	} = evaluateTrackedExpression(spot.component, spot.expr);
	patchSpot(spot, value);
	syncSpotSubscriptions(spot, spot.component, deps, spot.updateHandler);
}
function evaluateMultiAttrParts(spot, component) {
	let result = '';
	const allDeps = new Set();
	eachArray(spot.parts, (part) => {
		if (part.literal !== undefined) {
			result += part.literal;
			return;
		}
		const { expr } = part;
		if (isBindingType(expr)) {
			allDeps.add(expr.key);
			result += resolveBindingValue(component, expr.key) ?? '';
			return;
		}
		if (isFunction(expr)) {
			const {
				value,
				deps,
			} = evaluateTrackedExpression(component, expr);
			deps.forEach((dep) => {
				allDeps.add(dep);
			});
			result += value ?? '';
			return;
		}
		result += expr ?? '';
	});
	return {
		result,
		deps: allDeps,
	};
}
function evaluateClassListParts(spot, component) {
	const desired = new Set();
	const deps = new Set();
	eachArray(spot.parts, (part) => {
		if (part.literal !== undefined) {
			addTokens(part.literal, desired);
			return;
		}
		const { expr } = part;
		if (ClassList.isClassList(expr)) {
			applyClassListItems(expr.items, desired, deps, component);
			return;
		}
		applyClassListItems([expr], desired, deps, component);
	});
	return {
		desired,
		deps,
	};
}
function refreshClassListSpot(spot) {
	const {
		desired,
		deps,
	} = evaluateClassListParts(spot, spot.component);
	const current = spot.classListCurrent ?? new Set();
	diffClassList(spot.el, current, desired);
	spot.classListCurrent = desired;
	syncSpotSubscriptions(spot, spot.component, deps, spot.updateHandler);
}
function refreshMultiAttrSpot(spot) {
	const {
		result,
		deps,
	} = evaluateMultiAttrParts(spot, spot.component);
	if (!applySubeventAttr(spot.el, spot.attr, result)) {
		if (spot.el.getAttribute(spot.attr) !== result) {
			spot.el.setAttribute(spot.attr, result);
		}
	}
	syncSpotSubscriptions(spot, spot.component, deps, spot.updateHandler);
}
function runSpotRefresh(spot) {
	const kind = spot.kind;
	if (!kind) {
		return undefined;
	}
	if (kind === 'list') {
		const paths = spot.pendingPaths;
		spot.pendingPaths = null;
		if (paths && paths.length > 1) {
			let lastResult;
			for (let i = 0; i < paths.length; i++) {
				lastResult = refreshListSpot(spot, paths[i]);
			}
			return lastResult;
		}
		return refreshListSpot(spot, paths ? paths[0] : null);
	}
	spot.pendingPaths = null;
	if (kind === 'binding') {
		return refreshBindingSpot(spot);
	}
	if (kind === 'computed') {
		return refreshComputedSpot(spot);
	}
	if (kind === 'multi') {
		return refreshMultiAttrSpot(spot);
	}
	if (kind === 'class') {
		return refreshClassListSpot(spot);
	}
	return undefined;
}
// Hot path: called once per state-change notification per spot. Both the
// update handler and the refresh task are pre-bound at spot init (one alloc
// per spot lifetime) so per-change dispatch costs nothing but a property set.
function runSpotRefreshTask(spot) {
	spot.pendingTask = null;
	return runSpotRefresh(spot);
}
function dispatchSpotUpdate(spot, nextValue, prevOrGlobal, changedPath) {
	if (spot.kind === 'list') {
		if (!spot.pendingPaths) {
			spot.pendingPaths = [];
		}
		spot.pendingPaths.push(changedPath);
	}
	if (spot.pendingTask) {
		return spot.pendingTask;
	}
	spot.pendingTask = schedule(spot.refreshTask);
	return spot.pendingTask;
}
function attachSpotDispatch(spot) {
	spot.updateHandler = dispatchSpotUpdate.bind(null, spot);
	spot.refreshTask = runSpotRefreshTask.bind(null, spot);
}
function initializeBindingSpot(spot, component) {
	const bindingKey = spot.expr.key;
	spot.component = component;
	spot.bindingKey = bindingKey;
	attachSpotDispatch(spot);
	if (ListBinding.isListBinding(spot.expr)) {
		spot.kind = 'list';
		spot.renderFn = spot.expr.renderFn;
		spot.keyFn = spot.expr.keyFn;
		refreshListSpot(spot, null);
		syncSpotSubscriptions(spot, component, new Set([bindingKey]), spot.updateHandler);
		return;
	}
	spot.kind = 'binding';
	refreshBindingSpot(spot);
	syncSpotSubscriptions(spot, component, new Set([bindingKey]), spot.updateHandler);
}
function initializeClassListSpot(spot, component) {
	spot.kind = 'class';
	spot.component = component;
	attachSpotDispatch(spot);
	refreshClassListSpot(spot);
}
function initializeMultiAttrSpot(spot, component) {
	spot.kind = 'multi';
	spot.component = component;
	attachSpotDispatch(spot);
	refreshMultiAttrSpot(spot);
}
function initializeComputedSpot(spot, component) {
	spot.kind = 'computed';
	spot.component = component;
	attachSpotDispatch(spot);
	refreshComputedSpot(spot);
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
function teardownEventSpot(spot) {
	const map = EVENT_SPOTS.get(spot.el);
	if (map) {
		map.delete(spot.eventName);
	}
	spot.el.removeEventListener(spot.eventName, dispatchEventSpotListener);
}
function initializeEventSpot(spot, component) {
	if (spot.expr === undefined || spot.expr === null || spot.expr === false) {
		return;
	}
	if (!isFunction(spot.expr)) {
		throw new TypeError(`Template event handler for @${spot.eventName} must be a function.`);
	}
	spot.component = component;
	let map = EVENT_SPOTS.get(spot.el);
	if (!map) {
		map = new Map();
		EVENT_SPOTS.set(spot.el, map);
	}
	map.set(spot.eventName, spot);
	spot.el.addEventListener(spot.eventName, dispatchEventSpotListener);
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
		setGlobal({
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
function applyTwoWayState(spot, nextValue) {
	setDomProp(spot.el, spot.twoWayAttr, nextValue);
}
function teardownTwoWaySpot(spot) {
	const map = TWO_WAY_SPOTS.get(spot.el);
	if (map) {
		map.delete(spot.twoWayEvent);
	}
	spot.el.removeEventListener(spot.twoWayEvent, dispatchTwoWayInput);
}
function initializeTwoWaySpot(spot, component, explicitKey) {
	const key = explicitKey ?? spot.expr.key;
	const el = spot.el;
	const attr = spot.attr ?? domAttrForElement(el);
	const eventType = domInputEvent(el);
	spot.component = component;
	spot.bindingKey = key;
	spot.twoWayAttr = attr;
	spot.twoWayEvent = eventType;
	setDomProp(el, attr, resolveBindingValue(component, key));
	if (el.hasAttribute('value')) {
		el.removeAttribute('value');
	}
	if (el.hasAttribute('checked')) {
		el.removeAttribute('checked');
	}
	const stateHandler = applyTwoWayState.bind(null, spot);
	if (key.startsWith('global.')) {
		spot.unsubs.push(subscribeGlobalPath(component, key.slice(7), stateHandler));
	} else {
		spot.unsubs.push(subscribeStatePath(component, key, stateHandler));
	}
	let map = TWO_WAY_SPOTS.get(el);
	if (!map) {
		map = new Map();
		TWO_WAY_SPOTS.set(el, map);
	}
	map.set(eventType, spot);
	el.addEventListener(eventType, dispatchTwoWayInput);
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
	if (entry.type === 'bind') {
		const markerAttr = bindMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(markerAttr);
		return {
			type: 'bind',
			slotIndex: entry.i,
			path: lookup.path,
		};
	}
	if (entry.type === 'multi-attr') {
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
			type: 'multi-attr',
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
			parts,
		};
	}
	if (entry.type === 'event') {
		const isDeduce = entry.deduceFromExpr === true;
		const markerAttr = isDeduce ? `data-uwc-evfn-${entry.i}` : eventMarkerAttribute(entry.eventName);
		const markerValue = isDeduce ? '' : `expr${entry.i}`;
		const lookup = lookupMarker(map, markerAttr, markerValue);
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(markerAttr);
		return {
			type: 'event',
			slotIndex: entry.i,
			path: lookup.path,
			eventName: isDeduce ? null : entry.eventName,
			deduceFromExpr: isDeduce,
		};
	}
	if (entry.type === 'text') {
		const lookup = lookupMarker(map, SPOT, String(entry.i));
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(SPOT);
		lookup.el.style.display = 'contents';
		return {
			type: 'text',
			slotIndex: entry.i,
			path: lookup.path,
		};
	}
	if (entry.type === 'bare-attr') {
		const markerAttr = bareAttrMarkerAttribute(entry.i);
		const lookup = lookupMarker(map, markerAttr, '');
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(markerAttr);
		return {
			type: 'bare-attr',
			slotIndex: entry.i,
			path: lookup.path,
		};
	}
	if (entry.type === 'attr') {
		const lookup = lookupMarker(map, entry.attr, `expr${entry.i}`);
		if (!lookup) {
			return null;
		}
		lookup.el.removeAttribute(entry.attr);
		return {
			type: 'attr',
			slotIndex: entry.i,
			path: lookup.path,
			attr: entry.attr,
		};
	}
	if (entry.type === 'bool-attr' || entry.type === 'prop') {
		const sigilChar = entry.type === 'bool-attr' ? '?' : '.';
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
function applyDataBindState(spot, nextValue) {
	if (spot.isCheck) {
		spot.el.checked = Boolean(nextValue);
	} else {
		spot.el.value = String(nextValue ?? '');
	}
}
function teardownDataBind(spot) {
	DATA_BIND_SPOTS.delete(spot.el);
	spot.el.removeEventListener(spot.eventType, dispatchDataBindInput);
}
function installDataBind(el, stateKey, component, unsubs) {
	const spot = {
		el,
		component,
		bindingKey: stateKey,
		eventType: domInputEvent(el),
		isCheck: el.type === 'checkbox' || el.type === 'radio',
	};
	DATA_BIND_SPOTS.set(el, spot);
	el.addEventListener(spot.eventType, dispatchDataBindInput);
	unsubs.push(teardownDataBind.bind(null, spot));
	unsubs.push(subscribeStatePath(component, stateKey, applyDataBindState.bind(null, spot)));
	const currentValue = getValueAtPath(component.STATE, stateKey);
	if (currentValue !== undefined) {
		applyDataBindState(spot, currentValue);
	}
}
function installSpotFromPlan(plan, fragment, exprs, component, unsubs) {
	const el = walkPath(fragment, plan.path);
	if (!el) {
		return null;
	}
	if (plan.type === 'multi-attr') {
		const parts = plan.parts.map((part) => {
			if (part.literal !== undefined) {
				return {
					literal: part.literal,
				};
			}
			return {
				exprIndex: part.exprIndex,
				expr: exprs[part.exprIndex],
			};
		});
		// `class=` always uses the class-list spot so updates diff individual
		// tokens (preserving any class added externally), and every input
		// type — string, function, ClassList, Set, Array, Map, Binding — is
		// handled by the same machinery in `applyClassListItems`.
		if (plan.attr === 'class') {
			const classSpot = {
				type: 'class-list',
				slotIndex: plan.slotIndex,
				attr: 'class',
				parts,
				el,
				unsubs: [],
			};
			initializeClassListSpot(classSpot, component);
			return classSpot;
		}
		const multiSpot = {
			type: 'multi-attr',
			slotIndex: plan.slotIndex,
			attr: plan.attr,
			parts,
			el,
			unsubs: [],
		};
		initializeMultiAttrSpot(multiSpot, component);
		return multiSpot;
	}
	const expr = exprs[plan.slotIndex];
	if (plan.type === 'bind') {
		if (!isBindingType(expr)) {
			return null;
		}
		const bindSpot = {
			type: 'bind',
			slotIndex: plan.slotIndex,
			el,
			expr,
			unsubs: [],
		};
		initializeTwoWaySpot(bindSpot, component);
		return bindSpot;
	}
	if (plan.type === 'event') {
		let eventName = plan.eventName;
		if (plan.deduceFromExpr) {
			if (expr === undefined || expr === null || expr === false) {
				return null;
			}
			if (!isFunction(expr)) {
				throw new TypeError('Template event handler must be a function.');
			}
			const fnName = expr.name;
			if (!fnName || fnName.startsWith('bound ')) {
				throw new TypeError(
					`@\${fn} requires a named function reference; got "${fnName || 'anonymous'}". Pass a class method, named function, or class arrow field; not an anonymous arrow or .bind() result.`
				);
			}
			eventName = fnName;
		}
		const eventSpot = {
			type: 'event',
			slotIndex: plan.slotIndex,
			eventName,
			el,
			expr,
			unsubs: [],
		};
		initializeEventSpot(eventSpot, component);
		return eventSpot;
	}
	let spot;
	if (plan.type === 'text') {
		spot = {
			type: 'text',
			slotIndex: plan.slotIndex,
			el,
			expr,
			unsubs: [],
		};
		if (ListBinding.isListBinding(expr)) {
			spot.patch = patchListKind;
			spot.el.style.pointerEvents = '';
		} else if (ComponentBinding.is(expr)) {
			spot.patch = patchComponentKind;
			spot.el.style.pointerEvents = '';
		}
	} else if (plan.type === 'bare-attr') {
		const inferredAttr = inferBareAttrName(expr);
		if (!inferredAttr) {
			return null;
		}
		spot = {
			type: 'bare-attr',
			slotIndex: plan.slotIndex,
			attr: inferredAttr,
			el,
			expr,
			unsubs: [],
		};
	} else if (plan.type === 'attr') {
		if (plan.attr === 'class') {
			const classAttrSpot = {
				type: 'class-list',
				slotIndex: plan.slotIndex,
				attr: 'class',
				parts: [
					{
						exprIndex: plan.slotIndex,
						expr,
					},
				],
				el,
				unsubs: [],
			};
			initializeClassListSpot(classAttrSpot, component);
			return classAttrSpot;
		}
		spot = {
			type: 'attr',
			slotIndex: plan.slotIndex,
			attr: plan.attr,
			el,
			expr,
			unsubs: [],
		};
	} else if (plan.type === 'bool-attr' || plan.type === 'prop') {
		spot = {
			type: plan.type,
			slotIndex: plan.slotIndex,
			attr: plan.attr,
			el,
			expr,
			unsubs: [],
		};
	} else {
		return null;
	}
	if (isBindingType(expr)) {
		const autoTwoWay = (spot.type === 'attr' || spot.type === 'bare-attr') &&
			BINDABLE_TAGS.has(spot.el.tagName) &&
			BINDABLE_ATTRS.has(spot.attr);
		if (autoTwoWay) {
			initializeTwoWaySpot(spot, component);
		} else {
			initializeBindingSpot(spot, component);
		}
	} else if (isFunction(expr)) {
		const isBindableField = (spot.type === 'attr' || spot.type === 'bare-attr') &&
			BINDABLE_TAGS.has(spot.el.tagName) &&
			BINDABLE_ATTRS.has(spot.attr);
		if (isBindableField) {
			const evaluated = evaluateTrackedExpression(component, expr);
			if (evaluated.deps.size === 1) {
				const [inferredKey] = evaluated.deps;
				const sourceValue = inferredKey.startsWith('global.') ? getValueAtPath(getGlobalSource(component), inferredKey.slice(7)) : getValueAtPath(component.STATE ?? {}, inferredKey);
				if (sourceValue === evaluated.value) {
					spot.bindingKey = inferredKey;
					initializeTwoWaySpot(spot, component, inferredKey);
					return spot;
				}
			}
		}
		initializeComputedSpot(spot, component);
	} else {
		patchSpot(spot, expr);
	}
	return spot;
}
function cleanupSpots(spots) {
	if (!spots || !spots.length) {
		return;
	}
	for (let i = 0; i < spots.length; i++) {
		const spot = spots[i];
		if (spot.type === 'event') {
			teardownEventSpot(spot);
			continue;
		}
		if (spot.type === 'bind' || (spot.bindingKey !== undefined && spot.twoWayEvent)) {
			teardownTwoWaySpot(spot);
		}
		if (spot.liveList) {
			if (spot.liveList.disconnectSpot) {
				spot.liveList.disconnectSpot();
			}
			spot.liveList = null;
		}
		spot.keyMap = null;
		spot.prevItemMap = null;
		spot.pendingTask = null;
		spot.pendingPaths = null;
		spot.kind = null;
		if (spot.depMap) {
			spot.depMap.forEach(callFn);
			spot.depMap.clear();
			spot.depMap = null;
		}
		if (spot.unsubs && spot.unsubs.length) {
			spot.unsubs = clearSubscriptions(spot.unsubs);
		}
	}
}
function collectBoundKeys(spots, dataBindPlans) {
	const keys = new Set();
	for (let i = 0; i < spots.length; i++) {
		const spot = spots[i];
		if (spot.type === 'multi-attr' || spot.type === 'class-list') {
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
		const spot = installSpotFromPlan(plan, fragment, exprs, component, unsubs);
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
			registerSubevent(el, plan.attrName, plan.value);
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
	if (spot.type === 'event') {
		spot.expr = newExpr;
		return;
	}
	if (spot.type === 'bind') {
		return;
	}
	if (isBindingType(newExpr) || isFunction(newExpr)) {
		spot.expr = newExpr;
		return;
	}
	if (spot.type === 'attr') {
		const str = String(newExpr ?? '');
		if (!applySubeventAttr(spot.el, spot.attr, str)) {
			if (spot.el.getAttribute(spot.attr) !== str) {
				spot.el.setAttribute(spot.attr, str);
			}
		}
		spot.expr = newExpr;
		return;
	}
	if (spot.type === 'text' || spot.type === 'bare-attr' || spot.type === 'bool-attr' || spot.type === 'prop') {
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
		if (spot.type === 'multi-attr') {
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
				refreshMultiAttrSpot(spot);
			}
			continue;
		}
		if (spot.type === 'class-list') {
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
				refreshClassListSpot(spot);
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
// only set of nodes we must visit on teardown — populated by templateHtmlElement
// and by the dynamic subevent installer. Other DOM nodes' WeakMap entries
// (subevents, SUBEVENT_LAST_VALUES, HTML_ELEMENT_INSTANCES) auto-clean on GC
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
export function templateCleanup() {
	if (this.tplState) {
		cleanupSpots(this.tplState.spots);
	}
	eachArray(this.tplUnsubs, callFn);
	this.tplUnsubs = [];
	if (this.tplCleanupNodes.size) {
		this.tplCleanupNodes.forEach(runCleanupOnNode);
		this.tplCleanupNodes.clear();
	}
	this.tplState = null;
	this.tplBoundKeys = new Set();
	this.htmlElementCache?.clear();
}
export function templateHtml(strings, ...exprs) {
	const state = this.tplState;
	if (state && state.strings === strings) {
		updateTemplateSpots(state, exprs, this);
		this.templateBuilt = true;
		return;
	}
	templateCleanup.call(this);
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
function cleanupHtmlElementInstance() {
	const instance = HTML_ELEMENT_INSTANCES.get(this);
	if (!instance) {
		return;
	}
	HTML_ELEMENT_INSTANCES.delete(this);
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
