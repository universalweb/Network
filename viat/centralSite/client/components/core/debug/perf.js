import { IS_PRODUCTION } from './logger.js';
/**
 * Lightweight in-browser perf recorder for the framework's hot paths.
 *
 * Usage from the test page (or devtools):
 *   import { Perf } from './core/debug/perf.js';
 *   Perf.start();
 *   // ...trigger workload...
 *   Perf.stop();
 *   console.table(Perf.report());
 *
 * Zero-cost in production: `IS_PRODUCTION === true` early-returns from every
 * call site. When not in production but `active === false`, `mark()` still
 * returns null in ~1ns (single branch). The hot-path call sites pair
 * `Perf.mark(category)` with `Perf.measure(category, startTime)` — a null
 * startTime short-circuits `measure()` so cold sites pay nothing.
 *
 * Sample buffer per category capped at SAMPLE_LIMIT — once full, percentiles
 * stop tracking new samples (count/total/max keep accumulating). Cheap memory
 * upper bound during a long workload.
 */
const SAMPLE_LIMIT = 4096;
const records = new Map();
let active = false;
function getRecord(category) {
	let entry = records.get(category);
	if (!entry) {
		entry = {
			count: 0,
			total: 0,
			max: 0,
			samples: [],
		};
		records.set(category, entry);
	}
	return entry;
}
function quantile(sortedSamples, p) {
	if (!sortedSamples.length) {
		return 0;
	}
	const index = Math.min(sortedSamples.length - 1, Math.floor(sortedSamples.length * p));
	return sortedSamples[index];
}
export const Perf = {
	start() {
		if (IS_PRODUCTION) {
			return;
		}
		records.clear();
		active = true;
	},
	stop() {
		active = false;
	},
	clear() {
		records.clear();
	},
	isActive() {
		return active && !IS_PRODUCTION;
	},
	/**
	 * Capture a start timestamp for a category. Returns `null` when recording
	 * is off (production OR not started). Hot-path call sites should pair
	 * every `mark` with a `measure` using the returned value as `startTime`.
	 */
	mark(category) {
		if (!active || IS_PRODUCTION) {
			return null;
		}
		return performance.now();
	},
	/**
	 * Record the elapsed time since `startTime` against `category`. No-op when
	 * `startTime` is null (recording was off when `mark` ran) so call sites
	 * never need to guard their `measure` calls — the null acts as a sentinel.
	 */
	measure(category, startTime) {
		if (startTime === null || IS_PRODUCTION) {
			return;
		}
		const duration = performance.now() - startTime;
		const entry = getRecord(category);
		entry.count += 1;
		entry.total += duration;
		if (duration > entry.max) {
			entry.max = duration;
		}
		if (entry.samples.length < SAMPLE_LIMIT) {
			entry.samples.push(duration);
		}
	},
	/**
	 * Snapshot the recorded categories sorted by total time desc. Each row:
	 *   { category, count, totalMs, avgMs, p50Ms, p95Ms, maxMs }
	 * Returns a fresh array of plain objects suitable for `console.table` or
	 * for serializing to the perf log.
	 */
	report() {
		const rows = [];
		const entries = [...records.entries()];
		for (let i = 0; i < entries.length; i++) {
			const category = entries[i][0];
			const entry = entries[i][1];
			const avg = entry.count > 0 ? entry.total / entry.count : 0;
			const sorted = [...entry.samples].sort((a, b) => {
				return a - b;
			});
			rows.push({
				category,
				count: entry.count,
				totalMs: Number(entry.total.toFixed(3)),
				avgMs: Number(avg.toFixed(4)),
				p50Ms: Number(quantile(sorted, 0.5).toFixed(4)),
				p95Ms: Number(quantile(sorted, 0.95).toFixed(4)),
				maxMs: Number(entry.max.toFixed(4)),
			});
		}
		rows.sort((a, b) => {
			return b.totalMs - a.totalMs;
		});
		return rows;
	},
};
/**
 * Walk every WebComponent in the document (including shadow trees) and
 * collect counts. Reads the live DOM each call — no persistent registry —
 * so it's accurate but O(N) in total element count. Cheap for dashboards
 * that fire on demand; do not call inside hot loops.
 */
function walkAllComponents(root, sink) {
	if (!root) {
		return;
	}
	const all = root.querySelectorAll('*');
	for (let i = 0; i < all.length; i++) {
		const el = all[i];
		if (el.isWebComponent) {
			sink.push(el);
		}
		if (el.shadowRoot) {
			walkAllComponents(el.shadowRoot, sink);
		}
	}
}
function readSubscriptionCounts(component) {
	const stateBus = component.stateBus;
	const stateSubs = stateBus?.subs?.size ?? 0;
	const renderDeps = component.renderDepUnsubs?.size ?? 0;
	const stateUnsubs = component.stateUnsubs?.byPath?.size ?? 0;
	const globalUnsubs = component.globalUnsubs?.byPath?.size ?? 0;
	const eventEntries = component.eventEntries?.size ?? 0;
	const delegateEntries = component.delegateEntries?.size ?? 0;
	const hotkeyEntries = component.hotkeyEntries?.size ?? 0;
	const refs = component.refsMap?.size ?? 0;
	return {
		stateSubs,
		renderDeps,
		stateUnsubs,
		globalUnsubs,
		eventEntries,
		delegateEntries,
		hotkeyEntries,
		refs,
	};
}
/**
 * `Perf.census()` snapshot — live count of WebComponent instances, broken
 * out by tag name + phase, plus aggregate subscription totals. Useful as
 * the heartbeat metric for "is the framework actually doing reactive work
 * right now.".
 */
function census() {
	const all = [];
	walkAllComponents(document, all);
	const byTag = new Map();
	const byPhase = new Map();
	let totalStateSubs = 0;
	let totalRenderDeps = 0;
	let totalStateUnsubs = 0;
	let totalGlobalUnsubs = 0;
	let totalEvents = 0;
	let totalDelegates = 0;
	let totalHotkeys = 0;
	let totalRefs = 0;
	for (let i = 0; i < all.length; i++) {
		const el = all[i];
		const tag = el.tagName.toLowerCase();
		byTag.set(tag, (byTag.get(tag) ?? 0) + 1);
		const phase = el.phase ?? '(unset)';
		byPhase.set(phase, (byPhase.get(phase) ?? 0) + 1);
		const counts = readSubscriptionCounts(el);
		totalStateSubs += counts.stateSubs;
		totalRenderDeps += counts.renderDeps;
		totalStateUnsubs += counts.stateUnsubs;
		totalGlobalUnsubs += counts.globalUnsubs;
		totalEvents += counts.eventEntries;
		totalDelegates += counts.delegateEntries;
		totalHotkeys += counts.hotkeyEntries;
		totalRefs += counts.refs;
	}
	return {
		totalComponents: all.length,
		uniqueTags: byTag.size,
		byTag: [...byTag.entries()]
			.sort((a, b) => {
				return b[1] - a[1];
			}),
		byPhase: [...byPhase.entries()],
		totals: {
			stateBusSubs: totalStateSubs,
			renderDeps: totalRenderDeps,
			observers: totalStateUnsubs + totalGlobalUnsubs,
			eventEntries: totalEvents,
			delegateEntries: totalDelegates,
			hotkeyEntries: totalHotkeys,
			refs: totalRefs,
		},
	};
}
/**
 * Best-effort JS heap snapshot. `performance.memory` is Chromium-only and
 * gated behind `--enable-precise-memory-info` for accurate values, but the
 * coarse numbers are still useful for spotting leaks across benchmark runs.
 */
function memory() {
	const perfMemory = globalThis.performance?.memory;
	if (!perfMemory) {
		return null;
	}
	/*
	 * Rounded to whole MB intentionally — Chromium's `performance.memory`
	 * reports sub-MB fluctuations between polls even at idle, which would
	 * patch the JS-heap table every 2s and look like the framework is
	 * busy. Whole-MB resolution is plenty for spotting leaks (the only
	 * real use case here); detailed accounting belongs in DevTools.
	 */
	return {
		usedHeapMb: Math.round(perfMemory.usedJSHeapSize / 1024 / 1024),
		totalHeapMb: Math.round(perfMemory.totalJSHeapSize / 1024 / 1024),
		heapLimitMb: Math.round(perfMemory.jsHeapSizeLimit / 1024 / 1024),
	};
}
/**
 * ── Honest memory + timing benchmarking (dev only) ───────────────────
 * The negative-heap bug devs hit comes from sampling `usedJSHeapSize` across
 * allocating work while GC fires mid-measurement. The fix is discipline, not a
 * formula: force GC → read baseline → run → force GC → read after. Reported as
 * retained (afterSettled − baseline) AND peak (max during run − baseline),
 * never a raw uncorrected delta. `gcHonest:false` flags when GC couldn't be
 * forced (heap numbers are then sawtooth — timing stays valid regardless).
 *
 * Enable forced GC: Chrome → launch with `--js-flags="--expose-gc"` (and
 * `--enable-precise-memory-info` for MB-accurate heap); Node/Bun → `--expose-gc`
 * or Bun.gc. Without it, `Perf.bench` still returns honest TIMING.
 */
function round1(value) {
	return Number(value.toFixed(1));
}
function round2(value) {
	return Number(value.toFixed(2));
}
function round4(value) {
	return Number(value.toFixed(4));
}
function readHeapBytes() {
	const perfMemory = globalThis.performance?.memory;
	return perfMemory ? perfMemory.usedJSHeapSize : 0;
}
function forceGc() {
	if (typeof globalThis.gc === 'function') {
		globalThis.gc();
		return true;
	}
	const bunRuntime = globalThis.Bun;
	if (bunRuntime && typeof bunRuntime.gc === 'function') {
		bunRuntime.gc(true);
		return true;
	}
	return false;
}
function rafTwice() {
	if (typeof requestAnimationFrame !== 'function') {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(resolve);
		});
	});
}
function singleRaf() {
	if (typeof requestAnimationFrame !== 'function') {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
}
/**
 * `--enable-precise-memory-info` makes `usedJSHeapSize` byte-granular; without
 * it Chrome quantizes to coarse buckets. A non-zero sub-MB remainder is a
 * reliable signal the precise flag is active — which lets the no-forced-GC path
 * below trust a min-sampled floor instead of reporting nothing.
 */
function preciseMemoryActive() {
	const bytes = readHeapBytes();
	return bytes > 0 && bytes % 1048576 !== 0;
}
const HEAP_FLOOR_FRAMES = 6;
/**
 * Drain settle — the reactive update lands at the tail of masterFlush (one
 * microtask after a state write); a child-cascade (list assignState) costs one
 * more. Awaiting a few microtasks lets a benched `fn` include the full
 * write→drain→DOM cost in its timed region. Bump `microtasks` for deeper trees.
 */
async function settle(microtasks = 3) {
	const hops = typeof microtasks === 'number' ? microtasks : 3;
	for (let hop = 0; hop < hops; hop++) {
		await Promise.resolve();
	}
}
/**
 * Return a steady-state heap floor in bytes. With forced GC available, that's
 * the canonical "collect → settle paint → collect → read". Without it (e.g.
 * Playwright swallows `--js-flags=--expose-gc`), approximate the post-GC floor
 * by sampling across several RAFs and taking the MINIMUM — any GC that fires in
 * the window pulls the floor down, so retained heap stays meaningful as long as
 * `--enable-precise-memory-info` makes the readings byte-granular.
 */
async function settleHeap() {
	if (forceGc()) {
		await rafTwice();
		forceGc();
		return readHeapBytes();
	}
	let floor = Infinity;
	for (let frame = 0; frame < HEAP_FLOOR_FRAMES; frame++) {
		await singleRaf();
		const bytes = readHeapBytes();
		if (bytes > 0 && bytes < floor) {
			floor = bytes;
		}
	}
	return floor === Infinity ? readHeapBytes() : floor;
}
function percentile(sorted, fraction) {
	if (!sorted.length) {
		return 0;
	}
	const index = Math.min(sorted.length - 1, Math.floor(sorted.length * fraction));
	return sorted[index];
}
function heapConfidenceTier(gcHonest) {
	if (gcHonest) {
		return 'forced-gc';
	}
	if (preciseMemoryActive()) {
		return 'precise-settle';
	}
	return 'coarse';
}
/**
 * Run a benchmark with warmup, GC-honest heap accounting, and percentile
 * timing — the per-call instrument that replaces hand-rolled
 * `performance.now()` plumbing. `fn` may be sync or async (it is awaited, so a
 * reactive bench ends with `await Perf.settle()` to fold the drain into the
 * timed region). Returns a plain row for `console.table`. No-op in production.
 */
async function bench(label, fn, options) {
	if (IS_PRODUCTION) {
		return null;
	}
	const opts = options ?? {};
	const warmupRuns = opts.warmup ?? 5;
	const timedRuns = opts.iterations ?? 30;
	/*
	 * Optional per-iteration setup — run before each timed `fn` but EXCLUDED
	 * from the sample, so a destructive op (e.g. "create from empty") can
	 * re-establish its pre-state every run without polluting the timing.
	 */
	const setup = typeof opts.setup === 'function' ? opts.setup : null;
	const gcHonest = forceGc();
	for (let warm = 0; warm < warmupRuns; warm++) {
		if (setup) {
			await setup();
		}
		await fn();
	}
	const heapBaseline = await settleHeap();
	let heapPeak = heapBaseline;
	const samples = new Array(timedRuns);
	for (let run = 0; run < timedRuns; run++) {
		if (setup) {
			await setup();
		}
		const start = performance.now();
		await fn();
		samples[run] = performance.now() - start;
		const heapNow = readHeapBytes();
		if (heapNow > heapPeak) {
			heapPeak = heapNow;
		}
	}
	const heapAfter = await settleHeap();
	const sorted = [...samples].sort((left, right) => {
		return left - right;
	});
	let total = 0;
	for (let index = 0; index < samples.length; index++) {
		total += samples[index];
	}
	const meanMs = total / timedRuns;
	/*
	 * Heap-confidence tiers:
	 *   forced-gc      — gc() forced at both boundaries; retained is canonical.
	 *   precise-settle — no forced GC, but byte-granular memory + min-sampled
	 *                    floor (settleHeap) make retained meaningful; clamp tiny
	 *                    negatives (net-neutral op) to 0 so it never reads as the
	 *                    confusing negative artifact.
	 *   coarse         — MB-quantized + no GC: retained is noise → report null.
	 */
	const heapMethod = heapConfidenceTier(gcHonest);
	let heapRetainedKb;
	if (heapMethod === 'coarse') {
		heapRetainedKb = null;
	} else if (heapMethod === 'forced-gc') {
		heapRetainedKb = round1((heapAfter - heapBaseline) / 1024);
	} else {
		heapRetainedKb = round1(Math.max(0, heapAfter - heapBaseline) / 1024);
	}
	return {
		bench: label,
		iterations: timedRuns,
		meanMs: round4(meanMs),
		p50Ms: round4(percentile(sorted, 0.5)),
		p95Ms: round4(percentile(sorted, 0.95)),
		minMs: round4(sorted[0] ?? 0),
		maxMs: round4(sorted[sorted.length - 1] ?? 0),
		opsPerSec: meanMs > 0 ? Math.round(1000 / meanMs) : 0,
		heapBaselineMb: round2(heapBaseline / 1048576),
		heapRetainedKb,
		heapPeakKb: round1((heapPeak - heapBaseline) / 1024),
		heapMethod,
		gcHonest,
	};
}
Perf.census = census;
Perf.memory = memory;
Perf.settle = settle;
Perf.settleHeap = settleHeap;
Perf.bench = bench;
Perf.forceGc = forceGc;
// Expose for in-browser devtools poking when not in production.
if (!IS_PRODUCTION && typeof globalThis !== 'undefined') {
	globalThis.Perf = Perf;
}
