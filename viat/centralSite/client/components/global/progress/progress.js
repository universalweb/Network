/*
	DESCRIPTION: ui-progress — linear progress (/ Base UI Progress parity).
	Solid or segmented track (circle · round · square · triangle), tones, sizes,
	striped/glow/pulse/liquid animation variants, label + value header, min/max,
	indeterminate sweep. value null forces indeterminate (Base UI).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-progress .state.value=${62} .state.label=${'Upload'}></ui-progress>
	  <ui-progress .state.valuePosition=${'start'} .state.value=${40}></ui-progress>
	  <ui-progress .state.segmentShape=${'circle'} .state.segments=${12} .state.value=${70}></ui-progress>
	  <ui-progress .state.indeterminate=${true} .state.variant=${'striped'}></ui-progress>
	─────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
const SHAPES = new Set([
	'none',
	'circle',
	'round',
	'square',
	'triangle',
]);
const VARIANTS = new Set([
	'solid',
	'striped',
	'glow',
	'pulse',
	'liquid',
]);
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
const VALUE_POSITIONS = new Set([
	'auto',
	'center',
	'start',
	'end',
	'above',
]);
const LAYOUT_TO_POSITION = {
	overlay: 'center',
	above: 'above',
	end: 'end',
};
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
function normalizeShape(shape) {
	return SHAPES.has(shape) ? shape : 'none';
}
function normalizeVariant(variant) {
	return VARIANTS.has(variant) ? variant : 'solid';
}
function normalizeSize(size) {
	return SIZES.has(size) ? size : 'md';
}
function normalizeValuePosition(position, layout) {
	if (VALUE_POSITIONS.has(position)) {
		return position;
	}
	return LAYOUT_TO_POSITION[layout] || 'auto';
}
export class UIProgress extends WebComponent {
	static url = import.meta.url;
	static styles = {
		progress: './progress.css',
	};
	static state = {
		// null → indeterminate (Base UI). Number → determinate fill.
		value: 0,
		min: 0,
		max: 100,
		// Explicit override; also true when value is null.
		indeterminate: false,
		tone: 'accent',
		size: 'md',
		// solid | striped | glow | pulse | liquid
		variant: 'solid',
		// none | circle | round | square | triangle
		segmentShape: 'none',
		segments: 12,
		label: '',
		// Percent readout. Default on — hide with false.
		showValue: true,
		// auto | center | start | end | above. start/end stay inside the bar.
		// auto = center when the track is tall enough, else lift above.
		valuePosition: 'auto',
		// Compat alias: overlay→center · above→above · end→end (inside).
		valueLayout: 'end',
		// Smooth width / segment transitions (CSS). Set false for instant jumps.
		animated: true,
		// Hover hint on the track (core tooltip= behavior).
		tooltip: '',
		// Segmented track width: content = hug segments · fill = stretch full host.
		// Solid bars always fill. Default content so short segment rows don't span 100%.
		trackFit: 'content',
		// Built by paintSegments — flat light rows, not a child CE.
		segmentItems: [],
	};
	onConnect() {
		this.observe([
			'value',
			'min',
			'max',
			'indeterminate',
			'segments',
			'segmentShape',
		], this.paintSegments);
		this.paintSegments();
	}
	isIndeterminate() {
		return this.state.indeterminate === true || this.state.value === null;
	}
	range() {
		const min = Number(this.state.min);
		const max = Number(this.state.max);
		const lo = Number.isFinite(min) ? min : 0;
		const hi = Number.isFinite(max) ? max : 100;
		return {
			min: lo,
			max: hi > lo ? hi : lo + 1,
		};
	}
	ratio() {
		if (this.isIndeterminate()) {
			return 0;
		}
		const {
			min,
			max,
		} = this.range();
		return clamp((Number(this.state.value) - min) / (max - min), 0, 1);
	}
	percentLabel() {
		return `${Math.round(this.ratio() * 100)}%`;
	}
	barStyle() {
		if (this.isIndeterminate()) {
			return '';
		}
		return `inline-size:${(this.ratio() * 100).toFixed(2)}%`;
	}
	statusFlag() {
		if (this.isIndeterminate()) {
			return 'indeterminate';
		}
		if (this.ratio() >= 1) {
			return 'complete';
		}
		return 'progressing';
	}
	paintSegments() {
		const shape = normalizeShape(this.state.segmentShape);
		if (shape === 'none') {
			if (this.state.segmentItems.length > 0) {
				this.state.segmentItems = [];
			}
			return;
		}
		const count = Math.max(1, Math.min(48, Math.round(Number(this.state.segments) || 12)));
		const indeterminate = this.isIndeterminate();
		const filled = indeterminate ? 0 : this.ratio() * count;
		const items = [];
		for (let index = 0; index < count; index += 1) {
			const level = filled - index;
			let fill = 'empty';
			if (!indeterminate) {
				if (level >= 1) {
					fill = 'full';
				} else if (level > 0) {
					fill = 'partial';
				}
			}
			items.push({
				id: index,
				fill,
				delay: index,
			});
		}
		this.state.segmentItems = items;
	}
	/* Light row — plain values only. */
	segmentCell(item) {
		return html`
			<span
				class="pg-seg"
				data-fill=${item?.fill || 'empty'}
				style=${`--pg-i:${item?.delay ?? 0}`}
				aria-hidden="true"></span>`;
	}
	resolvedPosition() {
		return normalizeValuePosition(this.state.valuePosition, this.state.valueLayout);
	}
	showValueReadout() {
		return this.state.showValue === true && !this.isIndeterminate();
	}
	showLabelRow() {
		return Boolean(this.state.label);
	}
	showHeadValue() {
		return this.showValueReadout() && this.resolvedPosition() === 'above' && Boolean(this.state.label);
	}
	showTrackValue() {
		return this.showValueReadout() && !this.showHeadValue();
	}
	labelRowHidden() {
		return !this.showLabelRow();
	}
	headValueHidden() {
		return !this.showHeadValue();
	}
	trackValueHidden() {
		return !this.showTrackValue();
	}
	segmentsHidden() {
		return !this.useSegments();
	}
	useSegments() {
		return normalizeShape(this.state.segmentShape) !== 'none';
	}
	trackFitFlag() {
		// Solid continuous bar always fills the row; segments honor trackFit.
		if (!this.useSegments()) {
			return 'fill';
		}
		return this.state.trackFit === 'fill' ? 'fill' : 'content';
	}
	render() {
		const indeterminate = this.isIndeterminate();
		const {
			min,
			max,
		} = this.range();
		const now = indeterminate ? false : Math.round(this.ratio() * 100);
		this.html`
			<div
				class="pg"
				data-size=${normalizeSize(this.state.size)}
				data-tone=${this.state.tone || 'accent'}
				data-variant=${normalizeVariant(this.state.variant)}
				data-shape=${normalizeShape(this.state.segmentShape)}
				data-status=${this.statusFlag}
				data-value-position=${this.resolvedPosition}
				data-fit=${this.trackFitFlag}
				?data-indeterminate=${indeterminate}
				?data-animated=${this.state.animated !== false}
				role="progressbar"
				aria-label=${this.state.label || 'Progress'}
				aria-valuemin=${min}
				aria-valuemax=${max}
				aria-valuenow=${now}
				aria-valuetext=${indeterminate ? 'Loading' : this.percentLabel}>
				<div class="pg-head" ?hidden=${this.labelRowHidden}>
					<span class="pg-label" ?hidden=${!this.state.label}>${this.state.label}</span>
					<span class="pg-value pg-value-head" ?hidden=${this.headValueHidden}>${this.percentLabel}</span>
				</div>
				<div class="pg-row">
					<div class="pg-track" data-value-position=${this.resolvedPosition} tooltip=${this.state.tooltip}>
						<div class="pg-bar" ?hidden=${this.useSegments} style=${this.barStyle}></div>
						<div class="pg-segs" ?hidden=${this.segmentsHidden}>
							${this.list('segmentItems', this.segmentCell)}
						</div>
						<span class="pg-value" ?hidden=${this.trackValueHidden}>${this.percentLabel}</span>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-progress', UIProgress);
