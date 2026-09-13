/*
	DESCRIPTION: ui-grid — 2-D CSS Grid layout primitive.
	WHY GRID, NOT FLEXBOX: ui-stack already covers 1-D (row / column) via flex.
	Flexbox has no 2-D placement and no hole-filling. Grid is the 2-D / app-shell
	engine (explicit tracks, named `grid-template-areas`, item spans).
	`flow: dense` is `grid-auto-flow: row dense`. That backfills HOLES inside
	the grid's own row/column tracks. It does NOT pull items up past a row
	band, so a short card beside a tall one still leaves vertical dead space.
	Dense is not Pinterest / masonry packing. Native CSS masonry
	(`grid-template-rows: masonry`) is not shipped — do not write against it.
	Packing without JS is `ui-masonry` (CSS multicolumn; column-major on
	purpose). Full-width breakout: child `data-span="all"` → `grid-column: 1 / -1`.
	Item spans 2–6 via `data-span` / `data-row-span` (cap 6 — no unbounded rules).
	Every enumerated dim rides as a `data-*` ATTRIBUTE. `.grid` / `.gap-*` /
	`.col-span-*` already exist in `uwc.util` and would beat a class token.
	Gap tokens are the ui-stack scale (`none|xs|sm|md|lg|xl`), owned by
	util-layout.css — not re-declared here.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-grid .state.columns=${3} .state.gap=${'md'}>…</ui-grid>
	  <ui-grid .state.min=${'18rem'} .state.flow=${'dense'}>
	    <section data-span="2">wide</section>
	    <section>narrow</section>
	  </ui-grid>
	  <ui-grid .state.columns=${2} .state.areas=${'"header header" "rail main"'}>
	    <header style="grid-area:header">…</header>
	  </ui-grid>
	──────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-28
*/
import { WebComponent } from 'webcomponent';
import { resolveGridTemplateStyle } from '../../core/styles/tracks.js';
export class UIGrid extends WebComponent {
	static url = import.meta.url;
	static styles = {
		grid: './grid.css',
	};
	static state = {
		// 0 = auto-fit (with `min`, or the 14rem floor).
		columns: 0,
		min: '',
		rows: '',
		areas: '',
		gap: 'md',
		// row | column | dense. dense = hole-backfill, not masonry packing.
		flow: 'row',
		align: 'stretch',
		justify: 'stretch',
		autoRows: '',
	};
	templateStyle() {
		return resolveGridTemplateStyle(this.state);
	}
	render() {
		this.html`
			<div
				data-grid
				data-gap=${this.state.gap}
				data-flow=${this.state.flow}
				data-align=${this.state.align}
				data-justify=${this.state.justify}
				style=${this.templateStyle}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-grid', UIGrid);
