/*
 * Test-owned hit-floor token. variables.css is the runtime source;
 * this table is the independent expectation so icon-button, close-button,
 * and the framework button module cannot silently fork the 44px floor.
 * Computed pixel size is browser-only — assert this wiring, not getComputedStyle.
 */
export const HIT_MIN_DEFINITION = 'max(2.75rem, 44px)';
export const HIT_MIN_FALLBACK = 'var(--hit-min, max(2.75rem, 44px))';
