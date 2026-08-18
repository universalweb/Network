/*
	DESCRIPTION: ui-pie-chart — pie / donut share chart.
	Geometry: list() of this.partial mini-SVG slice rows (framework tooltip=).
	Legend: ui-legend. Live: rAF value tween.
	Hover: state.hoverId only — no querySelector / closest.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-pie-chart .state.items=${[…]} .state.variant=${'donut'}
	    .state.legendPosition=${'right'}></ui-pie-chart>
	─────────────────────────────────────────────────────────────────────
*/
import '../legend/legend.js';
import { WebComponent } from 'webcomponent';
import {
	applyChartLayoutFromViewport,
	attachChartLayout,
	chartLegendStateDefaults,
	detachChartLayout,
	resolveLegendLayout,
} from '../charts/chartLayout.js';
import {
	donutArcPath,
	formatTick,
	normalizeCategoryItems,
} from '../charts/chartMath.js';
import {
	bumpPaint,
	cancelChartMotion,
	cloneCategoryItems,
	DEFAULT_MOTION_MS,
	goChartMotion,
	lerpCategoryItems,
} from '../charts/chartMotion.js';
import { joinTip } from '../charts/chartTip.js';
const VIEW = 200;
const CX = 100;
const CY = 100;
const OUTER = 78;
const INNER_DONUT = 46;
export class UIPieChart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chartLayout: '../charts/chart-layout.css',
		pieChart: './pie-chart.css',
	};
	static state = {
		items: [],
		// Partial mini-SVG slice rows for list()
		sliceLayers: [],
		legendItems: [],
		totalLabel: '',
		hoverId: '',
		variant: 'donut',
		showTotal: true,
		showTip: true,
		...chartLegendStateDefaults({
			legendPosition: 'left',
		}),
		animate: true,
		motionMs: DEFAULT_MOTION_MS,
		paintGen: 0,
		motion: false,
		tone: 'accent',
		label: '',
		emptyLabel: 'No data',
	};
	_paintItems = null;
	onConnect() {
		this._paintItems = normalizeCategoryItems(this.state.items);
		this.observe(['items'], this.onItemsTarget);
		this.observe([
			'paintGen',
			'variant',
			'showLegend',
			'hoverId',
		], this.syncPaintLayers);
		this.syncPaintLayers();
		attachChartLayout(this);
	}
	onDisconnect() {
		cancelChartMotion(this);
		detachChartLayout(this);
	}
	handleChartViewportChange() {
		applyChartLayoutFromViewport(this);
	}
	onItemsTarget() {
		const target = normalizeCategoryItems(this.state.items);
		const from = this._paintItems ? cloneCategoryItems(this._paintItems) : cloneCategoryItems(target);
		goChartMotion(this, {
			from,
			to: target,
			lerp: lerpCategoryItems,
			apply: this.applyPaintItems,
			duration: this.state.motionMs,
			animate: this.state.animate !== false,
		});
	}
	applyPaintItems(mid) {
		this._paintItems = mid;
		bumpPaint(this);
	}
	// Rebuild list rows + legend from paint snapshot (no string SVG assembly).
	syncPaintLayers() {
		const paintGen = this.state.paintGen;
		const items = paintGen >= 0 ? (this._paintItems ?? normalizeCategoryItems(this.state.items)) : [];
		let total = 0;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			total += Math.max(0, items[index].value);
		}
		if (total <= 0 || itemCount === 0) {
			this.assignState({
				sliceLayers: [],
				legendItems: [],
				totalLabel: '',
			});
			return;
		}
		const inner = this.state.variant === 'donut' ? INNER_DONUT : 0;
		const hoverId = this.state.hoverId;
		const slices = [];
		const legend = [];
		let angle = 0;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			const value = Math.max(0, item.value);
			const sweep = (value / total) * 360;
			const start = angle;
			const end = angle + sweep;
			const path = itemCount === 1 ? donutArcPath(CX, CY, inner, OUTER, 0, 359.99) : donutArcPath(CX, CY, inner, OUTER, start, end);
			const pct = Math.round((value / total) * 1000) / 10;
			const tip = joinTip([
				item.label,
				formatTick(value),
				`${pct}%`,
			]);
			const id = item.id;
			slices.push({
				id,
				label: item.label,
				value,
				pct,
				d: path,
				tip,
				isHover: id === hoverId,
				// Plain fields for partial row (no CE / no runtime style build).
				style: `--pc-series:${item.color || 'currentColor'}`,
			});
			legend.push({
				id,
				label: item.label,
				color: item.color,
				tip,
				detail: `${pct}%`,
			});
			angle = end;
		}
		this.assignState({
			sliceLayers: slices,
			legendItems: this.state.showLegend === true ? legend : [],
			totalLabel: formatTick(total),
		});
	}
	/* Feature-light partial row — framework tooltip= + correct SVG namespace. */
	sliceLayerRow(layer) {
		return this.partial`
			<svg class="pc-slice-svg" viewBox="0 0 200 200" aria-hidden="true">
				<path class=${layer.isHover ? 'pc-slice is-hover' : 'pc-slice'}
					style=${layer.style}
					d=${layer.d}
					data-id=${layer.id}
					data-label=${layer.label}
					data-value=${layer.value}
					data-pct=${layer.pct}
					tooltip=${layer.tip}></path>
			</svg>`;
	}
	isEmpty() {
		return this.state.sliceLayers.length === 0;
	}
	hideEmpty() {
		return this.state.sliceLayers.length > 0;
	}
	hideBody() {
		return this.state.sliceLayers.length === 0;
	}
	hideLegend() {
		return this.state.showLegend !== true || this.state.legendItems.length === 0;
	}
	hideHeading() {
		return !String(this.state.label || '').trim();
	}
	hideTotal() {
		return this.state.showTotal !== true || this.state.variant !== 'donut' || !this.state.totalLabel;
	}
	legendLayout() {
		return resolveLegendLayout(this.state);
	}
	legendPosition() {
		return this.legendLayout().position;
	}
	legendOrientation() {
		return this.legendLayout().orientation;
	}
	legendAlign() {
		const pos = this.legendPosition();
		if (pos === 'left' || pos === 'right') {
			return 'start';
		}
		return 'center';
	}
	shellLayout() {
		return this.legendLayout().layout;
	}
	shellCompact() {
		return this.state.compact === true;
	}
	handleSliceClick(domEvent) {
		const path = domEvent?.target;
		if (!path || path.tagName !== 'path' || !path.hasAttribute('data-id')) {
			return;
		}
		this.emit('pie-chart:select', {
			id: path.getAttribute('data-id') || '',
			label: path.getAttribute('data-label') || '',
			value: Number(path.getAttribute('data-value')),
			pct: Number(path.getAttribute('data-pct')),
		});
	}
	/* hoverId drives is-hover paint; tips are framework tooltip= on each slice. */
	handlePointerMove(domEvent) {
		const target = domEvent.target;
		if (!(target instanceof Element)) {
			return;
		}
		if (target.tagName === 'UI-LEGEND' || target.tagName === 'UI-LEGEND-ITEM') {
			return;
		}
		const id = target.hasAttribute('data-id') ? (target.getAttribute('data-id') || '') : '';
		if (this.state.hoverId !== id) {
			this.state.hoverId = id;
		}
	}
	handlePointerLeave() {
		if (this.state.hoverId) {
			this.state.hoverId = '';
		}
	}
	handleLegendPointerMove(domEvent) {
		const path = typeof domEvent.composedPath === 'function' ? domEvent.composedPath() : [];
		const pathCount = path.length;
		let id = '';
		for (let index = 0; index < pathCount; index += 1) {
			const node = path[index];
			if (node && node.tagName === 'UI-LEGEND-ITEM' && node.state) {
				id = node.state.id || '';
				break;
			}
		}
		if (this.state.hoverId !== id) {
			this.state.hoverId = id;
		}
	}
	handleLegendPointerLeave() {
		if (this.state.hoverId) {
			this.state.hoverId = '';
		}
	}
	render() {
		this.html`
			<div class="pc chart-shell" data-tone=${this.state.tone} data-variant=${this.state.variant}
				data-legend-pos=${this.legendPosition}
				data-legend-orient=${this.legendOrientation}
				data-layout=${this.shellLayout}
				?data-compact=${this.shellCompact}
				role="img" aria-label=${this.state.label || 'Pie chart'}>
				<div class="pc-empty" ?hidden=${this.hideEmpty}>${this.state.emptyLabel}</div>
				<div class="chart-plot-area" ?hidden=${this.hideBody}>
					<div class="chart-heading" ?hidden=${this.hideHeading}>${this.state.label}</div>
					<div #plot class="chart-plot pc-chart" ?data-motion=${this.state.motion}
						@click=${this.handleSliceClick}
						@pointermove=${this.handlePointerMove} @pointerleave=${this.handlePointerLeave}>
						<div class="pc-svg-stack">
							${this.list('sliceLayers', this.sliceLayerRow)}
							<svg class="pc-total-svg" viewBox="0 0 200 200" aria-hidden="true" ?hidden=${this.hideTotal}>
								<text class="pc-total" x="100" y="104" text-anchor="middle">${this.state.totalLabel}</text>
							</svg>
						</div>
					</div>
				</div>
				<div class="chart-legend-slot pc-legend" ?hidden=${this.hideLegend}
					@pointermove=${this.handleLegendPointerMove}
					@pointerleave=${this.handleLegendPointerLeave}>
					<ui-legend
						.state.items=${this.state.legendItems}
						.state.orientation=${this.legendOrientation}
						.state.align=${this.legendAlign}></ui-legend>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-pie-chart', UIPieChart);
