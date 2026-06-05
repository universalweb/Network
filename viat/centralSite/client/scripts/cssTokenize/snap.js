/*
 * Pure snap functions for the CSS unit-modernization codemod (sweep #2 · Slice A).
 *
 * Maps a component's hardcoded length to the nearest STRUCTURAL token. No IO,
 * no DOM — deterministic and unit-tested. The rem-ness of the result lives in
 * the token definitions (variables.css), not here: these return a token NAME
 * (e.g. '--space-5'); the caller wraps it in `var(...)`.
 *
 * Snap rule: nearest step by absolute distance; ties resolve to the SMALLER step
 * (a strict `<` never lets an equal distance displace the earlier entry).
 * Out-of-range inputs return null → value left raw.
 */
/** Spacing scale — px reference values; array index === the --space-N suffix. */
export const SPACE_STEPS = [
	0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64,
];
/** Structural radius steps only — the themeable lg/xl band is intentionally absent. */
export const RADIUS_STEPS = [
	{
		token: '--radius-xs',
		px: 2,
	},
	{
		token: '--radius-sm',
		px: 4,
	},
	{
		token: '--radius-md',
		px: 6,
	},
];
/** Type scale — rem values; component rem font-sizes match these directly. */
export const TEXT_STEPS = [
	{
		token: '--text-2xs',
		rem: 0.625,
	},
	{
		token: '--text-xs',
		rem: 0.6875,
	},
	{
		token: '--text-sm',
		rem: 0.75,
	},
	{
		token: '--text-base',
		rem: 0.8125,
	},
	{
		token: '--text-md',
		rem: 0.875,
	},
	{
		token: '--text-lg',
		rem: 1,
	},
	{
		token: '--text-xl',
		rem: 1.125,
	},
	{
		token: '--text-2xl',
		rem: 1.375,
	},
	{
		token: '--text-3xl',
		rem: 1.75,
	},
];
/** Discrete font-weight map — exact match only (weights don't snap). */
export const WEIGHT_TOKENS = new Map([
	[400, '--weight-normal'],
	[500, '--weight-medium'],
	[600, '--weight-semibold'],
	[700, '--weight-bold'],
]);
const LENGTH_PATTERN = /^(-?\d*\.?\d+)(px|rem|em|%|vw|vh|svh|dvh|lvh|ch|fr|cqi|cqb)?$/;
/**
 * Index of the nearest value in an ascending list; ties resolve DOWN.
 * @param {number} value
 * @param {number[]} steps - Ascending.
 * @returns {number}
 */
export function nearestIndex(value, steps) {
	let bestIndex = 0;
	let bestDistance = Math.abs(value - steps[0]);
	for (let stepIndex = 1; stepIndex < steps.length; stepIndex++) {
		const distance = Math.abs(value - steps[stepIndex]);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestIndex = stepIndex;
		}
	}
	return bestIndex;
}
/**
 * Token whose `key` value is nearest; ties resolve DOWN (earlier entry).
 * @param {number} value
 * @param {{token:string}[]} steps - Ascending by key.
 * @param {string} key
 * @returns {string}
 */
function nearestToken(value, steps, key) {
	let bestToken = steps[0].token;
	let bestDistance = Math.abs(value - steps[0][key]);
	for (let stepIndex = 1; stepIndex < steps.length; stepIndex++) {
		const distance = Math.abs(value - steps[stepIndex][key]);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestToken = steps[stepIndex].token;
		}
	}
	return bestToken;
}
/** Px spacing → `--space-N`; leaves ≤1px hairlines, 0, negatives, and >64px outliers. */
export function snapSpacing(px) {
	if (px < 2 || px > 64) {
		return null;
	}
	return `--space-${nearestIndex(px, SPACE_STEPS)}`;
}
/** Px radius → structural token; leaves sharp 0/negatives and the themeable >8px band. */
export function snapRadiusPx(px) {
	if (px <= 0 || px > 8) {
		return null;
	}
	return nearestToken(px, RADIUS_STEPS, 'px');
}
/* Beyond this rem distance from the nearest step, a font-size is intentionally
 * off-scale — a display heading above --text-3xl or a sub-scale micro-label below
 * --text-2xs — and is left raw rather than snapped (which would visibly resize it). */
const FONT_SNAP_MAX_DISTANCE = 0.1;
/** Rem font-size → `--text-*`, or null when no step is within FONT_SNAP_MAX_DISTANCE. (px font-size is gated out by the caller — §2b.) */
export function snapFontRem(rem) {
	let bestStep = TEXT_STEPS[0];
	let bestDistance = Math.abs(rem - TEXT_STEPS[0].rem);
	for (let stepIndex = 1; stepIndex < TEXT_STEPS.length; stepIndex++) {
		const distance = Math.abs(rem - TEXT_STEPS[stepIndex].rem);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestStep = TEXT_STEPS[stepIndex];
		}
	}
	if (bestDistance > FONT_SNAP_MAX_DISTANCE) {
		return null;
	}
	return bestStep.token;
}
/** Exact font-weight → token, or null. */
export function snapWeight(weight) {
	return WEIGHT_TOKENS.get(weight) ?? null;
}
/** Wrap a token name as `var(--token)`, or pass null/empty through unchanged. */
function wrapToken(token) {
	return token ? `var(${token})` : null;
}
/**
 * Snap one whitespace-delimited value piece for a bucket. Returns a `var(...)`
 * replacement string, or null to leave the original verbatim.
 * @param {string} piece - E.g. '16px', '0.75rem', 'auto', '600'.
 * @param {'spacing'|'radius'|'fontSize'|'weight'} bucket
 * @returns {string|null}
 */
export function snapPiece(piece, bucket) {
	if (bucket === 'weight') {
		const weight = Number(piece);
		return Number.isInteger(weight) ? wrapToken(snapWeight(weight)) : null;
	}
	const match = LENGTH_PATTERN.exec(piece);
	if (!match) {
		return null;
	}
	const amount = Number(match[1]);
	const unit = match[2];
	if (bucket === 'spacing') {
		return unit === 'px' ? wrapToken(snapSpacing(amount)) : null;
	}
	if (bucket === 'radius') {
		return unit === 'px' ? wrapToken(snapRadiusPx(amount)) : null;
	}
	if (bucket === 'fontSize') {
		return unit === 'rem' ? wrapToken(snapFontRem(amount)) : null;
	}
	return null;
}
/**
 * Snap every length piece in a declaration value. A value containing any function
 * — var(), calc(), clamp(), min/max() — is left entirely untouched.
 * @param {string} value
 * @param {'spacing'|'radius'|'fontSize'|'weight'} bucket
 * @returns {{ value:string, changes:{from:string,to:string}[] }}
 */
export function snapValue(value, bucket) {
	if (value.includes('(')) {
		return {
			value,
			changes: [],
		};
	}
	const pieces = value.split(/\s+/);
	const changes = [];
	for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
		const piece = pieces[pieceIndex];
		const replacement = snapPiece(piece, bucket);
		if (replacement && replacement !== piece) {
			changes.push({
				from: piece,
				to: replacement,
			});
			pieces[pieceIndex] = replacement;
		}
	}
	return {
		value: pieces.join(' '),
		changes,
	};
}
const SPACING_PROPERTY = /^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(row-gap|column-gap|gap)$/;
const RADIUS_PROPERTY = /^border(-(top|bottom)-(left|right))?-radius$|^border-(start|end)-(start|end)-radius$/;
/** Map a CSS property to its snap bucket, or null if out of scope. */
export function bucketForProperty(property) {
	const propertyName = property.toLowerCase();
	if (propertyName === 'font-size') {
		return 'fontSize';
	}
	if (propertyName === 'font-weight') {
		return 'weight';
	}
	if (RADIUS_PROPERTY.test(propertyName)) {
		return 'radius';
	}
	if (SPACING_PROPERTY.test(propertyName)) {
		return 'spacing';
	}
	return null;
}
