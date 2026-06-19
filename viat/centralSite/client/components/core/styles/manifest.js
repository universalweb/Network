import { loadSheet } from './css-loader.js';
const moduleFiles = {
	'uwc.reset': 'reset.css',
	'uwc.elements': 'elements-forms.css',
	'uwc.elements-buttons': 'elements-buttons.css',
	'uwc.prose': 'elements-prose.css',
	'uwc.util-spacing': 'util-spacing.css',
	'uwc.util-layout': 'util-layout.css',
	'uwc.util-type': 'util-type.css',
	'uwc.util-elevation': 'util-elevation.css',
	'uwc.util-surface': 'util-surface.css',
	'uwc.animations': 'animations.css',
	'uwc.effects': 'effects.css',
};
/*
 * Default UWC CSS base — a keyed map of shared, RESOLVED module stylesheets
 * spread into WebComponent.static styles. Keys are stable so a component can opt
 * out of any module via chain-merge override (`static styles = { 'uwc.util-surface': null }`).
 * Sheets are resolved here (top-level await, matching the original baseSheet
 * pattern) because the style compiler's framework path expects CSSStyleSheet
 * instances, NOT promises — a promise would fall through to the string-path
 * branch and throw `requires static url` (WebComponent has no static url).
 */
const resolved = await Promise.all(Object.entries(moduleFiles).map((pair) => {
	return loadSheet(new URL(`./modules/${pair[1]}`, import.meta.url)).then((sheet) => {
		return [pair[0], sheet];
	});
}));
export const uwcBase = Object.fromEntries(resolved);
