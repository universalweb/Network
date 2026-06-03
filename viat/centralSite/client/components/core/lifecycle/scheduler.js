import { isPromiseLike, queueAsyncError } from '../utilities.js';
import { Perf } from '../debug/perf.js';
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
	const perfMark = Perf.mark('schedulerFlush');
	const currentBatch = batch;
	batch = null;
	if (!currentBatch) {
		Perf.measure('schedulerFlush', perfMark);
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
	Perf.measure('schedulerFlush', perfMark);
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
	/*
	 * Promise.withResolvers() avoids the per-batch executor closure that
	 * the `new Promise((capture) => { resolve = capture; })` pattern needs.
	 * Supported in every browser target (Chrome 119+ / Firefox 121+ / Safari 17.4+).
	 * NOTE: the project-wide floor is now Firefox 128 — raised by the no-shadow
	 * `@scope` style scoping (styles/styleApi.js), not by this Promise feature.
	 */
	const deferred = Promise.withResolvers();
	batch = {
		tasks: new Map(),
		promise: deferred.promise,
		resolve: deferred.resolve,
	};
	if (usePostTask) {
		startFlushViaPostTask();
	} else {
		startFlushViaRAF();
	}
}
/**
 * Schedule a task for the next batch flush. `schedule(task)` keeps the legacy
 * signature (app code, lifecycle helpers). `schedule(task, target)` dedups by
 * `target` identity and invokes as `task.call(target)` at flush time — the
 * lever that lets `Spot.prototype.runTask` serve as the shared task across all
 * spots with zero per-spot `.bind`.
 * @param {Function} task - The task to run at flush time.
 * @param {object} [target] - Optional dedup key + `this` for `task.call(target)`.
 * @returns {Promise} Resolves when the batch flushes.
 */
export function schedule(task, target) {
	ensureBatch();
	const key = target ?? task;
	batch.tasks.set(key, task);
	return batch.promise;
}
/*
 * ── Per-microtask spot drain ─────────────────────────────────────────
 * Replaces the old per-spot postTask/RAF scheduling for reactive template
 * spots. A spot marks itself dirty during a bus flush (Spot.handle →
 * markSpotDirty); drainSpots() runs ONCE at the tail of masterFlush — the
 * same microtask the path bus already pays (state/pathSubscriptions.js) — so
 * an update is a single microtask hop with zero per-spot task allocation.
 * Parity with Lit/Vue's per-element microtask batch, but coalesced across the
 * whole flush (component + global buses both feed one drain). BindingSpots
 * apply the bus-resolved value captured in `handle` (no re-read); every other
 * kind re-evaluates — both dispatched through the spot's `drain()` virtual.
 */
const dirtySpots = new Set();
export function markSpotDirty(spot) {
	dirtySpots.add(spot);
}
export function drainSpots() {
	if (!dirtySpots.size) {
		return;
	}
	/*
	 * Snapshot + clear before the loop: a drain that triggers a state write
	 * re-notifies → schedules the next masterFlush → drains the re-dirtied spot
	 * next microtask (matches the old postTask deferral, no reentrant double-run).
	 */
	const spots = [...dirtySpots];
	dirtySpots.clear();
	for (let index = 0; index < spots.length; index++) {
		spots[index].drain();
	}
}
/*
 * ── Per-microtask global-render drain ────────────────────────────────
 * A component that bare-reads `this.globalState.x` subscribes a renderDep on
 * the SHARED global bus. Unlike a per-component state bus, the global bus has
 * no onFlush→updateView hook (one bus serves every component), so its renderDep
 * subscribers (markRenderDirtyGlobal) enqueue here instead. drainGlobalRenders
 * runs ONCE at the tail of masterFlush and kicks each dirtied component's
 * updateView exactly once (Set dedup) — the global-state analogue of drainSpots.
 */
const pendingGlobalRenders = new Set();
export function queueGlobalRender(component) {
	pendingGlobalRenders.add(component);
}
export function drainGlobalRenders() {
	if (!pendingGlobalRenders.size) {
		return;
	}
	const components = [...pendingGlobalRenders];
	pendingGlobalRenders.clear();
	for (let index = 0; index < components.length; index++) {
		const result = components[index].updateView();
		if (isPromiseLike(result)) {
			result.catch(queueAsyncError);
		}
	}
}
