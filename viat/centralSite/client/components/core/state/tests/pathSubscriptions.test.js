import assert from 'node:assert/strict';
import test from 'node:test';
import { getValueAtPath, parsePath, pathsOverlap } from '../../utilities.js';
import { PathSubscriptions } from '../pathSubscriptions.js';
/*
 * Pure-node suite — the bus is deliberately DOM-free, so no happy-dom
 * registration. Flushes are driven synchronously via bus.flush(); the
 * microtask masterFlush that notify() schedules runs later as a no-op
 * (pending already drained) against empty scheduler queues.
 */
class TestBus extends PathSubscriptions {
	state = {};
	getValue(path) {
		return getValueAtPath(this.state, path);
	}
}
function makeLogger(log, id) {
	return function logFire(value, changedPath) {
		log.push([
			id,
			changedPath,
			value,
		]);
	};
}
test('coalesce: repeated notifies of one path fire the subscriber once', () => {
	const bus = new TestBus();
	bus.state = {
		count: 3,
	};
	const log = [];
	bus.subscribe('count', makeLogger(log, 'count'));
	bus.notify('count');
	bus.notify('count');
	bus.notify('count');
	bus.flush();
	assert.deepEqual(log, [
		[
			'count',
			'count',
			3,
		],
	]);
});
test('ancestor direction: subscription on a leaf fires when a parent path changes', () => {
	const bus = new TestBus();
	bus.state = {
		user: {
			name: 'ada',
		},
	};
	const log = [];
	bus.subscribe('user.name', makeLogger(log, 'leaf'));
	bus.notify('user');
	bus.flush();
	assert.deepEqual(log, [
		[
			'leaf',
			'user',
			'ada',
		],
	]);
});
test('descendant direction: subscription on a container fires when a nested path changes', () => {
	const bus = new TestBus();
	bus.state = {
		items: [
			{
				x: 1,
			},
		],
	};
	const log = [];
	bus.subscribe('items', makeLogger(log, 'list'));
	bus.notify('items.0.x');
	bus.flush();
	assert.equal(log.length, 1);
	assert.equal(log[0][1], 'items.0.x', 'changed path is the deep path');
	assert.equal(log[0][2], bus.state.items, 'value resolved at the subscription path');
});
test('first-overlap contract: non-multiPath fires once, with the FIRST overlapping changed path in notify order', () => {
	const bus = new TestBus();
	bus.state = {
		user: {
			name: 'ada',
			email: 'a@x',
		},
	};
	const log = [];
	bus.subscribe('user', makeLogger(log, 'user'));
	bus.notify('user.email');
	bus.notify('user.name');
	bus.flush();
	assert.deepEqual(log, [
		[
			'user',
			'user.email',
			bus.state.user,
		],
	], 'exactly one fire, carrying the first overlapping path');
});
test('multiPath replay: fires for EVERY overlapping changed path, same cached value', () => {
	const bus = new TestBus();
	bus.state = {
		items: [
			1,
			2,
		],
	};
	const log = [];
	bus.subscribe('items', makeLogger(log, 'spot'), null, true);
	bus.notify('items.0');
	bus.notify('items.1');
	bus.flush();
	assert.deepEqual(log.map((entry) => {
		return entry[1];
	}), [
		'items.0',
		'items.1',
	], 'one fire per overlapping path, in notify order');
	assert.equal(log[0][2], log[1][2], 'value computed once and reused across replays');
});
test('segment boundary: a.b does not overlap a.bc', () => {
	const bus = new TestBus();
	bus.state = {
		a: {
			b: 1,
			bc: 2,
		},
	};
	const log = [];
	bus.subscribe('a.b', makeLogger(log, 'ab'));
	bus.notify('a.bc');
	bus.flush();
	assert.deepEqual(log, [], 'no dot boundary, no overlap');
});
test('empty path: literal "" subscription matches only a literal "" notify', () => {
	const bus = new TestBus();
	const log = [];
	bus.subscribe('', makeLogger(log, 'root'));
	bus.notify('a');
	bus.flush();
	assert.deepEqual(log, [], 'non-empty change does not reach the "" bucket');
	bus.notify('');
	bus.flush();
	assert.equal(log.length, 1);
	assert.equal(log[0][1], '');
});
test('mid-dispatch unsubscribe: a handler tearing down a sibling suppresses the sibling fire', () => {
	const bus = new TestBus();
	bus.state = {
		x: 1,
	};
	const log = [];
	let second = null;
	function firstHandler() {
		log.push('first');
		second.unsubscribe();
	}
	bus.subscribe('x', firstHandler);
	second = bus.subscribe('x', makeLogger(log, 'second'));
	bus.notify('x');
	bus.flush();
	assert.deepEqual(log, ['first'], 'unsubscribed sibling skipped via the handler-null guard');
});
test('mid-dispatch subscribe to a NEW path does not fire in the same flush', () => {
	const bus = new TestBus();
	bus.state = {
		x: 1,
		y: 2,
	};
	const log = [];
	function subscribingHandler() {
		log.push('x');
		bus.subscribe('y', makeLogger(log, 'late'));
	}
	bus.subscribe('x', subscribingHandler);
	bus.notify('x');
	bus.notify('y');
	bus.flush();
	assert.deepEqual(log, ['x'], 'the late subscription waits for the next batch');
});
test('notifyAll: every bucket fires exactly once with its own path; multiPath gets no replays', () => {
	const bus = new TestBus();
	bus.state = {
		a: 1,
		b: {
			c: 2,
		},
		items: [9],
	};
	const log = [];
	bus.subscribe('a', makeLogger(log, 'a'));
	bus.subscribe('b.c', makeLogger(log, 'bc'));
	bus.subscribe('items', makeLogger(log, 'items'), null, true);
	bus.notify('a');
	bus.notifyAll();
	bus.notify('b.c');
	bus.flush();
	assert.deepEqual(log, [
		[
			'a',
			'a',
			1,
		],
		[
			'bc',
			'b.c',
			2,
		],
		[
			'items',
			'items',
			bus.state.items,
		],
	], 'one fire per bucket at its own path, in subscription order; pending notifies subsumed');
});
/*
 * Walk a lazily-built index and collect the paths of every terminal node — the
 * live buckets the trie claims to know. Asserts the rebuilt trie is in exact
 * bijection with `subs` (no stale terminal survives an unsubscribe).
 */
function collectTerminals(node, out) {
	if (node.path !== null) {
		out.push(node.path);
	}
	for (const child of node.children.values()) {
		collectTerminals(child, out);
	}
	return out;
}
test('lazy index: never built until a multi-path flush; rebuilt in bijection with live buckets', () => {
	const bus = new TestBus();
	bus.state = {
		a: {
			b: {
				c: 1,
			},
		},
	};
	const sub1 = bus.subscribe('a.b.c', makeLogger([], 'x'));
	const sub2 = bus.subscribe('a.b', makeLogger([], 'y'));
	assert.equal(bus.indexRoot, null, 'subscribing never builds the trie — a create-storm pays no index tax');
	assert.equal(bus.indexDirty, true, 'new buckets marked the vocabulary dirty');
	bus.notify('a.b');
	bus.notify('a');
	bus.flush();
	assert.ok(bus.indexRoot, 'the first multi-path flush builds the trie');
	assert.equal(bus.indexDirty, false, 'a clean build clears the dirty flag');
	assert.deepEqual(collectTerminals(bus.indexRoot, []).sort(), [
		'a.b',
		'a.b.c',
	], 'terminals == live buckets exactly');
	sub1.unsubscribe();
	assert.equal(bus.indexDirty, true, 'dropping a bucket re-dirties the vocabulary');
	bus.notify('a.b');
	bus.notify('a');
	bus.flush();
	assert.deepEqual(collectTerminals(bus.indexRoot, []).sort(), ['a.b'], 'rebuild reflects the unsubscribe — no stale terminal survives');
	sub2.unsubscribe();
	assert.equal(bus.subs.size, 0, 'both buckets dropped');
	/*
	 * A now-empty bus skips dispatch entirely (the `if (this.subs.size)` flush
	 * guard), so the prior trie is never re-read — the design rebuilds only on
	 * an actual read, and `collectOverlaps` always `ensureIndex`-es first. The
	 * contract is "correct WHEN read", so force the rebuild a future read would.
	 */
	assert.equal(bus.indexDirty, true, 'the emptied vocabulary is marked stale');
	bus.ensureIndex();
	assert.deepEqual(collectTerminals(bus.indexRoot, []), [], 'a rebuild reflects the empty subs — bijection holds');
});
test('create storm: single-path flushes and notifyAll never build the trie', () => {
	const bus = new TestBus();
	bus.state = {
		items: [
			{
				x: 1,
			},
			{
				x: 2,
			},
		],
	};
	const log = [];
	const subs = [];
	for (let index = 0; index < 50; index++) {
		subs.push(bus.subscribe(`items.${index}.x`, makeLogger(log, index)));
	}
	assert.equal(bus.indexRoot, null, 'a 50-bucket create-storm allocated no trie');
	bus.notify('items.0.x');
	bus.flush();
	assert.equal(bus.indexRoot, null, 'a single-path flush uses pathsOverlap directly — no trie');
	bus.notifyAll();
	bus.flush();
	assert.equal(bus.indexRoot, null, 'notifyAll fires every bucket at its own path — no trie');
	const subsLength = subs.length;
	for (let index = 0; index < subsLength; index++) {
		subs[index].unsubscribe();
	}
	assert.equal(bus.indexRoot, null, 'teardown never touched the trie either');
	assert.equal(bus.subs.size, 0);
});
test('vocabulary growth: a path subscribed AFTER the trie was built still matches (dirty-flip on create)', () => {
	const bus = new TestBus();
	bus.state = {
		user: {
			name: 'ada',
			email: 'a@x',
		},
	};
	const log = [];
	bus.subscribe('user', makeLogger(log, 'user'));
	bus.notify('user.name');
	bus.notify('user.email');
	bus.flush();
	assert.ok(bus.indexRoot, 'trie built on the first multi-path flush');
	assert.deepEqual(log.map((entry) => {
		return entry[0];
	}), ['user'], 'baseline: only the container matched');
	log.length = 0;
	bus.subscribe('user.name', makeLogger(log, 'name'));
	bus.notify('user.name');
	bus.notify('user.email');
	bus.flush();
	assert.deepEqual(log.map((entry) => {
		return entry[0];
	}).sort(), [
		'name',
		'user',
	], 'the late subscription is in the rebuilt trie — a stale trie would silently drop it');
});
test('stable vocabulary: repeated multi-path flushes reuse the same trie instance', () => {
	const bus = new TestBus();
	bus.state = {
		user: {
			name: 'ada',
			email: 'a@x',
		},
	};
	const log = [];
	bus.subscribe('user', makeLogger(log, 'user'), null, true);
	bus.notify('user.name');
	bus.notify('user.email');
	bus.flush();
	const builtOnce = bus.indexRoot;
	assert.ok(builtOnce, 'trie built');
	for (let round = 0; round < 5; round++) {
		log.length = 0;
		bus.notify('user.name');
		bus.notify('user.email');
		bus.flush();
		assert.equal(bus.indexRoot, builtOnce, `round ${round}: no vocabulary change → same trie instance reused, not rebuilt`);
		assert.deepEqual(log.map((entry) => {
			return entry[1];
		}), [
			'user.name',
			'user.email',
		], `round ${round}: multiPath replay still correct on the reused trie`);
	}
});
/*
 * Equivalence property: the trie-driven flush must produce the IDENTICAL fire
 * log — same subscribers, same order, same changed-path args, same values —
 * as the former pairwise pathsOverlap scan. The reference below is a faithful
 * copy of that algorithm (first-overlap + multiPath replay + break-when-no-
 * multiPath), driven over the same subscription spec. Randomized via a seeded
 * LCG (deterministic — no Math.random in tests).
 */
function referenceDispatch(spec, changed, state) {
	const log = [];
	const specLength = spec.length;
	const buckets = new Map();
	for (let specIndex = 0; specIndex < specLength; specIndex++) {
		const entry = spec[specIndex];
		let bucket = buckets.get(entry.path);
		if (!bucket) {
			bucket = [];
			buckets.set(entry.path, bucket);
		}
		bucket.push(entry);
	}
	for (const [
		subscriptionPath,
		bucket,
	] of buckets) {
		let fired = false;
		let value;
		let hasMultiPath = false;
		const changedLength = changed.length;
		const bucketLength = bucket.length;
		for (let changedIndex = 0; changedIndex < changedLength; changedIndex++) {
			if (!pathsOverlap(subscriptionPath, changed[changedIndex])) {
				continue;
			}
			const changedPath = changed[changedIndex];
			if (!fired) {
				fired = true;
				value = getValueAtPath(state, subscriptionPath);
				for (let bucketIndex = 0; bucketIndex < bucketLength; bucketIndex++) {
					if (bucket[bucketIndex].multiPath) {
						hasMultiPath = true;
					}
					log.push([
						bucket[bucketIndex].id,
						changedPath,
						value,
					]);
				}
				if (!hasMultiPath) {
					break;
				}
				continue;
			}
			for (let bucketIndex = 0; bucketIndex < bucketLength; bucketIndex++) {
				if (bucket[bucketIndex].multiPath) {
					log.push([
						bucket[bucketIndex].id,
						changedPath,
						value,
					]);
				}
			}
		}
	}
	return log;
}
function makeLcg(seed) {
	let current = seed >>> 0;
	return function nextRandom() {
		current = ((current * 1664525) + 1013904223) >>> 0;
		return current / 4294967296;
	};
}
const SEGMENTS = [
	'a',
	'b',
	'items',
	'0',
	'1',
	'x',
	'user',
	'name',
];
function randomPath(nextRandom) {
	const depth = 1 + Math.floor(nextRandom() * 3);
	const parts = [];
	for (let partIndex = 0; partIndex < depth; partIndex++) {
		parts.push(SEGMENTS[Math.floor(nextRandom() * SEGMENTS.length)]);
	}
	return parts.join('.');
}
test('equivalence: randomized trials match the former pairwise algorithm fire-for-fire', () => {
	const state = {
		a: {
			b: 1,
		},
		b: 2,
		items: [
			{
				x: 1,
			},
			{
				x: 2,
			},
		],
		user: {
			name: 'ada',
		},
	};
	for (let trial = 0; trial < 200; trial++) {
		const nextRandom = makeLcg(trial + 1);
		const subCount = 1 + Math.floor(nextRandom() * 40);
		const changedCount = 1 + Math.floor(nextRandom() * 15);
		const spec = [];
		for (let subIndex = 0; subIndex < subCount; subIndex++) {
			spec.push({
				id: subIndex,
				path: randomPath(nextRandom),
				multiPath: nextRandom() < 0.2,
			});
		}
		const changedSet = new Set();
		for (let changedIndex = 0; changedIndex < changedCount; changedIndex++) {
			changedSet.add(randomPath(nextRandom));
		}
		const changed = [...changedSet];
		const bus = new TestBus();
		bus.state = state;
		const log = [];
		const specLength = spec.length;
		for (let subIndex = 0; subIndex < specLength; subIndex++) {
			bus.subscribe(spec[subIndex].path, makeLogger(log, spec[subIndex].id), null, spec[subIndex].multiPath);
		}
		const changedLength = changed.length;
		for (let changedIndex = 0; changedIndex < changedLength; changedIndex++) {
			bus.notify(changed[changedIndex]);
		}
		bus.flush();
		const expected = referenceDispatch(spec, changed, state);
		assert.deepEqual(log, expected, `trial ${trial}: trie flush diverged from the pairwise reference`);
	}
});
/*
 * Mirror the bus's bucket-creation order so the reference spec groups buckets
 * in the same order the bus dispatches them (`subs` insertion order). A bucket
 * is created when a path gains its first live subscription and dropped when it
 * loses its last — a resurrected path lands at the end, exactly as the bus's
 * `subs` map re-inserts it. Building the spec from this order (not raw
 * subscription add-order) is what keeps the oracle honest when the earliest
 * subscription of a still-live bucket is unsubscribed.
 */
function bucketOrderSpec(live, bucketOrder) {
	const spec = [];
	const bucketOrderLength = bucketOrder.length;
	const liveLength = live.length;
	for (let orderIndex = 0; orderIndex < bucketOrderLength; orderIndex++) {
		const path = bucketOrder[orderIndex];
		for (let liveIndex = 0; liveIndex < liveLength; liveIndex++) {
			if (live[liveIndex].path === path) {
				spec.push({
					id: live[liveIndex].id,
					path,
					multiPath: live[liveIndex].multiPath,
				});
			}
		}
	}
	return spec;
}
/*
 * The correctness close for the lazy trie: the single-flush suites above all
 * subscribe-then-flush-once and so can never reach the one new failure mode —
 * a stale trie surviving a vocabulary change across flushes. This interleaves
 * subscribe / unsubscribe / notify / flush over many rounds and, after EACH
 * flush, compares the fires produced this round against a fresh pairwise
 * computation over the currently-live subscriptions. A missing dirty-flip (or
 * any trie/`subs` drift) would drop or duplicate a fire and fail here.
 */
test('multi-flush equivalence: interleaved subscribe/unsubscribe across flushes matches a fresh pairwise computation each flush', () => {
	const state = {
		a: {
			b: 1,
		},
		b: 2,
		items: [
			{
				x: 1,
			},
			{
				x: 2,
			},
		],
		user: {
			name: 'ada',
		},
	};
	for (let trial = 0; trial < 150; trial++) {
		const nextRandom = makeLcg(trial + 5000);
		const bus = new TestBus();
		bus.state = state;
		const log = [];
		const live = [];
		const bucketOrder = [];
		const pathCounts = new Map();
		let nextId = 0;
		const rounds = 3 + Math.floor(nextRandom() * 5);
		for (let round = 0; round < rounds; round++) {
			const addCount = Math.floor(nextRandom() * 5);
			for (let addIndex = 0; addIndex < addCount; addIndex++) {
				const id = nextId++;
				const path = randomPath(nextRandom);
				const multiPath = nextRandom() < 0.2;
				const subscription = bus.subscribe(path, makeLogger(log, id), null, multiPath);
				live.push({
					id,
					path,
					multiPath,
					subscription,
				});
				const priorCount = pathCounts.get(path) ?? 0;
				if (priorCount === 0) {
					bucketOrder.push(path);
				}
				pathCounts.set(path, priorCount + 1);
			}
			const removeCount = live.length ? Math.floor(nextRandom() * Math.min(3, live.length)) : 0;
			for (let removeIndex = 0; removeIndex < removeCount; removeIndex++) {
				const victim = Math.floor(nextRandom() * live.length);
				const removed = live[victim];
				removed.subscription.unsubscribe();
				live.splice(victim, 1);
				const remaining = pathCounts.get(removed.path) - 1;
				if (remaining === 0) {
					pathCounts.delete(removed.path);
					bucketOrder.splice(bucketOrder.indexOf(removed.path), 1);
				} else {
					pathCounts.set(removed.path, remaining);
				}
			}
			const changedSet = new Set();
			const changedCount = 1 + Math.floor(nextRandom() * 6);
			for (let changedIndex = 0; changedIndex < changedCount; changedIndex++) {
				changedSet.add(randomPath(nextRandom));
			}
			const changed = [...changedSet];
			const changedLength = changed.length;
			for (let changedIndex = 0; changedIndex < changedLength; changedIndex++) {
				bus.notify(changed[changedIndex]);
			}
			const logStart = log.length;
			bus.flush();
			const roundLog = log.slice(logStart);
			const expected = referenceDispatch(bucketOrderSpec(live, bucketOrder), changed, state);
			assert.deepEqual(roundLog, expected, `trial ${trial} round ${round}: multi-flush trie diverged from the pairwise reference`);
		}
	}
});
test('parsePath cache is bounded — dynamic list-index paths cannot grow it without limit', () => {
	/*
	 * Insert far more unique paths than the internal cap (10k). The cache
	 * clears wholesale on the miss that crosses the cap, so a cold re-split
	 * is transparent (consumers never retain the array by identity) and the
	 * live cache stays bounded. We can't read the private size, so prove the
	 * bound behaviorally: every lookup still returns the correct split, and
	 * a re-lookup after the churn still resolves — no leak, no corruption.
	 */
	const churn = 25000;
	for (let index = 0; index < churn; index++) {
		const parts = parsePath(`items.${index}.label`);
		assert.equal(parts.length, 3, 'split shape correct under churn');
		assert.equal(parts[1], String(index), 'index segment intact under churn');
	}
	// A path seen before the cap-triggered clear resolves correctly on re-split.
	assert.deepEqual(parsePath('items.0.label'), [
		'items',
		'0',
		'label',
	], 'early path still resolves after the cache was cleared at the cap');
	// getValueAtPath (a parsePath consumer) stays correct across the churn.
	assert.equal(getValueAtPath({
		items: [
			{
				label: 'first',
			},
		],
	}, 'items.0.label'), 'first', 'consumer read correct after cap churn');
});
/*
 * ── dispatchSingle flat fast path (nestedPathCount === 0) ────────────────────
 * When no subscribed path is nested, a single changed path overlaps AT MOST one
 * bucket (its exact key, or its sole bare-key ancestor = first segment). The
 * fast path resolves that bucket with one Map.get instead of the O(subs) scan +
 * `[...subs.entries()]` snapshot. These prove it fires the SAME subscribers, in
 * the same order, with the same value/changedPath as the pairwise reference —
 * and that the O(1) nestedPathCount invariant that gates it never drifts.
 */
const FLAT_KEYS = [
	'a',
	'b',
	'items',
	'user',
	'x',
	'name',
	'count',
	'',
];
function randomFlatKey(nextRandom) {
	return FLAT_KEYS[Math.floor(nextRandom() * FLAT_KEYS.length)];
}
function countDottedBuckets(bus) {
	let count = 0;
	for (const path of bus.subs.keys()) {
		if (path.includes('.')) {
			count += 1;
		}
	}
	return count;
}
test('flat fast path: all-flat vocabulary keeps nestedPathCount 0 and single-path dispatch matches the pairwise reference', () => {
	const state = {
		a: {
			b: 1,
		},
		b: 2,
		items: [
			{
				x: 1,
			},
		],
		user: {
			name: 'ada',
		},
		x: 7,
		name: 'z',
		count: 3,
	};
	for (let trial = 0; trial < 400; trial++) {
		const nextRandom = makeLcg(trial + 90000);
		const subCount = 1 + Math.floor(nextRandom() * 30);
		const spec = [];
		for (let subIndex = 0; subIndex < subCount; subIndex++) {
			spec.push({
				id: subIndex,
				path: randomFlatKey(nextRandom),
				multiPath: nextRandom() < 0.2,
			});
		}
		/*
		 * Single changed path — flat half the time (exact-match branch), a nested
		 * random path the other half (first-segment ancestor branch: a flat sub `a`
		 * must fire for changed `a.b.c`, and `b` must NOT).
		 */
		const changedPath = nextRandom() < 0.5 ? randomFlatKey(nextRandom) : randomPath(nextRandom);
		const bus = new TestBus();
		bus.state = state;
		const log = [];
		const specLength = spec.length;
		for (let subIndex = 0; subIndex < specLength; subIndex++) {
			bus.subscribe(spec[subIndex].path, makeLogger(log, spec[subIndex].id), null, spec[subIndex].multiPath);
		}
		assert.equal(bus.nestedPathCount, 0, `trial ${trial}: all-flat vocabulary => nestedPathCount 0 => fast path active`);
		bus.notify(changedPath);
		bus.flush();
		const expected = referenceDispatch(spec, [changedPath], state);
		assert.deepEqual(log, expected, `trial ${trial}: flat fast path diverged from pairwise reference (changed="${changedPath}")`);
	}
});
test('flat fast path: exact-key change fires only that bucket', () => {
	const bus = new TestBus();
	bus.state = {
		a: 1,
		b: 2,
		c: 3,
	};
	const log = [];
	bus.subscribe('a', makeLogger(log, 'a'));
	bus.subscribe('b', makeLogger(log, 'b'));
	bus.subscribe('c', makeLogger(log, 'c'));
	bus.notify('b');
	bus.flush();
	assert.deepEqual(log, [
		[
			'b',
			'b',
			2,
		],
	], 'only the exact-key bucket fired — no scan of siblings');
});
test('flat fast path: nested change fires the sole bare-key ancestor at its own value, not a same-prefix sibling', () => {
	const bus = new TestBus();
	bus.state = {
		a: {
			b: 'deep',
		},
		ab: 'sibling',
	};
	const log = [];
	bus.subscribe('a', makeLogger(log, 'a'));
	bus.subscribe('ab', makeLogger(log, 'ab'));
	bus.notify('a.b');
	bus.flush();
	assert.deepEqual(log, [
		[
			'a',
			'a.b',
			bus.state.a,
		],
	], 'ancestor "a" fired (value at "a", changed "a.b"); "ab" is not a dot-boundary prefix');
});
test('flat fast path: empty-path bucket matches only an empty change', () => {
	const bus = new TestBus();
	bus.state = {
		a: 1,
	};
	const log = [];
	bus.subscribe('', makeLogger(log, 'root'));
	bus.subscribe('a', makeLogger(log, 'a'));
	bus.notify('a');
	bus.flush();
	assert.deepEqual(log, [
		[
			'a',
			'a',
			1,
		],
	], 'non-empty change does not reach the "" bucket on the fast path');
	log.length = 0;
	bus.notify('');
	bus.flush();
	assert.deepEqual(log, [
		[
			'root',
			'',
			bus.state,
		],
	], 'empty change reaches only the "" bucket');
});
test('flat fast path: mid-dispatch sibling unsubscribe is suppressed (once-per-batch contract preserved)', () => {
	const bus = new TestBus();
	bus.state = {
		x: 1,
	};
	const log = [];
	let second = null;
	function firstHandler() {
		log.push('first');
		second.unsubscribe();
	}
	bus.subscribe('x', firstHandler);
	second = bus.subscribe('x', makeLogger(log, 'second'));
	bus.notify('x');
	bus.flush();
	assert.deepEqual(log, ['first'], 'the bucket snapshot + null-handler guard suppress the torn-down sibling');
});
test('nestedPathCount invariant: tracks live dotted buckets exactly across subscribe/unsubscribe churn and toggles the fast path', () => {
	const bus = new TestBus();
	assert.equal(bus.nestedPathCount, 0, 'starts flat');
	const flat = bus.subscribe('a', makeLogger([], 'a'));
	assert.equal(bus.nestedPathCount, 0, 'a flat bucket does not count');
	const nestedOne = bus.subscribe('user.name', makeLogger([], 'n'));
	const nestedTwo = bus.subscribe('user.email', makeLogger([], 'e'));
	assert.equal(bus.nestedPathCount, 2, 'two distinct dotted buckets counted');
	assert.equal(countDottedBuckets(bus), 2, 'counter agrees with live subs');
	// A second subscriber on an existing dotted bucket must NOT re-increment.
	const nestedOneAgain = bus.subscribe('user.name', makeLogger([], 'n2'));
	assert.equal(bus.nestedPathCount, 2, 'a second sub on an existing dotted bucket does not double-count');
	nestedOne.unsubscribe();
	assert.equal(bus.nestedPathCount, 2, 'bucket still live (n2 remains) — no decrement');
	nestedOneAgain.unsubscribe();
	assert.equal(bus.nestedPathCount, 1, 'last sub on the bucket dropped it — decrement');
	nestedTwo.unsubscribe();
	assert.equal(bus.nestedPathCount, 0, 'all dotted buckets gone — fast path re-enabled');
	assert.equal(countDottedBuckets(bus), 0, 'counter agrees with live subs after churn');
	flat.unsubscribe();
	assert.equal(bus.nestedPathCount, 0, 'dropping the flat bucket leaves the counter at 0');
});
