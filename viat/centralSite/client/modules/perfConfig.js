import './config.js';
/*
 * Benchmark-page override. The shared config ships logLevel 'perf', whose
 * wasted-set deep compares and per-render logging would skew the numbers the
 * shootout/perf harnesses exist to measure. ESM evaluates this module (and
 * its config.js dep) before the entry's later imports, so the override lands
 * before core/debug/logger snapshots CONFIG.
 */
globalThis.CONFIG.logLevel = 'info';
