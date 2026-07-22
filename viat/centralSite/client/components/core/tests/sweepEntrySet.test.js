import assert from 'node:assert/strict';
import test from 'node:test';
/*
 * D6 (tk:37) — the shared disconnect sweep behind clearEventListeners and
 * clearDelegateListeners. The contract worth pinning is the SNAPSHOT: both
 * EventEntry.unsubscribe and DelegateEntry.unsubscribe end by removing
 * themselves from the very Set being walked, so iterating the live Set would
 * mutate it mid-walk. These tests fail against a naive `for (const entry of
 * entries)` rewrite, which is the point — the snapshot reads like defensive
 * boilerplate and is not.
 */
const { sweepEntrySet } = await import('../utilities.js');
class SelfRemovingEntry {
	constructor(owner, log, entryName) {
		this.owner = owner;
		this.log = log;
		this.name = entryName;
		this.calls = 0;
	}
	unsubscribe() {
		this.calls += 1;
		this.log.push(this.name);
		this.owner.delete(this);
	}
}
test('every entry is swept even though each removes itself mid-walk', () => {
	const entries = new Set();
	const log = [];
	entries.add(new SelfRemovingEntry(entries, log, 'first'));
	entries.add(new SelfRemovingEntry(entries, log, 'second'));
	entries.add(new SelfRemovingEntry(entries, log, 'third'));
	sweepEntrySet(entries);
	assert.deepEqual(log, [
		'first',
		'second',
		'third',
	], 'all three swept in insertion order');
	assert.equal(entries.size, 0, 'the set ends empty');
});
test('each entry is unsubscribed exactly once', () => {
	const entries = new Set();
	const log = [];
	const only = new SelfRemovingEntry(entries, log, 'only');
	entries.add(only);
	sweepEntrySet(entries);
	assert.equal(only.calls, 1, 'no double teardown');
});
function sweepNothing() {
	sweepEntrySet(undefined);
	sweepEntrySet(null);
	sweepEntrySet(new Set());
}
test('an absent or empty set is a no-op', () => {
	assert.doesNotThrow(sweepNothing, 'the disconnect path runs on components that never subscribed');
});
test('an entry added DURING the sweep survives — it was not in the snapshot', () => {
	const entries = new Set();
	const log = [];
	const late = new SelfRemovingEntry(entries, log, 'late');
	class ResubscribingEntry extends SelfRemovingEntry {
		unsubscribe() {
			super.unsubscribe();
			this.owner.add(late);
		}
	}
	entries.add(new ResubscribingEntry(entries, log, 'resubscriber'));
	sweepEntrySet(entries);
	assert.deepEqual(log, ['resubscriber'], 'only the snapshotted entry was swept');
	assert.equal(entries.size, 0, 'the trailing clear() still empties the set');
	assert.equal(late.calls, 0, 'the late entry was never torn down');
});
