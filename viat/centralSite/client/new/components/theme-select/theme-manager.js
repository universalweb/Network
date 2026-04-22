export const THEMES = [
	{
		id: 'midnight',
		label: 'Midnight',
	},
	{
		id: 'dark',
		label: 'Dark',
	},
	{
		id: 'noir',
		label: 'Noir',
	},
	{
		id: 'marathon',
		label: 'Marathon',
	},
];
function themeLink() {
	return document.querySelector('link[rel="stylesheet"][href*="themes/"]');
}
export function setTheme(id) {
	if (!THEMES.find((t) => {
		return t.id === id;
	})) {
		return;
	}
	const links = document.querySelectorAll('link[href*="themes/"]');
	for (const link of links) {
		link.href = link.href.replace(/[^/]+\.css(\?.*)?$/, `${id}.css`);
	}
	localStorage.setItem('theme.mode', id);
}
export function getTheme() {
	return localStorage.getItem('theme.mode') ?? 'midnight';
}
// Apply saved theme on load
setTheme(getTheme());
