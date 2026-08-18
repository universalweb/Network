/*
	DESCRIPTION: ui-progress-ring — radial progress / gauge + optional spinner.
	SVG arc from 12 o'clock; centre value or slot. Thresholds recolor bands.
	Live value updates animate stroke-dashoffset via CSS custom property.
	indeterminate / spin variant = continuous rotation (unique loading ring).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-progress-ring .state.value=${72} .state.tone=${'accent'} .state.size=${'lg'}></ui-progress-ring>
	  <ui-progress-ring .state.indeterminate=${true} .state.variant=${'spin'}></ui-progress-ring>
	  <ui-progress-ring .state.value=${94} .state.thresholds=${[{ at: 90, tone: 'danger' }]}></ui-progress-ring>
	─────────────────────────────────────────────────────────────────────
*/
import { isArray } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DOT_COUNT = 18;
const DASH_COUNT = 24;
const VARIANTS = new Set([
	'solid',
	'dashed',
	'dots',
	'glow',
	'spin',
	'pulse',
]);
const SIZES = new Set([
	'sm',
	'md',
	'lg',
	'xl',
]);
function clamp(value, min, max) {
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
function normalizeVariant(variant) {
	return VARIANTS.has(variant) ? variant : 'solid';
}
function normalizeSize(size) {
	return SIZES.has(size) ? size : 'md';
}
function usesUnits(variant) {
	return variant === 'dashed' || variant === 'dots';
}
export class UIProgressRing extends WebComponent {
	static url = import.meta.url;
	static styles = {
		progressRing: './progress-ring.css',
	};
	static state = {
		value: 0,
		max: 100,
		min: 0,
		size: 'md',
		tone: 'accent',
		thickness: 8,
		label: '',
		showValue: true,
		// solid | dashed | dots | glow | spin | pulse
		variant: 'solid',
		// Continuous rotation + partial arc (loading). Also true when value is null.
		indeterminate: false,
		// Smooth dashoffset / --ring-p transitions on value change.
		animated: true,
		// [{ at: number, tone: string }] — highest met threshold wins.
		thresholds: [],
		// Discrete dash/dot marks — rebuilt in paintUnits (SVG ^html string).
		unitItems: [],
	};
	onConnect() {
		this.observe([
			'value',
			'min',
			'max',
			'indeterminate',
			'variant',
			'thickness',
		], this.paintUnits);
		this.paintUnits();
	}
	isIndeterminate() {
		return this.state.indeterminate === true || this.state.value === null;
	}
	get circumference() {
		return CIRCUMFERENCE.toFixed(2);
	}
	get ratio() {
		if (this.isIndeterminate()) {
			// Partial arc for spin/indeterminate chrome.
			return 0.28;
		}
		const min = Number(this.state.min) || 0;
		const max = Number(this.state.max) || 100;
		const span = max > min ? max - min : 1;
		return clamp((Number(this.state.value) - min) / span, 0, 1);
	}
	get dashOffset() {
		return (CIRCUMFERENCE * (1 - this.ratio)).toFixed(2);
	}
	get displayValue() {
		if (this.isIndeterminate()) {
			return '';
		}
		return `${Math.round(this.ratio * 100)}%`;
	}
	// Highest threshold whose `at` the value has reached wins; falls back to `tone`.
	effectiveTone() {
		const thresholds = this.state.thresholds;
		if (isArray(thresholds) && thresholds.length > 0 && !this.isIndeterminate()) {
			let chosen = '';
			let best = -Infinity;
			const value = Number(this.state.value);
			const count = thresholds.length;
			for (let index = 0; index < count; index += 1) {
				const rule = thresholds[index] || {};
				if (value >= rule.at && rule.at > best) {
					best = rule.at;
					chosen = rule.tone;
				}
			}
			if (chosen) {
				return chosen;
			}
		}
		return this.state.tone || 'accent';
	}
	statusFlag() {
		if (this.isIndeterminate()) {
			return 'indeterminate';
		}
		if (this.ratio >= 1) {
			return 'complete';
		}
		return 'progressing';
	}
	dashArray() {
		return this.circumference;
	}
	showCenterValue() {
		return this.state.showValue && !this.isIndeterminate();
	}
	useUnits() {
		return usesUnits(normalizeVariant(this.state.variant));
	}
	/*
	 * Discrete filled-vs-empty marks (same contract as ui-progress segments).
	 * Unfilled units keep the muted track color — never a transparent hole.
	 */
	paintUnits() {
		const variant = normalizeVariant(this.state.variant);
		if (!usesUnits(variant)) {
			if (this.state.unitItems.length > 0) {
				this.state.unitItems = [];
			}
			return;
		}
		const isDots = variant === 'dots';
		const count = isDots ? DOT_COUNT : DASH_COUNT;
		const indeterminate = this.isIndeterminate();
		const filled = indeterminate ? 0 : this.ratio * count;
		const thickness = Number(this.state.thickness) || 8;
		const dashSpan = (Math.PI * 2) / count;
		const dashLength = dashSpan * 0.58;
		const items = [];
		for (let index = 0; index < count; index += 1) {
			const start = ((index / count) * Math.PI * 2) - (Math.PI / 2);
			let fill = 'empty';
			if (!indeterminate) {
				const level = filled - index;
				if (level >= 1) {
					fill = 'full';
				} else if (level > 0) {
					fill = 'partial';
				}
			}
			if (isDots) {
				items.push({
					id: index,
					kind: 'dot',
					fill,
					cx: (50 + (RADIUS * Math.cos(start))).toFixed(2),
					cy: (50 + (RADIUS * Math.sin(start))).toFixed(2),
					r: Math.max(1.55, thickness * 0.24).toFixed(2),
				});
			} else {
				const end = start + dashLength;
				items.push({
					id: index,
					kind: 'dash',
					fill,
					x1: (50 + (RADIUS * Math.cos(start))).toFixed(2),
					y1: (50 + (RADIUS * Math.sin(start))).toFixed(2),
					x2: (50 + (RADIUS * Math.cos(end))).toFixed(2),
					y2: (50 + (RADIUS * Math.sin(end))).toFixed(2),
				});
			}
		}
		this.state.unitItems = items;
	}
	/* Trusted SVG marks — ^html inside <svg> so units land in the SVG namespace. */
	unitsSvg() {
		const items = this.state.unitItems;
		if (!isArray(items) || items.length === 0) {
			return '';
		}
		const count = items.length;
		let markup = '';
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			if (item.kind === 'dot') {
				markup += `<circle class="ring-unit" data-fill="${item.fill}" cx="${item.cx}" cy="${item.cy}" r="${item.r}"></circle>`;
			} else {
				markup += `<line class="ring-unit" data-fill="${item.fill}" x1="${item.x1}" y1="${item.y1}" x2="${item.x2}" y2="${item.y2}"></line>`;
			}
		}
		return markup;
	}
	render() {
		const indeterminate = this.isIndeterminate();
		const variant = normalizeVariant(this.state.variant);
		const now = indeterminate ? false : Math.round(this.ratio * 100);
		this.html`
			<div
				class="ring"
				data-size=${normalizeSize(this.state.size)}
				data-tone=${this.effectiveTone}
				data-variant=${variant}
				data-status=${this.statusFlag}
				?data-indeterminate=${indeterminate}
				?data-animated=${this.state.animated !== false}
				?data-units=${this.useUnits}
				style=${`--ring-p:${this.ratio};--ring-c:${this.circumference};--ring-sw:${this.state.thickness}`}
				role="progressbar"
				aria-label=${this.state.label || 'Progress'}
				aria-valuemin=${this.state.min || 0}
				aria-valuemax=${this.state.max || 100}
				aria-valuenow=${now}
				aria-valuetext=${indeterminate ? 'Loading' : this.displayValue}>
				<svg class="ring-svg" viewBox="0 0 100 100" overflow="visible" aria-hidden="true">
					<circle
						class="ring-track"
						cx="50" cy="50" r="42"
						stroke-width=${this.state.thickness}></circle>
					<circle
						class="ring-ind"
						cx="50" cy="50" r="42"
						stroke-width=${this.state.thickness}
						stroke-dasharray=${this.dashArray}
						stroke-dashoffset=${this.dashOffset}></circle>
					^html${this.unitsSvg()}
				</svg>
				<div class="ring-center">
					<span class="ring-value" ?hidden=${!this.showCenterValue}>${this.displayValue}</span>
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-progress-ring', UIProgressRing);
