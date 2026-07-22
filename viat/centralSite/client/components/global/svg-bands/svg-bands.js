/*
	DESCRIPTION: ui-svg-bands — a parametric decorative edge band, hand-rolled in
	SVG (zero-dep, no build). Draws a repeating geometric silhouette as a single
	path that stretches to its box via preserveAspectRatio="none" + non-scaling
	stroke (crisp at any width). Use it as a section divider or a torn/castle cap.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-svg-bands .shape=${'battlement'} .segments=${16} .tone=${'accent'}></ui-svg-bands>
	`shape`: zigzag | battlement | steep | wave. `fill` swaps the stroked edge for
	a filled silhouette; `flip` mirrors it to cap a section's top. `tone` maps to
	the shared scale (accent/success/warning/danger/info/neutral) or `current` to
	inherit the surrounding text color.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
// Wide, integer-friendly viewBox so segment math lands on clean coordinates;
// preserveAspectRatio="none" stretches it to the real box.
const VIEW_W = 2400;
const VIEW_H = 120;
// Build the band silhouette as one path. Pure geometry — no state reads here so
// the same function serves stroke and fill modes and stays trivially testable.
function buildBand(shape, segments, amplitude, filled) {
	const segCount = Math.max(1, Math.floor(segments));
	const segW = VIEW_W / segCount;
	const amp = Math.min(1, Math.max(0, amplitude));
	// Centre the pattern vertically; `amp` sets how much of the height it claims.
	const yPeak = (VIEW_H * (1 - amp)) / 2;
	const yBase = VIEW_H - yPeak;
	const hi = yPeak.toFixed(1);
	const lo = yBase.toFixed(1);
	// Quadratic control that lands the scallop crest exactly on yPeak.
	const ctrl = (yBase - (2 * (yBase - yPeak))).toFixed(1);
	let path = `M 0,${lo}`;
	for (let index = 0; index < segCount; index += 1) {
		const x0 = (index * segW).toFixed(1);
		const xMid = ((index * segW) + (segW / 2)).toFixed(1);
		const x1 = ((index + 1) * segW).toFixed(1);
		if (shape === 'battlement') {
			path += ` L ${x0},${hi} L ${xMid},${hi} L ${xMid},${lo} L ${x1},${lo}`;
		} else if (shape === 'steep') {
			path += ` L ${x0},${hi} L ${x1},${lo}`;
		} else if (shape === 'wave') {
			path += ` Q ${xMid},${ctrl} ${x1},${lo}`;
		} else {
			path += ` L ${xMid},${hi} L ${x1},${lo}`;
		}
	}
	if (filled) {
		path += ` L ${VIEW_W},${VIEW_H} L 0,${VIEW_H} Z`;
	}
	return path;
}
export class UISvgBands extends WebComponent {
	static url = import.meta.url;
	static styles = {
		bands: './svg-bands.css',
	};
	static state = {
		shape: 'zigzag',
		segments: 12,
		amplitude: 0.7,
		fill: false,
		flip: false,
		tone: 'accent',
	};
	// Method ref → reactive spot: a change to any read state triggers a patch pass
	// that recomputes the path (mirrors ui-sparkline's areaPath/linePoints).
	bandPath() {
		return buildBand(this.state.shape, Number(this.state.segments) || 1, Number(this.state.amplitude), this.state.fill);
	}
	render() {
		this.html`
			<svg
				class="band"
				data-tone=${this.state.tone}
				data-fill=${this.state.fill}
				data-flip=${this.state.flip}
				viewBox="0 0 2400 120" preserveAspectRatio="none"
				role="presentation" aria-hidden="true">
				<path class="band-path" d=${this.bandPath}></path>
			</svg>
		`;
	}
}
customElements.define('ui-svg-bands', UISvgBands);
