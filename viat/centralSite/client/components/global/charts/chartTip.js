/*
	DESCRIPTION: Shared in-chart tooltip helpers (heatmap-style floating tip).
	Hits carry data-tip on the pointer target itself — no querySelector walks.
*/
// Prefer the event target when it owns data-tip (paths/circles/rects do).
export function tipTarget(target) {
	if (!(target instanceof Element)) {
		return null;
	}
	if (target.hasAttribute('data-tip')) {
		return target;
	}
	// SVG text nodes / child tspans: one step to parent element only.
	const hostEl = target.parentElement;
	if (hostEl instanceof Element && hostEl.hasAttribute('data-tip')) {
		return hostEl;
	}
	return null;
}
// Show tip near the hovered element, relative to the plot wrapper (#plot).
export function showChartTip(component, domEvent) {
	const tip = component.refs?.tip;
	const plot = component.refs?.plot;
	if (!tip || !plot) {
		return;
	}
	const el = tipTarget(domEvent.target);
	if (!el) {
		hideChartTip(component);
		return;
	}
	const text = el.getAttribute('data-tip') || '';
	if (!text) {
		hideChartTip(component);
		return;
	}
	if (component._chartHoverEl !== el) {
		component._chartHoverEl = el;
		tip.textContent = text;
	}
	tip.dataset.show = 'true';
	const plotRect = plot.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();
	const midX = elRect.left + (elRect.width / 2) - plotRect.left;
	const tipTop = elRect.top - plotRect.top;
	tip.style.left = `${midX}px`;
	tip.style.top = `${tipTop}px`;
}
export function hideChartTip(component) {
	const tip = component.refs?.tip;
	if (!tip) {
		return;
	}
	tip.dataset.show = 'false';
	component._chartHoverEl = null;
}
export function joinTip(parts) {
	const out = [];
	const count = parts.length;
	for (let index = 0; index < count; index += 1) {
		const part = parts[index];
		if (part == null || part === '') {
			continue;
		}
		out.push(String(part));
	}
	return out.join(' · ');
}
