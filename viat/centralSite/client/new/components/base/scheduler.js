import { isPromiseLike } from './utilities.js';
const usePostTask = typeof scheduler !== 'undefined' && typeof scheduler.postTask === 'function';
let batch = null;
function queueAsyncError(error) {
	queueMicrotask(() => {
		throw error;
	});
}
async function flush() {
	const currentBatch = batch;
	batch = null;
	if (!currentBatch) {
		return;
	}
	const pendingTasks = [];
	for (const fn of currentBatch.tasks) {
		try {
			const result = fn();
			if (isPromiseLike(result)) {
				pendingTasks.push(result);
			}
		} catch (error) {
			queueAsyncError(error);
		}
	}
	if (pendingTasks.length) {
		const settledResults = await Promise.allSettled(pendingTasks);
		for (const settledResult of settledResults) {
			if (settledResult.status === 'rejected') {
				queueAsyncError(settledResult.reason);
			}
		}
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
