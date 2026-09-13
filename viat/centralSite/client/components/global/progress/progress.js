/*
	DESCRIPTION: ui-progress — linear progress.
	Solid or segmented track (circle · round · square · triangle), tones, sizes,
	striped/glow/pulse/liquid animation variants, label + value header, min/max,
	indeterminate sweep. value null forces indeterminate.
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
	'follow',
	'inside-follow',
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
		// null → indeterminate. Number → determinate fill.
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
		// auto | center | start | end | above | follow | inside-follow.
		// follow        = glass badge + caret riding the live fill end, ABOVE the bar.
		// inside-follow = the readout rides that same fill end from INSIDE the bar.
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
	ratioVarStyle() {
		if (this.isIndeterminate()) {
			return '';
		}
		return `--progress-ratio:${(this.ratio() * 100).toFixed(2)}%`;
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
				class="progress-seg"
				data-fill=${item?.fill || 'empty'}
				style=${`--progress-i:${item?.delay ?? 0}`}
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
	/*
	 * A FLOATING readout hovers outside the track, so it needs a real surface
	 * behind it and takes the house `.glass` utility. An INSIDE one sits on the
	 * fill and keeps its own scrim instead — glass over a tone-driven bar would
	 * blur the bar itself and lose the contrast the scrim exists to guarantee.
	 */
	floatsAboveTrack() {
		const position = this.resolvedPosition();
		return position === 'above' || position === 'auto' || position === 'follow';
	}
	trackValueClass() {
		return this.floatsAboveTrack() ? 'progress-value glass' : 'progress-value';
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
	progressMin() {
		return this.range().min;
	}
	progressMax() {
		return this.range().max;
	}
	progressNow() {
		if (this.isIndeterminate()) {
			return false;
		}
		return Math.round(this.ratio() * 100);
	}
	progressValueText() {
		if (this.isIndeterminate()) {
			return 'Loading';
		}
		return this.percentLabel();
	}
	render() {
		this.html`
			<div
				class="progress"
				data-size=${normalizeSize(this.state.size)}
				data-tone=${this.state.tone || 'accent'}
				data-variant=${normalizeVariant(this.state.variant)}
				data-shape=${normalizeShape(this.state.segmentShape)}
				data-status=${this.statusFlag}
				data-value-position=${this.resolvedPosition}
				data-fit=${this.trackFitFlag}
				?data-indeterminate=${this.isIndeterminate}
				?data-animated=${this.state.animated !== false}
				role="progressbar"
				aria-label=${this.state.label || 'Progress'}
				aria-valuemin=${this.progressMin}
				aria-valuemax=${this.progressMax}
				aria-valuenow=${this.progressNow}
				aria-valuetext=${this.progressValueText}>
				<div class="progress-head" ?hidden=${this.labelRowHidden}>
					<span class="progress-label" ?hidden=${!this.state.label}>${this.state.label}</span>
					<span class="progress-value progress-value-head" ?hidden=${this.headValueHidden}>${this.percentLabel}</span>
				</div>
				<div class="progress-row">
					<div class="progress-track" data-value-position=${this.resolvedPosition} style=${this.ratioVarStyle} tooltip=${this.state.tooltip}>
						<div class="progress-fill" ?hidden=${this.useSegments}>
							<div class="progress-bar" style=${this.barStyle}></div>
						</div>
						<div class="progress-segs" ?hidden=${this.segmentsHidden}>
							${this.list('segmentItems', this.segmentCell)}
						</div>
						<span class=${this.trackValueClass} ?hidden=${this.trackValueHidden}>${this.percentLabel}</span>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-progress', UIProgress);
