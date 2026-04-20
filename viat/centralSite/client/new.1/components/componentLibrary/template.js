/* eslint-disable no-restricted-syntax */
import { Binding, makeTrackingProxy, track } from './binding.js';
import { isFunction } from '../utilities.js';
import { schedule } from './scheduler.js';
const SPOT = 'data-expr';
const LIST = Symbol.for('wc.list');
export function each(items, renderFn, keyFn = (_, i) => {
	return i;
}) {
	return {
		[LIST]: true,
		items: Array.isArray(items) ? items : [],
		renderFn,
		keyFn,
	};
}
function isList(v) {
	return v?.[LIST] === true;
}
function patchList(spot, list) {
	const {
		items, renderFn, keyFn,
	} = list;
	const anchor = spot.el;
	const oldMap = spot.keyMap ?? new Map();
	const keyed = items.map((item, i) => {
		return {
			key: keyFn(item, i),
			item,
		};
	});
	const newKeySet = new Set(keyed.map((k) => {
		return k.key;
	}));
	for (const [
		key,
		el,
	] of oldMap) {
		if (!newKeySet.has(key)) {
			el.remove();
			oldMap.delete(key);
		}
	}
	const newMap = new Map();
	const prevItemMap = spot.prevItemMap ?? new Map();
	let cursor = null;
	for (const {
		key, item,
	} of keyed) {
		let el = oldMap.get(key);
		if (!el) {
			const result = renderFn(item);
			if (typeof result === 'string') {
				const tmpl = document.createElement('template');
				tmpl.innerHTML = result.trim();
				el = tmpl.content.firstElementChild;
			} else {
				el = result;
			}
		} else if (item !== prevItemMap.get(key)) {
			if (typeof el.updateState === 'function') {
				el.updateState(item);
			} else {
				const tmpl = document.createElement('template');
				tmpl.innerHTML = renderFn(item).trim();
				const next = tmpl.content.firstElementChild;
				el.replaceWith(next);
				el = next;
			}
		}
		const ref = cursor ? cursor.nextSibling : anchor.firstChild;
		if (el !== ref) {
			anchor.insertBefore(el, ref ?? null);
		}
		cursor = el;
		newMap.set(key, el);
		prevItemMap.set(key, item);
	}
	spot.keyMap = newMap;
	spot.prevItemMap = prevItemMap;
}
function attrContext(str) {
	const m = str.match(/([\w:-]+)=["']$/);
	return m ? m[1] : null;
}
function buildHTML(strings, exprs) {
	let html = '';
	const meta = [];
	for (let i = 0; i < strings.length; i++) {
		html += strings[i];
		if (i >= exprs.length) {
			continue;
		}
		const expr = exprs[i];
		const reactive = Binding.isBinding(expr) || isFunction(expr);
		if (!reactive) {
			html += expr ?? '';
			continue;
		}
		const attr = attrContext(strings[i]);
		if (attr) {
			html += `expr${i}`;
			meta.push({
				i,
				type: 'attr',
				attr,
				expr,
			});
		} else {
			html += `<span ${SPOT}="${i}"></span>`;
			meta.push({
				i,
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
	if (isList(value)) {
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
			spot.el.innerHTML = str;
		} else if (spot.el.textContent !== str) {
			spot.el.textContent = str;
		}
	} else {
		const str = String(value ?? '');
		if (spot.el.getAttribute(spot.attr) !== str) {
			spot.el.setAttribute(spot.attr, str);
		}
	}
}
function resolveAndInit(frag, meta, component, unsubs) {
	for (const m of meta) {
		let spot;
		if (m.type === 'text') {
			const el = frag.querySelector(`[${SPOT}="${m.i}"]`);
			if (!el) {
				continue;
			}
			el.removeAttribute(SPOT);
			el.style.display = 'contents';
			spot = {
				type: 'text',
				el,
				expr: m.expr,
			};
		} else {
			const el = frag.querySelector(`[${m.attr}="expr${m.i}"]`);
			if (!el) {
				continue;
			}
			spot = {
				type: 'attr',
				attr: m.attr,
				el,
				expr: m.expr,
			};
		}
		let value;
		let deps;
		if (Binding.isBinding(m.expr)) {
			value = component.STATE?.[m.expr.key];
			deps = new Set([m.expr.key]);
		} else {
			const saved = component.renderProxy;
			component.renderProxy = makeTrackingProxy(component.STATE);
			({
				value, deps,
			} = track(() => {
				return m.expr.call(component);
			}));
			component.renderProxy = saved;
		}
		patchSpot(spot, value);
		for (const key of deps) {
			const handler = (newVal) => {
				if (Binding.isBinding(spot.expr)) {
					return schedule(() => {
						return patchSpot(spot, newVal);
					});
				}
				const v = spot.expr.call(component);
				return schedule(() => {
					return patchSpot(spot, v);
				});
			};
			unsubs.push(component.watchState(key, handler));
		}
	}
	for (const el of frag.querySelectorAll('[data-bind]')) {
		const key = el.dataset.bind;
		if (!key) {
			continue;
		}
		const isCheck = el.type === 'checkbox' || el.type === 'radio';
		const evtType = el.tagName === 'SELECT' || isCheck ? 'change' : 'input';
		const handler = () => {
			component.updateState({
				[key]: isCheck ? el.checked : el.value,
			});
		};
		el.addEventListener(evtType, handler);
		unsubs.push(() => {
			return el.removeEventListener(evtType, handler);
		});
		if (component.STATE?.[key] !== undefined) {
			if (isCheck) {
				el.checked = Boolean(component.STATE[key]);
			} else {
				el.value = String(component.STATE[key] ?? '');
			}
		}
	}
}
export function makeHtmlTag(component) {
	let unsubs = [];
	return function html(strings, ...exprs) {
		for (const u of unsubs) {
			u();
		}
		unsubs = [];
		const {
			html: markup, meta,
		} = buildHTML(strings, exprs);
		const tmpl = document.createElement('template');
		tmpl.innerHTML = markup;
		resolveAndInit(tmpl.content, meta, component, unsubs);
		(component.shadowRoot ?? component).replaceChildren(tmpl.content);
		component.templateBuilt = true;
	};
}
