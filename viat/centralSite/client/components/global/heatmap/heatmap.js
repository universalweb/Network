/*
	DESCRIPTION: ui-heatmap — a value→colour grid in two modes:
	  • matrix   — a 2D number grid (or {x,y,value} points), optional row/col labels
	  • calendar — a GitHub-style day grid from [{date, value}] (weeks × weekdays)
	Activity density, tx-per-day, correlation matrices.
	ONE GRID, ONE LIST. Labels AND cells are light `html` rows in a SINGLE CSS grid,
	each placed by explicit `grid-column/grid-row` — so the two modes share the whole
	render core and matrix/calendar differ only in how a cell gets its (col,row).
	COLOUR is continuous with NO JS colour math: a cell is
	`color-mix(in oklab, var(--heat-color) INTENSITY%, var(--heat-track))`, INTENSITY
	the value normalised over the domain (floored for a present-but-low value so it
	stays distinct from empty). Retheme by overriding the two custom props.
	DATES ARE UTC END-TO-END (every UTC day is exactly 86.4M ms, so the `/DAY_MS`
	floor is only valid under UTC — never reach for a local getDate/getMonth). A
	{date: Date} entry is safe in reactive state: the framework's clone is selective
	— it deep-proxies plain objects/arrays but passes CLASS INSTANCES (Date) through
	by REFERENCE, so `getUTC*` keeps working straight off state (verified). `data`
	therefore lives in reactive state like any sibling list component.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-heatmap .state.mode=${'calendar'} .state.data=${[{ date: '2026-01-03', value: 5 }]}></ui-heatmap>
	  <ui-heatmap .state.data=${[[1, 4, 9], [2, 0, 7]]} .state.rowLabels=${['A', 'B']}></ui-heatmap>
	─────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
const DAY_MS = 86400000;
const WEEK_MS = DAY_MS * 7;
const DEFAULT_SPAN = DAY_MS * 363;
const MIN_INTENSITY = 12;
const WEEKDAY_LABELS = [
	'Sun',
	'Mon',
	'Tue',
	'Wed',
	'Thu',
	'Fri',
	'Sat',
];
const MONTH_LABELS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];
function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}
// Any accepted date input → UTC-midnight ms (or NaN). ISO date-only strings parse
// as UTC per spec; a Date/number is re-floored to its UTC day so the grid never
// drifts by a timezone.
function toTime(input) {
	if (input instanceof Date) {
		return input.getTime();
	}
	if (typeof input === 'number') {
		return input;
	}
	return Date.parse(input);
}
function toUtcDay(input) {
	const time = toTime(input);
	if (!Number.isFinite(time)) {
		return NaN;
	}
	const at = new Date(time);
	return Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
}
function weekdayIndex(dayMs, weekStart) {
	return (new Date(dayMs).getUTCDay() - weekStart + 7) % 7;
}
function startOfWeek(dayMs, weekStart) {
	return dayMs - (weekdayIndex(dayMs, weekStart) * DAY_MS);
}
function pointsToGrid(points) {
	let maxX = 0;
	let maxY = 0;
	for (const point of points) {
		if (Number.isInteger(point.x) && point.x > maxX) {
			maxX = point.x;
		}
		if (Number.isInteger(point.y) && point.y > maxY) {
			maxY = point.y;
		}
	}
	const grid = Array.from({
		length: maxY + 1,
	}, () => {
		return new Array(maxX + 1).fill(null);
	});
	for (const point of points) {
		if (Number.isInteger(point.x) && Number.isInteger(point.y)) {
			grid[point.y][point.x] = point.value;
		}
	}
	return grid;
}
function padGrid(grid) {
	let cols = 0;
	for (const row of grid) {
		if (Array.isArray(row) && row.length > cols) {
			cols = row.length;
		}
	}
	return grid.map((row) => {
		const out = new Array(cols).fill(null);
		if (Array.isArray(row)) {
			for (let index = 0; index < row.length; index += 1) {
				out[index] = row[index];
			}
		}
		return out;
	});
}
// 2D array | {x,y,value} points | flat number row → a padded 2D grid of values.
function toMatrix(data) {
	if (!Array.isArray(data) || data.length === 0) {
		return [];
	}
	const first = data[0];
	if (Array.isArray(first)) {
		return padGrid(data);
	}
	if (first && typeof first === 'object' && first.value !== undefined) {
		return padGrid(pointsToGrid(data));
	}
	return padGrid([data]);
}
export class UIHeatmap extends WebComponent {
	static url = import.meta.url;
	static styles = {
		heatmap: './heatmap.css',
	};
	static state = {
		data: null,
		mode: 'matrix',
		rowLabels: [],
		colLabels: [],
		domain: null,
		weekStart: 0,
		start: null,
		end: null,
		showLegend: true,
		showValues: false,
		items: [],
		templateStyle: '',
		legendMin: 0,
		legendMax: 0,
		hasData: false,
	};
	cellMap = new Map();
	formatTooltip = null;
	onConnect() {
		this.rebuild();
		this.observe([
			'data',
			'mode',
			'rowLabels',
			'colLabels',
			'domain',
			'weekStart',
			'start',
			'end',
			'showValues',
		], this.rebuild);
	}
	domainOf(values) {
		const override = this.state.domain;
		if (Array.isArray(override) && override.length === 2 && isFiniteNumber(override[0]) && isFiniteNumber(override[1])) {
			return {
				min: override[0],
				max: override[1],
			};
		}
		let min = Infinity;
		let max = -Infinity;
		for (const value of values) {
			if (isFiniteNumber(value)) {
				if (value < min) {
					min = value;
				}
				if (value > max) {
					max = value;
				}
			}
		}
		if (min === Infinity) {
			return {
				min: 0,
				max: 0,
			};
		}
		return {
			min,
			max,
		};
	}
	intensityOf(value, min, max) {
		if (!isFiniteNumber(value)) {
			return -1;
		}
		const span = max - min || 1;
		const normalized = (value - min) / span;
		if (normalized <= 0) {
			return 0;
		}
		return Math.max(MIN_INTENSITY, Math.min(100, Math.round(normalized * 100)));
	}
	cellStyle(gridColumn, gridRow, intensity) {
		let style = `grid-column:${gridColumn};grid-row:${gridRow};`;
		if (intensity > 0) {
			style += `background:color-mix(in oklab, var(--heat-color) ${intensity}%, var(--heat-track));`;
		}
		return style;
	}
	tooltipFor(parts, value) {
		if (typeof this.formatTooltip === 'function') {
			return this.formatTooltip(parts, value);
		}
		const head = parts.filter(Boolean).join(' · ');
		const tail = isFiniteNumber(value) ? String(value) : 'no data';
		return head ? `${head}: ${tail}` : tail;
	}
	pushCell(items, options) {
		const cellIndex = this.cellMap.size;
		const empty = !isFiniteNumber(options.value);
		const text = this.state.showValues && !empty ? String(options.value) : '';
		const item = {
			key: `c${cellIndex}`,
			kind: 'cell',
			cellIndex,
			value: options.value,
			tooltip: options.tooltip,
			col: options.col,
			row: options.row,
			dateKey: options.dateKey ?? null,
			text,
			cls: empty ? 'hm-cell is-empty' : 'hm-cell',
			style: this.cellStyle(options.gridColumn, options.gridRow, options.intensity),
		};
		this.cellMap.set(cellIndex, item);
		items.push(item);
	}
	rebuild() {
		this.cellMap = new Map();
		if (this.state.mode === 'calendar') {
			this.buildCalendar();
			return;
		}
		this.buildMatrix();
	}
	buildMatrix() {
		const grid = toMatrix(this.state.data);
		const rowLabels = Array.isArray(this.state.rowLabels) ? this.state.rowLabels : [];
		const colLabels = Array.isArray(this.state.colLabels) ? this.state.colLabels : [];
		const layout = {
			rowCount: grid.length,
			colCount: grid.length > 0 ? grid[0].length : 0,
			rowLabels,
			colLabels,
			hasRowLabels: rowLabels.length > 0,
			hasColLabels: colLabels.length > 0,
		};
		layout.colOffset = layout.hasRowLabels ? 1 : 0;
		layout.rowOffset = layout.hasColLabels ? 1 : 0;
		const flat = [];
		for (const row of grid) {
			for (const value of row) {
				flat.push(value);
			}
		}
		const domain = this.domainOf(flat);
		const items = [];
		this.pushMatrixLabels(items, layout);
		this.pushMatrixCells(items, grid, domain, layout);
		const template = `grid-template-columns:${layout.hasRowLabels ? ' auto' : ''} repeat(${layout.colCount}, var(--hm-cell));grid-template-rows:${layout.hasColLabels ? ' auto' : ''} repeat(${layout.rowCount}, var(--hm-cell));`;
		this.commit(items, template, domain, layout.rowCount > 0 && layout.colCount > 0);
	}
	pushMatrixLabels(items, layout) {
		if (layout.hasRowLabels && layout.hasColLabels) {
			items.push({
				key: 'corner',
				kind: 'corner',
				text: '',
				cls: 'hm-corner',
				style: 'grid-column:1;grid-row:1;',
			});
		}
		if (layout.hasColLabels) {
			for (let col = 0; col < layout.colCount; col += 1) {
				items.push({
					key: `cl${col}`,
					kind: 'collabel',
					text: String(layout.colLabels[col] ?? ''),
					cls: 'hm-label hm-col-label',
					style: `grid-column:${col + 1 + layout.colOffset};grid-row:1;`,
				});
			}
		}
		if (layout.hasRowLabels) {
			for (let row = 0; row < layout.rowCount; row += 1) {
				items.push({
					key: `rl${row}`,
					kind: 'rowlabel',
					text: String(layout.rowLabels[row] ?? ''),
					cls: 'hm-label hm-row-label',
					style: `grid-column:1;grid-row:${row + 1 + layout.rowOffset};`,
				});
			}
		}
	}
	pushMatrixCells(items, grid, domain, layout) {
		for (let row = 0; row < layout.rowCount; row += 1) {
			for (let col = 0; col < layout.colCount; col += 1) {
				const value = grid[row][col];
				const colTip = layout.hasColLabels ? String(layout.colLabels[col] ?? '') : `Col ${col + 1}`;
				const rowTip = layout.hasRowLabels ? String(layout.rowLabels[row] ?? '') : `Row ${row + 1}`;
				this.pushCell(items, {
					value,
					col,
					row,
					gridColumn: col + 1 + layout.colOffset,
					gridRow: row + 1 + layout.rowOffset,
					intensity: this.intensityOf(value, domain.min, domain.max),
					tooltip: this.tooltipFor([rowTip, colTip], value),
				});
			}
		}
	}
	calendarSums() {
		const sums = new Map();
		if (!Array.isArray(this.state.data)) {
			return sums;
		}
		for (const entry of this.state.data) {
			const dayKey = toUtcDay(entry?.date);
			if (!Number.isFinite(dayKey)) {
				continue;
			}
			const value = Number(entry?.value);
			const prior = sums.get(dayKey) ?? 0;
			sums.set(dayKey, prior + (Number.isFinite(value) ? value : 0));
		}
		return sums;
	}
	calendarRange(sums) {
		const explicitStart = toUtcDay(this.state.start);
		const explicitEnd = toUtcDay(this.state.end);
		const keys = [...sums.keys()];
		let start = Number.isFinite(explicitStart) ? explicitStart : Math.min(...keys);
		let end = Number.isFinite(explicitEnd) ? explicitEnd : Math.max(...keys);
		if (!Number.isFinite(start) || !Number.isFinite(end)) {
			end = toUtcDay(Date.now());
			start = end - DEFAULT_SPAN;
		}
		return {
			start,
			end,
			explicitStart,
		};
	}
	pushMonthLabel(items, dayMs, column, monthSeen) {
		const month = new Date(dayMs).getUTCMonth();
		if (monthSeen.has(month)) {
			return;
		}
		monthSeen.add(month);
		items.push({
			key: `mo${column}`,
			kind: 'monthlabel',
			text: MONTH_LABELS[month],
			cls: 'hm-label hm-month-label',
			style: `grid-column:${column + 2};grid-row:1;`,
		});
	}
	pushCalendarCell(items, dayMs, column, weekStart, sums, domain) {
		const weekday = weekdayIndex(dayMs, weekStart);
		const value = sums.has(dayMs) ? sums.get(dayMs) : null;
		const at = new Date(dayMs);
		const label = `${MONTH_LABELS[at.getUTCMonth()]} ${at.getUTCDate()}, ${at.getUTCFullYear()}`;
		this.pushCell(items, {
			value,
			col: column,
			row: weekday,
			dateKey: dayMs,
			gridColumn: column + 2,
			gridRow: weekday + 2,
			intensity: this.intensityOf(value, domain.min, domain.max),
			tooltip: this.tooltipFor([label], value),
		});
	}
	pushWeekdayLabels(items, weekStart) {
		for (let row = 0; row < 7; row += 1) {
			if (row % 2 !== 1) {
				continue;
			}
			items.push({
				key: `wd${row}`,
				kind: 'weekdaylabel',
				text: WEEKDAY_LABELS[(row + weekStart) % 7],
				cls: 'hm-label hm-weekday-label',
				style: `grid-column:1;grid-row:${row + 2};`,
			});
		}
	}
	buildCalendar() {
		const sums = this.calendarSums();
		const weekStart = Number(this.state.weekStart) || 0;
		const range = this.calendarRange(sums);
		const gridStart = startOfWeek(range.start, weekStart);
		const domain = this.domainOf([...sums.values()]);
		const items = [];
		const monthSeen = new Set();
		let lastColumn = -1;
		for (let dayMs = gridStart; dayMs <= range.end; dayMs += DAY_MS) {
			const elapsed = dayMs - gridStart;
			const column = Math.floor(elapsed / WEEK_MS);
			if (column !== lastColumn) {
				lastColumn = column;
				this.pushMonthLabel(items, dayMs, column, monthSeen);
			}
			this.pushCalendarCell(items, dayMs, column, weekStart, sums, domain);
		}
		this.pushWeekdayLabels(items, weekStart);
		const totalSpan = range.end - gridStart;
		const weeks = Math.floor(totalSpan / WEEK_MS);
		const template = `grid-template-columns: auto repeat(${weeks + 1}, var(--hm-cell));grid-template-rows: auto repeat(7, var(--hm-cell));`;
		this.commit(items, template, domain, sums.size > 0 || Number.isFinite(range.explicitStart));
	}
	commit(items, template, domain, hasData) {
		this.state.legendMin = domain.min;
		this.state.legendMax = domain.max;
		this.state.templateStyle = template;
		this.state.hasData = hasData;
		this.state.items = items;
	}
	handlePointerMove(domEvent) {
		const target = domEvent.target;
		if (!(target instanceof Element) || !target.classList.contains('hm-cell')) {
			this.hideTip();
			return;
		}
		const item = this.cellMap.get(Number(target.dataset.index));
		if (!item) {
			this.hideTip();
			return;
		}
		const tip = this.refs.tip;
		const wrapRect = this.refs.grid.getBoundingClientRect();
		const cellRect = target.getBoundingClientRect();
		const centerX = cellRect.left - wrapRect.left + (cellRect.width / 2);
		const topY = cellRect.top - wrapRect.top;
		tip.textContent = item.tooltip;
		tip.style.insetInlineStart = `${centerX}px`;
		tip.style.insetBlockStart = `${topY}px`;
		tip.dataset.show = 'true';
	}
	hideTip() {
		const tip = this.refs.tip;
		if (tip) {
			tip.dataset.show = 'false';
		}
	}
	handleClick(domEvent) {
		const target = domEvent.target;
		if (!(target instanceof Element) || !target.classList.contains('hm-cell')) {
			return;
		}
		const item = this.cellMap.get(Number(target.dataset.index));
		if (!item) {
			return;
		}
		this.emit('heatmap:select', {
			value: item.value,
			col: item.col,
			row: item.row,
			dateKey: item.dateKey,
		});
	}
	itemKey(item) {
		return item.key;
	}
	cellRow(item) {
		if (item.kind === 'cell') {
			return html`<div class=${item.cls} data-index=${item.cellIndex} style=${item.style}><span class="hm-val">${item.text}</span></div>`;
		}
		return html`<div class=${item.cls} style=${item.style}>${item.text}</div>`;
	}
	render() {
		this.html`
			<div class="hm" data-mode=${this.state.mode}>
				<div class="hm-scroll">
					<div #grid class="hm-grid" style=${this.state.templateStyle}
						@pointermove=${this.handlePointerMove} @pointerleave=${this.hideTip} @click=${this.handleClick}>
						${this.list('items', this.cellRow, this.itemKey)}
						<div #tip class="hm-tip" data-show="false" role="status"></div>
					</div>
				</div>
				<div class="hm-legend" ?hidden=${this.legendHidden}>
					<span class="hm-legend-min">${this.state.legendMin}</span>
					<span class="hm-legend-ramp"></span>
					<span class="hm-legend-max">${this.state.legendMax}</span>
				</div>
			</div>
		`;
	}
	legendHidden() {
		return this.state.showLegend !== true || this.state.hasData !== true;
	}
}
customElements.define('ui-heatmap', UIHeatmap);
