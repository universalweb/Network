const usePostTask = typeof scheduler !== 'undefined' && typeof scheduler.postTask === 'function';
let batch = null;
function flush() {
	const b = batch;
	batch = null;
	for (const fn of b.tasks) {
		fn();
	}
	b.resolve();
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
			scheduler.postTask(flush, {
				priority: 'user-visible',
			});
		} else {
			requestAnimationFrame(flush);
		}
	}
	batch.tasks.add(fn);
	return batch.promise;
}
