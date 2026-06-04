// Midnight is the canonical default. Other themes are opt-in via the
// settings selector; an unknown / stale theme id in localStorage falls
// back to midnight rather than silently sticking with the last valid
// paint.
export const DEFAULT_THEME = 'midnight';
export const THEMES = [
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
];
function findTheme(id) {
	return THEMES.find((entry) => {
		return entry.id === id;
	});
}
function themeHrefFor(currentHref, themeId) {
	return currentHref.replace(/[^/]+\.css(\?.*)?$/, `${themeId}.css`);
}
function applyThemeAttributes(theme) {
	document.documentElement.dataset.theme = theme.id;
	document.documentElement.dataset.themeMode = theme.mode;
}
/* Fetch + parse the target sheet WITHOUT applying it, so the later href swap is
 * a cache hit. Resolves on load or error (a missing theme file must not stall the
 * switch). The listener is the resolver itself — no wrapper closure. */
function preloadStylesheet(href) {
	return new Promise((resolve) => {
		const probe = document.createElement('link');
		probe.rel = 'preload';
		probe.as = 'style';
		probe.href = href;
		probe.addEventListener('load', resolve, {
			once: true,
		});
		probe.addEventListener('error', resolve, {
			once: true,
		});
		document.head.appendChild(probe);
	});
}
function commitThemeSwap(targets, theme) {
	for (let index = 0; index < targets.length; index++) {
		targets[index].link.href = targets[index].href;
	}
	applyThemeAttributes(theme);
}
/**
 * Switch the active theme seamlessly. The flash came from flipping
 * `data-theme`/`-mode` synchronously while the linked theme file loaded async —
 * a frame with the new mode but the old (or no) color vars. Fix: preload every
 * target sheet, then commit the `href` swaps and the `data-*` writes together in
 * a single `requestAnimationFrame` so the mode flag and its vars land in one paint.
 * @param {string} id - The theme id to activate; an unknown id falls back to DEFAULT_THEME.
 */
export function setTheme(id) {
	const theme = findTheme(id) ?? findTheme(DEFAULT_THEME);
	if (!theme) {
		return;
	}
	localStorage.setItem('theme.mode', theme.id);
	const links = [...document.querySelectorAll('link[href*="themes/"]')];
	const targets = [];
	for (let index = 0; index < links.length; index++) {
		const link = links[index];
		const href = themeHrefFor(link.href, theme.id);
		if (href !== link.href) {
			targets.push({
				link,
				href,
			});
		}
	}
	if (!targets.length) {
		applyThemeAttributes(theme);
		return;
	}
	const preloads = targets.map((target) => {
		return preloadStylesheet(target.href);
	});
	Promise.all(preloads).then(() => {
		requestAnimationFrame(() => {
			commitThemeSwap(targets, theme);
		});
	});
}
export function getTheme() {
	const stored = localStorage.getItem('theme.mode');
	// Only honour stored value when it points at a known theme — guards
	// against typos, leftover ids from removed themes, or any other
	// garbage that would otherwise let `setTheme(<invalid>)` collapse
	// silently and leave the DOM on whatever paint came before.
	if (stored && findTheme(stored)) {
		return stored;
	}
	return DEFAULT_THEME;
}
export function isDarkTheme(id = getTheme()) {
	return findTheme(id)?.mode === 'dark';
}
// Apply saved theme on load
setTheme(getTheme());
