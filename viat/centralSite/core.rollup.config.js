import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
/*
 * UWC CORE — production rollup.
 *
 * Folds the entire `components/core/` framework into ONE optimized ES module.
 * Core is self-contained (only relative imports inside core/, zero bare
 * specifiers, zero node_modules deps) so nothing is marked external and no
 * app component (user/global/shootout/… folders) is pulled in — the user
 * imports those separately as needed.
 *
 * What the build strips for a clean, log-free benchmark target:
 *   1. `globalThis.CONFIG?.production` → `true`  — forces IS_PRODUCTION on, so
 *      every non-error Logger method collapses to the captured noop and the
 *      dev log-level machinery folds away.
 *   2. `Logger.debugOn` / `Logger.perfOn` → `false` — turns each hot guard into
 *      `if (false) { … }`, which terser's dead_code pass deletes ENTIRELY:
 *      the guard, the Logger.debug/perf call, and the message string all go.
 *
 * Run:  pnpm run build:core      (→ client/components/core/dist/core.js)
 * Test: point the importmap's `webcomponent` specifier at the bundle instead
 *       of core/index.js to benchmark the framework with no logging overhead.
 *       (Not the active path yet — the unbundled modules stay default for now.)
 */
const CORE = './viat/centralSite/client/components/core';
export default {
	input: `${CORE}/index.js`,
	output: {
		file: `${CORE}/dist/core.js`,
		format: 'es',
		sourcemap: true,
		banner: '/* UWC Core — bundled (Rollup) · production · logger + debug/perf guards stripped */',
	},
	plugins: [
		replace({
			preventAssignment: true,
			// Exact full-expression substrings — these tokens are unique to their
			// callsites, so no-delimiter matching is precise and sidesteps the
			// `\b` word-boundary trouble around `?.` and `.`.
			delimiters: ['', ''],
			values: {
				'globalThis.CONFIG?.production': 'true',
				'Logger.debugOn': 'false',
				'Logger.perfOn': 'false',
				// The bundle lives in core/dist/, but base.css/tooltip.css load
				// relative to `import.meta.url` (now the bundle's own URL). Re-anchor
				// the two core assets up one level so they still resolve. base.css is
				// a TOP-LEVEL await (shared-styles.js) — a 404 would reject the whole
				// module import, so this re-anchor is load-bearing, not cosmetic.
				"'./base.css'": "'../styles/base.css'",
				"'./tooltip.css'": "'../tooltips/tooltip.css'",
			},
		}),
		terser({
			compress: {
				dead_code: true,
				conditionals: true,
				booleans: true,
				if_return: true,
				passes: 2,
			},
		}),
	],
};
