import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * E6 (tk:37) — the bus (Tier 2, `document`) and env (Tier 4, `globalThis`)
 * masters, which were two hand-written copies of the same dispatch + attach +
 * detach trio and are now one MasterRegistry class whose INSTANCE is the
 * EventListener.
 *
 * These tests exist because the round trip they cover had NO coverage: the only
 * pre-existing bus test asserted WeakRef identity and never dispatched, so a
 * green suite said nothing about whether delegation actually still worked.
 * Every case here drives a real dispatched event.
 *
 * The detach half is the part most likely to rot: `removeEventListener` matches
 * on (type, listener, capture), so the master must be removed with the SAME
 * instance and the SAME options it was added with. A mismatch leaves a live
 * listener that silently re-fires into an empty bucket forever.
 */
GlobalRegistrator.register();
const {
	delegate, onEnv,
} = await import('../delegate.js');
const { createBusEvent } = await import('../../events/events.js');
function isLeakCheckCall(call) {
	return call.eventName === 'app:leakcheck';
}
function makeRecorder() {
	const calls = [];
	function record(domEvent) {
		calls.push(domEvent.type);
	}
	return {
		calls,
		record,
	};
}
test('bus tier: a delegated handler fires, then stops after unsubscribe', () => {
	const owner = document.createElement('div');
	const recorder = makeRecorder();
	const entry = delegate.call(owner, 'app:ping', recorder.record);
	document.dispatchEvent(createBusEvent('app:ping', null));
	assert.deepEqual(recorder.calls, ['app:ping'], 'the master dispatched into the bucket');
	entry.unsubscribe();
	document.dispatchEvent(createBusEvent('app:ping', null));
	assert.deepEqual(recorder.calls, ['app:ping'], 'no dispatch after the master detached');
});
test('env tier: the globalThis master dispatches and detaches independently', () => {
	const owner = document.createElement('div');
	const recorder = makeRecorder();
	const entry = onEnv.call(owner, 'app:envtick', recorder.record);
	globalThis.dispatchEvent(new Event('app:envtick'));
	assert.deepEqual(recorder.calls, ['app:envtick'], 'the env master dispatched');
	entry.unsubscribe();
	globalThis.dispatchEvent(new Event('app:envtick'));
	assert.deepEqual(recorder.calls, ['app:envtick'], 'no dispatch after the env master detached');
});
test('the two tiers stay isolated — one master per target, not one shared', () => {
	const owner = document.createElement('div');
	const busRecorder = makeRecorder();
	const envRecorder = makeRecorder();
	const busEntry = delegate.call(owner, 'app:shared', busRecorder.record);
	const envEntry = onEnv.call(owner, 'app:shared', envRecorder.record);
	globalThis.dispatchEvent(new Event('app:shared'));
	assert.deepEqual(envRecorder.calls, ['app:shared'], 'env saw its own dispatch');
	assert.deepEqual(busRecorder.calls, [], 'the bus bucket is a separate registry');
	busEntry.unsubscribe();
	envEntry.unsubscribe();
});
test('several entries share ONE master; it detaches only when the last one goes', () => {
	const owner = document.createElement('div');
	const first = makeRecorder();
	const second = makeRecorder();
	const firstEntry = delegate.call(owner, 'app:multi', first.record);
	const secondEntry = delegate.call(owner, 'app:multi', second.record);
	document.dispatchEvent(createBusEvent('app:multi', null));
	assert.equal(first.calls.length, 1, 'first handler fired');
	assert.equal(second.calls.length, 1, 'second handler fired');
	firstEntry.unsubscribe();
	document.dispatchEvent(createBusEvent('app:multi', null));
	assert.equal(first.calls.length, 1, 'the unsubscribed entry stopped');
	assert.equal(second.calls.length, 2, 'the surviving entry still fires — master stayed attached');
	secondEntry.unsubscribe();
	document.dispatchEvent(createBusEvent('app:multi', null));
	assert.equal(second.calls.length, 2, 'master detached once the bucket emptied');
});
/*
 * The dispatch tests above CANNOT catch a leaked master: handleEvent early-
 * returns on a missing bucket, so an un-removed listener firing into an empty
 * bucket is behaviorally identical to a detached one. Proven by mutation —
 * dropping the options arg from removeEventListener leaves all five green.
 * A leak is only observable at the registration boundary, so assert there.
 */
test('the master is removed with the SAME listener and options it was added with', () => {
	const owner = document.createElement('div');
	const recorder = makeRecorder();
	const added = [];
	const removed = [];
	const realAdd = document.addEventListener;
	const realRemove = document.removeEventListener;
	function captureAdd(eventName, listener, options) {
		added.push({
			eventName,
			listener,
			options,
		});
		return realAdd.call(document, eventName, listener, options);
	}
	function captureRemove(eventName, listener, options) {
		removed.push({
			eventName,
			listener,
			options,
		});
		return realRemove.call(document, eventName, listener, options);
	}
	document.addEventListener = captureAdd;
	document.removeEventListener = captureRemove;
	try {
		const entry = delegate.call(owner, 'app:leakcheck', recorder.record);
		entry.unsubscribe();
	} finally {
		document.addEventListener = realAdd;
		document.removeEventListener = realRemove;
	}
	const addedMaster = added.find(isLeakCheckCall);
	const removedMaster = removed.find(isLeakCheckCall);
	assert.ok(addedMaster, 'the master attached');
	assert.ok(removedMaster, 'the master detached — no leaked document listener');
	assert.equal(removedMaster.listener, addedMaster.listener, 'same listener instance');
	assert.deepEqual(
		removedMaster.options,
		addedMaster.options,
		'same options — removeEventListener matches on capture, so a mismatch leaks the master'
	);
});
test('a re-subscribed event name re-attaches its master after a full teardown', () => {
	const owner = document.createElement('div');
	const first = makeRecorder();
	const firstEntry = delegate.call(owner, 'app:cycle', first.record);
	firstEntry.unsubscribe();
	const second = makeRecorder();
	const secondEntry = delegate.call(owner, 'app:cycle', second.record);
	document.dispatchEvent(createBusEvent('app:cycle', null));
	assert.deepEqual(second.calls, ['app:cycle'], 'the master re-attached for the new subscription');
	assert.deepEqual(first.calls, [], 'the torn-down entry stayed dead');
	secondEntry.unsubscribe();
});
