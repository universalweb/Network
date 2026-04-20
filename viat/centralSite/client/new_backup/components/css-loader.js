const cache = new Map();
export async function loadSheet(url) {
	const key = String(url);
	if (cache.has(key)) {
		return cache.get(key);
	}
	const sheet = new CSSStyleSheet();
	const request = await fetch(url);
	if (request.ok) {
		const results = await request.text();
		sheet.replaceSync(results);
		cache.set(key, sheet);
	} else {
		console.warn(`Failed to load stylesheet: ${url} (status: ${request.status})`);
	}
	return sheet;
}
