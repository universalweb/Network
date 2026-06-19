/*
 * Global configuration. MUST be the first import of every page entry
 * (index.js, preview.js) — core/debug/logger.js reads globalThis.CONFIG at
 * module init, so this has to execute before any core module loads.
 */
globalThis.CONFIG = {
	production: false,
	/*
	 * Dev log verbosity (see core/debug/logger.js LEVEL_RANK).
	 *   'info'  — default: boot banners + warnings, per-render flood muted
	 *   'debug' — full per-render lifecycle trace (patch pass / onRender / disconnect)
	 *   'perf'  — debug + WASTED-SET detection: an O(n) deep-compare on every
	 *             state write that flags redundant "set the same value" writes
	 *             ("are we setting things too much"). Noisiest; dev-only cost.
	 * Drop back to 'info' (or remove) to quiet the console and shed the compare.
	 */
	logLevel: 'perf',
};
