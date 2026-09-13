/*
 * Shared list-row partials — define once, pass as list()/each()/filter()
 * renderFn. A Partial is NOT a bag (ComponentPartialTemplate /
 * ComponentHTMLTemplate); it is a reusable renderer that yields those bags
 * (or an Element / HTML string) when the list materializes with a host.
 *
 *   export const detailPairRow = Partial.define('detail-pair', function detailPairRow(pair) {
 *     return componentPartial`<div class="pair">…</div>`;
 *   });
 *   // consumer
 *   list('items', detailPairRow)
 *   // or
 *   list('items', Partial.get('detail-pair'))
 *
 * At materialize, `this` inside the renderer is the list host — so
 * `this.partial` / host methods work the same as a bare component method ref.
 */
import {
	isFunction,
	isString,
} from '../utilities.js';
/** @type {Map<string, Partial>} */
const REGISTRY = new Map();
export class Partial {
	#render;
	#id;
	/**
	 * Prefer Partial.define(); constructor is public for subclasses/tests.
	 * @param {Function} renderFn - (item, itemIndex?) → bag | Element | string.
	 * @param {string|null} [id] - Optional registry name.
	 */
	constructor(renderFn, id = null) {
		this.#render = renderFn;
		this.#id = id;
	}
	get id() {
		return this.#id;
	}
	/**
	 * Run the shared row renderer with the list host as `this`.
	 * @param {*} item - Current list item.
	 * @param {object|null|undefined} host - List host component (becomes `this`).
	 * @param {number} [itemIndex] - Absolute row index when known.
	 * @returns {*} - componentPartial/componentHTML bag, Element, or HTML string.
	 */
	render(item, host, itemIndex) {
		return this.#render.call(host, item, itemIndex);
	}
	static is(source) {
		return source instanceof Partial;
	}
	/**
	 * Register (optional name) and return a shared Partial.
	 * @param {string|Function} idOrRender - Name, or the render function alone.
	 * @param {Function} [renderFn] - Required when the first arg is a name.
	 * @returns {Partial} - The defined instance (also Partial.get(name) when named).
	 */
	static define(idOrRender, renderFn) {
		let id = null;
		let render = renderFn;
		if (isString(idOrRender)) {
			id = idOrRender;
		} else {
			render = idOrRender;
		}
		if (!isFunction(render)) {
			throw new TypeError('Partial.define requires a render function (item, itemIndex?) that returns componentPartial/componentHTML, an Element, or an HTML string.');
		}
		if (id != null && REGISTRY.has(id)) {
			throw new TypeError(`Partial already defined: "${id}"`);
		}
		const partial = new Partial(render, id);
		if (id != null) {
			REGISTRY.set(id, partial);
		}
		return partial;
	}
	/**
	 * Look up a named Partial from the registry.
	 * @param {string} id - Name passed to Partial.define.
	 * @returns {Partial|null} - Registered instance, or null.
	 */
	static get(id) {
		return REGISTRY.get(id) ?? null;
	}
	/**
	 * Whether a named Partial is registered.
	 * @param {string} id - Registry name.
	 * @returns {boolean}
	 */
	static has(id) {
		return REGISTRY.has(id);
	}
	/** Test / HMR only — clears the named registry. */
	static clearRegistry() {
		REGISTRY.clear();
	}
}
