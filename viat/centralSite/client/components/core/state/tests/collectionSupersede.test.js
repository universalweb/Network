import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Supersede contract for reset()/goto() during an in-flight load (the audit's
 * tk:20 correctness fix). The old `if (loading) return` gate sat BEFORE the
 * token bump, so a replace-load was dropped: reset() had already cleared the
 * list, and the stale in-flight response then wrote onto the emptied window
 * with a stale cursor. The fix gates only additive loads (`loading && !replace`)
 * so a replace bumps the token + aborts the prior controller, and the stale
 * response bails on the token check. A regression here re-drops the fresh
 * window. Same happy-dom + fake-IO harness as collectionEngine.test.js.
 */
GlobalRegistrator.register();
class FakeIntersectionObserver {
	constructor(callback) {
		this.callback = callback;
	}
	observe() {}
	unobserve() {}
	disconnect() {}
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
async function settleFrame() {
	await new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
	await Promise.resolve();
}
/*
 * A loader whose every call parks on a Promise the test resolves by hand, so
 * two loads can be held in flight at once to exercise the supersede race.
 */
function makeDeferredLoader() {
	const calls = [];
	function loader(request) {
		const deferred = Promise.withResolvers();
		calls.push({
			request,
			resolve: deferred.resolve,
		});
		return deferred.promise;
	}
	return {
		loader,
		calls,
	};
}
test('engine: reset() supersedes an in-flight loadMore — stale response cannot clobber the fresh window', async () => {
	const host = makeHost();
	const {
		loader, calls,
	} = makeDeferredLoader();
	const engine = CollectionEngine.create(host, {
		key: 'items',
		mode: 'button',
		dedupe: false,
		loader,
	});
	engine.loadMore();
	assert.equal(calls.length, 1, 'loadMore started the first load');
	engine.reset();
	assert.equal(calls.length, 2, 'reset was NOT gated — it superseded the in-flight load');
	calls[0].resolve({
		items: [
			{
				id: 'stale',
			},
		],
		nextCursor: 99,
		hasMore: true,
	});
	await settleFrame();
	calls[1].resolve({
		items: [
			{
				id: 'fresh',
			},
		],
		nextCursor: null,
		hasMore: false,
	});
	await settleFrame();
	assert.deepEqual(host.state.items, [
		{
			id: 'fresh',
		},
	], 'the fresh reset window won; the stale response was discarded on the token check');
	assert.equal(host.state.itemsStatus.loading, false, 'loading settled');
	engine.dispose();
});
