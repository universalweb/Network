import { delegate, getSubeventData } from '../delegate.js';
let tooltipReady = null;
let activeTarget = null;
function ensureTooltip() {
	if (tooltipReady) {
		return tooltipReady;
	}
	tooltipReady = (async () => {
		await customElements.whenDefined('ui-tooltip');
		const el = document.createElement('ui-tooltip');
		document.body.append(el);
		await el.mounted;
		return el;
	})();
	return tooltipReady;
}
async function showFor(target, data) {
	const text = data == null ? '' : String(data);
	if (!text) {
		return;
	}
	const tip = await ensureTooltip();
	if (!target.isConnected || activeTarget !== target) {
		return;
	}
	tip.show({
		text,
		targetRect: target.getBoundingClientRect(),
	});
}
function hide() {
	activeTarget = null;
	if (!tooltipReady) {
		return;
	}
	tooltipReady.then((tip) => {
		tip.hide();
	}).catch(() => {});
}
document.addEventListener('pointermove', (evnt) => {
	const target = evnt.composedPath()[0];
	const data = getSubeventData(target, 'tooltip');
	if (data === undefined) {
		if (activeTarget) {
			hide();
		}
		return;
	}
	if (target === activeTarget) {
		return;
	}
	activeTarget = target;
	showFor(target, data);
}, {
	capture: true,
	passive: true,
});
delegate('click.tooltip', hide);
window.addEventListener('scroll', hide, {
	capture: true,
	passive: true,
});
ensureTooltip().catch(() => {});
