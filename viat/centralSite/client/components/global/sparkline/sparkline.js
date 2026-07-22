/*
	DESCRIPTION: ui-sparkline — a tiny inline trend chart, hand-rolled in SVG
	(zero-dep, no build). Feed it a number series; it draws a line, optionally
	filled into an area. Stretches to its box via preserveAspectRatio="none" +
	non-scaling-stroke (crisp 1.5px line at any width). The KPI-card gateway.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-sparkline .state.values=${[3, 5, 4, 8, 7, 11]} .state.variant=${'area'} .state.tone=${'success'}></ui-sparkline>
	`tone` maps to the shared token scale (accent/success/warning/danger/info/neutral).
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
const VIEW_W = 100;
const VIEW_H = 32;
// Vertical breathing room so peaks/troughs aren't clipped at the box edge.
const PAD = 3;
function toNumbers(values) {
	if (!Array.isArray(values)) {
		return [];
	}
	const out = [];
	for (let index = 0; index < values.length; index += 1) {
		const value = Number(values[index]);
		out.push(Number.isFinite(value) ? value : 0);
	}
	return out;
}
export class UISparkline extends WebComponent {
	static url = import.meta.url;
	static styles = {
		sparkline: './sparkline.css',
	};
	static state = {
		values: [],
		variant: 'line',
		tone: 'accent',
		label: '',
	};
	// Map the series into viewBox coordinates once; both renderers read it.
	coords() {
		const values = toNumbers(this.state.values);
		const count = values.length;
		if (count === 0) {
			return [];
		}
		let min = values[0];
		let max = values[0];
		for (let index = 1; index < count; index += 1) {
			if (values[index] < min) {
				min = values[index];
			}
			if (values[index] > max) {
				max = values[index];
			}
		}
		const span = max - min || 1;
		const stepX = count > 1 ? VIEW_W / (count - 1) : 0;
		const usableH = VIEW_H - (PAD * 2);
		const points = [];
		for (let index = 0; index < count; index += 1) {
			const x = count > 1 ? index * stepX : VIEW_W / 2;
			const y = PAD + usableH - (((values[index] - min) / span) * usableH);
			points.push({
				x,
				y,
			});
		}
		return points;
	}
	linePoints() {
		const points = this.coords();
		let out = '';
		for (let index = 0; index < points.length; index += 1) {
			out += `${points[index].x.toFixed(2)},${points[index].y.toFixed(2)} `;
		}
		return out.trim();
	}
	areaPath() {
		const points = this.coords();
		if (points.length === 0) {
			return '';
		}
		const last = points.length - 1;
		let path = `M ${points[0].x.toFixed(2)},${VIEW_H} `;
		for (let index = 0; index < points.length; index += 1) {
			path += `L ${points[index].x.toFixed(2)},${points[index].y.toFixed(2)} `;
		}
		path += `L ${points[last].x.toFixed(2)},${VIEW_H} Z`;
		return path;
	}
	render() {
		this.html`
			<svg
				class="spark"
				data-tone=${this.state.tone}
				viewBox="0 0 100 32" preserveAspectRatio="none"
				role="img" aria-label=${this.state.label}>
				<path class="spark-area" ?hidden=${this.state.variant !== 'area'} d=${this.areaPath}></path>
				<polyline class="spark-line" points=${this.linePoints}></polyline>
			</svg>
		`;
	}
}
customElements.define('ui-sparkline', UISparkline);
