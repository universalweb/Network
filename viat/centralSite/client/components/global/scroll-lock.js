/*
 * Shared background scroll-lock for full-viewport overlays (modals, the pulldown).
 *
 * Under document scroll an open overlay no longer freezes the page behind it the
 * way the old fixed `overflow:hidden` app shell did, so each overlay locks the
 * root scroller while it is open. The count is REFERENCE-COUNTED at module scope
 * (ES modules are singletons) so every overlay shares ONE count: the lock releases
 * only when the LAST overlay closes, regardless of close order. Per-overlay
 * counters would break here — a modal opened over an open pulldown and closed
 * first would wrongly unlock the still-open pulldown's background.
 *
 * The prior inline overflow is saved on the first lock and restored on the last
 * release so an author-set value is never clobbered.
 */
let activeLockCount = 0;
let priorRootOverflow = '';
/**
 * Acquire one background scroll-lock (call once when an overlay opens). The root
 * scroller's overflow is set to hidden on the first acquisition.
 */
export function lockBackgroundScroll() {
	if (activeLockCount === 0) {
		const root = globalThis.document.documentElement;
		priorRootOverflow = root.style.overflow;
		root.style.overflow = 'hidden';
	}
	activeLockCount += 1;
}
/**
 * Release one background scroll-lock (call once when an overlay closes). The root
 * scroller is restored to its prior overflow only when the last lock is released.
 */
export function unlockBackgroundScroll() {
	if (activeLockCount === 0) {
		return;
	}
	activeLockCount -= 1;
	if (activeLockCount === 0) {
		globalThis.document.documentElement.style.overflow = priorRootOverflow;
	}
}
