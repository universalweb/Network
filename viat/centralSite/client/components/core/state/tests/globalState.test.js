import assert from 'node:assert/strict';
import test from 'node:test';
import { Store, storeRealm } from '../globalState.js';
/*
 * Pure-node — Store is DOM-free. Flushes are driven synchronously via
 * store.bus.flush(); the microtask masterFlush that notifyAll schedules runs
 * later as a no-op (pendingAll already consumed).
 */
function makeLogger(log) {
	return function logFire(value, changedPath) {
		log.push([
			changedPath,
			value,
		]);
	};
}
/*
 * `store.set` writes THROUGH the proxy, so seeding leaves per-key notifications
 * pending. Drain them (no subscribers yet) so a test observes only what
 * `replaceState` itself dispatches.
 */
function seed(store, initial) {
	store.set(initial);
	store.bus.flush();
}
test('replaceState preserves STATE and proxy identity (the render-proxy memo invariant)', () => {
	const store = Store.create();
	seed(store, {
		a: 1,
	});
	const stateRef = store.STATE;
	const proxyRef = store.proxy;
	store.replaceState({
		b: 2,
	});
	assert.equal(store.STATE, stateRef, 'STATE object identity preserved (proxy target immutable)');
	assert.equal(store.proxy, proxyRef, 'root proxy identity preserved');
});
test('replaceState overwrites present keys and the proxy reads the new nested values', () => {
	const store = Store.create();
	seed(store, {
		user: {
			name: 'ada',
		},
	});
	store.replaceState({
		user: {
			name: 'grace',
		},
		count: 5,
	});
	assert.equal(store.get('user.name'), 'grace', 'nested proxy resolves the replacement value');
	assert.equal(store.get('count'), 5, 'added top-level key readable');
});
test('replaceState fires every subscriber once at its own path with the new value', () => {
	const store = Store.create();
	seed(store, {
		a: 1,
		nested: {
			x: 1,
		},
	});
	const log = [];
	store.observe('a', makeLogger(log));
	store.observe('nested.x', makeLogger(log));
	store.replaceState({
		a: 2,
		nested: {
			x: 9,
		},
	});
	store.bus.flush();
	assert.deepEqual(log, [
		[
			'a',
			2,
		],
		[
			'nested.x',
			9,
		],
	], 'each bucket fired once at its own path, new value resolved');
});
test('replaceState fires a dropped-key subscriber with undefined (re-render empty, not stale)', () => {
	const store = Store.create();
	seed(store, {
		user: {
			name: 'ada',
		},
	});
	const log = [];
	store.observe('user.name', makeLogger(log));
	store.replaceState({
		other: 1,
	});
	store.bus.flush();
	assert.equal(log.length, 1, 'dropped-path subscriber still fired');
	assert.equal(log[0][0], 'user.name');
	assert.equal(log[0][1], undefined, 'resolves undefined through the nulled parent');
	assert.equal(store.STATE.user, null, 'dropped key nulled in place (hidden-class stable), not deleted');
});
test('replaceState is a no-op for a structurally-equal replacement', () => {
	const store = Store.create();
	seed(store, {
		a: 1,
		b: {
			c: 2,
		},
	});
	const log = [];
	store.observe('a', makeLogger(log));
	store.replaceState({
		a: 1,
		b: {
			c: 2,
		},
	});
	store.bus.flush();
	assert.deepEqual(log, [], 'plainEqual guard suppressed the flush entirely');
});
test('replaceState reset to empty nulls all keys and fires all subscribers', () => {
	const store = Store.create();
	seed(store, {
		a: 1,
		b: 2,
	});
	const log = [];
	store.observe('a', makeLogger(log));
	store.observe('b', makeLogger(log));
	store.replaceState({});
	store.bus.flush();
	assert.deepEqual(log.map((entry) => {
		return entry[0];
	}), [
		'a',
		'b',
	], 'both subscribers fired on full clear');
	assert.equal(log[0][1], null, 'nulled value delivered');
});
test('replaceState notifyAll subsumes a partial notify pending in the same tick', () => {
	const store = Store.create();
	seed(store, {
		a: 1,
		b: 1,
	});
	const log = [];
	store.observe('a', makeLogger(log));
	store.observe('b', makeLogger(log));
	/*
	 * A direct proxy write schedules a partial notify on 'a'; the replaceState in
	 * the SAME tick must supersede it — every subscriber fires exactly once (via
	 * notifyAll), not twice (once for the pending 'a', once for the replace).
	 */
	store.proxy.a = 2;
	store.replaceState({
		a: 3,
		b: 4,
	});
	store.bus.flush();
	assert.deepEqual(log, [
		[
			'a',
			3,
		],
		[
			'b',
			4,
		],
	], 'pending partial notify subsumed; each subscriber fired once with the replacement value');
});
/*
 * ── set/setOne equality guard (X11/X12) ──
 * The guard reads raw STATE: identity skips must fire for a reused stored
 * ref, for the round-tripped memoized proxy, and for structurally-equal
 * fresh objects — none may notify. Changed writes notify exactly once.
 */
test('set with the identical stored object ref is a no-op (no notify)', () => {
	const store = Store.create();
	seed(store, {
		config: {
			theme: 'dark',
			flags: {
				beta: true,
			},
		},
	});
	const log = [];
	store.observe('config', makeLogger(log));
	const storedRef = store.STATE.config;
	store.set({
		config: storedRef,
	});
	store.bus.flush();
	assert.deepEqual(log, [], 'identity skip — no notify');
	assert.equal(store.STATE.config, storedRef, 'stored ref untouched');
});
test('set with the round-tripped memoized proxy is a no-op (no notify)', () => {
	const store = Store.create();
	seed(store, {
		config: {
			theme: 'dark',
		},
	});
	const log = [];
	store.observe('config', makeLogger(log));
	store.set({
		config: store.get('config'),
	});
	store.bus.flush();
	assert.deepEqual(log, [], 'memoized-proxy identity skip — no notify');
});
test('set at one path with the aliased object proxy from another path skips without notify', () => {
	const shared = {
		theme: 'dark',
	};
	const store = Store.create();
	seed(store, {
		a: shared,
		b: shared,
	});
	const log = [];
	store.observe('b', makeLogger(log));
	store.set({
		b: store.get('a'),
	});
	store.bus.flush();
	assert.deepEqual(log, [], 'aliased proxy is structurally equal — no notify');
	assert.equal(store.STATE.b, shared, 'stored ref untouched');
});
test('set with a fresh structurally-equal object is a no-op (no notify)', () => {
	const store = Store.create();
	seed(store, {
		config: {
			theme: 'dark',
			limits: {
				rows: 200,
			},
		},
	});
	const log = [];
	store.observe('config', makeLogger(log));
	store.set({
		config: {
			theme: 'dark',
			limits: {
				rows: 200,
			},
		},
	});
	store.bus.flush();
	assert.deepEqual(log, [], 'structural-equality skip preserved');
});
test('set mixed batch notifies only the changed keys', () => {
	const store = Store.create();
	seed(store, {
		a: 1,
		b: 2,
		c: 3,
	});
	const log = [];
	store.observe('a', makeLogger(log));
	store.observe('b', makeLogger(log));
	store.observe('c', makeLogger(log));
	store.set({
		a: 1,
		b: 9,
		c: 3,
	});
	store.bus.flush();
	assert.deepEqual(log, [
		[
			'b',
			9,
		],
	], 'unchanged keys guarded; only the changed key fired');
});
test('setOne changed value at a dotted path writes raw STATE and notifies once', () => {
	const store = Store.create();
	seed(store, {
		user: {
			profile: {
				age: 30,
			},
		},
	});
	const log = [];
	store.observe('user.profile.age', makeLogger(log));
	store.setOne('user.profile.age', 31);
	store.bus.flush();
	assert.deepEqual(log, [
		[
			'user.profile.age',
			31,
		],
	], 'one notify at the leaf path with the new value');
	assert.equal(store.STATE.user.profile.age, 31, 'raw STATE carries the write');
});
test('setOne with the current primitive value is a no-op (no notify)', () => {
	const store = Store.create();
	seed(store, {
		count: 7,
	});
	const log = [];
	store.observe('count', makeLogger(log));
	store.setOne('count', 7);
	store.bus.flush();
	assert.deepEqual(log, []);
});
test('storeRealm write routes through the setOne guard', () => {
	const store = Store.create();
	seed(store, {
		draft: 'a',
	});
	const realm = storeRealm(store);
	const log = [];
	store.observe('draft', makeLogger(log));
	realm.write('draft', 'b');
	store.bus.flush();
	realm.write('draft', 'b');
	store.bus.flush();
	assert.deepEqual(log, [
		[
			'draft',
			'b',
		],
	], 'changed write notified once; the repeat write is guarded');
});
