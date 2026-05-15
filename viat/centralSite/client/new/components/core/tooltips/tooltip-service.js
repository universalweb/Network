import { delegate, getSubeventData } from '../dom/delegate.js';
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
		await tooltipEl.whenMounted;
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
ensureTooltip().catch(() => {});
