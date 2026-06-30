/*
 * Shared background scroll-lock for full-viewport overlays (modals, the pulldown).
 *
 * The app shell's inner scroll surface (`.shell-scroll`) — not the document — is what
 * scrolls, so each overlay freezes THAT surface (see `setScrollLockTarget`) while it is
 * open, falling back to the document element until a target is set. The count is
 * REFERENCE-COUNTED at module scope
 * (ES modules are singletons) so every overlay shares ONE count: the lock releases
 * only when the LAST overlay closes, regardless of close order. Per-overlay
 * counters would break here — a modal opened over an open pulldown and closed
 * first would wrongly unlock the still-open pulldown's background.
 *
 * The prior inline overflow is saved on the first lock and restored on the last
 * release so an author-set value is never clobbered.
 */
let activeLockCount = 0;
let priorOverflow = '';
let lockedElement = null;
let preferredTarget = null;
/**
 * Designate the element whose overflow is frozen while an overlay is open. The app
 * shell points this at its inner scroll surface (`.shell-scroll`) because the document
 * itself no longer scrolls. Falls back to the document element when never set.
 */
export function setScrollLockTarget(element) {
	preferredTarget = element ?? null;
}
function resolveScrollLockTarget() {
	return preferredTarget ?? globalThis.document.documentElement;
}
/**
 * Acquire one background scroll-lock (call once when an overlay opens). The scroll
 * surface's overflow is set to hidden on the first acquisition; the locked element is
 * captured so the matching release restores the SAME one even if the target changes.
 */
export function lockBackgroundScroll() {
	if (activeLockCount === 0) {
		lockedElement = resolveScrollLockTarget();
		priorOverflow = lockedElement.style.overflow;
		lockedElement.style.overflow = 'hidden';
	}
	activeLockCount += 1;
}
/**
 * Release one background scroll-lock (call once when an overlay closes). The locked
 * element is restored to its prior overflow only when the last lock is released.
 */
export function unlockBackgroundScroll() {
	if (activeLockCount === 0) {
		return;
	}
	activeLockCount -= 1;
	if (activeLockCount === 0 && lockedElement) {
		lockedElement.style.overflow = priorOverflow;
		lockedElement = null;
	}
}
