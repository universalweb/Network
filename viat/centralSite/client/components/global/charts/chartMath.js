/*
	DESCRIPTION: Shared zero-dep chart geometry helpers for global viz components.
	Series-agnostic scales, nice ticks, palette, and SVG path builders.
*/
export const CHART_TONES = new Set([
	'accent',
	'success',
	'warning',
	'danger',
	'info',
	'neutral',
]);
/** Default multi-series palette — solid oklch so charts paint without theme tokens. */
export const SERIES_PALETTE = [
	'oklch(0.72 0.14 210)',
	'oklch(0.72 0.17 145)',
	'oklch(0.8 0.16 85)',
	'oklch(0.62 0.2 25)',
	'oklch(0.7 0.12 250)',
	'oklch(0.72 0.14 320)',
	'oklch(0.68 0.12 30)',
	'oklch(0.75 0.1 180)',
];
export function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}
export function toNumber(value, fallback = 0) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}
export function clamp(value, min, max) {
	if (!Number.isFinite(value)) {
		return min;
	}
	if (value < min) {
		return min;
	}
	if (value > max) {
		return max;
	}
	return value;
}
export function seriesColor(index, explicit) {
	if (explicit) {
		return explicit;
	}
	const paletteCount = SERIES_PALETTE.length;
	return SERIES_PALETTE[index % paletteCount];
}
/**
 * Nice tick step near rough span/count (Wilkinson-ish, simplified).
 */
export function niceStep(rough) {
	if (!Number.isFinite(rough) || rough <= 0) {
		return 1;
	}
	const exponent = Math.floor(Math.log10(rough));
	const fraction = rough / (10 ** exponent);
	let niceFraction = 1;
	if (fraction <= 1) {
		niceFraction = 1;
	} else if (fraction <= 2) {
		niceFraction = 2;
	} else if (fraction <= 5) {
		niceFraction = 5;
	} else {
		niceFraction = 10;
	}
	return niceFraction * (10 ** exponent);
}
export function niceTicks(min, max, tickCount = 5) {
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		return [
			0,
			1,
		];
	}
	if (min === max) {
		const pad = Math.abs(min) * 0.1 || 1;
		return niceTicks(min - pad, max + pad, tickCount);
	}
	const low = Math.min(min, max);
	const high = Math.max(min, max);
	const step = niceStep((high - low) / Math.max(1, tickCount - 1));
	const start = Math.floor(low / step) * step;
	const end = Math.ceil(high / step) * step;
	const ticks = [];
	for (let value = start; value <= end + (step * 0.5); value += step) {
		ticks.push(Number(value.toPrecision(12)));
		if (ticks.length > 24) {
			break;
		}
	}
	return ticks;
}
export function formatTick(value) {
	if (!Number.isFinite(value)) {
		return '';
	}
	const abs = Math.abs(value);
	if (abs >= 1e9) {
		return `${(value / 1e9).toFixed(1)}B`;
	}
	if (abs >= 1e6) {
		return `${(value / 1e6).toFixed(1)}M`;
	}
	if (abs >= 1e3) {
		return `${(value / 1e3).toFixed(1)}k`;
	}
	if (Number.isInteger(value) || abs >= 10) {
		return String(Math.round(value * 100) / 100);
	}
	return value.toFixed(2);
}
export function extentOf(values) {
	let min = Infinity;
	let max = -Infinity;
	const count = values.length;
	for (let index = 0; index < count; index += 1) {
		const value = values[index];
		if (!Number.isFinite(value)) {
			continue;
		}
		if (value < min) {
			min = value;
		}
		if (value > max) {
			max = value;
		}
	}
	if (!Number.isFinite(min)) {
		return {
			min: 0,
			max: 1,
		};
	}
	return {
		min,
		max,
	};
}
/**
 * Flatten numeric values from normalizeValueSeries rows. Domain/ticks must
 * read the TARGET series, not a mid-tween paint snapshot.
 */
export function valuesFromSeries(series) {
	const all = [];
	const list = Array.isArray(series) ? series : [];
	const seriesCount = list.length;
	for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
		const values = list[seriesIndex]?.values;
		if (!Array.isArray(values)) {
			continue;
		}
		const valueCount = values.length;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			all.push(values[valueIndex]);
		}
	}
	return all;
}
export function valueSeriesExtent(series) {
	return extentOf(valuesFromSeries(series));
}
/**
 * Nice ticks plus the domain the plot scales into. Shared by line/bar/scatter
 * so mid-animation paint cannot re-derive the frame.
 */
export function domainTicks(min, max, tickCount = 5) {
	const ticks = niceTicks(min, max, tickCount);
	return {
		ticks,
		domainMin: ticks[0],
		domainMax: ticks[ticks.length - 1],
	};
}
/** Linear map value∈[domainMin,domainMax] → [rangeMin,rangeMax]. */
export function scaleLinear(value, domainMin, domainMax, rangeMin, rangeMax) {
	const span = domainMax - domainMin || 1;
	const t = (value - domainMin) / span;
	return rangeMin + (t * (rangeMax - rangeMin));
}
export function polylinePoints(points) {
	let out = '';
	const count = points.length;
	for (let index = 0; index < count; index += 1) {
		const point = points[index];
		out += `${point.x.toFixed(2)},${point.y.toFixed(2)} `;
	}
	return out.trim();
}
export function areaPath(points, baselineY) {
	const count = points.length;
	if (count === 0) {
		return '';
	}
	const last = count - 1;
	let path = `M ${points[0].x.toFixed(2)},${baselineY.toFixed(2)} `;
	for (let index = 0; index < count; index += 1) {
		path += `L ${points[index].x.toFixed(2)},${points[index].y.toFixed(2)} `;
	}
	path += `L ${points[last].x.toFixed(2)},${baselineY.toFixed(2)} Z`;
	return path;
}
/**
 * Normalize series input:
 * - number[] → one series { id:'s0', values }
 * - { label, values, color? }[] → multi
 * - { label, value }[] for categorical (bar/pie)
 */
export function normalizeValueSeries(series) {
	if (!Array.isArray(series) || series.length === 0) {
		return [];
	}
	if (typeof series[0] === 'number' || series[0] == null) {
		const values = [];
		const numberCount = series.length;
		for (let index = 0; index < numberCount; index += 1) {
			values.push(toNumber(series[index], 0));
		}
		return [
			{
				id: 's0',
				label: '',
				color: '',
				values,
			},
		];
	}
	const out = [];
	const count = series.length;
	for (let index = 0; index < count; index += 1) {
		const row = series[index];
		if (!row || typeof row !== 'object') {
			continue;
		}
		const values = [];
		let raw = [];
		if (Array.isArray(row.values)) {
			raw = row.values;
		} else if (Array.isArray(row.data)) {
			raw = row.data;
		}
		const valueCount = raw.length;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			values.push(toNumber(raw[valueIndex], 0));
		}
		out.push({
			id: String(row.id ?? row.label ?? index),
			label: String(row.label || row.id || `Series ${index + 1}`),
			color: row.color || seriesColor(index),
			values,
		});
	}
	return out;
}
export function normalizeCategoryItems(items) {
	if (!Array.isArray(items)) {
		return [];
	}
	const out = [];
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const row = items[index];
		if (row == null) {
			continue;
		}
		if (typeof row === 'number') {
			out.push({
				id: String(index),
				label: String(index + 1),
				value: row,
				color: seriesColor(index),
			});
			continue;
		}
		if (typeof row !== 'object') {
			continue;
		}
		out.push({
			id: String(row.id ?? row.label ?? index),
			label: String(row.label || row.id || index + 1),
			value: toNumber(row.value, 0),
			color: row.color || seriesColor(index),
		});
	}
	return out;
}
export function polarToCartesian(cx, cy, radius, angleDeg) {
	const radians = ((angleDeg - 90) * Math.PI) / 180;
	return {
		x: cx + (radius * Math.cos(radians)),
		y: cy + (radius * Math.sin(radians)),
	};
}
/** SVG arc path from startAngle→endAngle (degrees, 0 = 12 o'clock). */
export function donutArcPath(cx, cy, innerR, outerR, startAngle, endAngle) {
	const sweep = endAngle - startAngle;
	if (Math.abs(sweep) < 0.001) {
		return '';
	}
	const large = Math.abs(sweep) > 180 ? 1 : 0;
	const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
	const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
	const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
	const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
	if (innerR <= 0) {
		return [
			`M ${cx} ${cy}`,
			`L ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
			`A ${outerR} ${outerR} 0 ${large} 1 ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
			'Z',
		].join(' ');
	}
	return [
		`M ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
		`A ${outerR} ${outerR} 0 ${large} 1 ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
		`L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
		`A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
		'Z',
	].join(' ');
}
