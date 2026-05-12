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
	const theme = findTheme(id);
	if (!theme) {
		return;
	}
	document.querySelectorAll('link[href*="themes/"]').forEach((link) => {
		link.href = link.href.replace(/[^/]+\.css(\?.*)?$/, `${id}.css`);
	});
	document.documentElement.dataset.theme = id;
	document.documentElement.dataset.themeMode = theme.mode;
	localStorage.setItem('theme.mode', id);
}
export function getTheme() {
	return localStorage.getItem('theme.mode') ?? 'midnight';
}
export function isDarkTheme(id = getTheme()) {
	return findTheme(id)?.mode === 'dark';
}
// Apply saved theme on load
setTheme(getTheme());
