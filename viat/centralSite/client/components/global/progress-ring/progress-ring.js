/*
	DESCRIPTION: ui-progress-ring — a radial progress / gauge dial, hand-rolled
	in SVG (zero-dep). A stroked arc sweeps from 12 o'clock; the centre shows the
	percentage (or a slotted label). Optional `thresholds` recolor the arc as the
	value crosses bands (e.g. turn danger past 90% capacity).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-progress-ring .state.value=${72} .state.tone=${'accent'} .state.size=${'lg'}></ui-progress-ring>
	  <ui-progress-ring .state.value=${94} .state.thresholds=${[{ at: 90, tone: 'danger' }]}></ui-progress-ring>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
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
export class UIProgressRing extends WebComponent {
	static url = import.meta.url;
	static styles = {
		progressRing: './progress-ring.css',
	};
	static state = {
		value: 0,
		max: 100,
		size: 'md',
		tone: 'accent',
		thickness: 8,
		label: '',
		showValue: true,
		thresholds: [],
	};
	get circumference() {
		return CIRCUMFERENCE.toFixed(2);
	}
	get ratio() {
		return clamp(this.state.value / (this.state.max || 100), 0, 1);
	}
	get dashOffset() {
		return (CIRCUMFERENCE * (1 - this.ratio)).toFixed(2);
	}
	get displayValue() {
		return `${Math.round(this.ratio * 100)}%`;
	}
	// Highest threshold whose `at` the value has reached wins; falls back to `tone`.
	effectiveTone() {
		const thresholds = this.state.thresholds;
		if (Array.isArray(thresholds) && thresholds.length > 0) {
			let chosen = '';
			let best = -Infinity;
			for (let index = 0; index < thresholds.length; index += 1) {
				const rule = thresholds[index] || {};
				if (this.state.value >= rule.at && rule.at > best) {
					best = rule.at;
					chosen = rule.tone;
				}
			}
			if (chosen) {
				return chosen;
			}
		}
		return this.state.tone;
	}
	render() {
		this.html`
			<div
				class="ring"
				data-size=${this.state.size}
				data-tone=${this.effectiveTone()}
				role="progressbar" aria-label=${this.state.label}
				aria-valuemin="0" aria-valuemax="100"
				aria-valuenow=${Math.round(this.ratio * 100)}>
				<svg class="ring-svg" viewBox="0 0 100 100">
					<circle class="ring-track" cx="50" cy="50" r="42" stroke-width=${this.state.thickness}></circle>
					<circle class="ring-ind" cx="50" cy="50" r="42" stroke-width=${this.state.thickness}
						stroke-dasharray=${this.circumference} stroke-dashoffset=${this.dashOffset}></circle>
				</svg>
				<div class="ring-center">
					<span class="ring-value" ?hidden=${!this.state.showValue}>${this.displayValue}</span>
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-progress-ring', UIProgressRing);
