/*
 * Unscoped light-DOM styles — the third style mode (see styleApi.js applyStyles).
 *
 *   shadow (default)         → adoptedStyleSheets on the shadowRoot
 *   light + scopeStyles      → @scope(tag) injected into document (styleApi.js)
 *   light + scopeStyles=false → THIS FILE: normal global CSS in <head>
 *
 * A `static useShadow=false` + `static scopeStyles=false` component is a plain
 * HTML element with NO style isolation — exactly like hand-authored markup on
 * the page. Its OWN `static styles` are emitted into <head>:
 *   - a `./path.css` string  → <link rel=stylesheet>, deduped by RESOLVED HREF
 *   - an author-declared CSSStyleSheet → <style> with the serialized cssText,
 *     deduped by sheet identity
 * The inherited framework `base` reset is deliberately NOT emitted (it is global
 * bare selectors meant for a shadow root — see applyHeadStyles).
 *
 * Dedup keys on the RESOURCE, never the class: two unrelated classes importing
 * the same `./shared.css` get ONE <link>. The per-class WeakSet only skips the
 * re-walk; the per-resource Map/WeakMap is what guarantees a single instance.
 * Injection is page-lifetime + append-only — other instances outlive any one,
 * so head entries are never removed on unmount.
 *
 * Consequence (by design): unscoped CSS is global. Authors namespace with their
 * own class selectors. A `<link>` loads async, so an unscoped component may
 * flash unstyled briefly — that is normal-HTML-page behavior, which is the point.
 * url() inside a serialized <style> resolves against the document, not the sheet
 * origin; prefer the path form (<link>) when a sheet uses relative url()s.
 */
import {
	eachArray, eachObject, hasOwn, isString,
} from '../utilities.js';
import { assertStaticStyles } from '../debug/assertions.js';
import { collectClassChain } from '../attrs/staticConfig.js';
const linkByHref = new Map();
const styleBySheet = new WeakMap();
const injectedClasses = new WeakSet();
/**
 * Chain-merge a class's `static styles` into `Map<key, { owner, value }>`, in
 * root → leaf order so a subclass overrides a base class on a shared key. Shared
 * by `compileStyles` (shadow/scoped path) and `applyHeadStyles` (unscoped path)
 * so both modes resolve the exact same set of entries.
 * @param {typeof import('../base.js').WebComponent} ComponentClass - Class whose styles to merge.
 * @returns {Map<string, {owner: Function, value: string|CSSStyleSheet}>} The merged entries.
 */
export function mergeStyleEntries(ComponentClass) {
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
	return merged;
}
function ensureHeadLink(href) {
	if (linkByHref.has(href)) {
		return;
	}
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = href;
	linkByHref.set(href, link);
	document.head.appendChild(link);
}
function serializeSheet(sheet) {
	const rules = sheet.cssRules;
	let cssText = '';
	for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
		cssText += `${rules[ruleIndex].cssText}\n`;
	}
	return cssText;
}
function ensureHeadStyle(sheet) {
	if (styleBySheet.has(sheet)) {
		return;
	}
	const styleElement = document.createElement('style');
	styleElement.textContent = serializeSheet(sheet);
	styleBySheet.set(sheet, styleElement);
	document.head.appendChild(styleElement);
}
function injectStyleEntry(entry) {
	const value = entry.value;
	if (value === null || value === undefined) {
		return;
	}
	if (value instanceof CSSStyleSheet) {
		ensureHeadStyle(value);
		return;
	}
	if (isString(value)) {
		if (!hasOwn(entry.owner, 'url')) {
			throw new TypeError(`${entry.owner.name}.styles: relative path "${value}" requires \`static url = import.meta.url\` on ${entry.owner.name}.`);
		}
		ensureHeadLink(new URL(value, entry.owner.url).toString());
	}
}
/**
 * Emit an unscoped light-DOM component's `static styles` into <head> as deduped
 * <link>/<style> elements. Idempotent per class (WeakSet short-circuit) and
 * globally deduped per resource (href / sheet identity), so any number of
 * instances or sharing classes converge on one element per unique resource.
 * @param {typeof import('../base.js').WebComponent} ComponentClass - The unscoped light-DOM class.
 */
export function applyHeadStyles(ComponentClass) {
	if (injectedClasses.has(ComponentClass)) {
		return;
	}
	injectedClasses.add(ComponentClass);
	/*
	 * chain[0] is always WebComponent (chain root — its parent is HTMLElement).
	 * Its `base` reset is GLOBAL bare selectors (`*{margin:0}`, the scrollbar
	 * skin) authored for adoption INTO a shadow root; emitting it into a global
	 * <head> <style> would restyle the entire document. Skip framework-owned
	 * entries — a subclass that overrides `base` owns that entry and still emits,
	 * so authors keep full control of their own reset.
	 */
	const frameworkBase = collectClassChain(ComponentClass)[0];
	const entries = [...mergeStyleEntries(ComponentClass).values()];
	for (let index = 0; index < entries.length; index++) {
		const entry = entries[index];
		if (entry.owner === frameworkBase) {
			continue;
		}
		injectStyleEntry(entry);
	}
}
