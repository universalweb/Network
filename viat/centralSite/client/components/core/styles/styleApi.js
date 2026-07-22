import { collectClassChain } from '../attrs/staticConfig.js';
import {
	eachArray, getProto, hasOwn, isArray, isCSSStyleSheet, isString, queueAsyncError,
} from '../utilities.js';
import { loadSheet } from './css-loader.js';
import { applyHeadStyles, mergeStyleEntries } from './headStyles.js';
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
/*
 * Structural test: the framework base is the one class in a component chain
 * that extends HTMLElement directly. The old name-string fallback
 * (`owner.name === 'WebComponent'`) broke under minification and matched any
 * stranger class that happened to share the name.
 */
function sheetIsFrameworkOwned(owner) {
	return owner != null && getProto(owner) === HTMLElement;
}
function serializeSheetRules(sheet) {
	const rules = sheet.cssRules;
	let cssText = '';
	const rulesLength = rules.length;
	for (let ruleIndex = 0; ruleIndex < rulesLength; ruleIndex++) {
		cssText += `${rules[ruleIndex].cssText}\n`;
	}
	return cssText;
}
function reLayer(sheet) {
	if (!isCSSStyleSheet(sheet)) {
		return sheet;
	}
	const layered = new CSSStyleSheet();
	layered.replaceSync(layerComponentSheet(serializeSheetRules(sheet)));
	return layered;
}
/*
 * Warm-adoption run merging. adoptedStyleSheets attach cost scales with ARRAY
 * LENGTH per shadow root, and the ~11 framework module sheets head every
 * class's compiled array — so every instance paid a 12-sheet attach. Each run
 * of CONSECUTIVE framework-owned sheets collapses into one constructed sheet:
 * rules concatenate in the exact order the separate sheets cascaded (list
 * order × rule order = total order), so specificity and @layer
 * first-declaration precedence are untouched. Runs cache by member identity —
 * every class shares ONE merged sheet object, keeping the browser's
 * shared-contents optimization across all roots. compiledStyles (the per-key
 * Map) stays unmerged: addStyle/removeStyle fork it and drop back to
 * individual-sheet adoption, and constructed sheets cannot carry @import, so
 * cssRules serialization is lossless.
 */
// @engram em:network/concept/warm-adoption-sheet-merge-consecutive-framework-sheets-colla — consecutive-run merge preserves cascade order; per-key map stays unmerged for the fork path
const sheetIdRegistry = new WeakMap();
const mergedRunCache = new Map();
let sheetIdCounter = 0;
function sheetIdFor(sheet) {
	let sheetId = sheetIdRegistry.get(sheet);
	if (sheetId === undefined) {
		sheetIdCounter += 1;
		sheetId = sheetIdCounter;
		sheetIdRegistry.set(sheet, sheetId);
	}
	return sheetId;
}
function mergedSheetForRun(runSheets) {
	const runLength = runSheets.length;
	let runKey = '';
	for (let runIndex = 0; runIndex < runLength; runIndex++) {
		runKey += `${sheetIdFor(runSheets[runIndex])}|`;
	}
	let merged = mergedRunCache.get(runKey);
	if (merged === undefined) {
		let cssText = '';
		for (let runIndex = 0; runIndex < runLength; runIndex++) {
			cssText += serializeSheetRules(runSheets[runIndex]);
		}
		merged = new CSSStyleSheet();
		merged.replaceSync(cssText);
		mergedRunCache.set(runKey, merged);
	}
	return merged;
}
function flushFrameworkRun(runSheets, adoption) {
	const runLength = runSheets.length;
	if (runLength === 0) {
		return;
	}
	if (runLength === 1) {
		adoption.push(runSheets[0]);
	} else {
		adoption.push(mergedSheetForRun(runSheets));
	}
	runSheets.length = 0;
}
export function styleSheet(source, metaUrl) {
	if (isArray(source)) {
		const sheetTasks = [];
		const sourceLength = source.length;
		for (let sourceIndex = 0; sourceIndex < sourceLength; sourceIndex++) {
			sheetTasks.push(styleSheet(source[sourceIndex], metaUrl));
		}
		return Promise.all(sheetTasks);
	}
	/*
	 * metaUrl path: delegate straight to css-loader, the single robust fetch
	 * cache (in-flight dedup + evict-on-failure retry). A local promise cache
	 * here used to double the caching AND poison permanently on a fetch reject.
	 * The inline (no-metaUrl) path stays synchronous and is cached below, keyed
	 * by CSS text — no fetch, no rejection, safe to hold forever.
	 */
	if (metaUrl) {
		return loadSheet(new URL(source, metaUrl).toString());
	}
	if (sheetCache.has(source)) {
		return sheetCache.get(source);
	}
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(source);
	sheetCache.set(source, sheet);
	return sheet;
}
/*
 * Load one styles entry into its pre-inserted slot. A named async helper so the
 * per-entry loads still run CONCURRENTLY (each call is pushed unawaited into
 * `tasks`; compileStyles gathers them with one Promise.all) — awaiting inline
 * in the entry loop would serialize every sheet fetch.
 */
async function fillSheetSlot(slot, value, owner) {
	const sheet = await styleSheet(value, owner.url);
	slot.sheet = sheetIsFrameworkOwned(owner) ? sheet : reLayer(sheet);
}
export async function compileStyles(ComponentClass) {
	const merged = mergeStyleEntries(ComponentClass);
	const ordered = [];
	const tasks = [];
	for (const [
		key,
		entry,
	] of merged) {
		const {
			owner,
			value,
		} = entry;
		if (value === null || value === undefined) {
			continue;
		}
		if (isCSSStyleSheet(value)) {
			ordered.push({
				key,
				sheet: value,
				frameworkOwned: sheetIsFrameworkOwned(owner),
			});
			continue;
		}
		if (!hasOwn(owner, 'url')) {
			throw new TypeError(`${owner.name}.styles.${key}: relative path "${value}" requires \`static url = import.meta.url\` on ${owner.name}.`);
		}
		const slot = {
			key,
			sheet: null,
			frameworkOwned: sheetIsFrameworkOwned(owner),
		};
		ordered.push(slot);
		tasks.push(fillSheetSlot(slot, value, owner));
	}
	await Promise.all(tasks);
	const map = new Map();
	const adoption = [];
	const runSheets = [];
	const orderedLength = ordered.length;
	for (let slotIndex = 0; slotIndex < orderedLength; slotIndex++) {
		const slot = ordered[slotIndex];
		map.set(slot.key, slot.sheet);
		if (slot.frameworkOwned && isCSSStyleSheet(slot.sheet)) {
			runSheets.push(slot.sheet);
			continue;
		}
		flushFrameworkRun(runSheets, adoption);
		adoption.push(slot.sheet);
	}
	flushFrameworkRun(runSheets, adoption);
	return {
		map,
		array: Object.freeze(adoption),
	};
}
/*
 * Compile + stamp the class-level caches. The returned promise IS the memo
 * (ensureCompiledStyles stores it as `compiledStylesPromise`), so the sync
 * fields land exactly when it settles — same contract as the old .then chain.
 */
async function compileAndCacheStyles(ComponentClass) {
	const result = await compileStyles(ComponentClass);
	ComponentClass.compiledStyles = result.map;
	ComponentClass.compiledStylesArray = result.array;
	return result;
}
export function ensureCompiledStyles(ComponentClass) {
	if (hasOwn(ComponentClass, 'compiledStylesPromise')) {
		return ComponentClass.compiledStylesPromise;
	}
	const promise = compileAndCacheStyles(ComponentClass);
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
	if (!isCSSStyleSheet(sheet)) {
		return null;
	}
	const scoped = new CSSStyleSheet();
	scoped.replaceSync(`@layer ${COMPONENT_LAYER} {\n@scope (${tagSelector}) {\n${scopeHostSelectors(serializeSheetRules(sheet))}\n}\n}`);
	return scoped;
}
function injectLightStyles(ComponentClass, styleMap, tagSelector) {
	if (lightStyleClasses.has(ComponentClass)) {
		return;
	}
	lightStyleClasses.add(ComponentClass);
	/**
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
	const pairsLength = pairs.length;
	for (let index = 0; index < pairsLength; index++) {
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
/*
 * Deliberately NOT an async function. An async applyStyles returns a promise
 * even when every branch completes synchronously, which made handleConnect's
 * isPromiseLike guard dead code — every instance paid the await's microtask
 * hops. The warm per-class path (instances 2..N: compiled sheets already on
 * the class) now returns undefined, so the guard actually skips; only the one
 * cold compile per class routes through the async tail, and runHook's
 * containment covers both shapes (sync throw and async rejection alike).
 */
export function applyStyles() {
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
		return undefined;
	}
	if (this.styleMap) {
		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		} else {
			injectLightStyles(ComponentClass, this.styleMap, this.localName);
		}
		return undefined;
	}
	if (hasOwn(ComponentClass, 'compiledStylesArray')) {
		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = ComponentClass.compiledStylesArray;
		} else {
			injectLightStyles(ComponentClass, ComponentClass.compiledStyles, this.localName);
		}
		return undefined;
	}
	return applyStylesCold(this, ComponentClass);
}
async function applyStylesCold(component, ComponentClass) {
	const result = await ensureCompiledStyles(ComponentClass);
	if (!component.shadowRoot) {
		injectLightStyles(ComponentClass, result.map, component.localName);
		return;
	}
	/*
	 * addStyle/importStyles may have forked a styleMap during the await above; if
	 * so it holds the live sheet set and supersedes the freshly compiled defaults.
	 */
	component.shadowRoot.adoptedStyleSheets = component.styleMap ? [...component.styleMap.values()] : result.array;
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
	if (isCSSStyleSheet(sheetOrPath)) {
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
	const listLength = list.length;
	for (let index = 0; index < listLength; index++) {
		/*
		 * Write-only setter — the declarative `.importStyles=` push can't return a
		 * promise, so route addStyle's rejection (a bad value / mis-declared path)
		 * to the async-error sink instead of leaking an unhandledrejection.
		 */
		this.addStyle(`imported-${index}`, list[index]).catch(queueAsyncError);
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
