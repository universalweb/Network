/*
	Track / packing resolvers for ui-grid and ui-masonry.
	CSS lives in util-layout.css (data-* primitives). This module is the JS
	half: grid-template-columns, grid-auto-flow, masonry column-count/width,
	and the shared gap-token predicate.
	AUTO_FIT_MIN matches uwc.util `.grid-auto-fit` (14rem).
	Author: Universal Web
	Date: 2026-08-28
*/
import { isNumber, isString } from '@universalweb/utilitylib';
export const AUTO_FIT_MIN = '14rem';
export const MAX_ITEM_SPAN = 6;
export const GAP_TOKENS = new Set([
	'none',
	'xs',
	'sm',
	'md',
	'lg',
	'xl',
]);
export const GAP_VAR = {
	none: '0',
	xs: 'var(--space-2, 0.25rem)',
	sm: 'var(--space-3, 0.5rem)',
	md: 'var(--space-4, 0.75rem)',
	lg: 'var(--space-6, 1.25rem)',
	xl: 'var(--space-8, 2rem)',
};
export function isGapToken(gap) {
	return GAP_TOKENS.has(gap);
}
export function resolveGapValue(gap) {
	if (isGapToken(gap)) {
		return GAP_VAR[gap];
	}
	const text = filledString(gap);
	if (text) {
		return text;
	}
	return '1rem';
}
export function resolveFlow(flow) {
	if (flow === 'column') {
		return 'column';
	}
	if (flow === 'dense') {
		return 'row dense';
	}
	return 'row';
}
function filledString(value) {
	if (!isString(value)) {
		return '';
	}
	return value.trim();
}
function columnCount(columns) {
	if (isNumber(columns) && Number.isFinite(columns) && columns > 0) {
		return Math.floor(columns);
	}
	if (isString(columns)) {
		const parsed = Number(columns);
		if (Number.isFinite(parsed) && parsed > 0) {
			return Math.floor(parsed);
		}
	}
	return 0;
}
function autoFitTrack(min) {
	return `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))`;
}
export function resolveTracks(state) {
	const source = state ?? {};
	const min = filledString(source.min);
	if (min) {
		return autoFitTrack(min);
	}
	const columns = columnCount(source.columns);
	if (columns > 0) {
		return `repeat(${columns}, minmax(0, 1fr))`;
	}
	return autoFitTrack(AUTO_FIT_MIN);
}
export function resolveGridTemplateStyle(state) {
	const source = state ?? {};
	const parts = [`--grid-cols:${resolveTracks(source)}`];
	const rows = filledString(source.rows);
	if (rows) {
		parts.push(`--grid-rows:${rows}`);
	}
	const areas = filledString(source.areas);
	if (areas) {
		parts.push(`--grid-areas:${areas}`);
	}
	const autoRows = filledString(source.autoRows);
	if (autoRows) {
		parts.push(`--grid-auto-rows:${autoRows}`);
	}
	return parts.join(';');
}
export function resolveMasonryStyle(state) {
	const source = state ?? {};
	const min = filledString(source.min);
	const parts = [];
	if (min) {
		parts.push(`--masonry-min:${min}`);
		parts.push('--masonry-columns:auto');
	} else {
		const columns = columnCount(source.columns);
		const count = columns > 0 ? columns : 3;
		parts.push(`--masonry-columns:${count}`);
		parts.push('--masonry-min:auto');
	}
	return parts.join(';');
}
