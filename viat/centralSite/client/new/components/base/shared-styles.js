export { loadSheet } from './css-loader.js';
import { loadSheet } from './css-loader.js';
export const panelSheet = await loadSheet(new URL('./styles/panel.css', import.meta.url));
export const scrollbarSheet = await loadSheet(new URL('./styles/scrollbar.css', import.meta.url));
export const utilsSheet = await loadSheet(new URL('./styles/utils.css', import.meta.url));
export const resetSheet = await loadSheet(new URL('./styles/reset.css', import.meta.url));
export function hostSheet(css) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	return sheet;
}
