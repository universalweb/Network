/*
	Shared tip / hit configuration for charts.
	tipMode:
	  auto   — points when present, else series (default flexible)
	  points — vertex / sample hits only
	  series — path / polyline series only
	  both   — series + points (point wins when both under cursor; hits sit above)
	  none   — no geometry tips
	pointMarker:
	  hover  — ring appears on :hover / :focus-visible (default, original look)
	  always — small filled dots always visible
	  never  — hit target only (still tooltips if tipMode allows)
*/
export const CHART_TIP_MODES = new Set([
	'auto',
	'points',
	'series',
	'both',
	'none',
]);
export const CHART_POINT_MARKERS = new Set([
	'hover',
	'always',
	'never',
]);
export function chartTipStateDefaults(overrides = {}) {
	return {
		// Master switch for geometry tips (framework tooltip=)
		showTip: true,
		tipMode: 'auto',
		// Vertex hit appearance
		pointMarker: 'hover',
		// Hit radius in SVG viewBox units (larger = easier to target)
		pointHitRadius: 8,
		// Visible marker radius when pointMarker is 'always'
		pointMarkerRadius: 3.5,
		...overrides,
	};
}
export function normalizeTipMode(value) {
	const key = String(value || 'auto').toLowerCase();
	return CHART_TIP_MODES.has(key) ? key : 'auto';
}
export function normalizePointMarker(value) {
	const key = String(value || 'hover').toLowerCase();
	return CHART_POINT_MARKERS.has(key) ? key : 'hover';
}
// Whether to emit point-level tips given tipMode + showTip.
export function wantPointTips(state) {
	if (state?.showTip === false) {
		return false;
	}
	const mode = normalizeTipMode(state?.tipMode);
	return mode === 'points' || mode === 'both' || mode === 'auto';
}
// Whether to emit series-level tips given tipMode + showTip.
export function wantSeriesTips(state) {
	if (state?.showTip === false) {
		return false;
	}
	const mode = normalizeTipMode(state?.tipMode);
	return mode === 'series' || mode === 'both' || mode === 'auto';
}
export function tipTextOrEmpty(enabled, text) {
	if (!enabled) {
		return '';
	}
	const out = String(text || '').trim();
	return out;
}
