/*
	DESCRIPTION: Shared live-update motion for SVG charts.
	Interpolates data in value-space (not path strings) on rAF with ease-out;
	each chart recomputes geometry from the mid-frame snapshot. Plot hosts are
	GPU-promoted via chart-tip.css (.chart-plot translateZ + will-change while
	data-motion is set). Honors prefers-reduced-motion and state.animate=false.
*/
export const DEFAULT_MOTION_MS = 480;
export function prefersReducedMotion() {
	return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}
export function easeOutCubic(progress) {
	const inverted = 1 - progress;
	return 1 - (inverted * inverted * inverted);
}
export function lerp(from, to, progress) {
	return from + ((to - from) * progress);
}
export function cancelChartMotion(host) {
	const motion = host._chartMotion;
	if (!motion) {
		return;
	}
	if (motion.raf) {
		cancelAnimationFrame(motion.raf);
		motion.raf = 0;
	}
	host._chartMotion = null;
	if (host.state && host.state.motion === true) {
		host.state.motion = false;
	}
}
// Run (or re-target) a data tween on a chart host. apply is host method ref.
export function goChartMotion(host, options) {
	const from = options.from;
	const to = options.to;
	const lerpFn = options.lerp;
	const apply = options.apply;
	const duration = Number(options.duration) > 0 ? Number(options.duration) : DEFAULT_MOTION_MS;
	const animate = options.animate !== false && !prefersReducedMotion();
	cancelChartMotion(host);
	if (!animate || from == null || to == null || lerpFn == null || apply == null) {
		if (apply != null && to != null) {
			apply.call(host, to);
		}
		if (host.state) {
			host.state.motion = false;
		}
		return;
	}
	if (!host._chartMotionTick) {
		host._chartMotionTick = () => {
			chartMotionFrame(host);
		};
	}
	host._chartMotion = {
		from,
		to,
		lerp: lerpFn,
		apply,
		start: performance.now(),
		duration,
		raf: 0,
	};
	if (host.state) {
		host.state.motion = true;
	}
	// First paint at t≈0 so we never flash the target.
	apply.call(host, lerpFn(from, to, 0));
	host._chartMotion.raf = requestAnimationFrame(host._chartMotionTick);
}
function chartMotionFrame(host) {
	const motion = host._chartMotion;
	if (!motion) {
		return;
	}
	const elapsed = performance.now() - motion.start;
	const progress = elapsed >= motion.duration ? 1 : elapsed / motion.duration;
	const mid = motion.lerp(motion.from, motion.to, easeOutCubic(progress));
	motion.apply.call(host, mid);
	if (progress < 1) {
		motion.raf = requestAnimationFrame(host._chartMotionTick);
		return;
	}
	motion.raf = 0;
	host._chartMotion = null;
	if (host.state) {
		host.state.motion = false;
	}
}
// Lerp multi-series [{ id, label, color, values[] }] toward `to` structure.
export function lerpValueSeries(from, to, progress) {
	const fromList = Array.isArray(from) ? from : [];
	const toList = Array.isArray(to) ? to : [];
	const fromById = new Map();
	const fromCount = fromList.length;
	for (let index = 0; index < fromCount; index += 1) {
		const row = fromList[index];
		if (row && row.id != null) {
			fromById.set(String(row.id), row);
		}
	}
	const out = [];
	const toCount = toList.length;
	for (let index = 0; index < toCount; index += 1) {
		const target = toList[index];
		const source = fromById.get(String(target.id)) || fromList[index] || null;
		const sourceValues = source && Array.isArray(source.values) ? source.values : [];
		const targetValues = Array.isArray(target.values) ? target.values : [];
		const valueCount = targetValues.length;
		const values = [];
		const sourceLast = sourceValues.length > 0 ? sourceValues[sourceValues.length - 1] : 0;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			const fromValue = valueIndex < sourceValues.length ? sourceValues[valueIndex] : sourceLast;
			values.push(lerp(Number(fromValue) || 0, Number(targetValues[valueIndex]) || 0, progress));
		}
		out.push({
			id: target.id,
			label: target.label,
			color: target.color,
			values,
		});
	}
	return out;
}
// Lerp categorical [{ id, label, color, value }].
export function lerpCategoryItems(from, to, progress) {
	const fromList = Array.isArray(from) ? from : [];
	const toList = Array.isArray(to) ? to : [];
	const fromById = new Map();
	const fromCount = fromList.length;
	for (let index = 0; index < fromCount; index += 1) {
		const row = fromList[index];
		if (row && row.id != null) {
			fromById.set(String(row.id), row);
		}
	}
	const out = [];
	const toCount = toList.length;
	for (let index = 0; index < toCount; index += 1) {
		const target = toList[index];
		const source = fromById.get(String(target.id)) || fromList[index] || null;
		const fromValue = source ? Number(source.value) || 0 : 0;
		out.push({
			id: target.id,
			label: target.label,
			color: target.color,
			value: lerp(fromValue, Number(target.value) || 0, progress),
		});
	}
	return out;
}
// Lerp scatter points [{ x, y, … }].
export function lerpPoints(from, to, progress) {
	const fromList = Array.isArray(from) ? from : [];
	const toList = Array.isArray(to) ? to : [];
	const out = [];
	const toCount = toList.length;
	for (let index = 0; index < toCount; index += 1) {
		const target = toList[index] || {};
		const source = fromList[index] || null;
		const fromX = source ? Number(source.x) || 0 : Number(target.x) || 0;
		const fromY = source ? Number(source.y) || 0 : Number(target.y) || 0;
		out.push({
			x: lerp(fromX, Number(target.x) || 0, progress),
			y: lerp(fromY, Number(target.y) || 0, progress),
			r: target.r,
			label: target.label,
			color: target.color,
		});
	}
	return out;
}
// Lerp scatter multi-series [{ id, label, color, points[] }].
export function lerpScatterSeries(from, to, progress) {
	const fromList = Array.isArray(from) ? from : [];
	const toList = Array.isArray(to) ? to : [];
	const fromById = new Map();
	const fromCount = fromList.length;
	for (let index = 0; index < fromCount; index += 1) {
		const row = fromList[index];
		if (row && row.id != null) {
			fromById.set(String(row.id), row);
		}
	}
	const out = [];
	const toCount = toList.length;
	for (let index = 0; index < toCount; index += 1) {
		const target = toList[index];
		const source = fromById.get(String(target.id)) || fromList[index] || null;
		out.push({
			id: target.id,
			label: target.label,
			color: target.color,
			points: lerpPoints(source?.points, target.points, progress),
		});
	}
	return out;
}
export function lerpNumber(from, to, progress) {
	return lerp(Number(from) || 0, Number(to) || 0, progress);
}
// Shallow-clone normalized value series (new values arrays).
export function cloneValueSeries(series) {
	const list = Array.isArray(series) ? series : [];
	const out = [];
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const row = list[index];
		out.push({
			id: row.id,
			label: row.label,
			color: row.color,
			values: Array.isArray(row.values) ? row.values.slice() : [],
		});
	}
	return out;
}
export function cloneCategoryItems(items) {
	const list = Array.isArray(items) ? items : [];
	const out = [];
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const row = list[index];
		out.push({
			id: row.id,
			label: row.label,
			color: row.color,
			value: row.value,
		});
	}
	return out;
}
export function clonePoints(points) {
	const list = Array.isArray(points) ? points : [];
	const out = [];
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const row = list[index] || {};
		out.push({
			x: row.x,
			y: row.y,
			r: row.r,
			label: row.label,
			color: row.color,
		});
	}
	return out;
}
export function cloneScatterSeries(series) {
	const list = Array.isArray(series) ? series : [];
	const out = [];
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const row = list[index];
		out.push({
			id: row.id,
			label: row.label,
			color: row.color,
			points: clonePoints(row.points),
		});
	}
	return out;
}
// Bump paintGen so chartSvg / plotModel re-run for the mid-frame snapshot.
export function bumpPaint(host) {
	host.state.paintGen = (Number(host.state.paintGen) || 0) + 1;
}
