import { isPromiseLike, queueAsyncError } from '../utilities.js';
const usePostTask = typeof scheduler !== 'undefined' && typeof scheduler.postTask === 'function';
let batch = null;
let nextFrameQueue = [];
let nextFrameScheduled = false;
function runNextFrameQueue() {
	const callbacks = nextFrameQueue;
	nextFrameQueue = [];
	nextFrameScheduled = false;
	for (let index = 0; index < callbacks.length; index++) {
		callbacks[index]();
	}
}
function captureNextFrameResolve(resolve) {
	nextFrameQueue.push(resolve);
}
export function nextFrame() {
	const promise = new Promise(captureNextFrameResolve);
	if (!nextFrameScheduled) {
		nextFrameScheduled = true;
		requestAnimationFrame(runNextFrameQueue);
	}
	return promise;
}
async function flush() {
	const currentBatch = batch;
	batch = null;
	if (!currentBatch) {
		return;
	}
	const pendingTasks = [];
	/** Iterate `Map<key, task>` entries; when `key !== task`, the key IS the
	 * target object (a Spot, typically) and the task is dispatched via
	 * `task.call(target)`. When `key === task`, no target was provided — plain
	 * function call. This dedup-by-target shape lets a single prototype method
	 * (e.g. `Spot.prototype.runTask`) serve as the task across many targets
	 * without colliding in the batch map. */
	const entries = [...currentBatch.tasks.entries()];
	for (let i = 0; i < entries.length; i++) {
		const key = entries[i][0];
		const task = entries[i][1];
		const result = key === task ? task() : task.call(key);
		if (isPromiseLike(result)) {
			pendingTasks.push(result);
		}
	}
	if (pendingTasks.length) {
		const settledResults = await Promise.allSettled(pendingTasks);
		for (let i = 0; i < settledResults.length; i++) {
			if (settledResults[i].status === 'rejected') {
				queueAsyncError(settledResults[i].reason);
			}
		}
	}
	currentBatch.resolve();
}
function startFlushViaPostTask() {
	scheduler.postTask(flush, {
		priority: 'user-visible',
	});
}
function startFlushViaRAF() {
	requestAnimationFrame(flush);
}
function ensureBatch() {
	if (batch) {
		return;
	}
	let resolve;
	const promise = new Promise((capture) => {
		resolve = capture;
	});
	batch = {
		tasks: new Map(),
		promise,
		resolve,
	};
	if (usePostTask) {
		startFlushViaPostTask();
	} else {
		startFlushViaRAF();
	}
}
/** `schedule(task)` keeps the legacy signature (used by app code, lifecycle
 * helpers, etc.). `schedule(task, target)` dedups by `target` identity and
 * invokes the task as `task.call(target)` at flush time — the lever that
 * lets `Spot.prototype.runTask` serve as the shared task across all spots
 * with zero per-spot `.bind`. */
export function schedule(task, target) {
	ensureBatch();
	const key = target ?? task;
	batch.tasks.set(key, task);
	return batch.promise;
}
