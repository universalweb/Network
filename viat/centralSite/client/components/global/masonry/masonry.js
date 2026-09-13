/*
	DESCRIPTION: ui-masonry — Pinterest / masonry packing for slotted children.
	ENGINE: native CSS multicolumn. Zero JS layout, zero ResizeObserver. The
	browser packs items into balanced columns and `break-inside: avoid` keeps
	each child whole. This is the only zero-JS path that actually fills
	vertical dead space (CSS Grid row-bands cannot).
	TRADEOFF (deliberate, not a defect): multicol fills COLUMN-MAJOR
	(top-of-col-1 → bottom-of-col-1 → top-of-col-2). Visual order is not
	left-to-right reading order. Correct for galleries / pin boards / mixed-
	height dashboards. Strict row-major 2-D placement is `ui-grid`.
	`grid-auto-flow: dense` is NOT this: dense backfills holes inside grid
	tracks, it does not pull items up past a row band. Native
	`grid-template-rows: masonry` is not shipped; this primitive does not
	depend on it and must not auto-flip when it lands (that would invert
	reading order).
	Full-width breakout: child `data-span="all"` → `column-span: all`.
	Gap accepts the ui-stack token scale (`md`) or a CSS length (`1rem`).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-masonry .state.columns=${2} .state.gap=${'md'}>
	    <ui-panel>tall</ui-panel>
	    <ui-panel>short</ui-panel>
	    <ui-panel data-span="all">full width</ui-panel>
	  </ui-masonry>
	  <ui-masonry .state.min=${'220px'} .state.gap=${'0.75rem'}>…</ui-masonry>
	──────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-28
*/
import { WebComponent } from 'webcomponent';
import { isGapToken, resolveGapValue, resolveMasonryStyle } from '../../core/styles/tracks.js';
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
	gapToken() {
		return isGapToken(this.state.gap) ? this.state.gap : '';
	}
	trackStyle() {
		return resolveMasonryStyle(this.state);
	}
	syncHostGap() {
		/*
		 * Host, not the inner wrapper: slotted children inherit from the host
		 * (light tree). A --masonry-gap on the shadow wrapper does not reach
		 * ::slotted margin-block-end.
		 */
		this.style.setProperty('--masonry-gap', resolveGapValue(this.state.gap));
	}
	render() {
		this.syncHostGap();
		this.html`
			<div
				data-masonry
				data-gap=${this.gapToken}
				style=${this.trackStyle}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-masonry', UIMasonry);
