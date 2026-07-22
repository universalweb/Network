import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * <ui-collection> component wiring — proves the reparent foundation on the real
 * element: the engine's client-side filter drives visible rows through the
 * filter() spot, a reactive filterArg re-filters WITHOUT reloading, showBar
 * suppresses the chrome, and the empty gate reads the filtered (not raw) count.
 * Register happy-dom, stub the stylesheet fetch, and swap in a no-op IO (the
 * engine arms a sentinel in 'both' mode) BEFORE the component graph loads.
 */
GlobalRegistrator.register();
async function emptyStylesheetText() {
	return '';
}
function stubbedFetch() {
	return Promise.resolve({
		ok: true,
		status: 200,
		text: emptyStylesheetText,
	});
}
globalThis.fetch = stubbedFetch;
let observerCount = 0;
class NoopIntersectionObserver {
	constructor(callback) {
		this.callback = callback;
		observerCount += 1;
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.IntersectionObserver = NoopIntersectionObserver;
const {
	html, WebComponent,
} = await import('../../../core/index.js');
const {
	COLLECTION_EVENT, UICollection,
} = await import('../ui-collection.js');
function rowMarkup(item) {
	return html`<div class="tst-row" data-id=${item.id}>${item.label}</div>`;
}
function keepByTag(item, tag) {
	return tag === 'all' || item.tag === tag;
}
function onePage(items) {
	return async function loader() {
		return {
			items,
			nextCursor: null,
			hasMore: false,
		};
	};
}
async function settle() {
	for (let index = 0; index < 5; index += 1) {
		await new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
		await Promise.resolve();
	}
}
async function mount(state) {
	// Ctor-arg state MERGES onto static defaults (items/itemsConfig/itemsStatus);
	// `element.state = obj` would replaceState wholesale and wipe them.
	const element = new UICollection(state);
	document.body.append(element);
	await element.pendingConnect;
	await settle();
	return element;
}
function rowCount(element) {
	return element.shadowRoot.querySelectorAll('.tst-row').length;
}
test('filter: rows render, and a reactive filterArg re-filters client-side with NO reload', async () => {
	let loadCount = 0;
	const items = [
		{
			id: 'a',
			tag: 'in',
			label: 'A',
		},
		{
			id: 'b',
			tag: 'out',
			label: 'B',
		},
		{
			id: 'c',
			tag: 'in',
			label: 'C',
		},
	];
	const element = await mount({
		loader: async function loader() {
			loadCount += 1;
			return {
				items,
				nextCursor: null,
				hasMore: false,
			};
		},
		renderRow: rowMarkup,
		filter: keepByTag,
		filterArg: 'all',
		showBar: false,
		pagingStyle: 'loadmore',
	});
	assert.equal(rowCount(element), 3, 'all rows visible under the "all" tag');
	element.state.filterArg = 'in';
	await settle();
	assert.equal(rowCount(element), 2, 'filterArg="in" drops the single "out" row');
	assert.equal(loadCount, 1, 're-filter reused the loaded window — no reload');
	element.remove();
});
test('showBar: false hides the meta/controls bar; default shows it', async () => {
	const hidden = await mount({
		loader: onePage([]),
		renderRow: rowMarkup,
		showBar: false,
		pagingStyle: 'loadmore',
	});
	assert.ok(hidden.shadowRoot.querySelector('.pl-bar').hasAttribute('hidden'), 'bar hidden when showBar=false');
	hidden.remove();
	const shown = await mount({
		loader: onePage([]),
		renderRow: rowMarkup,
		pagingStyle: 'loadmore',
	});
	assert.ok(!shown.shadowRoot.querySelector('.pl-bar').hasAttribute('hidden'), 'bar shown by default (showBar=true)');
	shown.remove();
});
test('empty gate: a filtered-to-empty view still surfaces the empty message', async () => {
	const element = await mount({
		loader: onePage([
			{
				id: 'a',
				tag: 'in',
				label: 'A',
			},
		]),
		renderRow: rowMarkup,
		filter: keepByTag,
		filterArg: 'all',
		showBar: false,
		pagingStyle: 'loadmore',
		emptyMessage: 'Nothing matches',
	});
	const empty = element.shadowRoot.querySelector('.pl-empty');
	assert.ok(empty.hasAttribute('hidden'), 'empty hidden while a row is visible');
	element.state.filterArg = 'out';
	await settle();
	assert.equal(rowCount(element), 0, 'no loaded item carries the "out" tag');
	assert.ok(!empty.hasAttribute('hidden'), 'filtered-to-empty (raw items > 0) reveals the empty message');
	element.remove();
});
test('button mode: no sentinel/auto-fill, manual load-more, then an end-of-results marker', async () => {
	const pages = [
		[
			{
				id: 'a',
				label: 'A',
			},
			{
				id: 'b',
				label: 'B',
			},
		],
		[
			{
				id: 'c',
				label: 'C',
			},
		],
	];
	let loadCount = 0;
	const before = observerCount;
	const element = await mount({
		loader: async function loader({
			reset, cursor,
		}) {
			loadCount += 1;
			const page = reset || cursor == null ? 1 : cursor;
			return {
				items: pages[page - 1] ?? [],
				nextCursor: page + 1,
				hasMore: page < pages.length,
			};
		},
		renderRow: rowMarkup,
		pagingStyle: 'button',
		showBar: false,
	});
	assert.equal(observerCount, before, 'button mode arms NO IntersectionObserver (no scroll auto-load)');
	assert.equal(rowCount(element), 2, 'initial load = page 1 only');
	assert.equal(loadCount, 1, 'button mode does not auto-fill the viewport');
	const button = element.shadowRoot.querySelector('.pl-loadmore');
	const endMarker = element.shadowRoot.querySelector('.pl-end');
	assert.ok(!button.hasAttribute('hidden'), 'LOAD MORE shown while a next page exists');
	assert.ok(endMarker.hasAttribute('hidden'), 'no end-of-results marker while more remains');
	element.handleLoadMore();
	await settle();
	assert.equal(rowCount(element), 3, 'manual load-more appended page 2');
	assert.ok(button.hasAttribute('hidden'), 'LOAD MORE hidden once exhausted');
	assert.ok(!endMarker.hasAttribute('hidden'), 'end-of-results marker shown when no more pages');
	element.remove();
});
/*
 * Host → collection control channel. The host emits COLLECTION_EVENT on ITSELF
 * and the mounted <ui-collection> reacts, because the collection listens on its
 * parent host rather than the host reaching in through a ref. These tests mount
 * a real host component so `parentComponent` resolves (the `mount` helper above
 * appends straight to body, where there is no host to listen on).
 */
let hostSeq = 0;
let hostLoadCount = 0;
const PAGED_ITEMS = [
	{
		id: 'a',
		label: 'A',
	},
	{
		id: 'b',
		label: 'B',
	},
];
async function hostLoader({
	reset, cursor,
}) {
	hostLoadCount += 1;
	const page = reset ? 1 : (cursor ?? 1);
	return {
		items: PAGED_ITEMS,
		nextCursor: page < 3 ? page + 1 : null,
		hasMore: page < 3,
		totalCount: 6,
	};
}
async function mountHost(pagingStyle) {
	const tag = `uc-host-${hostSeq++}`;
	class CollectionHost extends WebComponent {
		listConfig = {
			loader: hostLoader,
			renderRow: rowMarkup,
			pagingStyle,
			showBar: false,
		};
		render() {
			this.html`<ui-collection .state=${this.listConfig} #list></ui-collection>`;
		}
	}
	customElements.define(tag, CollectionHost);
	const host = document.createElement(tag);
	document.body.append(host);
	await host.pendingConnect;
	await host.lifecycle.whenRendered;
	await settle();
	return host;
}
test('host emits collection:refresh — the mounted collection reloads, no ref involved', async () => {
	hostLoadCount = 0;
	const host = await mountHost('loadmore');
	assert.equal(rowCount(host.getChild('ui-collection')), 2, 'the collection rendered its first page');
	const loadsAfterMount = hostLoadCount;
	assert.ok(loadsAfterMount > 0, 'the mount auto-load ran');
	host.emit(COLLECTION_EVENT.REFRESH);
	await settle();
	assert.ok(hostLoadCount > loadsAfterMount, 'the emitted event drove a reload through the host listener');
	host.remove();
});
test('host emits collection:goToPage with a page number — the collection jumps to it', async () => {
	const host = await mountHost('paged');
	const collection = host.getChild('ui-collection');
	assert.equal(collection.state.itemsStatus.page, 1, 'starts on page 1');
	host.emit(COLLECTION_EVENT.GO_TO_PAGE, 3);
	await settle();
	assert.equal(collection.state.itemsStatus.page, 3, 'the page number rode the event detail');
	host.remove();
});
test('the collection stops listening once disconnected — a later host emit is inert', async () => {
	const host = await mountHost('loadmore');
	const collection = host.getChild('ui-collection');
	collection.remove();
	await settle();
	const loadsAfterRemoval = hostLoadCount;
	host.emit(COLLECTION_EVENT.REFRESH);
	await settle();
	assert.equal(hostLoadCount, loadsAfterRemoval, 'a disconnected collection released its host listener');
	host.remove();
});
