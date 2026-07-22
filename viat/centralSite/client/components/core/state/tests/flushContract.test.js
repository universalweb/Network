import assert from 'node:assert/strict';
import test from 'node:test';
import { getValueAtPath } from '../../utilities.js';
import { PathSubscriptions } from '../pathSubscriptions.js';
/*
 * Bus failure CONTRACT — fail fast, callee owns its failure. Handlers are
 * invoked bare: a handler that can fail wraps its own risky logic; a throw
 * from an unwrapped handler (or from an app getter/Proxy that getValue reads
 * through) unwinds the flush RAW at its origin — the framework launders
 * nothing. Registration type-gates handlers (subscribe throws TypeError on a
 * non-callable, at the bug). The only framework-settled failure is an async
 * handler rejection, because the framework holds the promise's only reference
 * — unobserved, it would crash the host as an unhandledrejection; it re-throws
 * via queueAsyncError (absorbed here through the scoped uncaught callback).
 */
const absorbedErrors = [];
function absorbQueuedError(error) {
	absorbedErrors.push(error);
}
process.setUncaughtExceptionCaptureCallback(absorbQueuedError);
function flushMicrotasks() {
	return new Promise(queueMicrotask);
}
class RecordingBus extends PathSubscriptions {
	state = {};
	flushCount = 0;
	getValue(path) {
		return getValueAtPath(this.state, path);
	}
	onFlush() {
		this.flushCount += 1;
	}
}
function makeLogger(log, id) {
	return function logFire() {
		log.push(id);
	};
}
function makeThrower(id) {
	return function throwOnFire() {
		throw new Error(`${id} handler exploded`);
	};
}
test('an unwrapped throwing handler unwinds the flush raw — fail fast, nothing laundered', () => {
	const bus = new RecordingBus();
	bus.state = {
		count: 1,
	};
	const log = [];
	bus.subscribe('count', makeThrower('first'));
	bus.subscribe('count', makeLogger(log, 'second'));
	bus.notify('count');
	function flushBus() {
		bus.flush();
	}
	assert.throws(flushBus, /first handler exploded/, 'the original error propagates with its stack, unconverted');
	/* Documented cost of the contract: the unwound flush drops the batch's remaining work. */
	assert.deepEqual(log, [], 'subscribers after the violator are skipped for the consumed batch');
	assert.equal(bus.flushCount, 0, 'onFlush is skipped for the consumed batch');
});
test('a handler that wraps its own risky logic keeps the flush intact — the contract in action', () => {
	const bus = new RecordingBus();
	bus.state = {
		count: 1,
	};
	const log = [];
	function selfHandlingFire() {
		try {
			throw new Error('internal risk');
		} catch {
			log.push('recovered');
		}
	}
	bus.subscribe('count', selfHandlingFire);
	bus.subscribe('count', makeLogger(log, 'sibling'));
	bus.notify('count');
	bus.flush();
	assert.deepEqual(log, [
		'recovered',
		'sibling',
	], 'a self-contained handler costs the flush nothing');
	assert.equal(bus.flushCount, 1, 'the flush ran to completion — render kick intact');
});
test('subscribe type-gates the handler at registration — the bug breaks at its origin', () => {
	const bus = new RecordingBus();
	function subscribeNonCallable() {
		bus.subscribe('count', 'not-a-function');
	}
	assert.throws(subscribeNonCallable, TypeError, 'a non-callable handler never enters the dispatch path');
});
test('a throwing app getter in state propagates raw — reading IS executing app code', () => {
	const bus = new RecordingBus();
	bus.state = {};
	Object.defineProperty(bus.state, 'hostile', {
		enumerable: true,
		get() {
			throw new Error('user getter exploded');
		},
	});
	bus.subscribe('hostile', makeThrower('never-reached'));
	bus.notify('hostile');
	function flushBus() {
		bus.flush();
	}
	assert.throws(flushBus, /user getter exploded/, 'the app getter throw surfaces with the app stack');
});
test('the bus recovers after a contract violation — next batch delivers, no wedge', () => {
	const bus = new RecordingBus();
	bus.state = {
		alpha: 1,
		beta: 2,
	};
	const log = [];
	bus.subscribe('alpha', makeThrower('alpha'));
	bus.subscribe('beta', makeLogger(log, 'beta'));
	bus.notify('alpha');
	function flushBus() {
		bus.flush();
	}
	assert.throws(flushBus, /alpha handler exploded/);
	bus.notify('beta');
	bus.flush();
	assert.deepEqual(log, ['beta'], 'the next batch dispatched normally after the violation');
	assert.equal(bus.flushCount, 1, 'onFlush fired for the healthy batch');
});
test('an async handler rejection is settled by the framework — sole holder of the promise', async () => {
	const bus = new RecordingBus();
	bus.state = {
		count: 1,
	};
	async function rejectingFire() {
		throw new Error('async handler exploded');
	}
	bus.subscribe('count', rejectingFire);
	bus.notify('count');
	bus.flush();
	assert.equal(bus.flushCount, 1, 'a rejecting async handler never blocks the sync flush');
	await flushMicrotasks();
	await flushMicrotasks();
	await flushMicrotasks();
	assert.equal(absorbedErrors.length, 1, 'the rejection re-surfaced raw through queueAsyncError');
	assert.equal(absorbedErrors[0].message, 'async handler exploded');
	absorbedErrors.length = 0;
	process.setUncaughtExceptionCaptureCallback(null);
});
