import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * The engine reads DOM globals (IntersectionObserver, getComputedStyle) at
 * attach time — register happy-dom, then swap in a controllable fake IO
 * BEFORE the dynamic import so every observer the engine creates is ours.
 */
GlobalRegistrator.register();
const observers = [];
class FakeIntersectionObserver {
	constructor(callback, options) {
		this.callback = callback;
		this.options = options ?? {};
		this.observed = [];
		this.unobserveCalls = [];
		this.disconnected = false;
		observers.push(this);
	}
	observe(element) {
		this.observed.push(element);
	}
	unobserve(element) {
		this.unobserveCalls.push(element);
	}
	disconnect() {
		this.disconnected = true;
	}
	fire(element, isIntersecting) {
		this.callback([
			{
				target: element,
				isIntersecting,
			},
		], this);
	}
}
globalThis.IntersectionObserver = FakeIntersectionObserver;
const { CollectionEngine } = await import('../collectionEngine.js');
function makeHost() {
	return {
		state: {},
		events: [],
		emit(eventName, data) {
			this.events.push({
				eventName,
				data,
			});
		},
	};
}
function makeSentinel() {
	const sentinel = document.createElement('div');
	document.body.append(sentinel);
	return sentinel;
}
function eventNames(host) {
	return host.events.map(pluckEventName);
}
function pluckEventName(record) {
	return record.eventName;
}
async function settleFrame() {
	await new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
	await Promise.resolve();
}
function pageLoader(pages) {
	return async function loader({
		reset, cursor,
	}) {
		const page = reset || cursor == null ? 1 : cursor;
		const items = pages[page - 1] ?? [];
		return {
			items,
			nextCursor: page + 1,
			hasMore: page < pages.length,
			totalCount: pages.flat().length,
		};
	};
}
test('initial attach auto-loads page 1 and writes items + status scope', async () => {
	const host = makeHost();
	const loaderCalls = [];
	const engine = CollectionEngine.create(host, {
		key: 'items',
		mode: 'button',
		loader: async function loader(options) {
			loaderCalls.push({
				reset: options.reset,
				cursor: options.cursor,
			});
			return {
				items: [
					{
						id: 'a',
					}, {
						id: 'b',
					},
				],
				nextCursor: 2,
				hasMore: true,
				totalCount: 9,
			};
		},
	});
	assert.deepEqual(host.state.itemsStatus.loading, false, 'status scope seeded at create');
	engine.attach({});
	await settleFrame();
	assert.deepEqual(loaderCalls, [
		{
			reset: true,
			cursor: null,
		},
	]);
	assert.equal(host.state.items.length, 2);
	const status = host.state.itemsStatus;
	assert.equal(status.loading, false);
	assert.equal(status.hasMore, true);
	assert.equal(status.exhausted, false);
	assert.equal(status.started, true);
	assert.equal(status.page, 1);
	assert.equal(status.totalCount, 9, 'totalCount captured in the engine on replace');
	assert.deepEqual(eventNames(host), ['items:loading', 'items:loaded']);
	engine.dispose();
});
test('dedupe: overlapping pages and prepend never double-render', async () => {
	const host = makeHost();
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		loader: pageLoader([
			[
				{
					id: 'a',
				}, {
					id: 'b',
				},
			],
			[
				{
					id: 'b',
				}, {
					id: 'c',
				},
			],
		]),
	});
	engine.attach({});
	await settleFrame();
	await engine.loadMore();
	assert.deepEqual(host.state.items.map(pluckId), [
		'a', 'b', 'c',
	]);
	engine.prepend({
		id: 'a',
	});
	assert.equal(host.state.items.length, 3, 'seen prepend dropped');
	engine.prepend({
		id: 'fresh',
	});
	assert.deepEqual(host.state.items.map(pluckId), [
		'fresh', 'a', 'b', 'c',
	]);
	engine.dispose();
});
function pluckId(item) {
	return item.id;
}
test('supersede: a stale slow response never clobbers a newer one', async () => {
	const host = makeHost();
	let resolveSlow = null;
	let callIndex = 0;
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		auto: false,
		loader: function loader() {
			callIndex += 1;
			if (callIndex === 1) {
				return new Promise((resolve) => {
					resolveSlow = resolve;
				});
			}
			return Promise.resolve({
				items: [
					{
						id: 'fresh',
					},
				],
				nextCursor: null,
				hasMore: false,
			});
		},
	});
	engine.attach({});
	const slowLoad = engine.start();
	/* Force a competing reset while the first request hangs. */
	engine.writeStatus({
		loading: false,
	});
	await engine.reset();
	resolveSlow({
		items: [
			{
				id: 'stale',
			},
		],
		nextCursor: 9,
		hasMore: true,
	});
	await slowLoad;
	assert.deepEqual(host.state.items.map(pluckId), ['fresh'], 'stale result dropped by loadToken');
	assert.equal(host.state.itemsStatus.hasMore, false);
	engine.dispose();
});
test('abort: a reset mid-flight aborts the previous request signal', async () => {
	const host = makeHost();
	const signals = [];
	let resolveFirst = null;
	let callIndex = 0;
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		auto: false,
		loader: function loader({ signal }) {
			signals.push(signal);
			callIndex += 1;
			if (callIndex === 1) {
				return new Promise((resolve) => {
					resolveFirst = resolve;
				});
			}
			return Promise.resolve({
				items: [],
				nextCursor: null,
				hasMore: false,
			});
		},
	});
	engine.attach({});
	engine.start();
	engine.writeStatus({
		loading: false,
	});
	await engine.reset();
	assert.equal(signals[0].aborted, true, 'first request signal aborted by the superseding load');
	assert.equal(signals[1].aborted, false);
	resolveFirst(null);
	engine.dispose();
});
test('paged semantics: gotoPage replaces, goPrev floors, goNext guards on hasMore', async () => {
	const host = makeHost();
	const engine = CollectionEngine.create(host, {
		mode: 'paged',
		loader: pageLoader([
			[
				{
					id: 'p1',
				},
			],
			[
				{
					id: 'p2',
				},
			],
			[
				{
					id: 'p3',
				},
			],
		]),
	});
	engine.attach({});
	await settleFrame();
	await engine.gotoPage(2);
	assert.deepEqual(host.state.items.map(pluckId), ['p2'], 'goto REPLACES the window');
	assert.equal(host.state.itemsStatus.page, 2);
	assert.equal(host.state.itemsStatus.hasPrev, true);
	await engine.goNext();
	assert.equal(host.state.itemsStatus.page, 3);
	assert.equal(host.state.itemsStatus.hasMore, false);
	await engine.goNext();
	assert.equal(host.state.itemsStatus.page, 3, 'goNext no-ops at the last page');
	await engine.goPrev();
	await engine.goPrev();
	assert.equal(host.state.itemsStatus.page, 1);
	await engine.goPrev();
	assert.equal(host.state.itemsStatus.page, 1, 'goPrev no-ops at page 1');
	engine.dispose();
});
test('error path: status.error set, items untouched, items:error emitted', async () => {
	const host = makeHost();
	let fail = false;
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		loader: async function loader() {
			if (fail) {
				throw new Error('boom');
			}
			return {
				items: [
					{
						id: 'a',
					},
				],
				nextCursor: 2,
				hasMore: true,
			};
		},
	});
	engine.attach({});
	await settleFrame();
	fail = true;
	await engine.loadMore();
	assert.equal(host.state.itemsStatus.error, 'boom');
	assert.equal(host.state.itemsStatus.loading, false);
	assert.deepEqual(host.state.items.map(pluckId), ['a'], 'items untouched by the failure');
	assert.ok(eventNames(host).includes('items:error'));
	engine.dispose();
});
test('sentinel: enter auto-loads, maxAutoFill caps with fill-capped, leave resets the budget', async () => {
	const host = makeHost();
	const sentinel = makeSentinel();
	const engine = CollectionEngine.create(host, {
		mode: 'scroll',
		maxAutoFill: 2,
		loader: pageLoader([
			[
				{
					id: '1',
				},
			], [
				{
					id: '2',
				},
			], [
				{
					id: '3',
				},
			], [
				{
					id: '4',
				},
			], [
				{
					id: '5',
				},
			],
		]),
	});
	engine.attach({
		sentinel,
	});
	await settleFrame();
	const observer = observers.at(-1);
	assert.equal(observer.observed[0], sentinel);
	observer.fire(sentinel, true);
	await settleFrame();
	assert.equal(host.state.itemsStatus.page, 2, 'sentinel enter auto-loaded');
	observer.fire(sentinel, true);
	await settleFrame();
	observer.fire(sentinel, true);
	await settleFrame();
	assert.equal(host.state.itemsStatus.page, 3, 'third consecutive auto-load capped');
	assert.ok(eventNames(host).includes('items:fill-capped'));
	observer.fire(sentinel, false);
	observer.fire(sentinel, true);
	await settleFrame();
	assert.equal(host.state.itemsStatus.page, 4, 'leaving the sentinel re-opened the budget');
	engine.dispose();
	sentinel.remove();
});
test('sentinel re-arms (unobserve+observe) after each successful load', async () => {
	const host = makeHost();
	const sentinel = makeSentinel();
	const engine = CollectionEngine.create(host, {
		mode: 'scroll',
		loader: pageLoader([
			[
				{
					id: '1',
				},
			], [
				{
					id: '2',
				},
			],
		]),
	});
	engine.attach({
		sentinel,
	});
	await settleFrame();
	await settleFrame();
	const observer = observers.at(-1);
	assert.ok(observer.unobserveCalls.includes(sentinel), 'post-load re-arm unobserved the sentinel');
	assert.ok(observer.observed.length >= 2, 'post-load re-arm re-observed the sentinel');
	engine.dispose();
	assert.equal(observer.disconnected, true, 'dispose disconnects the observer');
	sentinel.remove();
});
test('setFilterArg retouches the array reference so a filter spot re-runs', async () => {
	const host = makeHost();
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		filter: function keepByTag(item, tag) {
			return tag === 'all' || item.tag === tag;
		},
		filterArg: 'all',
		loader: pageLoader([
			[
				{
					id: 'a',
					tag: 'in',
				},
				{
					id: 'b',
					tag: 'out',
				},
			],
		]),
	});
	engine.attach({});
	await settleFrame();
	const before = host.state.items;
	assert.equal(engine.keepItem(before[0]), true);
	engine.setFilterArg('in');
	assert.notEqual(host.state.items, before, 'array reference retouched');
	assert.deepEqual(host.state.items.map(pluckId), ['a', 'b'], 'same items, new reference');
	assert.equal(engine.keepItem(before[0]), true);
	assert.equal(engine.keepItem(before[1]), false, 'predicate now filters by the new arg');
	const retouched = host.state.items;
	engine.setFilterArg('in');
	assert.equal(host.state.items, retouched, 'same-arg setFilterArg is a no-op');
	engine.dispose();
});
test('empty reset skips the wasted []→[] reassign', async () => {
	const host = makeHost();
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		loader: pageLoader([[]]),
	});
	engine.attach({});
	await settleFrame();
	const emptyRef = host.state.items;
	assert.equal(Array.isArray(emptyRef), true);
	await engine.reset();
	assert.equal(host.state.items, emptyRef, 'empty-over-empty kept the same reference');
	engine.dispose();
});
test('dispose: no further loads, aborted in-flight, seenKeys cleared', async () => {
	const host = makeHost();
	const signals = [];
	const engine = CollectionEngine.create(host, {
		mode: 'button',
		loader: function loader({ signal }) {
			signals.push(signal);
			return new Promise(() => {});
		},
	});
	engine.attach({});
	engine.dispose();
	assert.equal(signals[0].aborted, true, 'in-flight request aborted on dispose');
	assert.equal(engine.seenKeys.size, 0);
	engine.attach({});
	assert.equal(signals.length, 1, 'a disposed engine never attaches or loads again');
});
