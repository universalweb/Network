/* eslint-disable no-restricted-syntax */
import {
	Binding, makeGlobalTrackingProxy, makeTrackingProxy, track,
} from './binding.js';
import {
	createElementFromHTML,
	isElement,
	isFunction,
	isString,
} from './utilities.js';
import { schedule } from './scheduler.js';
const SPOT = 'data-expr';
const TEMPLATE_CLEANUP = Symbol('templateCleanup');
function cleanupTemplateNode(node) {
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
	for (const node of root.querySelectorAll('*')) {
		cleanupTemplateNode(node);
	}
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
		const el = new ElementType();
		if (el.STATE && typeof el.STATE === 'object' && typeof item === 'object' && item !== null) {
			Object.assign(el.STATE, item);
		} else {
			el.state = item;
		}
		return el;
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
			for (let insertIndex = 0; insertIndex < newItems.length; insertIndex++) {
				const newItem = newItems[insertIndex];
				const itemKey = this.keyFn(newItem, normalStart + insertIndex);
				const element = this.createElement(newItem);
				if (this.spot.keyMap === undefined || this.spot.keyMap === null) {
					this.spot.keyMap = new Map();
				}
				if (this.spot.prevItemMap === undefined || this.spot.prevItemMap === null) {
					this.spot.prevItemMap = new Map();
				}
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
	const list = new LiveList(renderFn, keyFn);
	if (Array.isArray(items) && items.length) {
		list.push(...items);
	}
	return list;
}
export function liveList(items, renderTarget, keyFn = (item, index) => {
	return item?.key ?? item?.id ?? index;
}) {
	return each(items, renderTarget, keyFn);
}
export function listBind(key, renderFn, keyFn = (item, index) => {
	return item?.key ?? item?.id ?? index;
}) {
	return new ListBinding(key, renderFn, keyFn);
}
function patchList(spot, list) {
	if (list.connectSpot) {
		list.connectSpot(spot);
	}
	const {
		items, renderFn, keyFn,
	} = list;
	const anchor = spot.el;
	const oldMap = spot.keyMap ?? new Map();
	const keyedItems = items.map((item, index) => {
		return {
			key: keyFn(item, index),
			item,
		};
	});
	const newKeySet = new Set(keyedItems.map((keyedItem) => {
		return keyedItem.key;
	}));
	for (const [
		key,
		element,
	] of oldMap) {
		if (!newKeySet.has(key)) {
			cleanupTemplateNode(element);
			element.remove();
			oldMap.delete(key);
		}
	}
	const newMap = new Map();
	const prevItemMap = spot.prevItemMap ?? new Map();
	const isBatchInsert = oldMap.size === 0 && keyedItems.length > 1;
	const fragment = isBatchInsert ? document.createDocumentFragment() : null;
	let cursor = null;
	for (const {
		key, item,
	} of keyedItems) {
		let element = oldMap.get(key);
		if (!element) {
			element = list.createElement(item);
			if (fragment) {
				fragment.append(element);
			}
		} else if (item !== prevItemMap.get(key)) {
			if (element.state) {
				Object.assign(element.state, item);
			} else {
				const replacementElement = list.createElement(item);
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
function bareAttrMarkerAttribute(index) {
	return `data-attr-expr-${index}`;
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
	if (!Binding.isBinding(expr)) {
		return null;
	}
	const bindingKey = String(expr.key ?? '');
	const attrName = bindingKey.split('.').pop()?.trim();
	if (!attrName) {
		return null;
	}
	const firstChar = attrName[0];
	const firstCharCode = firstChar?.charCodeAt(0);
	const startsWithLetter = (firstCharCode >= 65 && firstCharCode <= 90) || (firstCharCode >= 97 && firstCharCode <= 122);
	if (!startsWithLetter && firstChar !== '_' && firstChar !== ':') {
		return null;
	}
	for (const char of attrName.slice(1)) {
		const charCode = char.charCodeAt(0);
		const isLetter = (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
		const isNumber = charCode >= 48 && charCode <= 57;
		if (!isLetter && !isNumber && char !== '_' && char !== ':' && char !== '.' && char !== '-') {
			return null;
		}
	}
	if (!attrName) {
		return null;
	}
	return attrName;
}
function buildHTML(strings, exprs) {
	let html = '';
	const meta = [];
	for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
		const currentString = strings[stringIndex];
		const eventBinding = eventContext(currentString);
		html += eventBinding?.prefix ?? currentString;
		if (stringIndex >= exprs.length) {
			continue;
		}
		const expr = exprs[stringIndex];
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
		const reactive = Binding.isBinding(expr) || isFunction(expr);
		if (!reactive) {
			html += expr ?? '';
			continue;
		}
		const attr = attrContext(strings[stringIndex]);
		if (attr) {
			html += `expr${stringIndex}`;
			meta.push({
				i: stringIndex,
				type: 'attr',
				attr,
				expr,
			});
		} else if (bareAttrContext(currentString, strings[stringIndex + 1] ?? '')) {
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
	for (const pathPart of pathParts) {
		if (!currentValue[pathPart] || typeof currentValue[pathPart] !== 'object') {
			currentValue[pathPart] = {};
		}
		currentValue = currentValue[pathPart];
	}
	currentValue[finalKey] = value;
}
function clearSubscriptions(subscriptions = []) {
	for (const unsubscribe of subscriptions) {
		unsubscribe();
	}
	return [];
}
function getGlobalSource(component) {
	if (component.getGlobalState) {
		return component.getGlobalState();
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
	component.renderProxy = makeTrackingProxy(component.STATE, component);
	component.globalRenderProxy = makeGlobalTrackingProxy(getGlobalSource(component), component);
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
	for (const dep of deps) {
		if (dep.startsWith('global.')) {
			spot.unsubs.push(subscribeGlobalPath(component, dep.slice(7), handler));
		} else {
			spot.unsubs.push(subscribeStatePath(component, dep, handler));
		}
	}
}
// Text spots use display:contents spans — transparent to layout but support
// both textContent (plain strings) and innerHTML (HTML fragments from .map()).
function patchSpot(spot, value) {
	const patchToken = (spot.patchToken ?? 0) + 1;
	spot.patchToken = patchToken;
	if (LiveList.isLiveList(value)) {
		patchList(spot, value);
		return;
	}
	if (spot.keyMap) {
		for (const element of spot.keyMap.values()) {
			cleanupTemplateNode(element);
		}
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
		if (str.includes('<') || str.includes('&')) {
			spot.el.innerHTML = str;
		} else if (spot.el.textContent !== str) {
			spot.el.textContent = str;
		}
	} else if (spot.type === 'bare-attr') {
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
							if (element?.state) {
								Object.assign(element.state, item);
							}
						}
						return;
					}
				}
				const allItems = resolveBindingValue(component, bindingKey);
				const patchResult = patchSpot(spot, each(Array.isArray(allItems) ? allItems : [], renderFn, keyFn));
				component.scheduleRenderComplete?.();
				return patchResult;
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
			const patchResult = patchSpot(spot, resolveBindingValue(component, bindingKey));
			component.scheduleRenderComplete?.();
			return patchResult;
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
function initializeComputedSpot(spot, component) {
	function updateComputedSpot() {
		return schedule(() => {
			const patchResult = refreshComputedSpot(spot, component);
			component.scheduleRenderComplete?.();
			return patchResult;
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
function resolveAndInit(fragment, meta, component, unsubs) {
	const textSpots = {};
	for (const el of fragment.querySelectorAll(`[${SPOT}]`)) {
		textSpots[el.getAttribute(SPOT)] = el;
	}
	for (const metaEntry of meta) {
		let spot;
		if (metaEntry.type === 'event') {
			const markerAttribute = eventMarkerAttribute(metaEntry.eventName);
			const spotElement = fragment.querySelector(`[${markerAttribute}="expr${metaEntry.i}"]`);
			if (!spotElement) {
				continue;
			}
			spotElement.removeAttribute(markerAttribute);
			spot = {
				type: 'event',
				eventName: metaEntry.eventName,
				el: spotElement,
				expr: metaEntry.expr,
				unsubs: [],
			};
			initializeEventSpot(spot, component);
			unsubs.push(() => {
				spot.unsubs = clearSubscriptions(spot.unsubs);
			});
			continue;
		}
		if (metaEntry.type === 'text') {
			const spotElement = textSpots[metaEntry.i];
			if (!spotElement) {
				continue;
			}
			spotElement.removeAttribute(SPOT);
			spotElement.style.display = 'contents';
			spot = {
				type: 'text',
				el: spotElement,
				expr: metaEntry.expr,
				unsubs: [],
			};
		} else if (metaEntry.type === 'bare-attr') {
			const markerAttribute = bareAttrMarkerAttribute(metaEntry.i);
			const spotElement = fragment.querySelector(`[${markerAttribute}]`);
			if (!spotElement) {
				continue;
			}
			spotElement.removeAttribute(markerAttribute);
			spot = {
				type: 'bare-attr',
				attr: metaEntry.attr,
				el: spotElement,
				expr: metaEntry.expr,
				unsubs: [],
			};
		} else {
			const spotElement = fragment.querySelector(`[${metaEntry.attr}="expr${metaEntry.i}"]`);
			if (!spotElement) {
				continue;
			}
			spot = {
				type: 'attr',
				attr: metaEntry.attr,
				el: spotElement,
				expr: metaEntry.expr,
				unsubs: [],
			};
		}
		if (Binding.isBinding(metaEntry.expr)) {
			initializeBindingSpot(spot, component);
		} else {
			initializeComputedSpot(spot, component);
		}
		unsubs.push(() => {
			spot.unsubs = clearSubscriptions(spot.unsubs);
		});
	}
	for (const boundElement of fragment.querySelectorAll('[data-bind]')) {
		const stateKey = boundElement.dataset.bind;
		if (!stateKey) {
			continue;
		}
		const isCheck = boundElement.type === 'checkbox' || boundElement.type === 'radio';
		const eventType = boundElement.tagName === 'SELECT' || isCheck ? 'change' : 'input';
		const handler = () => {
			setValueAtPath(component.state, stateKey, isCheck ? boundElement.checked : boundElement.value);
		};
		boundElement.addEventListener(eventType, handler);
		unsubs.push(() => {
			return boundElement.removeEventListener(eventType, handler);
		});
		const currentValue = getValueAtPath(component.STATE, stateKey);
		if (currentValue !== undefined) {
			if (isCheck) {
				boundElement.checked = Boolean(currentValue);
			} else {
				boundElement.value = String(currentValue ?? '');
			}
		}
	}
}
function buildTemplateContent(component, strings, exprs) {
	const {
		html: markup, meta,
	} = buildHTML(strings, exprs);
	const template = document.createElement('template');
	template.innerHTML = markup;
	const unsubs = [];
	resolveAndInit(template.content, meta, component, unsubs);
	return {
		content: template.content,
		unsubs,
	};
}
function buildTemplateElement(component, strings, exprs) {
	const {
		content,
		unsubs,
	} = buildTemplateContent(component, strings, exprs);
	if (content.children.length !== 1) {
		clearSubscriptions(unsubs);
		throw new TypeError('html.element requires exactly one root element.');
	}
	const element = content.firstElementChild;
	element[TEMPLATE_CLEANUP] = () => {
		clearSubscriptions(unsubs);
	};
	return element;
}
export function makeHtmlTag(component) {
	let unsubs = [];
	function html(strings, ...exprs) {
		for (const unsubscribe of unsubs) {
			unsubscribe();
		}
		unsubs = [];
		cleanupTemplateTree(component.shadowRoot ?? component);
		const builtTemplate = buildTemplateContent(component, strings, exprs);
		unsubs = builtTemplate.unsubs;
		(component.shadowRoot ?? component).replaceChildren(builtTemplate.content);
		component.templateBuilt = true;
	}
	html.element = function element(strings, ...exprs) {
		return buildTemplateElement(component, strings, exprs);
	};
	return html;
}
