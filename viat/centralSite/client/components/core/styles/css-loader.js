/*
 * Single robust stylesheet-fetch cache. Keyed by resolved URL; the value is the
 * IN-FLIGHT promise (set before the await), so N components of the same class
 * booting concurrently share ONE fetch instead of racing N. A load NEVER
 * rejects — a fetch throw or a non-ok response degrades to an empty sheet
 * (styling absent, not broken) AND evicts the key, so the failure is transient:
 * the next boot re-fetches instead of being permanently poisoned by a cached
 * rejection. Only a successful load stays cached. styleApi.js delegates its
 * metaUrl path straight here (no second cache layer) precisely because this one
 * is both in-flight-dedup'd and retry-safe.
 */
const cache = new Map();
function onFetchError() {
	/*
	 * fetch() itself threw (offline / DNS / abort) — not a bad HTTP status. The
	 * never-reject boundary: convert to null so fetchSheet degrades gracefully
	 * and the caller (a component's style pipeline) stays up.
	 */
	return null;
}
async function fetchSheet(key) {
	const sheet = new CSSStyleSheet();
	const response = await fetch(key).then(undefined, onFetchError);
	if (response && response.ok) {
		sheet.replaceSync(await response.text());
		return sheet;
	}
	/*
	 * Missing/failed: evict this in-flight entry so a later boot retries rather
	 * than inheriting a cached empty/poisoned result. Concurrent awaiters still
	 * get this empty sheet (graceful) — only the NEXT call re-fetches.
	 */
	if (response) {
		console.warn(`Failed to load stylesheet: ${key} (status: ${response.status})`);
	}
	cache.delete(key);
	return sheet;
}
export function loadSheet(url) {
	const key = String(url);
	const cached = cache.get(key);
	if (cached) {
		return cached;
	}
	const request = fetchSheet(key);
	cache.set(key, request);
	return request;
}
