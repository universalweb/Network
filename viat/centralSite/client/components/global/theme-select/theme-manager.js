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
export function setTheme(id) {
	const theme = findTheme(id) ?? findTheme(DEFAULT_THEME);
	if (!theme) {
		return;
	}
	document.querySelectorAll('link[href*="themes/"]').forEach((link) => {
		link.href = link.href.replace(/[^/]+\.css(\?.*)?$/, `${theme.id}.css`);
	});
	document.documentElement.dataset.theme = theme.id;
	document.documentElement.dataset.themeMode = theme.mode;
	localStorage.setItem('theme.mode', theme.id);
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
