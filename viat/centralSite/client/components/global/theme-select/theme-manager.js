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
 * Resolution of that fallback does NOT write `theme.mode` — only an explicit
 * `setTheme(id)` (user pick / profile apply) persists. An unset key stays
 * unset, so a later default change is still visible to first-visit users.
 * Existing keys written by the old boot path cannot be distinguished from a
 * real choice; there is no migration. A consumer blocking script that seeded
 * `theme.mode` before this module loaded is no longer required.
 * This module is the SINGLE owner of theme boot AND of the theme <link>
 * element itself: the top-level `setTheme(getTheme(), { persist: false })`
 * below creates the sheet if the page has none, then applies the resolved
 * theme (link swap + dataset attributes) at module load — no inline HTML
 * script and no hand-written <link> involved. A page only has to IMPORT this
 * module. The body is empty until components mount, so the default sheet
 * never paints content.
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
/*
 * The managed sheet is tagged with `data-uwc-id="theme"`. The attribute is the
 * contract — not the element's `id` (which a page may already be using for its
 * own purposes) and emphatically not the href shape.
 */
const THEME_LINK_ID = 'theme';
const THEME_LINK_SELECTOR = `link[data-uwc-id="${THEME_LINK_ID}"]`;
/*
 * Parsed theme sheets stay in <head> disabled. A later switch re-enables the
 * cached link instead of tearing down and re-parsing the file — the lag on
 * Forms/Charts is style recalc over hundreds of shadow roots, and a second
 * parse+insert doubled it. Identity (`data-uwc-id`) still lives on exactly
 * one link at a time; parked sheets keep their href and drop the id.
 */
const sheetByHref = new Map();
function rememberSheet(link) {
	const href = link?.href;
	if (href) {
		sheetByHref.set(href, link);
	}
}
function cachedSheet(href) {
	const link = sheetByHref.get(href);
	if (link?.isConnected) {
		return link;
	}
	return null;
}
function parkSheet(link) {
	if (!link) {
		return;
	}
	link.removeAttribute('data-uwc-id');
	link.disabled = true;
	rememberSheet(link);
}
function ownSheet(link) {
	link.disabled = false;
	link.dataset.uwcId = THEME_LINK_ID;
	rememberSheet(link);
}
/*
 * Theme hrefs resolve against THIS MODULE's url — never the page url and never
 * an existing <link>. Pages sit at different depths (/, /preview/, /perf/,
 * /shootout/), so a document-relative path resolves differently on each one;
 * import.meta.url is the same everywhere. A registered theme's own `href`
 * resolves by the same rule, so one path convention covers built-ins and
 * runtime-registered themes alike (an absolute href is unaffected).
 */
function themeHref(theme) {
	return new URL(theme.href ?? `../../../styles/themes/${theme.id}.css`, import.meta.url).href;
}
/*
 * Find the managed sheet by its attribute, and CREATE it when absent — so
 * theming never depends on the page shipping a hand-written theme <link>.
 *
 * The old approach selected `link[href*="themes/"]`, which failed in exactly
 * the case that matters: with no such tag, swapToTheme found nothing, skipped
 * the stylesheet entirely, and left the page on base tokens while still
 * flipping the data-theme attributes — themed in name only. Matching on an
 * href shape also meant any unrelated sheet living under a `themes/` path
 * could be hijacked as the theme link.
 */
function ensureThemeLink() {
	const owned = document.querySelector(THEME_LINK_SELECTOR);
	if (owned) {
		return owned;
	}
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.dataset.uwcId = THEME_LINK_ID;
	document.head.append(link);
	return link;
}
/*
 * First paint for a link this module just created: there is no old sheet to
 * overlap with, so point it at the href and wait for it to land. Settles on
 * load OR error so a missing theme file cannot strand boot forever.
 */
function loadStylesheet(link, href) {
	return new Promise((resolve) => {
		function settle() {
			link.onload = null;
			link.onerror = null;
			resolve();
		}
		link.onload = settle;
		link.onerror = settle;
		link.href = href;
	});
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
 * missing theme file can't strand the page with the old sheet already gone.
 *
 * Identity TRANSFERS to the incoming link rather than being duplicated onto it.
 * Both moves happen in one synchronous step, so exactly one element carries
 * data-uwc-id at every observable moment — never two, never zero. That matters
 * because the attribute is the lookup key: the outgoing link is earlier in
 * document order, so if both carried it, ensureThemeLink's querySelector would
 * return the sheet that is about to be parked. */
function settleSwap(oldLink, nextLink, accept) {
	nextLink.onload = null;
	nextLink.onerror = null;
	ownSheet(nextLink);
	if (oldLink !== nextLink) {
		parkSheet(oldLink);
	}
	accept();
}
function swapStylesheet(oldLink, nextHref) {
	const cached = cachedSheet(nextHref);
	if (cached && cached !== oldLink) {
		oldLink.after(cached);
		ownSheet(cached);
		parkSheet(oldLink);
		return Promise.resolve();
	}
	return new Promise((accept) => {
		const nextLink = document.createElement('link');
		nextLink.rel = 'stylesheet';
		nextLink.href = nextHref;
		function settle() {
			settleSwap(oldLink, nextLink, accept);
		}
		nextLink.onload = settle;
		nextLink.onerror = settle;
		oldLink.removeAttribute('data-uwc-id');
		nextLink.dataset.uwcId = THEME_LINK_ID;
		oldLink.after(nextLink);
	});
}
/*
 * Warm every LIVE component's per-theme sub-module before anything flips.
 *
 * The global token sheet was already load-before-swap, but component theme
 * sheets were fetched only in reaction to `theme:change` — i.e. AFTER the
 * attribute flip. That left a window painting the NEW tokens against the OLD
 * component rules, which is the flash. Components enlist a promise on the event
 * (the ExtendableEvent.waitUntil shape) so this can await all of them; their
 * later adoption then resolves from the URL-keyed style cache in the same task.
 *
 * Failures are swallowed on purpose: a component that cannot preload must not
 * strand the switch, it just adopts a frame late as it did before.
 */
async function preloadComponentThemes(theme) {
	const pending = [];
	emitDelegate('theme:preload', {
		id: theme.id,
		pending,
	});
	if (pending.length === 0) {
		return;
	}
	await Promise.allSettled(pending);
}
async function swapToTheme(theme) {
	const link = ensureThemeLink();
	rememberSheet(link);
	const nextHref = themeHref(theme);
	/*
	 * An empty href means this link was just created, so there is nothing to
	 * cross-fade against — load it directly. Otherwise overlap the two sheets
	 * so the page never drops to unstyled base for a frame.
	 */
	if (!link.href) {
		await loadStylesheet(link, nextHref);
	} else if (link.href !== nextHref) {
		await swapStylesheet(link, nextHref);
	}
	/* Global tokens are live but still parked behind the old sheet's cascade —
	   warm the component sheets BEFORE the attribute flip announces the change. */
	await preloadComponentThemes(theme);
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
 * Switch the active theme without a flash. Persists `theme.mode` unless
 * `{ persist: false }` — boot uses that so resolving the midnight fallback
 * cannot masquerade as a user choice.
 * @param {string} id - The theme id to activate; an unknown id falls back to DEFAULT_THEME.
 * @param {{ persist?: boolean }} [options] - `persist: false` applies without writing storage.
 * @returns {Promise<void>} Resolves once this switch is fully applied.
 */
export function setTheme(id, options) {
	const theme = THEMES.get(id) ?? THEMES.get(DEFAULT_THEME);
	if (options?.persist !== false) {
		localStorage.setItem('theme.mode', theme.id);
	}
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
// Apply the resolved theme on load without writing a fallback as a choice.
await setTheme(getTheme(), {
	persist: false,
});
