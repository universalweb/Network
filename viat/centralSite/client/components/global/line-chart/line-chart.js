/*
	DESCRIPTION: ui-line-chart — multi-series line/area.
	Geometry: this.partial mini-SVG series + hit rows (framework tooltip=).
	Tips: tipMode auto|points|series|both|none; pointMarker hover|always|never.
	Layout: legend placement + axis labels; viewport bus for compact.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-line-chart .state.series=${[…]} .state.tipMode=${'both'}
	    .state.pointMarker=${'hover'} .state.xLabel=${'Day'}></ui-line-chart>
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
	areaPath,
	domainTicks,
	formatTick,
	normalizeValueSeries,
	polylinePoints,
	scaleLinear,
	valueSeriesExtent,
} from '../charts/chartMath.js';
import {
	bumpPaint,
	cancelChartMotion,
	cloneValueSeries,
	DEFAULT_MOTION_MS,
	goChartMotion,
	lerpValueSeries,
} from '../charts/chartMotion.js';
import { joinTip } from '../charts/chartTip.js';
import {
	chartTipStateDefaults,
	normalizePointMarker,
	tipTextOrEmpty,
	wantPointTips,
	wantSeriesTips,
} from '../charts/chartTipConfig.js';
const VIEW_W = 400;
const VIEW_H = 220;
const VIEW_BOX = '0 0 400 220';
const PAD = {
	top: 16,
	right: 16,
	bottom: 36,
	left: 44,
};
function hitTargetRadius(marker, hitRadius, markerRadius) {
	if (marker === 'always') {
		return Number(markerRadius) || 3.5;
	}
	return Number(hitRadius) || 8;
}
export class UILineChart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chartLayout: '../charts/chart-layout.css',
		chartLayerLight: '../charts/chart-layer-light.css',
		lineChart: './line-chart.css',
	};
	static state = {
		series: [],
		categories: [],
		legendItems: [],
		seriesLayers: [],
		hitLayers: [],
		xTickLayers: [],
		yTickLayers: [],
		gridPathD: '',
		variant: 'line',
		...chartTipStateDefaults({
			// Line: points primary; series tip on the path when tipMode allows
			tipMode: 'both',
			pointMarker: 'hover',
		}),
		...chartLegendStateDefaults({
			legendPosition: 'bottom',
		}),
		...chartAxisStateDefaults(),
		animate: true,
		motionMs: DEFAULT_MOTION_MS,
		paintGen: 0,
		motion: false,
		yMin: null,
		yMax: null,
		tone: 'accent',
		label: '',
		emptyLabel: 'No data',
	};
	_paintSeries = null;
	onConnect() {
		this._paintSeries = normalizeValueSeries(this.state.series);
		this.observe(['series'], this.onSeriesTarget);
		this.observe([
			'paintGen',
			'showLegend',
			'showGrid',
			'showXAxis',
			'showYAxis',
			'showXTicks',
			'showYTicks',
			'showTip',
			'tipMode',
			'pointMarker',
			'pointHitRadius',
			'pointMarkerRadius',
			'variant',
			'categories',
			'yMin',
			'yMax',
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
	onSeriesTarget() {
		const target = normalizeValueSeries(this.state.series);
		const from = this._paintSeries ? cloneValueSeries(this._paintSeries) : cloneValueSeries(target);
		goChartMotion(this, {
			from,
			to: target,
			lerp: lerpValueSeries,
			apply: this.applyPaintSeries,
			duration: this.state.motionMs,
			animate: this.state.animate !== false,
		});
	}
	applyPaintSeries(mid) {
		this._paintSeries = mid;
		bumpPaint(this);
	}
	paintSeries() {
		const paintGen = this.state.paintGen;
		return paintGen >= 0 ? (this._paintSeries ?? normalizeValueSeries(this.state.series)) : [];
	}
	syncPaintLayers() {
		const series = this.paintSeries();
		const plotLeft = PAD.left;
		const plotRight = VIEW_W - PAD.right;
		const plotTop = PAD.top;
		const plotBottom = VIEW_H - PAD.bottom;
		const plotW = plotRight - plotLeft;
		let yMin = this.state.yMin;
		let yMax = this.state.yMax;
		const seriesCount = series.length;
		if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
			const extent = valueSeriesExtent(normalizeValueSeries(this.state.series));
			yMin = Number.isFinite(this.state.yMin) ? this.state.yMin : extent.min;
			yMax = Number.isFinite(this.state.yMax) ? this.state.yMax : extent.max;
			if (this.state.variant === 'area' && yMin > 0) {
				yMin = 0;
			}
		}
		const domain = domainTicks(yMin, yMax, 5);
		const yTicks = domain.ticks;
		const domainMin = domain.domainMin;
		const domainMax = domain.domainMax;
		const categories = Array.isArray(this.state.categories) ? this.state.categories : [];
		let maxLen = 0;
		for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
			if (series[seriesIndex].values.length > maxLen) {
				maxLen = series[seriesIndex].values.length;
			}
		}
		const isArea = this.state.variant === 'area';
		const pointsOn = wantPointTips(this.state);
		const seriesOn = wantSeriesTips(this.state);
		const marker = normalizePointMarker(this.state.pointMarker);
		const hitRadius = Number(this.state.pointHitRadius) || 8;
		const markerRadius = Number(this.state.pointMarkerRadius) || 3.5;
		const seriesLayers = [];
		const hitLayers = [];
		const legend = [];
		for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
			const row = series[seriesIndex];
			const points = [];
			const valueCount = row.values.length;
			for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
				const x = valueCount > 1 ? scaleLinear(valueIndex, 0, valueCount - 1, plotLeft, plotRight) : plotLeft + (plotW / 2);
				const value = row.values[valueIndex];
				const y = scaleLinear(value, domainMin, domainMax, plotBottom, plotTop);
				const category = categories[valueIndex] == null ? String(valueIndex + 1) : String(categories[valueIndex]);
				points.push({
					x,
					y,
				});
				// Point tip is specific; always emit hit row if markers or point tips needed
				if (pointsOn || marker !== 'never') {
					const color = row.color || 'currentColor';
					hitLayers.push({
						id: `${row.id}-p${valueIndex}`,
						cx: x,
						cy: y,
						tip: tipTextOrEmpty(pointsOn, joinTip([
							row.label,
							category,
							formatTick(value),
						])),
						viewBox: VIEW_BOX,
						marker,
						r: hitTargetRadius(marker, hitRadius, markerRadius),
						style: `--chart-mark-color:${color}`,
					});
				}
			}
			const seriesColor = row.color || 'currentColor';
			const areaD = areaPath(points, plotBottom);
			seriesLayers.push({
				id: row.id,
				pointsAttr: polylinePoints(points),
				areaD,
				showArea: isArea === true && Boolean(areaD),
				tip: tipTextOrEmpty(seriesOn, row.label),
				viewBox: VIEW_BOX,
				variant: 'line',
				style: `--chart-series-color:${seriesColor}`,
			});
			legend.push({
				id: row.id,
				label: row.label,
				color: row.color,
				tip: row.label,
			});
		}
		let gridPathD = '';
		const yTickLayers = [];
		const showGrid = this.state.showGrid !== false && this.state.showYAxis !== false;
		const showYTicks = this.state.showYTicks !== false && this.state.showYAxis !== false;
		const tickCount = yTicks.length;
		for (let index = 0; index < tickCount; index += 1) {
			const value = yTicks[index];
			const y = scaleLinear(value, domainMin, domainMax, plotBottom, plotTop);
			if (showGrid) {
				gridPathD += `M ${plotLeft} ${y} L ${plotRight} ${y} `;
			}
			if (showYTicks) {
				yTickLayers.push({
					id: `y-${index}`,
					x: plotLeft - 8,
					y: y + 3,
					label: formatTick(value),
				});
			}
		}
		const xTickLayers = [];
		const showXTicks = this.state.showXTicks !== false && this.state.showXAxis !== false;
		if (showXTicks) {
			const labelCount = Math.max(maxLen, categories.length);
			const step = labelCount > 8 ? Math.ceil(labelCount / 6) : 1;
			for (let index = 0; index < labelCount; index += step) {
				const x = labelCount > 1 ? scaleLinear(index, 0, labelCount - 1, plotLeft, plotRight) : plotLeft + (plotW / 2);
				xTickLayers.push({
					id: `x-${index}`,
					x,
					y: VIEW_H - 10,
					label: categories[index] == null ? String(index + 1) : String(categories[index]),
				});
			}
		}
		this.assignState({
			seriesLayers,
			hitLayers,
			xTickLayers,
			yTickLayers,
			gridPathD: gridPathD.trim(),
			legendItems: this.state.showLegend === true && legend.length >= 2 ? legend : [],
		});
	}
	xTickRow(tick) {
		return this.partial`
			<svg class="lc-layer" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<text class="lc-tick lc-tick-x" x=${tick.x} y=${tick.y} text-anchor="middle">${tick.label}</text>
			</svg>`;
	}
	yTickRow(tick) {
		return this.partial`
			<svg class="lc-layer" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<text class="lc-tick lc-tick-y" x=${tick.x} y=${tick.y} text-anchor="end">${tick.label}</text>
			</svg>`;
	}
	/*
	 * Feature-light rows — framework tooltip= without a CE per mark.
	 * Display fields are precomputed in paint (plain values only).
	 */
	seriesLayerRow(layer) {
		return this.partial`
			<svg class="chart-series-svg" viewBox=${layer.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<path class="chart-series-area" data-variant=${layer.variant}
					style=${layer.style}
					d=${layer.areaD}
					?hidden=${!layer.showArea}></path>
				<polyline class="chart-series-stroke" data-variant=${layer.variant}
					style=${layer.style}
					fill="none"
					points=${layer.pointsAttr}
					tooltip=${layer.tip}></polyline>
			</svg>`;
	}
	hitLayerRow(hit) {
		return this.partial`
			<svg class="chart-hit-svg" viewBox=${hit.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<circle class="chart-hit-target"
					data-marker=${hit.marker}
					style=${hit.style}
					cx=${hit.cx}
					cy=${hit.cy}
					r=${hit.r}
					tooltip=${hit.tip}></circle>
			</svg>`;
	}
	isEmpty() {
		return this.state.seriesLayers.length === 0;
	}
	hideEmpty() {
		return this.state.seriesLayers.length > 0;
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
	hideGrid() {
		return !this.state.gridPathD;
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
	render() {
		this.html`
			<div class="lc chart-shell" data-tone=${this.state.tone}
				data-legend-pos=${this.legendPosition}
				data-legend-orient=${this.legendOrientation}
				data-layout=${this.shellLayout}
				?data-compact=${this.shellCompact}
				role="img" aria-label=${this.state.label || 'Line chart'}>
				<div class="lc-empty" ?hidden=${this.hideEmpty}>${this.state.emptyLabel}</div>
				<div class="chart-plot-area">
					<div class="chart-heading" ?hidden=${this.hideHeading}>${this.state.label}</div>
					<div class="chart-axis-label chart-axis-label-y" ?hidden=${this.hideYLabel}>${this.state.yLabel}</div>
					<div #plot class="chart-plot" ?data-motion=${this.state.motion}>
						<div class="lc-svg-stack">
							<svg class="lc-base" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
								<path class="lc-grid" d=${this.state.gridPathD} ?hidden=${this.hideGrid}></path>
							</svg>
							${this.list('seriesLayers', this.seriesLayerRow)}
							${this.list('hitLayers', this.hitLayerRow)}
							${this.list('xTickLayers', this.xTickRow)}
							${this.list('yTickLayers', this.yTickRow)}
						</div>
					</div>
					<div class="chart-axis-label chart-axis-label-x" ?hidden=${this.hideXLabel}>${this.state.xLabel}</div>
				</div>
				<div class="chart-legend-slot lc-legend" ?hidden=${this.hideLegend}>
					<ui-legend
						.state.items=${this.state.legendItems}
						.state.orientation=${this.legendOrientation}
						.state.align=${this.legendAlign}></ui-legend>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-line-chart', UILineChart);
