import { applyHeadStyles, mergeStyleEntries } from './headStyles.js';
import {
	eachArray, hasOwn, isArray, isString,
} from '../utilities.js';
import { collectClassChain } from '../attrs/staticConfig.js';
import { loadSheet } from './css-loader.js';
const sheetCache = new Map();
const COMPONENT_LAYER = 'uwc.components';
/**
 * Wrap a component-authored sheet's cssText in @layer uwc.components so utility
 * classes (uwc.util) win over it while it still beats base-element rules
 * (uwc.base). Framework module sheets are NOT passed here — they self-declare
 * their own @layer bands.
 * @param {string} cssText - Raw component CSS.
 * @returns {string} The layer-wrapped CSS.
 */
export function layerComponentSheet(cssText) {
	return `@layer ${COMPONENT_LAYER} {\n${cssText}\n}`;
}
function sheetIsFrameworkOwned(owner) {
	return owner === globalThis.WebComponent || (owner && owner.name === 'WebComponent');
}
function reLayer(sheet) {
	if (!(sheet instanceof CSSStyleSheet)) {
		return sheet;
	}
	const rules = sheet.cssRules;
	let cssText = '';
	for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
		cssText += `${rules[ruleIndex].cssText}\n`;
	}
	const layered = new CSSStyleSheet();
	layered.replaceSync(layerComponentSheet(cssText));
	return layered;
}
export function styleSheet(source, metaUrl) {
	if (isArray(source)) {
		return Promise.all(source.map((sourceItem) => {
			return styleSheet(sourceItem, metaUrl);
		}));
	}
	const key = metaUrl ? new URL(source, metaUrl).toString() : source;
	if (sheetCache.has(key)) {
		return sheetCache.get(key);
	}
	if (metaUrl) {
		const sheetPromise = loadSheet(key);
		sheetCache.set(key, sheetPromise);
		return sheetPromise;
	}
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(source);
	sheetCache.set(key, sheet);
	return sheet;
}
export async function compileStyles(ComponentClass) {
	const merged = mergeStyleEntries(ComponentClass);
	const ordered = [];
	const tasks = [];
	merged.forEach((entry, key) => {
		const {
			owner,
			value,
		} = entry;
		if (value === null || value === undefined) {
			return;
		}
		if (value instanceof CSSStyleSheet) {
			ordered.push({
				key,
				sheet: value,
			});
			return;
		}
		if (!hasOwn(owner, 'url')) {
			throw new TypeError(`${owner.name}.styles.${key}: relative path "${value}" requires \`static url = import.meta.url\` on ${owner.name}.`);
		}
		const slot = {
			key,
			sheet: null,
		};
		ordered.push(slot);
		tasks.push(styleSheet(value, owner.url).then((sheet) => {
			slot.sheet = sheetIsFrameworkOwned(owner) ? sheet : reLayer(sheet);
		}));
	});
	await Promise.all(tasks);
	const map = new Map();
	eachArray(ordered, (slot) => {
		map.set(slot.key, slot.sheet);
	});
	return {
		map,
		array: Object.freeze([...map.values()]),
	};
}
export function ensureCompiledStyles(ComponentClass) {
	if (hasOwn(ComponentClass, 'compiledStylesPromise')) {
		return ComponentClass.compiledStylesPromise;
	}
	const promise = compileStyles(ComponentClass).then((result) => {
		ComponentClass.compiledStyles = result.map;
		ComponentClass.compiledStylesArray = result.array;
		return result;
	});
	Object.defineProperty(ComponentClass, 'compiledStylesPromise', {
		value: promise,
		configurable: true,
		writable: true,
	});
	return promise;
}
/*
 * ── Light-DOM (no-shadow) style scoping ──────────────────────────────
 * A no-shadow component has no shadowRoot to adopt sheets into, so its styles
 * would leak across the whole document. We scope them with `@scope (tag) { … }`
 * — the custom-element tag is unique per type, so one injection covers every
 * instance, and `@scope` confines rules to each host's own subtree (handling
 * nested same-tag instances natively). `:host` → `:scope`. Injection is
 * once-per-class + append-only (other instances may outlive any one; never
 * removed on unmount). Constraint: `<slot>`/`::slotted`/`:host-context` don't
 * exist in light DOM.
 * BROWSER FLOOR: `@scope` requires Chrome 118+ / Safari 17.4+ / Firefox 128+.
 * This is the project's binding floor — higher than the Promise.withResolvers
 * floor (FF 121) in lifecycle/scheduler.js. Only no-shadow components hit it;
 * shadow-DOM components (the default) have no `@scope` dependency.
 */
const lightStyleClasses = new Set();
function scopeHostSelectors(cssText) {
	/*
	 * `:host(.x)` → `:scope.x` (host matching .x); bare `:host` → `:scope`.
	 * The negative lookahead leaves `:host-context(` and `:host(` (handled above)
	 * untouched by the bare pass.
	 */
	return cssText
		.replace(/:host\(([^)]*)\)/g, ':scope$1')
		.replace(/:host(?![-\w(])/g, ':scope');
}
function buildScopedSheet(sheet, tagSelector) {
	if (!(sheet instanceof CSSStyleSheet)) {
		return null;
	}
	const rules = sheet.cssRules;
	let cssText = '';
	for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
		cssText += `${rules[ruleIndex].cssText}\n`;
	}
	const scoped = new CSSStyleSheet();
	scoped.replaceSync(`@layer ${COMPONENT_LAYER} {\n@scope (${tagSelector}) {\n${scopeHostSelectors(cssText)}\n}\n}`);
	return scoped;
}
function injectLightStyles(ComponentClass, styleMap, tagSelector) {
	if (lightStyleClasses.has(ComponentClass)) {
		return;
	}
	lightStyleClasses.add(ComponentClass);
	/*
	 * Framework module sheets (owner === the WebComponent base) are GLOBAL — they
	 * reach light DOM via styles/index.css @imports, so they must NOT be scoped to
	 * this tag or re-layered (doing so would scope-trap the reset/utilities and
	 * break their self-declared @layer bands). Only component-authored sheets (and
	 * any runtime-injected keys absent from the static-style chain) get
	 * @scope(tag) + @layer uwc.components. Mirrors the frameworkBase skip in
	 * headStyles.applyHeadStyles — and its indexed-for over a materialized map:
	 * runs once per class (the guard above), so the loop cost is moot and the
	 * win is killing the per-entry anonymous callback. `for…of` is avoided in
	 * core, so materialize-then-index is the eslint-clean, sibling-matching form.
	 */
	const frameworkBase = collectClassChain(ComponentClass)[0];
	const entries = mergeStyleEntries(ComponentClass);
	const pairs = [...styleMap];
	const scoped = [];
	for (let index = 0; index < pairs.length; index++) {
		const key = pairs[index][0];
		const entry = entries.get(key);
		if (entry && entry.owner === frameworkBase) {
			continue;
		}
		const built = buildScopedSheet(pairs[index][1], tagSelector);
		if (built) {
			scoped.push(built);
		}
	}
	if (scoped.length) {
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...scoped];
	}
}
export async function applyStyles() {
	const ComponentClass = this.constructor;
	/*
	 * Unscoped light DOM (useShadow=false + scopeStyles=false): emit normal
	 * global CSS into <head> as deduped <link>/<style>. Branches BEFORE the
	 * compile/fetch — path imports become <link> and the browser fetches them,
	 * so this mode never inlines a sheet. addStyle/importStyles target shadow
	 * children and don't apply here.
	 */
	if (!this.shadowRoot && ComponentClass.scopeStyles === false) {
		applyHeadStyles(ComponentClass);
		return;
	}
	if (this.styleMap) {
		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		} else {
			injectLightStyles(ComponentClass, this.styleMap, this.localName);
		}
		return;
	}
	const result = await ensureCompiledStyles(ComponentClass);
	if (!this.shadowRoot) {
		injectLightStyles(ComponentClass, result.map, this.localName);
		return;
	}
	/*
	 * addStyle/importStyles may have forked a styleMap during the await above; if
	 * so it holds the live sheet set and supersedes the freshly compiled defaults.
	 */
	this.shadowRoot.adoptedStyleSheets = this.styleMap ? [...this.styleMap.values()] : result.array;
}
export function forkStyleMap() {
	if (this.styleMap) {
		return this.styleMap;
	}
	const compiled = this.constructor.compiledStyles;
	this.styleMap = compiled ? new Map(compiled) : new Map();
	return this.styleMap;
}
export async function resolveStyle(sheetOrPath, baseUrl) {
	if (sheetOrPath instanceof CSSStyleSheet) {
		return sheetOrPath;
	}
	if (!isString(sheetOrPath)) {
		throw new TypeError('addStyle expects CSSStyleSheet or string path.');
	}
	const url = baseUrl ?? this.constructor.url ?? document.baseURI;
	return styleSheet(sheetOrPath, url);
}
export async function addStyle(key, sheetOrPath, baseUrl) {
	if (!isString(key)) {
		throw new TypeError('addStyle: key must be a string.');
	}
	await ensureCompiledStyles(this.constructor);
	const sheet = await this.resolveStyle(sheetOrPath, baseUrl);
	this.forkStyleMap();
	this.styleMap.set(key, sheet);
	if (this.shadowRoot) {
		this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
	}
	return sheet;
}
export async function removeStyle(key) {
	if (!isString(key)) {
		throw new TypeError('removeStyle: key must be a string.');
	}
	await ensureCompiledStyles(this.constructor);
	this.forkStyleMap();
	const wasDeleted = this.styleMap.delete(key);
	if (wasDeleted && this.shadowRoot) {
		this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
	}
	return wasDeleted;
}
/**
 * Parent → child style injection. A parent does `<child .importStyles=${sheet}>`
 * (or `child.importStyles = sheet`) to push a stylesheet THROUGH the child's
 * shadow boundary — the sanctioned way to style a subcomponent's internals from
 * the outside. Accepts a CSSStyleSheet, a `./path.css` string, or an array of
 * either; each is adopted via `addStyle` (keyed, layered AFTER the child's own
 * styles so the parent's rules win). A setter, so it works declaratively in a
 * template and imperatively. Setting null/undefined clears the first imported
 * sheet. NOTE: targets a shadow child; a light-DOM child already inherits the
 * parent's global/`@scope` styles, so injection isn't needed there.
 */
export function importStyles(source) {
	if (source === null || source === undefined) {
		this.removeStyle('imported-0');
		return;
	}
	const list = isArray(source) ? source : [source];
	for (let index = 0; index < list.length; index++) {
		this.addStyle(`imported-${index}`, list[index]);
	}
}
export function hasStyle(key) {
	if (this.styleMap) {
		return this.styleMap.has(key);
	}
	const compiled = this.constructor.compiledStyles;
	if (compiled) {
		return compiled.has(key);
	}
	return false;
}
