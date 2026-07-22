import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * css-loader single-cache contract (tk:23 style-cache hardening):
 *   - a successful load is cached (one fetch across repeat + concurrent calls),
 *   - a fetch REJECTION does not poison — a later call retries and can succeed
 *     (the old sheetCache cached the rejected promise forever),
 *   - a non-ok RESPONSE likewise evicts so a later call retries,
 *   - concurrent first-load calls share a single in-flight fetch.
 * happy-dom provides CSSStyleSheet + replaceSync; fetch is stubbed per test.
 */
GlobalRegistrator.register();
const { loadSheet } = await import('../css-loader.js');
let fetchCalls = 0;
function okResponse(cssText) {
	return {
		ok: true,
		status: 200,
		text() {
			return Promise.resolve(cssText);
		},
	};
}
beforeEach(() => {
	fetchCalls = 0;
});
afterEach(() => {
	delete globalThis.fetch;
});
test('a successful load caches — repeat calls do not re-fetch', async () => {
	globalThis.fetch = function stubFetch() {
		fetchCalls += 1;
		return Promise.resolve(okResponse('.ok{color:red}'));
	};
	const url = 'https://example.test/a.css';
	const first = await loadSheet(url);
	const second = await loadSheet(url);
	assert.equal(fetchCalls, 1, 'second call served from cache');
	assert.equal(first, second, 'same cached sheet instance');
});
test('a fetch rejection does not poison — a later call retries and succeeds', async () => {
	let shouldFail = true;
	globalThis.fetch = function stubFetch() {
		fetchCalls += 1;
		if (shouldFail) {
			return Promise.reject(new Error('offline'));
		}
		return Promise.resolve(okResponse('.recovered{color:green}'));
	};
	const url = 'https://example.test/flaky.css';
	const failed = await loadSheet(url);
	assert.ok(failed instanceof CSSStyleSheet, 'failure degrades to an empty sheet, not a throw');
	assert.equal(failed.cssRules.length, 0, 'empty sheet on failure');
	shouldFail = false;
	const recovered = await loadSheet(url);
	assert.equal(fetchCalls, 2, 'the failed entry was evicted and re-fetched');
	assert.ok(recovered.cssRules.length > 0, 'retry loaded the real sheet');
});
test('a non-ok response evicts so a later call retries', async () => {
	let status = 404;
	globalThis.fetch = function stubFetch() {
		fetchCalls += 1;
		if (status === 404) {
			return Promise.resolve({
				ok: false,
				status: 404,
				text() {
					return Promise.resolve('');
				},
			});
		}
		return Promise.resolve(okResponse('.late{color:blue}'));
	};
	const url = 'https://example.test/missing.css';
	await loadSheet(url);
	status = 200;
	const retried = await loadSheet(url);
	assert.equal(fetchCalls, 2, 'non-ok did not poison the cache');
	assert.ok(retried.cssRules.length > 0, 'retry loaded the now-present sheet');
});
test('concurrent first-load calls share a single in-flight fetch', async () => {
	globalThis.fetch = function stubFetch() {
		fetchCalls += 1;
		return new Promise((resolve) => {
			setImmediate(() => {
				resolve(okResponse('.shared{color:teal}'));
			});
		});
	};
	const url = 'https://example.test/concurrent.css';
	const [
		left,
		right,
	] = await Promise.all([
		loadSheet(url),
		loadSheet(url),
	]);
	assert.equal(fetchCalls, 1, 'both callers shared one in-flight fetch');
	assert.equal(left, right, 'both received the same sheet');
});
