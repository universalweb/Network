/*
	DESCRIPTION: ui-radar-chart — multi-axis spider / radar.
	Series + vertices: this.partial mini-SVG rows (framework tooltip=).
	tipMode both by default — path hover = series summary; point = axis value.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-radar-chart .state.categories=${[…]} .state.series=${[…]}
	    .state.tipMode=${'both'} .state.pointMarker=${'hover'}></ui-radar-chart>
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
	formatTick,
	normalizeValueSeries,
	polarToCartesian,
	polylinePoints,
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
const VIEW = 240;
const VIEW_BOX = '0 0 240 240';
const CX = 120;
const CY = 120;
const RADIUS = 88;
const LEVELS = 4;
export class UIRadarChart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chartLayout: '../charts/chart-layout.css',
		chartLayerLight: '../charts/chart-layer-light.css',
		radarChart: './radar-chart.css',
	};
	static state = {
		categories: [],
		series: [],
		legendItems: [],
		seriesLayers: [],
		hitLayers: [],
		ringLayers: [],
		axisLayers: [],
		labelLayers: [],
		max: null,
		showLabels: true,
		...chartTipStateDefaults({
			tipMode: 'both',
			pointMarker: 'hover',
			pointHitRadius: 9,
		}),
		...chartLegendStateDefaults({
			legendPosition: 'bottom',
		}),
		animate: true,
		motionMs: DEFAULT_MOTION_MS,
		paintGen: 0,
		motion: false,
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
			'categories',
			'showLegend',
			'showLabels',
			'showTip',
			'tipMode',
			'pointMarker',
			'pointHitRadius',
			'pointMarkerRadius',
			'max',
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
		const categories = Array.isArray(this.state.categories) ? this.state.categories : [];
		const series = this.paintSeries();
		const axisCount = categories.length || (series[0]?.values.length ?? 0);
		if (axisCount < 3 || series.length === 0) {
			this.assignState({
				seriesLayers: [],
				hitLayers: [],
				ringLayers: [],
				axisLayers: [],
				labelLayers: [],
				legendItems: [],
			});
			return;
		}
		const seriesCount = series.length;
		let max = Number(this.state.max);
		if (!Number.isFinite(max) || max <= 0) {
			const extent = valueSeriesExtent(normalizeValueSeries(this.state.series));
			max = extent.max > 0 ? extent.max : 100;
		}
		const ringLayers = [];
		for (let level = 1; level <= LEVELS; level += 1) {
			const r = (RADIUS * level) / LEVELS;
			const points = [];
			for (let axis = 0; axis < axisCount; axis += 1) {
				const angle = (360 * axis) / axisCount;
				points.push(polarToCartesian(CX, CY, r, angle));
			}
			points.push(points[0]);
			ringLayers.push({
				id: `ring-${level}`,
				pointsAttr: polylinePoints(points),
			});
		}
		const axisLayers = [];
		const labelLayers = [];
		for (let axis = 0; axis < axisCount; axis += 1) {
			const angle = (360 * axis) / axisCount;
			const tip = polarToCartesian(CX, CY, RADIUS, angle);
			const labelPos = polarToCartesian(CX, CY, RADIUS + 16, angle);
			axisLayers.push({
				id: `axis-${axis}`,
				x2: tip.x,
				y2: tip.y,
			});
			if (this.state.showLabels !== false) {
				labelLayers.push({
					id: `lab-${axis}`,
					x: labelPos.x,
					y: labelPos.y,
					label: categories[axis] == null ? String(axis + 1) : String(categories[axis]),
				});
			}
		}
		const pointsOn = wantPointTips(this.state);
		const seriesOn = wantSeriesTips(this.state);
		const marker = normalizePointMarker(this.state.pointMarker);
		const hitRadius = Number(this.state.pointHitRadius) || 9;
		const markerRadius = Number(this.state.pointMarkerRadius) || 3.5;
		const seriesLayers = [];
		const hitLayers = [];
		const legend = [];
		for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
			const row = series[seriesIndex];
			const points = [];
			const tipParts = [row.label];
			for (let axis = 0; axis < axisCount; axis += 1) {
				const value = row.values[axis] ?? 0;
				const r = (Math.max(0, value) / max) * RADIUS;
				const angle = (360 * axis) / axisCount;
				const point = polarToCartesian(CX, CY, r, angle);
				points.push(point);
				const axisLabel = categories[axis] == null ? String(axis + 1) : String(categories[axis]);
				tipParts.push(`${axisLabel} ${formatTick(value)}`);
				if (pointsOn || marker !== 'never') {
					const color = row.color || 'currentColor';
					hitLayers.push({
						id: `${row.id}-a${axis}`,
						cx: point.x,
						cy: point.y,
						tip: tipTextOrEmpty(pointsOn, joinTip([
							row.label,
							axisLabel,
							formatTick(value),
						])),
						viewBox: VIEW_BOX,
						marker,
						r: marker === 'always' ? (Number(markerRadius) || 3.5) : (Number(hitRadius) || 8),
						style: `--chart-mark-color:${color}`,
					});
				}
			}
			points.push(points[0]);
			// Closed area for radar fill (series layer area path)
			let areaD = '';
			const pointCount = points.length;
			if (pointCount > 0) {
				areaD = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
				for (let pointIndex = 1; pointIndex < pointCount; pointIndex += 1) {
					areaD += ` L ${points[pointIndex].x.toFixed(2)} ${points[pointIndex].y.toFixed(2)}`;
				}
				areaD += ' Z';
			}
			const seriesColor = row.color || 'currentColor';
			seriesLayers.push({
				id: row.id,
				pointsAttr: polylinePoints(points),
				areaD,
				showArea: Boolean(areaD),
				tip: tipTextOrEmpty(seriesOn, tipParts.join(' · ')),
				viewBox: VIEW_BOX,
				variant: 'radar',
				style: `--chart-series-color:${seriesColor}`,
			});
			legend.push({
				id: row.id,
				label: row.label,
				color: row.color,
				tip: row.label,
			});
		}
		this.assignState({
			seriesLayers,
			hitLayers,
			ringLayers,
			axisLayers,
			labelLayers,
			legendItems: this.state.showLegend === true && legend.length >= 2 ? legend : [],
		});
	}
	ringRow(ring) {
		return this.partial`
			<svg class="rc-layer" viewBox="0 0 240 240" aria-hidden="true">
				<polyline class="rc-ring" fill="none" points=${ring.pointsAttr}></polyline>
			</svg>`;
	}
	axisRow(axis) {
		return this.partial`
			<svg class="rc-layer" viewBox="0 0 240 240" aria-hidden="true">
				<line class="rc-axis" x1=${CX} y1=${CY} x2=${axis.x2} y2=${axis.y2}></line>
			</svg>`;
	}
	labelRow(lab) {
		return this.partial`
			<svg class="rc-layer" viewBox="0 0 240 240" aria-hidden="true">
				<text class="rc-label" x=${lab.x} y=${lab.y} text-anchor="middle" dominant-baseline="middle">${lab.label}</text>
			</svg>`;
	}
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
			<div class="rc chart-shell" data-tone=${this.state.tone}
				data-legend-pos=${this.legendPosition}
				data-legend-orient=${this.legendOrientation}
				data-layout=${this.shellLayout}
				?data-compact=${this.shellCompact}
				role="img" aria-label=${this.state.label || 'Radar chart'}>
				<div class="rc-empty" ?hidden=${this.hideEmpty}>${this.state.emptyLabel}</div>
				<div class="chart-plot-area">
					<div class="chart-heading" ?hidden=${this.hideHeading}>${this.state.label}</div>
					<div #plot class="chart-plot" ?data-motion=${this.state.motion}>
						<div class="rc-svg-stack">
							${this.list('ringLayers', this.ringRow)}
							${this.list('axisLayers', this.axisRow)}
							${this.list('seriesLayers', this.seriesLayerRow)}
							${this.list('hitLayers', this.hitLayerRow)}
							${this.list('labelLayers', this.labelRow)}
						</div>
					</div>
				</div>
				<div class="chart-legend-slot rc-legend" ?hidden=${this.hideLegend}>
					<ui-legend
						.state.items=${this.state.legendItems}
						.state.orientation=${this.legendOrientation}
						.state.align=${this.legendAlign}></ui-legend>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-radar-chart', UIRadarChart);
