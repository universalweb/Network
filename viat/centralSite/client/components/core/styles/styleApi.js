import { eachArray, eachObject, hasOwn, isArray, isString } from '../utilities.js';
import { assertStaticStyles } from '../debug/assertions.js';
import { collectClassChain } from '../attrs/staticConfig.js';
import { loadSheet } from './css-loader.js';
const sheetCache = new Map();
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
	const chain = collectClassChain(ComponentClass);
	const merged = new Map();
	eachArray(chain, (classRef) => {
		if (!hasOwn(classRef, 'styles')) {
			return;
		}
		assertStaticStyles(classRef.styles, classRef.name);
		eachObject(classRef.styles, (key, value) => {
			merged.set(key, {
				owner: classRef,
				value,
			});
		});
	});
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
			slot.sheet = sheet;
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
// ── Light-DOM (no-shadow) style scoping ──────────────────────────────
// A no-shadow component has no shadowRoot to adopt sheets into, so its styles
// would leak across the whole document. We scope them with `@scope (tag) { … }`
// — the custom-element tag is unique per type, so one injection covers every
// instance, and `@scope` confines rules to each host's own subtree (handling
// nested same-tag instances natively). `:host` → `:scope`. Injection is
// once-per-class + append-only (other instances may outlive any one; never
// removed on unmount). Constraint: `<slot>`/`::slotted`/`:host-context` don't
// exist in light DOM.
// BROWSER FLOOR: `@scope` requires Chrome 118+ / Safari 17.4+ / Firefox 128+.
// This is the project's binding floor — higher than the Promise.withResolvers
// floor (FF 121) in lifecycle/scheduler.js. Only no-shadow components hit it;
// shadow-DOM components (the default) have no `@scope` dependency.
const lightStyleClasses = new Set();
function scopeHostSelectors(cssText) {
	// `:host(.x)` → `:scope.x` (host matching .x); bare `:host` → `:scope`.
	// The negative lookahead leaves `:host-context(` and `:host(` (handled above)
	// untouched by the bare pass.
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
	scoped.replaceSync(`@scope (${tagSelector}) {\n${scopeHostSelectors(cssText)}\n}`);
	return scoped;
}
function injectLightStyles(ComponentClass, sheets, tagSelector) {
	if (lightStyleClasses.has(ComponentClass)) {
		return;
	}
	lightStyleClasses.add(ComponentClass);
	const scoped = [];
	for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
		const built = buildScopedSheet(sheets[sheetIndex], tagSelector);
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
	if (this.styleMap) {
		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		} else {
			injectLightStyles(ComponentClass, [...this.styleMap.values()], this.localName);
		}
		return;
	}
	const result = await ensureCompiledStyles(ComponentClass);
	if (!this.shadowRoot) {
		injectLightStyles(ComponentClass, result.array, this.localName);
		return;
	}
	if (this.styleMap) {
		this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		return;
	}
	this.shadowRoot.adoptedStyleSheets = result.array;
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
// Parent → child style injection. A parent does `<child .importStyles=${sheet}>`
// (or `child.importStyles = sheet`) to push a stylesheet THROUGH the child's
// shadow boundary — the sanctioned way to style a subcomponent's internals from
// the outside. Accepts a CSSStyleSheet, a `./path.css` string, or an array of
// either; each is adopted via `addStyle` (keyed, layered AFTER the child's own
// styles so the parent's rules win). A setter, so it works declaratively in a
// template and imperatively. Setting null/undefined clears the first imported
// sheet. NOTE: targets a shadow child; a light-DOM child already inherits the
// parent's global/`@scope` styles, so injection isn't needed there.
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
