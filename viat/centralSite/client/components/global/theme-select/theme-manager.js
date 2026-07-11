import { emitDelegate } from '../../core/dom/delegate.js';
import { globalState } from '../../core/state/globalState.js';
/*
 * Theme registry + document-level switcher.
 *
 * THEMES is a live Map (id → descriptor) so themes can be registered at
 * runtime via `registerTheme({ id, label, mode, href? })` — including
 * user-created ones later. `href` is optional: a theme without one resolves
 * to `styles/themes/{id}.css` beside the built-ins.
 *
 * Midnight is the canonical default. An unknown / stale id in localStorage
 * falls back to it rather than silently sticking with the last valid paint.
 * This module is the SINGLE owner of theme boot: the top-level
 * `setTheme(getTheme())` below applies the saved theme (link swap + dataset
 * attributes) at module load — no inline HTML script involved. The body is
 * empty until components mount, so the default sheet never paints content.
 */
export const DEFAULT_THEME = 'midnight';
export const THEMES = new Map();
/**
 * Add one or more themes to the registry. Safe to call at runtime — a theme
 * registered after boot is immediately selectable via setTheme and shows up
 * in any UI that iterates THEMES on its next render.
 * @param {...object} themes - Descriptors: { id, label, mode, href? }.
 * @returns {Map} The THEMES registry.
 */
export function registerTheme(...themes) {
	for (let themeIndex = 0; themeIndex < themes.length; themeIndex++) {
		THEMES.set(themes[themeIndex].id, themes[themeIndex]);
	}
	return THEMES;
}
registerTheme(
	{
		id: 'hypr',
		label: 'Hypr',
		mode: 'dark',
	},
	{
		id: 'midnight',
		label: 'Midnight',
		mode: 'dark',
	},
	{
		id: 'dark',
		label: 'Dark',
		mode: 'dark',
	},
	{
		id: 'noir',
		label: 'Noir',
		mode: 'dark',
	},
	{
		id: 'marathon',
		label: 'Marathon',
		mode: 'dark',
	},
	{
		id: 'gnosis',
		label: 'Gnosis',
		mode: 'dark',
	},
	{
		id: 'codex',
		label: 'Codex',
		mode: 'light',
	}
);
function activeThemeLink() {
	return document.querySelector('link[rel="stylesheet"][href*="themes/"]');
}
function themeHrefFor(currentHref, themeId) {
	return currentHref.replace(/[^/]+\.css(\?.*)?$/, `${themeId}.css`);
}
function applyThemeAttributes(theme) {
	document.documentElement.dataset.theme = theme.id;
	document.documentElement.dataset.themeMode = theme.mode;
	/*
	 * Publish the active id on the reactive global store — the single source
	 * of truth every theme UI (top-bar dropdown, settings select) renders
	 * from, so they can never drift out of sync. The store drops identical
	 * writes without notifying, so this can't feed back into a render loop.
	 */
	globalState.set({
		theme: theme.id,
	});
	/*
	 * Announce so themed components hot-swap their per-component theme
	 * sub-modules (core/environment/themeStyles.js). Fires AFTER the attribute
	 * flip — and, on the swap path, after the global token sheet has loaded —
	 * so a listener reading documentElement.dataset.theme sees the new id and the
	 * tokens are already live when component rules swap.
	 */
	emitDelegate('theme:change', {
		id: theme.id,
		mode: theme.mode,
	});
}
/* Swap the theme <link> without a flash. Insert the NEW sheet immediately after
 * the old one and wait for it to LOAD — so its rules are live — BEFORE removing
 * the old. The two sheets overlap for that interval and the new wins by cascade
 * order, so the page never drops to the unstyled base for a frame (the white
 * flash on a first, uncached switch — mutating one link's href instead removes
 * the old rules before the new file has arrived). Settles on load OR error so a
 * missing theme file can't strand the page with the old sheet already gone. The
 * new link carries the old one's id so the next swap still finds it. */
function swapStylesheet(oldLink, nextHref) {
	return new Promise((resolve) => {
		const nextLink = document.createElement('link');
		nextLink.rel = 'stylesheet';
		nextLink.id = oldLink.id;
		nextLink.href = nextHref;
		function settle() {
			oldLink.remove();
			resolve();
		}
		nextLink.onload = settle;
		nextLink.onerror = settle;
		oldLink.after(nextLink);
	});
}
async function swapToTheme(theme) {
	const link = activeThemeLink();
	if (link) {
		const nextHref = new URL(theme.href ?? themeHrefFor(link.href, theme.id), document.baseURI).href;
		if (nextHref !== link.href) {
			await swapStylesheet(link, nextHref);
		}
	}
	applyThemeAttributes(theme);
}
/*
 * Swaps are serialized through this chain: a rapid second switch queues behind
 * the in-flight one instead of racing it (two concurrent swaps would both find
 * the same overlap links and leave duplicates behind). The chain continues on
 * rejection so one failed swap can never brick theme switching.
 */
let pendingSwap = Promise.resolve();
/**
 * Switch the active theme without a flash and persist the choice. The new
 * sheet loads while the old stays applied, then the old is removed, so the
 * page never shows the unstyled base for a frame — even on a first (uncached)
 * switch. The `data-theme`/`-mode` attributes flip once the sheet is live, so
 * the flag and its colour vars agree.
 * @param {string} id - The theme id to activate; an unknown id falls back to DEFAULT_THEME.
 * @returns {Promise<void>} Resolves once this switch is fully applied.
 */
export function setTheme(id) {
	const theme = THEMES.get(id) ?? THEMES.get(DEFAULT_THEME);
	localStorage.setItem('theme.mode', theme.id);
	function run() {
		return swapToTheme(theme);
	}
	pendingSwap = pendingSwap.then(run, run);
	return pendingSwap;
}
export function getTheme() {
	const stored = localStorage.getItem('theme.mode');
	// Only honour stored value when it points at a known theme — guards
	// against typos, leftover ids from removed themes, or any other
	// garbage that would otherwise let `setTheme(<invalid>)` collapse
	// silently and leave the DOM on whatever paint came before.
	if (stored && THEMES.has(stored)) {
		return stored;
	}
	return DEFAULT_THEME;
}
// Apply saved theme on load
await setTheme(getTheme());
