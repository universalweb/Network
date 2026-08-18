/*
	DESCRIPTION: ui-scatter-chart — X/Y scatter plot (SVG).
	Geometry: list() of this.partial mini-SVG layers (framework tooltip=).
	Legend is <ui-legend>. Live: rAF value tween. Layout: legendPosition/Orientation,
	xLabel/yLabel, showGrid/X/Y ticks, layout:auto compact fold.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-scatter-chart .state.points=${[…]} .state.xLabel=${'X'} .state.yLabel=${'Y'}></ui-scatter-chart>
	─────────────────────────────────────────────────────────────────────
*/
import '../legend/legend.js';
import { WebComponent } from 'webcomponent';
import {
	applyChartLayoutFromViewport,
	attachChartLayout,
	chartAxisStateDefaults,
	chartLegendStateDefaults,
	detachChartLayout,
	hideAxisLabel,
	resolveLegendLayout,
} from '../charts/chartLayout.js';
import {
	domainTicks,
	extentOf,
	formatTick,
	scaleLinear,
	seriesColor,
} from '../charts/chartMath.js';
import {
	bumpPaint,
	cancelChartMotion,
	clonePoints,
	cloneScatterSeries,
	DEFAULT_MOTION_MS,
	goChartMotion,
	lerpPoints,
	lerpScatterSeries,
} from '../charts/chartMotion.js';
import { joinTip } from '../charts/chartTip.js';
import { tipTextOrEmpty } from '../charts/chartTipConfig.js';
const VIEW_W = 400;
const VIEW_H = 220;
const VIEW_BOX = '0 0 400 220';
const PAD = {
	top: 16,
	right: 16,
	bottom: 36,
	left: 44,
};
function normalizeScatterSeries(seriesIn, flatPoints) {
	const series = [];
	const list = Array.isArray(seriesIn) ? seriesIn : [];
	if (list.length > 0) {
		const seriesInCount = list.length;
		for (let index = 0; index < seriesInCount; index += 1) {
			const row = list[index];
			if (!row || typeof row !== 'object') {
				continue;
			}
			const pts = Array.isArray(row.points) ? row.points : [];
			series.push({
				id: String(row.id ?? row.label ?? index),
				label: String(row.label || row.id || `Series ${index + 1}`),
				color: row.color || seriesColor(index),
				points: pts,
			});
		}
		return series;
	}
	const flat = Array.isArray(flatPoints) ? flatPoints : [];
	if (flat.length > 0) {
		series.push({
			id: 's0',
			label: '',
			color: seriesColor(0),
			points: flat,
		});
	}
	return series;
}
export class UIScatterChart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chartLayout: '../charts/chart-layout.css',
		scatterChart: './scatter-chart.css',
	};
	static state = {
		points: [],
		series: [],
		// Partial mini-SVG layers for list()
		dotLayers: [],
		gridLayers: [],
		tickLayers: [],
		// Legend rows for <ui-legend> ({ label, color, tip, id })
		legendItems: [],
		showTip: true,
		pointRadius: 4,
		...chartLegendStateDefaults({
			legendPosition: 'bottom',
		}),
		...chartAxisStateDefaults(),
		animate: true,
		motionMs: DEFAULT_MOTION_MS,
		paintGen: 0,
		motion: false,
		tone: 'accent',
		label: '',
		emptyLabel: 'No data',
	};
	_paintSeries = null;
	_paintPoints = null;
	onConnect() {
		this._paintSeries = normalizeScatterSeries(this.state.series, null);
		this._paintPoints = clonePoints(this.state.points);
		this.observe([
			'points',
			'series',
		], this.onDataTarget);
		this.observe([
			'paintGen',
			'pointRadius',
			'showLegend',
			'showTip',
			'showGrid',
			'showXTicks',
			'showYTicks',
			'showXAxis',
			'showYAxis',
		], this.syncPlotLayers);
		this.syncPlotLayers();
		attachChartLayout(this);
	}
	onDisconnect() {
		cancelChartMotion(this);
		detachChartLayout(this);
	}
	handleChartViewportChange() {
		applyChartLayoutFromViewport(this);
	}
	onDataTarget() {
		const multi = normalizeScatterSeries(this.state.series, null);
		if (multi.length > 0) {
			const seriesTarget = multi;
			const seriesFrom = this._paintSeries ? cloneScatterSeries(this._paintSeries) : cloneScatterSeries(seriesTarget);
			goChartMotion(this, {
				from: seriesFrom,
				to: seriesTarget,
				lerp: lerpScatterSeries,
				apply: this.applyPaintSeries,
				duration: this.state.motionMs,
				animate: this.state.animate !== false,
			});
			return;
		}
		const pointsTarget = clonePoints(this.state.points);
		const pointsFrom = this._paintPoints ? clonePoints(this._paintPoints) : clonePoints(pointsTarget);
		goChartMotion(this, {
			from: pointsFrom,
			to: pointsTarget,
			lerp: lerpPoints,
			apply: this.applyPaintPoints,
			duration: this.state.motionMs,
			animate: this.state.animate !== false,
		});
	}
	applyPaintSeries(mid) {
		this._paintSeries = mid;
		this._paintPoints = null;
		bumpPaint(this);
	}
	applyPaintPoints(mid) {
		this._paintPoints = mid;
		this._paintSeries = null;
		bumpPaint(this);
	}
	plotModel() {
		const paintGen = this.state.paintGen;
		const plotLeft = PAD.left;
		if (paintGen < 0) {
			return {
				empty: true,
				dots: [],
				grid: [],
				legend: [],
			};
		}
		const plotRight = VIEW_W - PAD.right;
		const plotTop = PAD.top;
		const plotBottom = VIEW_H - PAD.bottom;
		let series = [];
		if (this._paintSeries && this._paintSeries.length > 0) {
			series = this._paintSeries;
		} else if (this._paintPoints && this._paintPoints.length > 0) {
			series = [
				{
					id: 's0',
					label: '',
					color: seriesColor(0),
					points: this._paintPoints,
				},
			];
		} else {
			series = normalizeScatterSeries(this.state.series, this.state.points);
		}
		const seriesCount = series.length;
		const targetSeries = normalizeScatterSeries(this.state.series, this.state.points);
		const xs = [];
		const ys = [];
		const targetCount = targetSeries.length;
		for (let seriesIndex = 0; seriesIndex < targetCount; seriesIndex += 1) {
			const pts = targetSeries[seriesIndex].points;
			const pointCount = pts.length;
			for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
				const point = pts[pointIndex];
				const x = Number(point?.x);
				const y = Number(point?.y);
				if (Number.isFinite(x)) {
					xs.push(x);
				}
				if (Number.isFinite(y)) {
					ys.push(y);
				}
			}
		}
		if (xs.length === 0) {
			return {
				empty: true,
				dots: [],
				grid: [],
				legend: [],
			};
		}
		const xExtent = extentOf(xs);
		const yExtent = extentOf(ys);
		const xDomain = domainTicks(xExtent.min, xExtent.max, 5);
		const yDomain = domainTicks(yExtent.min, yExtent.max, 5);
		const xTicks = xDomain.ticks;
		const yTicks = yDomain.ticks;
		const xMin = xDomain.domainMin;
		const xMax = xDomain.domainMax;
		const yMin = yDomain.domainMin;
		const yMax = yDomain.domainMax;
		const dots = [];
		const r = Number(this.state.pointRadius) || 4;
		for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
			const row = series[seriesIndex];
			const pts = row.points;
			const pointCount = pts.length;
			for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
				const point = pts[pointIndex];
				const rawX = Number(point?.x);
				const rawY = Number(point?.y);
				if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) {
					continue;
				}
				const pointLabel = String(point?.label || row.label || '');
				dots.push({
					cx: scaleLinear(rawX, xMin, xMax, plotLeft, plotRight),
					cy: scaleLinear(rawY, yMin, yMax, plotBottom, plotTop),
					r: Number(point?.r) || r,
					color: point?.color || row.color,
					label: pointLabel,
					x: rawX,
					y: rawY,
					seriesId: row.id,
					tip: joinTip([
						pointLabel || row.label,
						`x ${formatTick(rawX)}`,
						`y ${formatTick(rawY)}`,
					]),
				});
			}
		}
		const grid = [];
		const yCount = yTicks.length;
		for (let index = 0; index < yCount; index += 1) {
			const value = yTicks[index];
			const y = scaleLinear(value, yMin, yMax, plotBottom, plotTop);
			grid.push({
				x1: plotLeft,
				y1: y,
				x2: plotRight,
				y2: y,
				labelX: plotLeft - 8,
				labelY: y + 3,
				label: formatTick(value),
				anchor: 'end',
			});
		}
		const xCount = xTicks.length;
		for (let index = 0; index < xCount; index += 1) {
			const value = xTicks[index];
			const x = scaleLinear(value, xMin, xMax, plotLeft, plotRight);
			grid.push({
				x1: x,
				y1: plotTop,
				x2: x,
				y2: plotBottom,
				labelX: x,
				labelY: plotBottom + 14,
				label: formatTick(value),
				anchor: 'middle',
			});
		}
		const legend = [];
		if (series.length > 1) {
			for (let index = 0; index < seriesCount; index += 1) {
				const row = series[index];
				legend.push({
					id: row.id,
					label: row.label,
					color: row.color,
					tip: row.label,
				});
			}
		}
		return {
			empty: dots.length === 0,
			dots,
			grid,
			legend,
		};
	}
	syncPlotLayers() {
		const plot = this.plotModel();
		if (plot.empty) {
			this.assignState({
				dotLayers: [],
				gridLayers: [],
				tickLayers: [],
				legendItems: [],
			});
			return;
		}
		const tipsOn = this.state.showTip !== false;
		const dotLayers = [];
		const dotCount = plot.dots.length;
		for (let index = 0; index < dotCount; index += 1) {
			const row = plot.dots[index];
			dotLayers.push({
				id: `d${index}`,
				cx: row.cx,
				cy: row.cy,
				r: row.r,
				style: `--sc-series:${row.color || 'currentColor'}`,
				seriesId: row.seriesId,
				x: row.x,
				y: row.y,
				label: row.label,
				tip: tipTextOrEmpty(tipsOn, row.tip),
			});
		}
		const showGrid = this.state.showGrid !== false;
		const gridLayers = [];
		const tickLayers = [];
		const showTicks = (this.state.showXTicks !== false || this.state.showYTicks !== false) &&
			(this.state.showXAxis !== false || this.state.showYAxis !== false);
		const gridCount = plot.grid.length;
		for (let index = 0; index < gridCount; index += 1) {
			const row = plot.grid[index];
			if (showGrid) {
				gridLayers.push({
					id: `g${index}`,
					x1: row.x1,
					y1: row.y1,
					x2: row.x2,
					y2: row.y2,
				});
			}
			if (showTicks) {
				tickLayers.push({
					id: `t${index}`,
					x: row.labelX,
					y: row.labelY,
					anchor: row.anchor,
					label: row.label,
				});
			}
		}
		let legendItems = [];
		if (this.state.showLegend === true && plot.legend.length >= 2) {
			const next = [];
			const count = plot.legend.length;
			for (let index = 0; index < count; index += 1) {
				const row = plot.legend[index];
				next.push({
					id: row.id,
					label: row.label,
					color: row.color,
					tip: row.tip,
				});
			}
			legendItems = next;
		}
		this.assignState({
			dotLayers,
			gridLayers,
			tickLayers,
			legendItems,
		});
	}
	dotLayerRow(dot) {
		return this.partial`
			<svg class="sc-layer" viewBox=${VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<circle class="sc-dot" style=${dot.style}
					cx=${dot.cx} cy=${dot.cy} r=${dot.r}
					data-series=${dot.seriesId}
					data-x=${dot.x}
					data-y=${dot.y}
					data-label=${dot.label}
					tooltip=${dot.tip}></circle>
			</svg>`;
	}
	gridLayerRow(line) {
		return this.partial`
			<svg class="sc-layer sc-layer-grid" viewBox=${VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<line class="sc-grid" x1=${line.x1} y1=${line.y1} x2=${line.x2} y2=${line.y2}></line>
			</svg>`;
	}
	tickLayerRow(tick) {
		return this.partial`
			<svg class="sc-layer sc-layer-tick" viewBox=${VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<text class="sc-tick" x=${tick.x} y=${tick.y} text-anchor=${tick.anchor}>${tick.label}</text>
			</svg>`;
	}
	isEmpty() {
		return this.state.dotLayers.length === 0;
	}
	hideEmpty() {
		return this.state.dotLayers.length > 0;
	}
	hideLegend() {
		return this.state.showLegend !== true || this.state.legendItems.length < 2;
	}
	hideHeading() {
		return !String(this.state.label || '').trim();
	}
	hideXLabel() {
		return hideAxisLabel(this.state.xLabel);
	}
	hideYLabel() {
		return hideAxisLabel(this.state.yLabel);
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
	handleDotClick(domEvent) {
		const node = domEvent?.target;
		if (!node || node.tagName !== 'circle') {
			return;
		}
		this.emit('scatter-chart:select', {
			seriesId: node.getAttribute('data-series') || '',
			x: Number(node.getAttribute('data-x')),
			y: Number(node.getAttribute('data-y')),
			label: node.getAttribute('data-label') || '',
		});
	}
	render() {
		this.html`
			<div class="sc chart-shell" data-tone=${this.state.tone}
				data-legend-pos=${this.legendPosition}
				data-legend-orient=${this.legendOrientation}
				data-layout=${this.shellLayout}
				?data-compact=${this.shellCompact}
				role="img" aria-label=${this.state.label || 'Scatter chart'} @click=${this.handleDotClick}>
				<div class="sc-empty" ?hidden=${this.hideEmpty}>${this.state.emptyLabel}</div>
				<div class="chart-plot-area">
					<div class="chart-heading" ?hidden=${this.hideHeading}>${this.state.label}</div>
					<div class="chart-axis-label chart-axis-label-y" ?hidden=${this.hideYLabel}>${this.state.yLabel}</div>
					<div #plot class="chart-plot" ?data-motion=${this.state.motion}>
						<div class="sc-svg-stack">
							${this.list('gridLayers', this.gridLayerRow)}
							${this.list('dotLayers', this.dotLayerRow)}
							${this.list('tickLayers', this.tickLayerRow)}
						</div>
					</div>
					<div class="chart-axis-label chart-axis-label-x" ?hidden=${this.hideXLabel}>${this.state.xLabel}</div>
				</div>
				<div class="chart-legend-slot sc-legend" ?hidden=${this.hideLegend}>
					<ui-legend
						.state.items=${this.state.legendItems}
						.state.orientation=${this.legendOrientation}
						.state.align=${this.legendAlign}></ui-legend>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-scatter-chart', UIScatterChart);
