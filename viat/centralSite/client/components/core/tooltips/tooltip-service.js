/*
 * Tooltip wiring — per-element `pointerenter` / `pointerleave` listeners,
 * browser-native dispatch, JS-state-driven content.
 *
 * Architecture
 *   - Two shared listener objects (`enterListener` / `leaveListener`) — DOM
 *     `EventListener`-object pattern: the object IS the listener, browser
 *     calls `obj.handleEvent(event)` with `this=obj`. No per-element closures.
 *   - Each behavior install on a tooltipped element adds two listeners
 *     (enter + leave) referencing the shared objects. Uninstall removes them.
 *     N tagged elements → N×2 entries in the browser's listener table; each
 *     entry costs ~80 bytes. No JS closures allocated per element.
 *   - The tooltip text lives in a `WeakMap<Element, string>`. The DOM holds
 *     NOTHING — no `data-tooltip` attribute, no dataset write, no marker.
 *     The element IS the key; install/uninstall manage the entry.
 *   - `enterListener` schedules a single `tip.show()` per animation frame via
 *     `requestAnimationFrame`. Rapid enter→leave→enter sequences coalesce so
 *     we never trigger redundant layout reads or DOM mutations within a frame.
 *   - On touch-only devices (`(hover: hover)` = false), `attachTooltip` and
 *     `detachTooltip` are no-ops — no listeners installed, no tooltip element
 *     pre-warmed, no globals registered. Pure dead weight skipped.
 *
 * (No hover-capability check inside this file — the caller `behaviors/tooltip.js`
 * only dynamically imports this module when `(hover: hover)` is true. By the
 * time we evaluate, hover is guaranteed.)
 * WeakMap value store. Element key → text string. GC-safe; an element removed
 * from the DOM and dropped from all refs takes its entry with it.
 */
const tooltipText = new WeakMap();
let tooltipReady = null;
/*
 * WeakRef so an element removed from DOM mid-hover doesn't pin. The deref
 * check below also catches the gc'd case.
 */
let activeTargetRef = null;
/*
 * rAF token for the show coalescer. 0 = nothing scheduled; non-zero = the
 * frame handle we can cancel if a hide preempts it.
 */
let scheduledShowFrame = 0;
function currentActiveTarget() {
	return activeTargetRef?.deref() ?? null;
}
async function createTooltipElement() {
	await customElements.whenDefined('ui-tooltip');
	const tooltipEl = document.createElement('ui-tooltip');
	document.body.append(tooltipEl);
	await tooltipEl.lifecycle.whenMounted;
	return tooltipEl;
}
function ensureTooltip() {
	if (tooltipReady) {
		return tooltipReady;
	}
	tooltipReady = createTooltipElement();
	return tooltipReady;
}
async function showFor(target, text) {
	if (!text) {
		return;
	}
	const tip = await ensureTooltip();
	if (!target.isConnected || currentActiveTarget() !== target) {
		return;
	}
	tip.show({
		text,
		targetRect: target.getBoundingClientRect(),
	});
}
/**
 * rAF coalescer — multiple enters within a single frame collapse to one
 * `tip.show()` call that reads layout once. Reads `currentActiveTarget()`
 * at frame time so the latest-entered element wins.
 */
function processScheduledShow() {
	scheduledShowFrame = 0;
	const target = currentActiveTarget();
	if (!target) {
		return;
	}
	const text = tooltipText.get(target);
	if (!text) {
		return;
	}
	showFor(target, text);
}
function scheduleShow() {
	if (scheduledShowFrame) {
		return;
	}
	scheduledShowFrame = requestAnimationFrame(processScheduledShow);
}
function hide() {
	if (scheduledShowFrame) {
		cancelAnimationFrame(scheduledShowFrame);
		scheduledShowFrame = 0;
	}
	activeTargetRef = null;
	if (!tooltipReady) {
		return;
	}
	tooltipReady.then((tip) => {
		tip.hide();
	}).catch(() => {});
}
/**
 * — Value registry API — used by `behaviors/tooltip.js` (install + applyValue).
 * Pure JS memory. The DOM never holds the text. Updating here is one Map.set,
 * zero DOM mutation, zero invalidation. Reactive changes can flow at any rate.
 */
export function setTooltipText(element, value) {
	const text = value == null || value === false ? '' : String(value);
	if (text) {
		tooltipText.set(element, text);
	} else {
		tooltipText.delete(element);
	}
	/*
	 * Live update path: if the user is currently hovering this exact element,
	 * push the new text into the live popover immediately so reactive state
	 * changes are visible without requiring a fresh pointer enter.
	 */
	if (tooltipReady && currentActiveTarget() === element) {
		if (text) {
			tooltipReady.then((tip) => {
				tip.show({
					text,
					targetRect: element.getBoundingClientRect(),
				});
			}).catch(() => {});
		} else {
			hide();
		}
	}
}
export function clearTooltipText(element) {
	tooltipText.delete(element);
	if (currentActiveTarget() === element) {
		hide();
	}
}
/*
 * Shared listener objects — DOM `EventListener`-object pattern. The browser
 * calls `obj.handleEvent(event)` with `this=obj`, so the implementation just
 * reads `event.currentTarget` (the element the listener is attached to). Two
 * singletons referenced by every tagged element's two registrations.
 */
const enterListener = {
	handleEvent(pointerEvent) {
		activeTargetRef = new WeakRef(pointerEvent.currentTarget);
		scheduleShow();
	},
};
const leaveListener = {
	handleEvent(pointerEvent) {
		if (currentActiveTarget() === pointerEvent.currentTarget) {
			hide();
		}
	},
};
/**
 * — Public attach/detach API — only ever called from desktop. The behavior
 * in `behaviors/tooltip.js` branches at module load: on touch its install /
 * applyValue methods are static no-op functions, so these are unreachable on
 * hover-incapable devices. No runtime guard needed here.
 */
export function attachTooltip(element) {
	element.addEventListener('pointerenter', enterListener);
	element.addEventListener('pointerleave', leaveListener);
}
export function detachTooltip(element) {
	element.removeEventListener('pointerenter', enterListener);
	element.removeEventListener('pointerleave', leaveListener);
	if (currentActiveTarget() === element) {
		hide();
	}
}
/*
 * (No module-load wiring. The `<ui-tooltip>` element is created lazily on
 * the first hover via `ensureTooltip()` inside `showFor`. There are no
 */
// global scroll/pointerdown listeners — the cursor moving off the element
/*
 * fires `pointerleave` and hides via the per-element path, which covers the
 * common cases without a globally-attached listener.)
 * Pre-warm the tooltip element so the first real hover shows instantly.
 * ensureTooltip().catch(() => {});
 */
