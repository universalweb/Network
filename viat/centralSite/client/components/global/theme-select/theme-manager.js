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
/* Swap one theme <link> without a flash. Insert the NEW sheet immediately after
 * the old one and wait for it to LOAD — so its rules are live — BEFORE removing
 * the old. The two sheets overlap for that interval and the new wins by cascade
 * order, so the page never drops to the unstyled base for a frame (the white
 * flash on a first, uncached switch — mutating one link's href instead removes
 * the old rules before the new file has arrived). Resolves on load OR error so a
 * missing theme file can't strand the page with the old sheet already gone. The
 * new link inherits the old one's id so the next swap still finds it. */
function swapStylesheet(oldLink, nextHref) {
	return new Promise((resolve) => {
		const nextLink = document.createElement('link');
		nextLink.rel = 'stylesheet';
		nextLink.href = nextHref;
		function settle() {
			if (oldLink.id) {
				nextLink.id = oldLink.id;
			}
			oldLink.remove();
			resolve();
		}
		nextLink.addEventListener('load', settle, {
			once: true,
		});
		nextLink.addEventListener('error', settle, {
			once: true,
		});
		oldLink.insertAdjacentElement('afterend', nextLink);
	});
}
/**
 * Switch the active theme without a flash. Each theme <link> is swapped via
 * `swapStylesheet` — the new sheet loads while the old stays applied, then the
 * old is removed — so the page never shows the unstyled base for a frame, even
 * on a first (uncached) switch. The `data-theme`/`-mode` attributes flip once
 * every new sheet is live, so the flag and its colour vars agree.
 * @param {string} id - The theme id to activate; an unknown id falls back to DEFAULT_THEME.
 */
export function setTheme(id) {
	const theme = findTheme(id) ?? findTheme(DEFAULT_THEME);
	if (!theme) {
		return;
	}
	localStorage.setItem('theme.mode', theme.id);
	const links = [...document.querySelectorAll('link[rel="stylesheet"][href*="themes/"]')];
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
	const swaps = targets.map((target) => {
		return swapStylesheet(target.link, target.href);
	});
	Promise.all(swaps).then(() => {
		applyThemeAttributes(theme);
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
