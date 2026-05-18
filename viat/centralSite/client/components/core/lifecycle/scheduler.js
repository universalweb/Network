import { eachArray, isPromiseLike, queueAsyncError } from '../utilities.js';
const usePostTask = typeof scheduler !== 'undefined' && typeof scheduler.postTask === 'function';
let batch = null;
let nextFrameQueue = [];
let nextFrameScheduled = false;
export function nextFrame() {
	return new Promise((resolve) => {
		nextFrameQueue.push(resolve);
		if (nextFrameScheduled) {
			return;
		}
		nextFrameScheduled = true;
		requestAnimationFrame(() => {
			const callbacks = nextFrameQueue;
			nextFrameQueue = [];
			nextFrameScheduled = false;
			for (let index = 0; index < callbacks.length; index++) {
				callbacks[index]();
			}
		});
	});
}
async function flush() {
	const currentBatch = batch;
	batch = null;
	if (!currentBatch) {
		return;
	}
	const pendingTasks = [];
	currentBatch.tasks.forEach((fn) => {
		const result = fn();
		if (isPromiseLike(result)) {
			pendingTasks.push(result);
		}
	});
	if (pendingTasks.length) {
		const settledResults = await Promise.allSettled(pendingTasks);
		eachArray(settledResults, (settledResult) => {
			if (settledResult.status === 'rejected') {
				queueAsyncError(settledResult.reason);
			}
		});
	}
	currentBatch.resolve();
}
export function schedule(fn) {
	if (!batch) {
		let resolve;
		const promise = new Promise((r) => {
			resolve = r;
		});
		batch = {
			tasks: new Set(),
			promise,
			resolve,
		};
		if (usePostTask) {
			scheduler.postTask(() => {
				return flush();
			}, {
				priority: 'user-visible',
			});
		} else {
			requestAnimationFrame(() => {
				return flush();
			});
		}
	}
	batch.tasks.add(fn);
	return batch.promise;
}
