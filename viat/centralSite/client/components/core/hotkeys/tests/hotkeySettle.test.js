import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Async-settle contract for hotkey handlers (hotkeys.js invokeHandler, E3).
 *
 * `isPromiseLike` proves only that `.then` exists, so a handler returning a bare
 * thenable used to hit `result.catch(...)` on an object with no `.catch` — a
 * TypeError raised synchronously inside dispatch, which aborted the loop and
 * silently killed every hotkey registered after it on that same keystroke. These
 * tests pin the settle route: the rejection reaches the owner's handleEventError
 * sink, and the dispatch loop survives to run the remaining entries.
 *
 * Same happy-dom harness as hotkeys.test.js — register before the dynamic import.
 */
GlobalRegistrator.register();
const { registerHotkey } = await import('../hotkeys.js');
const { Perf } = await import('../../debug/perf.js');
function keydown(init) {
	document.dispatchEvent(new KeyboardEvent('keydown', {
		bubbles: true,
		cancelable: true,
		...init,
	}));
}
function keyup(init) {
	document.dispatchEvent(new KeyboardEvent('keyup', {
		bubbles: true,
		...init,
	}));
}
function releaseKeyJ() {
	keyup({
		code: 'KeyJ',
		key: 'j',
	});
}
function pressCtrlJ() {
	keydown({
		code: 'KeyJ',
		ctrlKey: true,
		key: 'j',
	});
}
/*
 * A thenable with `.then` and NOTHING else — the exact shape isPromiseLike
 * admits and `.catch` cannot handle. A real Promise would mask the defect.
 */
function makeBareThenable(rejectWith) {
	return {
		then(onFulfilled, onRejected) {
			if (rejectWith) {
				onRejected(rejectWith);
				return undefined;
			}
			onFulfilled();
			return undefined;
		},
	};
}
function makeOwner(errors) {
	return {
		handleEventError(error, domEvent, element, eventName) {
			errors.push({
				eventName,
				message: error.message,
			});
		},
		isConnected: true,
	};
}
test('bare-thenable hotkey handler that rejects: settles into handleEventError', async () => {
	const errors = [];
	const owner = makeOwner(errors);
	const boom = new Error('hotkey handler boom');
	function returnsBareThenable() {
		return makeBareThenable(boom);
	}
	const binding = registerHotkey(owner, 'ctrl+j', returnsBareThenable, 'api');
	pressCtrlJ();
	await Perf.settle(6);
	/*
	 * The decisive assertion — NOT a doesNotThrow. Pre-fix, `result.catch(...)`
	 * raised `TypeError: result.catch is not a function` inside the listener, but
	 * a DOM dispatch boundary absorbs listener throws, so the crash is invisible
	 * from the caller's side. What it actually cost is observable only here: the
	 * rejection never reached the sink at all.
	 */
	assert.equal(errors.length, 1, 'rejection routed to the owner sink, not swallowed');
	assert.equal(errors[0].message, 'hotkey handler boom');
	assert.equal(errors[0].eventName, 'ctrl+j', 'the combo is the hotkey event name');
	binding.unregister();
	releaseKeyJ();
});
test('a throwing handler does not kill the other hotkeys on the same keystroke', async () => {
	const errors = [];
	const owner = makeOwner(errors);
	const ran = [];
	function returnsBareThenable() {
		return makeBareThenable(new Error('first handler boom'));
	}
	function recordsSecond() {
		ran.push('second');
	}
	const first = registerHotkey(owner, 'ctrl+j', returnsBareThenable, 'api');
	const second = registerHotkey(owner, 'ctrl+j', recordsSecond, 'api');
	pressCtrlJ();
	/*
	 * The actual damage the crash caused, and the reason this is a correctness bug
	 * rather than a cosmetic one: dispatch iterates one bucket, so a synchronous
	 * throw from entry one meant entry two never ran at all.
	 */
	assert.deepEqual(ran, ['second'], 'the second entry still ran after the first misbehaved');
	await Perf.settle(6);
	assert.equal(errors.length, 1);
	first.unregister();
	second.unregister();
	releaseKeyJ();
});
test('bare-thenable handler that resolves: no error is routed', async () => {
	const errors = [];
	const owner = makeOwner(errors);
	function returnsResolvingThenable() {
		return makeBareThenable(null);
	}
	const binding = registerHotkey(owner, 'ctrl+j', returnsResolvingThenable, 'api');
	pressCtrlJ();
	await Perf.settle(6);
	assert.equal(errors.length, 0, 'a fulfilled thenable is not an error');
	binding.unregister();
	releaseKeyJ();
});
test('async handler rejecting: still routed to the owner sink', async () => {
	const errors = [];
	const owner = makeOwner(errors);
	async function rejectsAsync() {
		throw new Error('async hotkey boom');
	}
	const binding = registerHotkey(owner, 'ctrl+j', rejectsAsync, 'api');
	pressCtrlJ();
	await Perf.settle(6);
	assert.equal(errors.length, 1, 'a real rejected promise routes the same way');
	assert.equal(errors[0].message, 'async hotkey boom');
	binding.unregister();
	releaseKeyJ();
});
