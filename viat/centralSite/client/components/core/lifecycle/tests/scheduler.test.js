import assert from 'node:assert/strict';
import test from 'node:test';
/*
 * Pure-node suite — node has no requestAnimationFrame, so stub it with a
 * macrotask BEFORE the module loads (scheduler.js resolves its postTask/rAF
 * strategy at call time, but stubbing first keeps load order irrelevant).
 */
globalThis.requestAnimationFrame = function stubRequestAnimationFrame(callback) {
	return setTimeout(callback, 0);
};
const {
	nextFrame, schedule,
} = await import('../scheduler.js');
function resolveAfterFiveMs(resolve) {
	setTimeout(resolve, 5);
}
test('schedule: dedups by target identity and invokes task.call(target)', async () => {
	const calls = [];
	function runTask() {
		calls.push(this);
	}
	const target = {
		id: 'spot',
	};
	const first = schedule(runTask, target);
	const second = schedule(runTask, target);
	assert.equal(first, second);
	await first;
	assert.equal(calls.length, 1);
	assert.equal(calls[0], target);
});
test('schedule: plain task runs once per batch flush', async () => {
	let runs = 0;
	function bump() {
		runs += 1;
	}
	await schedule(bump);
	assert.equal(runs, 1);
});
test('schedule: batch promise resolves only after async tasks settle', async () => {
	let settled = false;
	async function slowTask() {
		await new Promise(resolveAfterFiveMs);
		settled = true;
	}
	await schedule(slowTask);
	assert.equal(settled, true);
});
/*
 * Regression locks for the shared per-frame promise: all same-frame callers
 * get ONE promise; state resets before resolve so a re-call from an awaiter
 * books the NEXT frame; awaiters resume in call order (reaction order).
 */
test('nextFrame: same-frame callers share one promise; re-call after the frame books a new one', async () => {
	const first = nextFrame();
	const second = nextFrame();
	assert.equal(first, second);
	await first;
	const third = nextFrame();
	assert.notEqual(third, first);
	await third;
});
test('nextFrame: awaiters resume in call order', async () => {
	const order = [];
	async function waitFirst() {
		await nextFrame();
		order.push('first');
	}
	async function waitSecond() {
		await nextFrame();
		order.push('second');
	}
	const pendingFirst = waitFirst();
	const pendingSecond = waitSecond();
	await Promise.all([
		pendingFirst,
		pendingSecond,
	]);
	assert.deepEqual(order, [
		'first',
		'second',
	]);
});
