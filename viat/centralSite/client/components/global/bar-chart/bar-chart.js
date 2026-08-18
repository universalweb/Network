/*
	DESCRIPTION: ui-bar-chart — vertical/horizontal categorical bar chart (SVG).
	Geometry: list() of this.partial mini-SVG layers (framework tooltip=).
	Distinct from ui-bar-list. Legend: <ui-legend>.
	Live update: rAF value tween. Layout: legendPosition/Orientation, xLabel/yLabel,
	showGrid/X/Y ticks, layout:auto compact fold (ResizeObserver settle — no SVG thrash).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-bar-chart .state.items=${[…]} .state.legendPosition=${'right'}
	    .state.xLabel=${'Day'} .state.yLabel=${'Count'}></ui-bar-chart>
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
	normalizeCategoryItems,
	normalizeValueSeries,
	scaleLinear,
	seriesColor,
} from '../charts/chartMath.js';
import {
	bumpPaint,
	cancelChartMotion,
	cloneCategoryItems,
	cloneValueSeries,
	DEFAULT_MOTION_MS,
	goChartMotion,
	lerpCategoryItems,
	lerpValueSeries,
} from '../charts/chartMotion.js';
import { joinTip } from '../charts/chartTip.js';
import { tipTextOrEmpty } from '../charts/chartTipConfig.js';
const VIEW_W = 400;
const VIEW_H = 220;
const VIEW_BOX = '0 0 400 220';
const PAD = {
	top: 16,
	right: 16,
	bottom: 40,
	left: 44,
};
function buildBarGroups(multi, items, categories) {
	const useMulti = multi.length > 0 && multi[0].values.length > 0;
	const groups = [];
	let seriesMeta = [];
	if (useMulti) {
		seriesMeta = multi;
		let maxLen = 0;
		const multiCount = multi.length;
		for (let seriesIndex = 0; seriesIndex < multiCount; seriesIndex += 1) {
			if (multi[seriesIndex].values.length > maxLen) {
				maxLen = multi[seriesIndex].values.length;
			}
		}
		for (let groupIndex = 0; groupIndex < maxLen; groupIndex += 1) {
			const values = [];
			for (let seriesIndex = 0; seriesIndex < multiCount; seriesIndex += 1) {
				values.push(multi[seriesIndex].values[groupIndex] ?? 0);
			}
			groups.push({
				id: `g-${groupIndex}`,
				label: categories[groupIndex] == null ? String(groupIndex + 1) : String(categories[groupIndex]),
				values,
			});
		}
	} else {
		seriesMeta = [
			{
				id: 's0',
				label: '',
				color: seriesColor(0),
			},
		];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			groups.push({
				id: items[index].id,
				label: items[index].label,
				values: [items[index].value],
				colors: [items[index].color],
			});
		}
	}
	return {
		groups,
		seriesMeta,
		useMulti,
	};
}
function barValueExtent(groups, stacked) {
	const allValues = [];
	const groupCount = groups.length;
	for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
		const values = groups[groupIndex].values;
		let sum = 0;
		const valueCount = values.length;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			sum += values[valueIndex];
			if (!stacked) {
				allValues.push(values[valueIndex]);
			}
		}
		if (stacked) {
			allValues.push(sum);
		}
	}
	return extentOf(allValues.concat([0]));
}
export class UIBarChart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chartLayout: '../charts/chart-layout.css',
		barChart: './bar-chart.css',
	};
	static state = {
		items: [],
		series: [],
		categories: [],
		// Partial mini-SVG layers for list()
		barLayers: [],
		gridLayers: [],
		tickLayers: [],
		// Legend rows for <ui-legend> ({ label, color, tip, id })
		legendItems: [],
		orientation: 'vertical',
		stacked: false,
		showTip: true,
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
	_paintItems = null;
	_paintSeries = null;
	onConnect() {
		this._paintItems = normalizeCategoryItems(this.state.items);
		this._paintSeries = normalizeValueSeries(this.state.series);
		this.observe([
			'items',
			'series',
		], this.onDataTarget);
		this.observe([
			'paintGen',
			'orientation',
			'stacked',
			'categories',
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
		const multi = normalizeValueSeries(this.state.series);
		const useMulti = multi.length > 0 && multi[0].values.length > 0;
		if (useMulti) {
			const seriesTarget = multi;
			const seriesFrom = this._paintSeries ? cloneValueSeries(this._paintSeries) : cloneValueSeries(seriesTarget);
			goChartMotion(this, {
				from: seriesFrom,
				to: seriesTarget,
				lerp: lerpValueSeries,
				apply: this.applyPaintSeries,
				duration: this.state.motionMs,
				animate: this.state.animate !== false,
			});
			return;
		}
		const itemsTarget = normalizeCategoryItems(this.state.items);
		const itemsFrom = this._paintItems ? cloneCategoryItems(this._paintItems) : cloneCategoryItems(itemsTarget);
		goChartMotion(this, {
			from: itemsFrom,
			to: itemsTarget,
			lerp: lerpCategoryItems,
			apply: this.applyPaintItems,
			duration: this.state.motionMs,
			animate: this.state.animate !== false,
		});
	}
	applyPaintSeries(mid) {
		this._paintSeries = mid;
		bumpPaint(this);
	}
	applyPaintItems(mid) {
		this._paintItems = mid;
		bumpPaint(this);
	}
	plotModel() {
		const paintGen = this.state.paintGen;
		const plotLeft = PAD.left;
		if (paintGen < 0) {
			return {
				empty: true,
				bars: [],
				grid: [],
				labels: [],
				legend: [],
				horizontal: this.state.orientation === 'horizontal',
			};
		}
		const plotRight = VIEW_W - PAD.right;
		const plotTop = PAD.top;
		const plotBottom = VIEW_H - PAD.bottom;
		const plotW = plotRight - plotLeft;
		const plotH = plotBottom - plotTop;
		const categories = Array.isArray(this.state.categories) ? this.state.categories.slice() : [];
		const paintBuilt = buildBarGroups(
			this._paintSeries ?? normalizeValueSeries(this.state.series),
			this._paintItems ?? normalizeCategoryItems(this.state.items),
			categories
		);
		const groups = paintBuilt.groups;
		const seriesMeta = paintBuilt.seriesMeta;
		const groupCount = groups.length;
		if (groupCount === 0) {
			return {
				empty: true,
				bars: [],
				grid: [],
				labels: [],
				legend: [],
				horizontal: this.state.orientation === 'horizontal',
			};
		}
		const stacked = Boolean(this.state.stacked) && seriesMeta.length > 1;
		const targetBuilt = buildBarGroups(
			normalizeValueSeries(this.state.series),
			normalizeCategoryItems(this.state.items),
			categories
		);
		const extent = barValueExtent(targetBuilt.groups, stacked);
		const domain = domainTicks(Math.min(0, extent.min), extent.max, 5);
		const yTicks = domain.ticks;
		const domainMin = domain.domainMin;
		const domainMax = domain.domainMax;
		const horizontal = this.state.orientation === 'horizontal';
		const seriesCount = seriesMeta.length;
		const groupGap = 0.2;
		const bars = [];
		for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
			const group = groups[groupIndex];
			if (stacked) {
				let stack = 0;
				for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
					const value = group.values[seriesIndex] ?? 0;
					const color = group.colors?.[seriesIndex] || seriesMeta[seriesIndex].color;
					const tip = joinTip([
						seriesMeta[seriesIndex].label,
						group.label,
						formatTick(value),
					]);
					if (horizontal) {
						const y = scaleLinear(groupIndex + (groupGap / 2), 0, groupCount, plotTop, plotBottom);
						const h = (plotH / groupCount) * (1 - groupGap);
						const x0 = scaleLinear(stack, domainMin, domainMax, plotLeft, plotRight);
						const x1 = scaleLinear(stack + value, domainMin, domainMax, plotLeft, plotRight);
						bars.push({
							x: Math.min(x0, x1),
							y,
							width: Math.abs(x1 - x0),
							height: h,
							color,
							tip,
						});
					} else {
						const x = scaleLinear(groupIndex + (groupGap / 2), 0, groupCount, plotLeft, plotRight);
						const w = (plotW / groupCount) * (1 - groupGap);
						const y0 = scaleLinear(stack, domainMin, domainMax, plotBottom, plotTop);
						const y1 = scaleLinear(stack + value, domainMin, domainMax, plotBottom, plotTop);
						bars.push({
							x,
							y: Math.min(y0, y1),
							width: w,
							height: Math.abs(y1 - y0),
							color,
							tip,
						});
					}
					stack += value;
				}
			} else {
				for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
					const value = group.values[seriesIndex] ?? 0;
					const color = group.colors?.[seriesIndex] || seriesMeta[seriesIndex].color;
					const tip = joinTip([
						seriesMeta[seriesIndex].label,
						group.label,
						formatTick(value),
					]);
					if (horizontal) {
						const slot = plotH / groupCount;
						const barH = (slot * (1 - groupGap)) / seriesCount;
						const y = plotTop + (groupIndex * slot) + (slot * groupGap / 2) + (seriesIndex * barH);
						const x0 = scaleLinear(0, domainMin, domainMax, plotLeft, plotRight);
						const x1 = scaleLinear(value, domainMin, domainMax, plotLeft, plotRight);
						bars.push({
							x: Math.min(x0, x1),
							y,
							width: Math.max(0, Math.abs(x1 - x0)),
							height: Math.max(1, barH * 0.9),
							color,
							tip,
						});
					} else {
						const slot = plotW / groupCount;
						const barW = (slot * (1 - groupGap)) / seriesCount;
						const x = plotLeft + (groupIndex * slot) + (slot * groupGap / 2) + (seriesIndex * barW);
						const y0 = scaleLinear(0, domainMin, domainMax, plotBottom, plotTop);
						const y1 = scaleLinear(value, domainMin, domainMax, plotBottom, plotTop);
						bars.push({
							x,
							y: Math.min(y0, y1),
							width: Math.max(1, barW * 0.9),
							height: Math.max(0, Math.abs(y1 - y0)),
							color,
							tip,
						});
					}
				}
			}
		}
		const grid = [];
		const tickCount = yTicks.length;
		for (let index = 0; index < tickCount; index += 1) {
			const value = yTicks[index];
			if (horizontal) {
				const x = scaleLinear(value, domainMin, domainMax, plotLeft, plotRight);
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
			} else {
				const y = scaleLinear(value, domainMin, domainMax, plotBottom, plotTop);
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
		}
		const labels = [];
		for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
			if (horizontal) {
				const y = scaleLinear(groupIndex + 0.5, 0, groupCount, plotTop, plotBottom);
				labels.push({
					x: plotLeft - 8,
					y: y + 3,
					label: groups[groupIndex].label,
					anchor: 'end',
				});
			} else {
				const x = scaleLinear(groupIndex + 0.5, 0, groupCount, plotLeft, plotRight);
				labels.push({
					x,
					y: plotBottom + 16,
					label: groups[groupIndex].label,
					anchor: 'middle',
				});
			}
		}
		const legend = [];
		if (seriesMeta.length > 1 || (seriesMeta[0] && seriesMeta[0].label)) {
			const legendCount = seriesMeta.length;
			for (let index = 0; index < legendCount; index += 1) {
				const meta = seriesMeta[index];
				const legendLabel = meta.label || meta.id;
				legend.push({
					id: meta.id,
					label: legendLabel,
					color: meta.color,
					tip: legendLabel,
				});
			}
		}
		return {
			empty: false,
			bars,
			grid,
			labels,
			legend,
			horizontal,
		};
	}
	/*
	 * Materialize plotModel geometry into list state for this.partial rows.
	 * Replaces ^html string SVG (wrong attr binding + no framework tooltips).
	 */
	syncPlotLayers() {
		const plot = this.plotModel();
		if (plot.empty) {
			this.assignState({
				barLayers: [],
				gridLayers: [],
				tickLayers: [],
				legendItems: [],
			});
			return;
		}
		const tipsOn = this.state.showTip !== false;
		const barLayers = [];
		const barCount = plot.bars.length;
		for (let index = 0; index < barCount; index += 1) {
			const row = plot.bars[index];
			barLayers.push({
				id: `b${index}`,
				x: row.x,
				y: row.y,
				width: row.width,
				height: row.height,
				style: `--bc-series:${row.color || 'currentColor'}`,
				tip: tipTextOrEmpty(tipsOn, row.tip),
			});
		}
		const showGrid = this.state.showGrid !== false;
		const gridLayers = [];
		if (showGrid) {
			const gridCount = plot.grid.length;
			for (let index = 0; index < gridCount; index += 1) {
				const row = plot.grid[index];
				gridLayers.push({
					id: `g${index}`,
					x1: row.x1,
					y1: row.y1,
					x2: row.x2,
					y2: row.y2,
				});
			}
		}
		const tickLayers = [];
		const showCatTicks = this.state.showXTicks !== false && this.state.showXAxis !== false;
		if (showCatTicks) {
			const labelCount = plot.labels.length;
			for (let index = 0; index < labelCount; index += 1) {
				const row = plot.labels[index];
				tickLayers.push({
					id: `c${index}`,
					x: row.x,
					y: row.y,
					anchor: row.anchor,
					label: row.label,
				});
			}
		}
		const showValueTicks = this.state.showYTicks !== false && this.state.showYAxis !== false;
		if (showValueTicks && showGrid) {
			const gridCount = plot.grid.length;
			for (let index = 0; index < gridCount; index += 1) {
				const row = plot.grid[index];
				tickLayers.push({
					id: `v${index}`,
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
			barLayers,
			gridLayers,
			tickLayers,
			legendItems,
		});
	}
	barLayerRow(bar) {
		return this.partial`
			<svg class="bc-layer" viewBox=${VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<rect class="bc-bar" style=${bar.style}
					x=${bar.x} y=${bar.y}
					width=${bar.width} height=${bar.height}
					rx="2" tooltip=${bar.tip}></rect>
			</svg>`;
	}
	gridLayerRow(line) {
		return this.partial`
			<svg class="bc-layer bc-layer-grid" viewBox=${VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<line class="bc-grid" x1=${line.x1} y1=${line.y1} x2=${line.x2} y2=${line.y2}></line>
			</svg>`;
	}
	tickLayerRow(tick) {
		return this.partial`
			<svg class="bc-layer bc-layer-tick" viewBox=${VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
				<text class="bc-tick" x=${tick.x} y=${tick.y} text-anchor=${tick.anchor}>${tick.label}</text>
			</svg>`;
	}
	isEmpty() {
		return this.state.barLayers.length === 0;
	}
	hideEmpty() {
		return this.state.barLayers.length > 0;
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
	render() {
		this.html`
			<div class="bc chart-shell" data-tone=${this.state.tone} data-orientation=${this.state.orientation}
				data-legend-pos=${this.legendPosition}
				data-legend-orient=${this.legendOrientation}
				data-layout=${this.shellLayout}
				?data-compact=${this.shellCompact}
				role="img" aria-label=${this.state.label || 'Bar chart'}>
				<div class="bc-empty" ?hidden=${this.hideEmpty}>${this.state.emptyLabel}</div>
				<div class="chart-plot-area">
					<div class="chart-heading" ?hidden=${this.hideHeading}>${this.state.label}</div>
					<div class="chart-axis-label chart-axis-label-y" ?hidden=${this.hideYLabel}>${this.state.yLabel}</div>
					<div #plot class="chart-plot" ?data-motion=${this.state.motion}>
						<div class="bc-svg-stack">
							${this.list('gridLayers', this.gridLayerRow)}
							${this.list('barLayers', this.barLayerRow)}
							${this.list('tickLayers', this.tickLayerRow)}
						</div>
					</div>
					<div class="chart-axis-label chart-axis-label-x" ?hidden=${this.hideXLabel}>${this.state.xLabel}</div>
				</div>
				<div class="chart-legend-slot bc-legend" ?hidden=${this.hideLegend}>
					<ui-legend
						.state.items=${this.state.legendItems}
						.state.orientation=${this.legendOrientation}
						.state.align=${this.legendAlign}></ui-legend>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-bar-chart', UIBarChart);
