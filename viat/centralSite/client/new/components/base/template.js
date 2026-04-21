/* eslint-disable no-restricted-syntax */
import { Binding, makeTrackingProxy, track } from './binding.js';
import { createElementFromHTML, isFunction, isString } from '../utilities.js';
import { schedule } from './scheduler.js';
const SPOT = 'data-expr';
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
		const result = this.renderFn(item);
		return isString(result) ? createElementFromHTML(result) : result;
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
				this.spot.keyMap?.get(itemKey)?.remove();
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
			const result = renderFn(item);
			element = isString(result) ? createElementFromHTML(result) : result;
			if (fragment) {
				fragment.append(element);
			}
		} else if (item !== prevItemMap.get(key)) {
			if (element.state) {
				Object.assign(element.state, item);
			} else {
				const replacementElement = createElementFromHTML(renderFn(item));
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
function buildHTML(strings, exprs) {
	let html = '';
	const meta = [];
	for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
		html += strings[stringIndex];
		if (stringIndex >= exprs.length) {
			continue;
		}
		const expr = exprs[stringIndex];
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
// Text spots use display:contents spans — transparent to layout but support
// both textContent (plain strings) and innerHTML (HTML fragments from .map()).
function patchSpot(spot, value) {
	if (LiveList.isLiveList(value)) {
		patchList(spot, value);
		return;
	}
	if (spot.keyMap) {
		spot.keyMap = null;
		spot.prevItemMap = null;
	}
	if (spot.type === 'text') {
		const str = String(value ?? '');
		if (str.includes('<')) {
			console.log(`%c[dom patch] innerHTML`, 'color:orange');
			spot.el.innerHTML = str;
		} else if (spot.el.textContent !== str) {
			console.log(`%c[dom patch] textContent = ${str}`, 'color:orange');
			spot.el.textContent = str;
		}
	} else {
		const str = String(value ?? '');
		if (spot.el.getAttribute(spot.attr) !== str) {
			console.log(`%c[dom patch] ${spot.attr} = ${str}`, 'color:orange');
			spot.el.setAttribute(spot.attr, str);
		}
	}
}
function resolveAndInit(fragment, meta, component, unsubs) {
	const textSpots = {};
	for (const el of fragment.querySelectorAll(`[${SPOT}]`)) {
		textSpots[el.getAttribute(SPOT)] = el;
	}
	for (const metaEntry of meta) {
		let spot;
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
			};
		}
		let value;
		let deps;
		if (Binding.isBinding(metaEntry.expr)) {
			value = component.STATE?.[metaEntry.expr.key];
			deps = new Set([metaEntry.expr.key]);
		} else {
			const previousRenderProxy = component.renderProxy;
			component.renderProxy = makeTrackingProxy(component.STATE);
			({
				value, deps,
			} = track(() => {
				return metaEntry.expr.call(component);
			}));
			component.renderProxy = previousRenderProxy;
		}
		patchSpot(spot, value);
		for (const stateKey of deps) {
			const handler = (updatedValue) => {
				if (Binding.isBinding(spot.expr)) {
					return schedule(() => {
						return patchSpot(spot, updatedValue);
					});
				}
				const computedValue = spot.expr.call(component);
				return schedule(() => {
					return patchSpot(spot, computedValue);
				});
			};
			unsubs.push(component.watchState(stateKey, handler));
		}
	}
	for (const boundElement of fragment.querySelectorAll('[data-bind]')) {
		const stateKey = boundElement.dataset.bind;
		if (!stateKey) {
			continue;
		}
		const isCheck = boundElement.type === 'checkbox' || boundElement.type === 'radio';
		const eventType = boundElement.tagName === 'SELECT' || isCheck ? 'change' : 'input';
		const handler = () => {
			component.state[stateKey] = isCheck ? boundElement.checked : boundElement.value;
		};
		boundElement.addEventListener(eventType, handler);
		unsubs.push(() => {
			return boundElement.removeEventListener(eventType, handler);
		});
		if (component.STATE?.[stateKey] !== undefined) {
			if (isCheck) {
				boundElement.checked = Boolean(component.STATE[stateKey]);
			} else {
				boundElement.value = String(component.STATE[stateKey] ?? '');
			}
		}
	}
}
export function makeHtmlTag(component) {
	let unsubs = [];
	return function html(strings, ...exprs) {
		for (const unsubscribe of unsubs) {
			unsubscribe();
		}
		unsubs = [];
		const {
			html: markup, meta,
		} = buildHTML(strings, exprs);
		const template = document.createElement('template');
		template.innerHTML = markup;
		resolveAndInit(template.content, meta, component, unsubs);
		(component.shadowRoot ?? component).replaceChildren(template.content);
		component.templateBuilt = true;
	};
}
