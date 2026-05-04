/* eslint-disable no-restricted-syntax */
import {
	Binding,
	makeGlobalProxy,
	makeProxy,
	track,
} from './binding.js';
import {
	callFn,
	createElementFromHTML,
	eachArray,
	eachNodeList,
	hasValue,
	isElement,
	isFunction,
	isString,
} from './utilities.js';
import {
	registerSubevent,
	unregisterAllSubevents,
	unregisterSubevent,
} from './delegate.js';
import { STATE_PATH } from './state.js';
import { schedule } from './scheduler.js';
import { setGlobal } from './globalState.js';
const SUBEVENT_ATTRS = new Set(['tooltip']);
function applySubeventAttr(el, attrName, value) {
	if (!SUBEVENT_ATTRS.has(attrName)) {
		return false;
	}
	if (el.hasAttribute(attrName)) {
		el.removeAttribute(attrName);
	}
	if (value == null || value === false || value === '') {
		unregisterSubevent(el, attrName);
		return true;
	}
	registerSubevent(el, attrName, value === true ? '' : String(value));
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
		const ctor = item.constructor;
		if (ctor === Set) {
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
		if (ctor === Map) {
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
	if (node) {
		unregisterAllSubevents(node);
	}
	const cleanup = node?.[TEMPLATE_CLEANUP];
	if (!isFunction(cleanup)) {
		return;
	}
	node[TEMPLATE_CLEANUP] = null;
	cleanup();
}
function cleanupTemplateTree(root) {
	if (!root?.querySelectorAll) {
		cleanupTemplateNode(root);
		return;
	}
	cleanupTemplateNode(root);
	eachNodeList(root.querySelectorAll('*'), cleanupTemplateNode);
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
function createListElement(renderFn, item) {
	if (isString(renderFn)) {
		const el = document.createElement(renderFn);
		el.state = item;
		return el;
	}
	if (isCustomElementConstructor(renderFn)) {
		const ElementType = renderFn;
		return new ElementType(item);
	}
	return createRenderableElement(renderFn(item));
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
export class LiveList {
	items = [];
	renderFn;
	keyFn;
	spot = null;
	constructor(renderFn, keyFn = (item, index) => {
		return index;
	}) {
		this.renderFn = renderFn;
		this.keyFn = keyFn;
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
	createElement(item) {
		return createListElement(this.renderFn, item);
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
	if (itemList.connectSpot) {
		itemList.connectSpot(spot);
	}
	const {
		items, renderFn, keyFn,
	} = itemList;
	const anchor = spot.el;
	const oldMap = spot.keyMap ?? new Map();
	const newKeySet = new Set();
	const keyedItems = items.map((item, index) => {
		const key = keyFn(item, index);
		newKeySet.add(key);
		return {
			key,
			item,
		};
	});
	oldMap.forEach((element, key) => {
		if (!newKeySet.has(key)) {
			cleanupTemplateNode(element);
			element.remove();
			oldMap.delete(key);
		}
	});
	const newMap = new Map();
	const prevItemMap = spot.prevItemMap ?? new Map();
	const isBatchInsert = oldMap.size === 0 && keyedItems.length > 1;
	const fragment = isBatchInsert ? document.createDocumentFragment() : null;
	let cursor = null;
	for (let ki = 0; ki < keyedItems.length; ki++) {
		const {
			key, item,
		} = keyedItems[ki];
		let element = oldMap.get(key);
		if (!element) {
			element = itemList.createElement(item);
			if (fragment) {
				fragment.append(element);
			}
		} else if (item !== prevItemMap.get(key)) {
			if (element.state) {
				Object.assign(element.state, item);
			} else {
				const replacementElement = itemList.createElement(item);
				cleanupTemplateNode(element);
				element.replaceWith(replacementElement);
				element = replacementElement;
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
	if (fragment) {
		anchor.append(fragment);
	}
	spot.keyMap = newMap;
	spot.prevItemMap = prevItemMap;
}
function attrContext(templateString) {
	const attrMatch = templateString.match(/([\w:-]+)=["']$/);
	return attrMatch ? attrMatch[1] : null;
}
function eventContext(templateString) {
	const eventMatch = templateString.match(/^(?<prefix>[\s\S]*?)@(?<eventName>[\w:-]+)=["']?$/);
	if (!eventMatch?.groups?.eventName) {
		return null;
	}
	return {
		eventName: eventMatch.groups.eventName,
		prefix: eventMatch.groups.prefix,
	};
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
const ATTR_OPEN_RE = /([\w:-]+)=(["'])([^"']*)$/;
function detectAttrOpen(currentString, nextString) {
	const match = ATTR_OPEN_RE.exec(currentString);
	if (!match) {
		return null;
	}
	const [
		, name,
		quote,
		prefix,
	] = match;
	if (prefix.length === 0 && nextString.startsWith(quote)) {
		return null;
	}
	return {
		name,
		quote,
		prefix,
		totalLength: name.length + 2 + prefix.length,
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
			html += ` ${multiAttrMarkerAttribute(attrAccum.markerIdx)}=""`;
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
			html += `${bindMarkerAttribute(stringIndex)}=""`;
			meta.push({
				i: stringIndex,
				type: 'bind',
				expr,
			});
			continue;
		}
		if (eventBinding) {
			html += `${eventMarkerAttribute(eventBinding.eventName)}="expr${stringIndex}"`;
			meta.push({
				i: stringIndex,
				type: 'event',
				eventName: eventBinding.eventName,
				expr,
			});
			continue;
		}
		const attr = attrContext(effectiveString);
		if (attr) {
			html += `expr${stringIndex}`;
			meta.push({
				i: stringIndex,
				type: 'attr',
				attr,
				expr,
			});
		} else if (bareAttrContext(effectiveString, nextString)) {
			const inferredAttr = inferBareAttrName(expr);
			if (inferredAttr) {
				html += `${bareAttrMarkerAttribute(stringIndex)}=""`;
				meta.push({
					i: stringIndex,
					type: 'bare-attr',
					attr: inferredAttr,
					expr,
				});
				continue;
			}
		} else {
			html += `<span ${SPOT}="${stringIndex}"></span>`;
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
function getValueAtPath(source, path) {
	if (!path) {
		return source;
	}
	return path.split('.').reduce((value, key) => {
		return value?.[key];
	}, source);
}
function setValueAtPath(source, path, value) {
	const pathParts = path.split('.');
	const finalKey = pathParts.pop();
	let currentValue = source;
	for (let i = 0; i < pathParts.length; i++) {
		const part = pathParts[i];
		if (!currentValue[part] || typeof currentValue[part] !== 'object') {
			currentValue[part] = {};
		}
		currentValue = currentValue[part];
	}
	currentValue[finalKey] = value;
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
function evaluateTrackedExpression(component, expr) {
	const previousRenderTracking = component.renderTracking;
	const previousRenderProxy = component.renderProxy;
	const previousGlobalRenderProxy = component.globalRenderProxy;
	component.renderTracking = true;
	component.renderProxy = makeProxy(component.STATE, component);
	component.globalRenderProxy = makeGlobalProxy(getGlobalSource(component), component);
	try {
		return track(() => {
			return expr.call(component);
		});
	} finally {
		component.renderTracking = previousRenderTracking;
		component.renderProxy = previousRenderProxy;
		component.globalRenderProxy = previousGlobalRenderProxy;
	}
}
function subscribeStatePath(component, statePath, handler) {
	if (!component.watchState) {
		return () => {};
	}
	return component.watchState(statePath, (nextValue, empty, changedPath) => {
		return handler(nextValue, changedPath);
	});
}
function subscribeGlobalPath(component, statePath, handler) {
	if (!component.watchGlobal) {
		return () => {};
	}
	return component.watchGlobal(statePath, (nextValue, empty, changedPath) => {
		return handler(nextValue, changedPath);
	});
}
function syncSpotSubscriptions(spot, component, deps, handler) {
	spot.unsubs = clearSubscriptions(spot.unsubs);
	deps.forEach((dep) => {
		if (dep.startsWith('global.')) {
			spot.unsubs.push(subscribeGlobalPath(component, dep.slice(7), handler));
		} else {
			spot.unsubs.push(subscribeStatePath(component, dep, handler));
		}
	});
}
// Text spots use display:contents spans — transparent to layout but support
// textContent (plain strings), innerHTML (HTML fragments), and patchList
// (LiveLists). pointer-events on the wrapper is decided per branch:
//   - LiveList / HTML with `<` → '' (preserve interactivity for child elements)
//   - HTML entity-only or plain text → 'none' (cursor falls through to parent,
//     enabling leaf-only tooltip lookup)
function patchSpot(spot, value) {
	const patchToken = (spot.patchToken ?? 0) + 1;
	spot.patchToken = patchToken;
	if (LiveList.isLiveList(value)) {
		if (!spot.keyMap && spot.el.firstChild) {
			spot.el.textContent = '';
		}
		spot.el.style.pointerEvents = '';
		patchList(spot, value);
		return;
	}
	if (spot.keyMap) {
		spot.keyMap.forEach(cleanupTemplateNode);
		spot.keyMap = null;
		spot.prevItemMap = null;
	}
	if (value instanceof Promise) {
		value.then((v) => {
			if (spot.patchToken !== patchToken) {
				return;
			}
			return patchSpot(spot, v);
		}).catch((error) => {
			console.error('[template] async spot error:', error);
		});
		return;
	}
	if (spot.type === 'text') {
		const str = String(value ?? '');
		const hasMarkup = str.includes('<');
		if (hasMarkup) {
			spot.el.innerHTML = str;
			spot.el.style.pointerEvents = '';
		} else if (str.includes('&')) {
			spot.el.innerHTML = str;
			spot.el.style.pointerEvents = 'none';
		} else if (spot.el.textContent !== str) {
			spot.el.textContent = str;
			spot.el.style.pointerEvents = 'none';
		}
	} else if (spot.type === 'bare-attr') {
		if (applySubeventAttr(spot.el, spot.attr, value)) {
			return;
		}
		if (value === false || value === null || value === undefined || value === '') {
			if (spot.el.hasAttribute(spot.attr)) {
				spot.el.removeAttribute(spot.attr);
			}
		} else if (value === true) {
			if (!spot.el.hasAttribute(spot.attr)) {
				spot.el.setAttribute(spot.attr, '');
			}
		} else {
			const str = String(value);
			if (spot.el.getAttribute(spot.attr) !== str) {
				spot.el.setAttribute(spot.attr, str);
			}
		}
	} else {
		if (applySubeventAttr(spot.el, spot.attr, value)) {
			return;
		}
		const str = String(value ?? '');
		if (spot.el.getAttribute(spot.attr) !== str) {
			spot.el.setAttribute(spot.attr, str);
		}
	}
}
function initializeBindingSpot(spot, component) {
	const bindingKey = spot.expr.key;
	if (ListBinding.isListBinding(spot.expr)) {
		const {
			renderFn, keyFn,
		} = spot.expr;
		function updateListSpot(nextValue, changedPath) {
			return schedule(() => {
				if (changedPath && changedPath !== bindingKey && changedPath.startsWith(`${bindingKey}.`) && spot.keyMap) {
					const subPath = changedPath.slice(bindingKey.length + 1);
					const index = Number(subPath.split('.')[0]);
					if (!Number.isNaN(index)) {
						const currentItems = resolveBindingValue(component, bindingKey);
						const item = Array.isArray(currentItems) ? currentItems[index] : undefined;
						if (item !== undefined) {
							const itemKey = keyFn(item, index);
							const element = spot.keyMap.get(itemKey);
							if (hasValue(element?.state)) {
								Object.assign(element.state, item);
								return;
							}
						}
					}
				}
				const allItems = resolveBindingValue(component, bindingKey);
				return patchSpot(spot, each(Array.isArray(allItems) ? allItems : [], renderFn, keyFn));
			});
		}
		spot.updateHandler = updateListSpot;
		const initialItems = resolveBindingValue(component, bindingKey);
		patchSpot(spot, each(Array.isArray(initialItems) ? initialItems : [], renderFn, keyFn));
		syncSpotSubscriptions(spot, component, new Set([bindingKey]), updateListSpot);
		return;
	}
	function updateBindingSpot() {
		return schedule(() => {
			return patchSpot(spot, resolveBindingValue(component, bindingKey));
		});
	}
	spot.updateHandler = updateBindingSpot;
	patchSpot(spot, resolveBindingValue(component, bindingKey));
	syncSpotSubscriptions(spot, component, new Set([bindingKey]), updateBindingSpot);
}
function refreshComputedSpot(spot, component) {
	const {
		value,
		deps,
	} = evaluateTrackedExpression(component, spot.expr);
	patchSpot(spot, value);
	syncSpotSubscriptions(spot, component, deps, spot.updateHandler);
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
function refreshClassListSpot(spot, component) {
	const {
		desired,
		deps,
	} = evaluateClassListParts(spot, component);
	const current = spot.classListCurrent ?? new Set();
	diffClassList(spot.el, current, desired);
	spot.classListCurrent = desired;
	syncSpotSubscriptions(spot, component, deps, spot.updateHandler);
}
function initializeClassListSpot(spot, component) {
	function updateClassListSpot() {
		return schedule(() => {
			return refreshClassListSpot(spot, component);
		});
	}
	spot.updateHandler = updateClassListSpot;
	refreshClassListSpot(spot, component);
}
function partsHaveClassListMarker(parts) {
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (part.expr !== undefined && ClassList.isClassList(part.expr)) {
			return true;
		}
	}
	return false;
}
function refreshMultiAttrSpot(spot, component) {
	const {
		result,
		deps,
	} = evaluateMultiAttrParts(spot, component);
	if (!applySubeventAttr(spot.el, spot.attr, result)) {
		if (spot.el.getAttribute(spot.attr) !== result) {
			spot.el.setAttribute(spot.attr, result);
		}
	}
	syncSpotSubscriptions(spot, component, deps, spot.updateHandler);
}
function initializeMultiAttrSpot(spot, component) {
	function updateMultiAttr() {
		return schedule(() => {
			return refreshMultiAttrSpot(spot, component);
		});
	}
	spot.updateHandler = updateMultiAttr;
	refreshMultiAttrSpot(spot, component);
}
function initializeComputedSpot(spot, component) {
	function updateComputedSpot() {
		return schedule(() => {
			return refreshComputedSpot(spot, component);
		});
	}
	spot.updateHandler = updateComputedSpot;
	refreshComputedSpot(spot, component);
}
function initializeEventSpot(spot, component) {
	if (spot.expr === undefined || spot.expr === null || spot.expr === false) {
		return;
	}
	if (!isFunction(spot.expr)) {
		throw new TypeError(`Template event handler for @${spot.eventName} must be a function.`);
	}
	const listener = (domEvent) => {
		return component.runEventHandler(spot.expr, domEvent, spot.el, spot.eventName);
	};
	spot.el.addEventListener(spot.eventName, listener);
	spot.unsubs.push(() => {
		spot.el.removeEventListener(spot.eventName, listener);
	});
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
function initializeTwoWaySpot(spot, component, explicitKey) {
	const key = explicitKey ?? spot.expr.key;
	const el = spot.el;
	const attr = spot.attr ?? domAttrForElement(el);
	setDomProp(el, attr, resolveBindingValue(component, key));
	if (el.hasAttribute('value')) {
		el.removeAttribute('value');
	}
	if (el.hasAttribute('checked')) {
		el.removeAttribute('checked');
	}
	const subscribeFn = key.startsWith('global.') ? (handler) => {
		return subscribeGlobalPath(component, key.slice(7), handler);
	} : (handler) => {
		return subscribeStatePath(component, key, handler);
	};
	spot.unsubs.push(subscribeFn((nextValue) => {
		return setDomProp(el, attr, nextValue);
	}));
	const eventType = domInputEvent(el);
	const domHandler = () => {
		writeBoundValue(component, key, readDomProp(el, attr));
	};
	el.addEventListener(eventType, domHandler);
	spot.unsubs.push(() => {
		return el.removeEventListener(eventType, domHandler);
	});
}
const TEMPLATE_RECIPES = new WeakMap();
function getNodePath(node, root) {
	const path = [];
	let current = node;
	while (current !== root) {
		const parent = current.parentNode;
		if (!parent) {
			return null;
		}
		let index = 0;
		let sibling = parent.firstChild;
		while (sibling && sibling !== current) {
			sibling = sibling.nextSibling;
			index += 1;
		}
		path.push(index);
		current = parent;
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
function buildSpotPlan(fragment, entry) {
	if (entry.type === 'bind') {
		const markerAttr = bindMarkerAttribute(entry.i);
		const el = fragment.querySelector(`[${markerAttr}]`);
		if (!el) {
			return null;
		}
		el.removeAttribute(markerAttr);
		return {
			type: 'bind',
			slotIndex: entry.i,
			path: getNodePath(el, fragment),
		};
	}
	if (entry.type === 'multi-attr') {
		const markerAttr = multiAttrMarkerAttribute(entry.i);
		const el = fragment.querySelector(`[${markerAttr}]`);
		if (!el) {
			return null;
		}
		el.removeAttribute(markerAttr);
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
			path: getNodePath(el, fragment),
			attr: entry.attr,
			parts,
		};
	}
	if (entry.type === 'event') {
		const markerAttr = eventMarkerAttribute(entry.eventName);
		const el = fragment.querySelector(`[${markerAttr}="expr${entry.i}"]`);
		if (!el) {
			return null;
		}
		el.removeAttribute(markerAttr);
		return {
			type: 'event',
			slotIndex: entry.i,
			path: getNodePath(el, fragment),
			eventName: entry.eventName,
		};
	}
	if (entry.type === 'text') {
		const el = fragment.querySelector(`[${SPOT}="${entry.i}"]`);
		if (!el) {
			return null;
		}
		el.removeAttribute(SPOT);
		el.style.display = 'contents';
		return {
			type: 'text',
			slotIndex: entry.i,
			path: getNodePath(el, fragment),
		};
	}
	if (entry.type === 'bare-attr') {
		const markerAttr = bareAttrMarkerAttribute(entry.i);
		const el = fragment.querySelector(`[${markerAttr}]`);
		if (!el) {
			return null;
		}
		el.removeAttribute(markerAttr);
		return {
			type: 'bare-attr',
			slotIndex: entry.i,
			path: getNodePath(el, fragment),
		};
	}
	if (entry.type === 'attr') {
		const el = fragment.querySelector(`[${entry.attr}="expr${entry.i}"]`);
		if (!el) {
			return null;
		}
		el.removeAttribute(entry.attr);
		return {
			type: 'attr',
			slotIndex: entry.i,
			path: getNodePath(el, fragment),
			attr: entry.attr,
		};
	}
	return null;
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
			key: stateKey,
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
			key: stateKey,
		});
		el.removeAttribute('@bind');
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
function prepareRecipe(strings) {
	const placeholderExprs = new Array(Math.max(0, strings.length - 1));
	const {
		html: markup,
		meta,
	} = buildHTML(strings, placeholderExprs);
	const template = document.createElement('template');
	template.innerHTML = markup;
	const fragment = template.content;
	const spotPlans = [];
	eachArray(meta, (entry) => {
		const plan = buildSpotPlan(fragment, entry);
		if (plan) {
			spotPlans.push(plan);
		}
	});
	const dataBindPlans = extractDataBindPlans(fragment);
	const subeventPlans = extractSubeventPlans(fragment);
	return {
		fragment,
		spotPlans,
		dataBindPlans,
		subeventPlans,
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
function installDataBind(el, stateKey, component, unsubs) {
	const isCheck = el.type === 'checkbox' || el.type === 'radio';
	const eventType = domInputEvent(el);
	const setProp = (v) => {
		if (isCheck) {
			el.checked = Boolean(v);
		} else {
			el.value = String(v ?? '');
		}
	};
	const handler = () => {
		setValueAtPath(component.stateProxy, stateKey, isCheck ? el.checked : el.value);
	};
	el.addEventListener(eventType, handler);
	unsubs.push(() => {
		el.removeEventListener(eventType, handler);
	});
	const currentValue = getValueAtPath(component.STATE, stateKey);
	if (currentValue !== undefined) {
		setProp(currentValue);
	}
	unsubs.push(subscribeStatePath(component, stateKey, setProp));
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
		if (plan.attr === 'class' && partsHaveClassListMarker(parts)) {
			const spot = {
				type: 'class-list',
				slotIndex: plan.slotIndex,
				attr: 'class',
				parts,
				el,
				unsubs: [],
			};
			initializeClassListSpot(spot, component);
			unsubs.push(() => {
				spot.unsubs = clearSubscriptions(spot.unsubs);
			});
			return spot;
		}
		const spot = {
			type: 'multi-attr',
			slotIndex: plan.slotIndex,
			attr: plan.attr,
			parts,
			el,
			unsubs: [],
		};
		initializeMultiAttrSpot(spot, component);
		unsubs.push(() => {
			spot.unsubs = clearSubscriptions(spot.unsubs);
		});
		return spot;
	}
	const expr = exprs[plan.slotIndex];
	if (plan.type === 'bind') {
		if (!isBindingType(expr)) {
			return null;
		}
		const spot = {
			type: 'bind',
			slotIndex: plan.slotIndex,
			el,
			expr,
			unsubs: [],
		};
		initializeTwoWaySpot(spot, component);
		unsubs.push(() => {
			spot.unsubs = clearSubscriptions(spot.unsubs);
		});
		return spot;
	}
	if (plan.type === 'event') {
		const spot = {
			type: 'event',
			slotIndex: plan.slotIndex,
			eventName: plan.eventName,
			el,
			expr,
			unsubs: [],
		};
		initializeEventSpot(spot, component);
		unsubs.push(() => {
			spot.unsubs = clearSubscriptions(spot.unsubs);
		});
		return spot;
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
		if (plan.attr === 'class' && ClassList.isClassList(expr)) {
			const spot = {
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
			initializeClassListSpot(spot, component);
			unsubs.push(() => {
				spot.unsubs = clearSubscriptions(spot.unsubs);
			});
			return spot;
		}
		spot = {
			type: 'attr',
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
					unsubs.push(() => {
						spot.unsubs = clearSubscriptions(spot.unsubs);
					});
					return spot;
				}
			}
		}
		initializeComputedSpot(spot, component);
	} else {
		patchSpot(spot, expr);
	}
	unsubs.push(() => {
		spot.unsubs = clearSubscriptions(spot.unsubs);
	});
	return spot;
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
function instantiateRecipe(recipe, exprs, component) {
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
	if (spot.type === 'text' || spot.type === 'bare-attr') {
		patchSpot(spot, newExpr);
		spot.expr = newExpr;
	}
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
				const newVal = newExprs[part.exprIndex];
				if (part.expr !== newVal) {
					part.expr = newVal;
					changed = true;
				}
			});
			if (changed) {
				refreshMultiAttrSpot(spot, component);
			}
			continue;
		}
		if (spot.type === 'class-list') {
			let changed = false;
			eachArray(spot.parts, (part) => {
				if (part.exprIndex === undefined) {
					return;
				}
				const newVal = newExprs[part.exprIndex];
				if (part.expr !== newVal) {
					part.expr = newVal;
					changed = true;
				}
			});
			if (changed) {
				refreshClassListSpot(spot, component);
			}
			continue;
		}
		const slotIndex = spot.slotIndex;
		if (slotIndex === undefined) {
			continue;
		}
		const newVal = newExprs[slotIndex];
		const prevVal = prevExprs[slotIndex];
		if (newVal === prevVal) {
			continue;
		}
		updateSpot(spot, newVal, component);
	}
	state.prevExprs = newExprs.slice();
}
export function makeHtmlTag(component) {
	let unsubs = [];
	let templateState = null;
	let boundKeys = new Set();
	const cleanup = () => {
		eachArray(unsubs, callFn);
		unsubs = [];
		cleanupTemplateTree(component.shadowRoot ?? component);
		templateState = null;
		boundKeys = new Set();
	};
	function html(strings, ...exprs) {
		if (templateState && templateState.strings === strings) {
			updateTemplateSpots(templateState, exprs, component);
			component.templateBuilt = true;
			return;
		}
		cleanup();
		const recipe = getRecipe(strings);
		const instance = instantiateRecipe(recipe, exprs, component);
		unsubs = instance.unsubs;
		boundKeys = instance.boundKeys;
		(component.shadowRoot ?? component).replaceChildren(instance.fragment);
		component.templateBuilt = true;
		templateState = {
			strings,
			spots: instance.spots,
			prevExprs: exprs.slice(),
		};
	}
	html.element = function element(strings, ...exprs) {
		const recipe = getRecipe(strings);
		const instance = instantiateRecipe(recipe, exprs, component);
		if (instance.fragment.children.length !== 1) {
			clearSubscriptions(instance.unsubs);
			throw new TypeError('html.element requires exactly one root element.');
		}
		const element = instance.fragment.firstElementChild;
		element[TEMPLATE_CLEANUP] = () => {
			clearSubscriptions(instance.unsubs);
		};
		return element;
	};
	html.cleanup = cleanup;
	html.boundKeys = () => {
		return boundKeys;
	};
	return html;
}
