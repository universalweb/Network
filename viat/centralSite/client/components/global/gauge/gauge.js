/*
	DESCRIPTION: ui-gauge — semi-circular dial gauge (SVG). Distinct from
	ui-progress-ring. Real SVG template + bound attrs (sparkline pattern) —
	no ^html string builder. Live: .state.value eases via chartMotion.
	aria-valuenow stays on the target value (not mid-tween paint).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-gauge .state.value=${72} .state.max=${100} .state.label=${'CPU'}></ui-gauge>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import {
	CHART_TONES,
	clamp,
	donutArcPath,
	formatTick,
} from '../charts/chartMath.js';
import {
	bumpPaint,
	cancelChartMotion,
	DEFAULT_MOTION_MS,
	goChartMotion,
	lerpNumber,
} from '../charts/chartMotion.js';
import { hideChartTip, joinTip, showChartTip } from '../charts/chartTip.js';
const VIEW_W = 200;
const VIEW_H = 120;
const CX = 100;
const CY = 100;
const OUTER = 78;
const INNER = 58;
const START = 270;
const SWEEP = 180;
export class UIGauge extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chartTip: '../charts/chart-tip.css',
		gauge: './gauge.css',
	};
	static state = {
		value: 0,
		min: 0,
		max: 100,
		label: '',
		unit: '',
		tone: 'accent',
		thresholds: [],
		showValue: true,
		showLabel: true,
		readoutPosition: 'overlay',
		showTip: true,
		animate: true,
		motionMs: DEFAULT_MOTION_MS,
		paintGen: 0,
		motion: false,
	};
	_chartHoverEl = null;
	_paintValue = null;
	onConnect() {
		this._paintValue = Number(this.state.value) || 0;
		this.observe(['value'], this.onValueTarget);
	}
	onDisconnect() {
		cancelChartMotion(this);
	}
	onValueTarget() {
		const target = Number(this.state.value) || 0;
		const from = this._paintValue == null ? target : this._paintValue;
		goChartMotion(this, {
			from,
			to: target,
			lerp: lerpNumber,
			apply: this.applyPaintValue,
			duration: this.state.motionMs,
			animate: this.state.animate !== false,
		});
	}
	applyPaintValue(mid) {
		this._paintValue = mid;
		bumpPaint(this);
	}
	paintValue() {
		const paintGen = this.state.paintGen;
		if (paintGen < 0) {
			return 0;
		}
		return this._paintValue == null ? (Number(this.state.value) || 0) : this._paintValue;
	}
	get ratio() {
		const min = Number(this.state.min) || 0;
		const max = Number(this.state.max) || 100;
		return clamp((this.paintValue() - min) / (max - min || 1), 0, 1);
	}
	effectiveTone() {
		const thresholds = this.state.thresholds;
		const value = Number(this.state.value);
		if (Array.isArray(thresholds) && thresholds.length > 0) {
			let chosen = '';
			let best = -Infinity;
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
		return CHART_TONES.has(this.state.tone) ? this.state.tone : 'accent';
	}
	trackPath() {
		const paintGen = this.state.paintGen;
		if (paintGen < 0) {
			return '';
		}
		return donutArcPath(CX, CY, INNER, OUTER, START, START + SWEEP);
	}
	valuePath() {
		const paintGen = this.state.paintGen;
		if (paintGen < 0 || this.ratio <= 0) {
			return '';
		}
		const end = START + (this.ratio * SWEEP);
		return donutArcPath(CX, CY, INNER, OUTER, START, end);
	}
	displayValue() {
		const text = formatTick(this.paintValue());
		const unit = String(this.state.unit || '');
		return unit ? `${text}${unit}` : text;
	}
	tipText() {
		const pct = Math.round(this.ratio * 100);
		return joinTip([
			this.state.label,
			this.displayValue(),
			`${pct}% of range`,
		]);
	}
	hideValue() {
		return this.state.showValue !== true;
	}
	hideLabel() {
		return this.state.showLabel !== true || !String(this.state.label || '').trim();
	}
	readoutPosition() {
		return this.state.readoutPosition === 'below' ? 'below' : 'overlay';
	}
	handlePointerMove(domEvent) {
		if (this.state.showTip === false) {
			return;
		}
		showChartTip(this, domEvent);
	}
	handlePointerLeave() {
		hideChartTip(this);
	}
	render() {
		this.html`
			<div class="gg" data-tone=${this.effectiveTone} data-readout=${this.readoutPosition}
				role="meter"
				aria-label=${this.state.label || 'Gauge'}
				aria-valuemin=${this.state.min}
				aria-valuemax=${this.state.max}
				aria-valuenow=${this.state.value}>
				<div #plot class="chart-plot" ?data-motion=${this.state.motion}
					@pointermove=${this.handlePointerMove} @pointerleave=${this.handlePointerLeave}>
					<svg class="gg-svg" viewBox="0 0 200 120" role="presentation">
						<path class="gg-track" d=${this.trackPath}></path>
						<path class="gg-value" d=${this.valuePath} data-tip=${this.tipText}></path>
					</svg>
					<div #tip class="chart-tip" data-show="false" role="status"></div>
				</div>
				<div class="gg-readout">
					<span class="gg-value-text" ?hidden=${this.hideValue}>${this.displayValue}</span>
					<span class="gg-label" ?hidden=${this.hideLabel}>${this.state.label}</span>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-gauge', UIGauge);
