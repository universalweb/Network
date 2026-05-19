import { delegate, getSubeventData } from '../dom/delegate.js';
// Tooltips are a hover affordance — they make no sense on touch-only
// devices (phones, most tablets) where the user can't preview an
// element without committing to a tap, and we don't want the tip
// flashing during a scroll. `(hover: hover)` is the precise CSS media
// query for "has a hover-capable pointer" — true on desktops (mouse,
// trackpad), false on touch-only mobile. Surface / iPad with attached
// keyboard report `hover: hover` and get tooltips back automatically.
const hoverCapableMQ = typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia('(hover: hover)') : null;
function isHoverCapable() {
	return hoverCapableMQ ? hoverCapableMQ.matches : true;
}
let tooltipReady = null;
// WeakRef so an element removed from DOM mid-hover doesn't pin until the next
// pointermove. The deref check below also catches the gc'd case.
let activeTargetRef = null;
function currentActiveTarget() {
	return activeTargetRef?.deref() ?? null;
}
function ensureTooltip() {
	if (tooltipReady) {
		return tooltipReady;
	}
	tooltipReady = (async () => {
		await customElements.whenDefined('ui-tooltip');
		const tooltipEl = document.createElement('ui-tooltip');
		document.body.append(tooltipEl);
		await tooltipEl.lifecycle.whenMounted;
		return tooltipEl;
	})();
	return tooltipReady;
}
async function showFor(target, data) {
	const text = data == null ? '' : String(data);
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
function hide() {
	activeTargetRef = null;
	if (!tooltipReady) {
		return;
	}
	tooltipReady.then((tip) => {
		tip.hide();
	}).catch(() => {});
}
document.addEventListener('pointermove', (pointerEvent) => {
	// Touch / pen flick across an element still emits pointermove on
	// some engines; bail out so we don't surface a hover tip on a tap.
	// Re-check on every event because a docked laptop can change its
	// capability profile at runtime.
	if (!isHoverCapable()) {
		if (currentActiveTarget()) {
			hide();
		}
		return;
	}
	const target = pointerEvent.composedPath()[0];
	const data = getSubeventData(target, 'tooltip');
	if (data === undefined) {
		if (currentActiveTarget()) {
			hide();
		}
		return;
	}
	if (target === currentActiveTarget()) {
		return;
	}
	activeTargetRef = new WeakRef(target);
	showFor(target, data);
}, {
	capture: true,
	passive: true,
});
delegate('click.tooltip', hide);
globalThis.addEventListener('scroll', hide, {
	capture: true,
	passive: true,
});
// Defer creating the tooltip element until we know we'll need it.
// Hover-capable devices pre-warm so the first tip is instant; touch-only
// devices never spin up the popover at all.
if (isHoverCapable()) {
	ensureTooltip().catch(() => {});
}
