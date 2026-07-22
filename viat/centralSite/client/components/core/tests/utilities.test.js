import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePath, setValueAtPath, syncSubsByDiff } from '../utilities.js';
/*
 * Pure-node suite for the two reactive hot-path primitives (X6 setValueAtPath,
 * KNOWN-3 syncSubsByDiff). No happy-dom — both functions are DOM-free. The
 * syncSubsByDiff cases route their per-call counters through the real
 * subscribe(key, context) channel, mirroring how render.js / template.js call
 * it, so no wrapper closures are needed to observe subscribe/dispose activity.
 */
class TrackSub {
	constructor(key, counters) {
		this.key = key;
		this.counters = counters;
		this.disposed = false;
	}
	unsubscribe() {
		this.disposed = true;
		this.counters.disposeCount += 1;
	}
}
function countingSubscribe(key, counters) {
	counters.subCount += 1;
	return new TrackSub(key, counters);
}
function makeCounters() {
	return {
		subCount: 0,
		disposeCount: 0,
	};
}
test('setValueAtPath: nested write reaches the leaf', () => {
	const source = {
		alpha: {
			beta: {
				gamma: 0,
			},
		},
	};
	setValueAtPath(source, 'alpha.beta.gamma', 42);
	assert.equal(source.alpha.beta.gamma, 42);
});
test('setValueAtPath: single-key fast path writes the own key', () => {
	const source = {};
	setValueAtPath(source, 'count', 7);
	assert.equal(source.count, 7);
});
test('setValueAtPath: auto-vivifies missing containers', () => {
	const source = {};
	setValueAtPath(source, 'a.b.c', 1);
	assert.deepEqual(source, {
		a: {
			b: {
				c: 1,
			},
		},
	});
});
test('setValueAtPath: dynamic array-index path populates the cache and writes', () => {
	const source = {
		items: [],
	};
	setValueAtPath(source, 'items.4821.label', 'z');
	assert.equal(source.items[4821].label, 'z');
});
test('setValueAtPath: never mutates the shared parsePath cache array', () => {
	const before = parsePath('one.two.three');
	assert.equal(before.length, 3);
	const source = {
		one: {
			two: {
				three: 0,
			},
		},
	};
	setValueAtPath(source, 'one.two.three', 9);
	// same cached instance the read path reuses — a split+pop impl would shrink it to 2
	assert.equal(before.length, 3, 'setValueAtPath must not pop the cached array');
	assert.deepEqual(before, [
		'one',
		'two',
		'three',
	]);
});
test('syncSubsByDiff: initial pass subscribes every next key once', () => {
	const current = new Map();
	const nextKeys = new Set([
		'a',
		'b',
		'c',
	]);
	const counters = makeCounters();
	const result = syncSubsByDiff(current, nextKeys, countingSubscribe, counters);
	assert.equal(result, current);
	assert.equal(current.size, 3);
	assert.equal(counters.subCount, 3);
	assert.equal(counters.disposeCount, 0);
});
test('syncSubsByDiff: unchanged deps are a no-op — no churn, stable refs', () => {
	const current = new Map();
	const nextKeys = new Set([
		'a',
		'b',
		'c',
	]);
	const counters = makeCounters();
	syncSubsByDiff(current, nextKeys, countingSubscribe, counters);
	const subA = current.get('a');
	const subB = current.get('b');
	const subC = current.get('c');
	const result = syncSubsByDiff(current, nextKeys, countingSubscribe, counters);
	assert.equal(result, current, 'returns the same map');
	assert.equal(counters.subCount, 3, 'no re-subscribe on unchanged deps');
	assert.equal(counters.disposeCount, 0, 'no dispose on unchanged deps');
	assert.equal(current.get('a'), subA, 'stable key keeps its subscription reference');
	assert.equal(current.get('b'), subB);
	assert.equal(current.get('c'), subC);
});
test('syncSubsByDiff: equal-size membership change disposes dropped + subscribes added', () => {
	const current = new Map();
	const counters = makeCounters();
	syncSubsByDiff(current, new Set([
		'a',
		'b',
		'c',
	]), countingSubscribe, counters);
	const subA = current.get('a');
	const subC = current.get('c');
	const droppedB = current.get('b');
	syncSubsByDiff(current, new Set([
		'a',
		'c',
		'd',
	]), countingSubscribe, counters);
	assert.deepEqual([...current.keys()].sort(), [
		'a',
		'c',
		'd',
	]);
	assert.equal(counters.disposeCount, 1, 'only the dropped key is disposed');
	assert.equal(droppedB.disposed, true, 'the dropped subscription specifically was unsubscribed');
	assert.equal(counters.subCount, 4, 'only the added key mints a new subscription');
	assert.equal(current.get('a'), subA, 'surviving key keeps its reference');
	assert.equal(current.get('c'), subC);
	assert.equal(subA.disposed, false, 'surviving subscription is untouched');
});
test('syncSubsByDiff: shrinking deps dispose the removed keys, add nothing', () => {
	const current = new Map();
	const counters = makeCounters();
	syncSubsByDiff(current, new Set([
		'a',
		'b',
		'c',
	]), countingSubscribe, counters);
	syncSubsByDiff(current, new Set(['a']), countingSubscribe, counters);
	assert.deepEqual([...current.keys()], ['a']);
	assert.equal(counters.disposeCount, 2, 'both removed keys disposed');
	assert.equal(counters.subCount, 3, 'no new subscriptions on shrink');
});
