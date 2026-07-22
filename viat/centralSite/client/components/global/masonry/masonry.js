/*
	DESCRIPTION: ui-masonry — a masonry/justified grid for slotted children, built
	on native CSS multicolumn. Zero JS layout, zero ResizeObserver: the browser
	packs items into balanced columns and `break-inside: avoid` keeps each child
	whole. Set a fixed column COUNT, or pass `min` (a min column width) to let the
	columns auto-fit responsively.
	CAVEAT: multicol fills COLUMN-MAJOR (top-of-col-1 → bottom-of-col-1 → top-of-col-2),
	so the visual order is not left-to-right reading order. Correct for galleries /
	pin boards; if you need strict row order, this is the wrong primitive.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-masonry .state.columns=${3} .state.gap=${'1rem'}> …cards… </ui-masonry>
	  <ui-masonry .state.min=${'220px'} .state.gap=${'0.75rem'}> …cards… </ui-masonry>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
export class UIMasonry extends WebComponent {
	static url = import.meta.url;
	static styles = {
		masonry: './masonry.css',
	};
	static state = {
		columns: 3,
		min: '',
		gap: '1rem',
	};
	render() {
		// `min` (column-width) takes precedence and gives auto-fit responsiveness;
		// otherwise a fixed column-count. `--masonry-gap` feeds the per-item bottom
		// margin (custom props inherit through the slot to the projected children).
		const track = this.state.min ? `column-width:${this.state.min}` : `column-count:${this.state.columns}`;
		const style = `${track};column-gap:${this.state.gap};--masonry-gap:${this.state.gap}`;
		this.html`
			<div class="masonry" style=${style}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-masonry', UIMasonry);
