/*
	DESCRIPTION: ui-svg-bands — a parametric decorative edge band, hand-rolled in
	SVG (zero-dep, no build). Draws a repeating geometric silhouette as a single
	path that stretches to its box via preserveAspectRatio="none" + non-scaling
	stroke (crisp at any width). Use it as a section divider or a torn/castle cap.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-svg-bands .state.shape=${'battlement'} .state.segments=${16} .state.tone=${'accent'}></ui-svg-bands>
	`shape` picks the silhouette (see BAND_SHAPES). `fill` swaps the stroked edge
	for a filled silhouette; `flip` mirrors it to cap a section's top. `tone` maps
	to the shared scale (accent/success/warning/danger/info/neutral) or `current`
	to inherit the surrounding text color.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
// Wide, integer-friendly viewBox so segment math lands on clean coordinates;
// preserveAspectRatio="none" stretches it to the real box.
const VIEW_W = 2400;
const VIEW_H = 120;
export const BAND_SHAPES = Object.freeze([
	'zigzag',
	'battlement',
	'steep',
	'wave',
	'scallop',
	'cloud',
	'bevel',
	'diamond',
	'ripple',
	'notch',
	'peaks',
	'petal',
	'steps',
]);
function coord(value) {
	return value.toFixed(1);
}
// Build the band silhouette as one path. Pure geometry — no state reads here so
// the same function serves stroke and fill modes and stays trivially testable.
export function buildBand(shape, segments, amplitude, filled) {
	const segCount = Math.max(1, Math.floor(segments));
	const segW = VIEW_W / segCount;
	const amp = Math.min(1, Math.max(0, amplitude));
	const yPeak = (VIEW_H * (1 - amp)) / 2;
	const yBase = VIEW_H - yPeak;
	const yMid = (yPeak + yBase) / 2;
	const rise = yBase - yPeak;
	const hi = coord(yPeak);
	const lo = coord(yBase);
	const mid = coord(yMid);
	const ctrl = coord(yBase - (2 * rise));
	let path = `M 0,${lo}`;
	for (let index = 0; index < segCount; index += 1) {
		const startX = index * segW;
		const x0 = coord(startX);
		const xMid = coord(startX + (segW / 2));
		const x1 = coord(startX + segW);
		const xQ = coord(startX + (segW * 0.25));
		const x3Q = coord(startX + (segW * 0.75));
		switch (shape) {
			case 'battlement': {
				path += ` L ${x0},${hi} L ${xMid},${hi} L ${xMid},${lo} L ${x1},${lo}`;
				break;
			}
			case 'steep': {
				path += ` L ${x0},${hi} L ${x1},${lo}`;
				break;
			}
			case 'wave': {
				path += ` Q ${xMid},${ctrl} ${x1},${lo}`;
				break;
			}
			case 'scallop': {
				path += ` A ${coord(segW / 2)} ${coord(rise)} 0 0 0 ${x1},${lo}`;
				break;
			}
			case 'cloud': {
				const joinX = coord(startX + (segW * 0.58));
				path += ` A ${coord(segW * 0.36)} ${coord(rise)} 0 0 0 ${joinX},${lo}`;
				path += ` A ${coord(segW * 0.3)} ${coord(rise * 0.82)} 0 0 0 ${x1},${lo}`;
				break;
			}
			case 'bevel': {
				path += ` L ${xQ},${hi} L ${x3Q},${hi} L ${x1},${lo}`;
				break;
			}
			case 'diamond': {
				path += ` L ${xQ},${mid} L ${xMid},${hi} L ${x3Q},${mid} L ${x1},${lo}`;
				break;
			}
			case 'ripple': {
				path += ` C ${coord(startX + (segW * 0.32))},${hi} ${coord(startX + (segW * 0.68))},${hi} ${x1},${lo}`;
				break;
			}
			case 'notch': {
				path += ` L ${xQ},${lo} L ${xQ},${hi} L ${x3Q},${hi} L ${x3Q},${lo} L ${x1},${lo}`;
				break;
			}
			case 'peaks': {
				path += ` L ${xQ},${hi} L ${xMid},${mid} L ${x3Q},${hi} L ${x1},${lo}`;
				break;
			}
			case 'petal': {
				path += ` A ${coord(segW * 0.42)} ${coord(rise * 1.12)} 0 0 0 ${x1},${lo}`;
				break;
			}
			case 'steps': {
				path += ` L ${xQ},${mid} L ${xQ},${hi} L ${x3Q},${hi} L ${x3Q},${lo} L ${x1},${lo}`;
				break;
			}
			default: {
				path += ` L ${xMid},${hi} L ${x1},${lo}`;
				break;
			}
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
				data-shape=${this.state.shape}
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
