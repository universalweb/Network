import assert from 'node:assert/strict';
import test from 'node:test';
/*
 * Spot-drain failure CONTRACT — the drainSpots analogue of the bus contract
 * (state/tests/flushContract.test.js): spot.drain() runs app-authored template
 * expressions and app getters bare, so a throw unwinds the drain RAW at its
 * origin. Documented cost pinned here: the batch was consumed (snapshot+clear
 * before the loop), so remaining dequeued spots are dropped for that microtask
 * and the thrower is not re-queued — a spot re-dirties on its next state
 * change, so nothing wedges permanently.
 */
const {
	drainSpots, markSpotDirty,
} = await import('../scheduler.js');
class RecordingSpot {
	constructor(log, spotName, shouldThrow) {
		this.log = log;
		this.name = spotName;
		this.shouldThrow = shouldThrow;
	}
	drain() {
		if (this.shouldThrow) {
			throw new Error(`${this.name} drain exploded`);
		}
		this.log.push(this.name);
	}
}
test('a throwing spot drain unwinds raw — fail fast, nothing laundered', () => {
	const log = [];
	markSpotDirty(new RecordingSpot(log, 'first', true));
	markSpotDirty(new RecordingSpot(log, 'second', false));
	assert.throws(drainSpots, /first drain exploded/, 'the original error propagates with its stack, unconverted');
	/* Documented cost of the contract: the consumed batch's remaining spots are dropped. */
	assert.deepEqual(log, [], 'spots after the violator are skipped for that microtask');
});
test('the consumed batch is not re-queued — the drain recovers on the next dirty cycle', () => {
	const log = [];
	drainSpots();
	assert.deepEqual(log, [], 'the previous test\'s batch was consumed — no re-drain of the thrower');
	markSpotDirty(new RecordingSpot(log, 'fresh', false));
	drainSpots();
	assert.deepEqual(log, ['fresh'], 'a newly dirtied spot drains normally after a violation — no wedge');
});
