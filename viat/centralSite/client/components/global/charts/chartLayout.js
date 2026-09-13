/*
	DESCRIPTION: Shared chart chrome layout — legend placement, axis labels,
	compact adaptation. Resize/orientation follow the house viewport bus
	(viewport:resize + viewport:change), same as sidebar/dock — NOT a private
	ResizeObserver. Visual fold also via CSS @container on the host. Compact
	bucket flips only when the shared viewport width bucket changes so charts
	never thrash SVG geometry during drag-resize.
*/
export const CHART_LEGEND_POSITIONS = new Set([
	'top',
	'bottom',
	'left',
	'right',
]);
export const CHART_LEGEND_ORIENTATIONS = new Set([
	'auto',
	'horizontal',
	'vertical',
]);
// Viewport width buckets that collapse side legends (matches dock mobile edge).
export const CHART_COMPACT_WIDTH_BUCKETS = new Set([
	'xs',
	'sm',
]);
export function normalizeLegendPosition(value, fallback = 'bottom') {
	const key = String(value || '').toLowerCase();
	if (CHART_LEGEND_POSITIONS.has(key)) {
		return key;
	}
	return fallback;
}
export function normalizeLegendOrientation(value, fallback = 'auto') {
	const key = String(value || '').toLowerCase();
	if (CHART_LEGEND_ORIENTATIONS.has(key)) {
		return key;
	}
	return fallback;
}
// Resolve legend position + orientation. layout:auto + compact folds sides → bottom.
export function resolveLegendLayout(state) {
	const layout = state?.layout === 'fixed' ? 'fixed' : 'auto';
	const compact = state?.compact === true;
	let position = normalizeLegendPosition(state?.legendPosition, 'bottom');
	if (layout === 'auto' && compact && (position === 'left' || position === 'right')) {
		position = 'bottom';
	}
	let orientation = normalizeLegendOrientation(state?.legendOrientation, 'auto');
	if (orientation === 'auto') {
		orientation = (position === 'left' || position === 'right') ? 'vertical' : 'horizontal';
	}
	return {
		position,
		orientation,
		layout,
		compact,
	};
}
// Shared static-state defaults for charts that host a legend.
export function chartLegendStateDefaults(overrides = {}) {
	return {
		showLegend: true,
		legendPosition: 'bottom',
		legendOrientation: 'auto',
		// auto = adapt on narrow viewport; fixed = honor legendPosition always
		layout: 'auto',
		// Reactive: set from shared viewport bus (not for callers to set).
		compact: false,
		...overrides,
	};
}
// Shared static-state defaults for cartesian axis chrome.
export function chartAxisStateDefaults(overrides = {}) {
	return {
		showGrid: true,
		showXAxis: true,
		showYAxis: true,
		showXTicks: true,
		showYTicks: true,
		xLabel: '',
		yLabel: '',
		...overrides,
	};
}
export function hideAxisLabel(label) {
	return !String(label || '').trim();
}
// Bind viewport bus → compact measure. Call from chart onConnect.
// Charts implement: handleChartViewportChange() { applyChartLayoutFromViewport(this); }
export function attachChartLayout(host) {
	if (host._chartLayoutAttached) {
		return;
	}
	host._chartLayoutAttached = true;
	// Same channels as sidebar/dock — rAF-coalesced in core/environment/viewport.js
	host.delegate('viewport:resize', host.handleChartViewportChange);
	host.delegate('viewport:change', host.handleChartViewportChange);
	applyChartLayoutFromViewport(host);
}
export function detachChartLayout(host) {
	// delegate auto-cleans on disconnect; flag only
	host._chartLayoutAttached = false;
}
// Read shared viewport snapshot; flip state.compact only on real bucket change.
export function applyChartLayoutFromViewport(host) {
	if (!host?.state || host.isDisconnected) {
		return;
	}
	const bucket = host.global?.environment?.viewport?.w ?? 'lg';
	const nextCompact = CHART_COMPACT_WIDTH_BUCKETS.has(bucket);
	if (host.state.compact !== nextCompact) {
		host.state.compact = nextCompact;
	}
	if (typeof host.onChartLayoutSettled === 'function') {
		host.onChartLayoutSettled();
	}
}
// data-* bag for chart shell templates.
export function chartShellDataAttrs(state) {
	const resolved = resolveLegendLayout(state);
	return {
		legendPos: resolved.position,
		legendOrient: resolved.orientation,
		compact: resolved.compact,
		layout: resolved.layout,
	};
}
