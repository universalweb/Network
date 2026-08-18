/*
	DESCRIPTION: ui-meter-group — stacked proportional meter (PrimeVue MeterGroup).
	Items { label, value, color?, icon?, tone? } share a min/max range. Tooltips
	on segments; hover + click set :hover / [data-active] for styling. Intro
	scale-in on mount; live value writes animate flex-grow. showIcon swaps the
	legend mark from a color circle to <ui-icon>.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-meter-group .state.items=${[
	    { id: 'apps', label: 'Apps', value: 16, icon: 'app-window', tone: 'accent' },
	    { id: 'media', label: 'Media', value: 24, icon: 'image', tone: 'success' },
	  ]} .state.showIcon=${true} @meter-group:select=${this.onSeg}></ui-meter-group>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { hasValue, isArray, isNumber } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
const TONE_CYCLE = [
	'accent',
	'success',
	'warning',
	'info',
	'danger',
];
function clamp(value, min, max) {
	if (!isNumber(value) || !Number.isFinite(value)) {
		return min;
	}
	if (value < min) {
		return min;
	}
	if (value > max) {
		return max;
	}
	return value;
}
function numericValue(value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return 0;
	}
	return parsed;
}
export class UIMeterGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		meterGroup: './meter-group.css',
	};
	static state = {
		items: [],
		min: 0,
		max: 100,
		// horizontal | vertical
		orientation: 'horizontal',
		// horizontal | vertical
		labelOrientation: 'horizontal',
		showLegend: true,
		// Legend mark: icon (when item.icon is set) vs color circle.
		showIcon: false,
		animated: true,
		activeIndex: null,
		label: '',
		tooltip: '',
	};
	onConnect() {
		this.observe(['items'], this.syncItemDefaults);
		this.syncItemDefaults();
	}
	onMount() {
		if (this.state.animated !== false) {
			this.animateIn();
		}
	}
	/* Stamp missing tone once so light rows never need the list index. */
	syncItemDefaults() {
		const items = this.state.items;
		if (!isArray(items)) {
			return;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			if (!hasValue(item.tone) || item.tone === '') {
				item.tone = TONE_CYCLE[index % TONE_CYCLE.length];
			}
		}
	}
	range() {
		const minRaw = Number(this.state.min);
		const maxRaw = Number(this.state.max);
		const min = Number.isFinite(minRaw) ? minRaw : 0;
		const max = Number.isFinite(maxRaw) ? maxRaw : 100;
		return {
			min,
			max: max > min ? max : min + 1,
		};
	}
	span() {
		const {
			min,
			max,
		} = this.range();
		return max - min;
	}
	totalValue() {
		const items = this.state.items;
		if (!isArray(items)) {
			return 0;
		}
		let sum = 0;
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			sum += numericValue(items[index]?.value);
		}
		return sum;
	}
	itemShare(item) {
		return clamp(numericValue(item?.value) / this.span(), 0, 1);
	}
	itemPercent(item) {
		return Math.round(this.itemShare(item) * 100);
	}
	itemTone(item) {
		if (hasValue(item?.tone) && item.tone !== '') {
			return item.tone;
		}
		return 'accent';
	}
	itemTip(item) {
		if (hasValue(item?.tooltip) && item.tooltip !== '') {
			return item.tooltip;
		}
		const label = item?.label || '';
		return `${label} (${this.itemPercent(item)}%)`;
	}
	orientationFlag() {
		return this.state.orientation === 'vertical' ? 'vertical' : 'horizontal';
	}
	labelOrientationFlag() {
		return this.state.labelOrientation === 'vertical' ? 'vertical' : 'horizontal';
	}
	handleSegmentClick(_domEvent, item) {
		const items = this.state.items;
		if (!isArray(items) || !item) {
			return;
		}
		const count = items.length;
		let index = -1;
		for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
			const entry = items[itemIndex];
			const isActive = entry === item;
			if (isActive) {
				index = itemIndex;
			}
			if (entry && entry.active !== isActive) {
				entry.active = isActive;
			}
		}
		this.state.activeIndex = item.id ?? index;
		this.emit('meter-group:select', {
			id: item.id,
			item,
			index,
		});
	}
	/* Light row — share is a plain value from (item, group). */
	segmentRow(item) {
		const share = this.itemShare(item);
		const tone = this.itemTone(item);
		const color = item?.color || '';
		const fillStyle = color ? `background:${color};--mg-share:${share}` : `--mg-share:${share}`;
		const tip = this.itemTip(item);
		const active = item?.active === true;
		return this.partial`
			<button type="button" class="mg-seg"
				data-tone=${tone}
				?data-active=${active}
				style=${fillStyle}
				tooltip=${tip}
				aria-label=${tip}
				@click=${this.handleSegmentClick}></button>`;
	}
	legendRow(item) {
		const tone = this.itemTone(item);
		const color = item?.color || '';
		const swatchStyle = color ? `background:${color}` : '';
		const label = item?.label || '';
		const detail = `${this.itemPercent(item)}%`;
		const icon = item?.icon || '';
		const mark = this.state.showIcon === true && icon !== '' ? 'icon' : 'dot';
		const tip = this.itemTip(item);
		const active = item?.active === true;
		return this.partial`
			<button type="button" class="mg-leg"
				data-mark=${mark}
				data-tone=${tone}
				?data-active=${active}
				tooltip=${tip}
				@click=${this.handleSegmentClick}>
				<span class="mg-swatch" style=${swatchStyle}></span>
				<ui-icon class="mg-icon" .state.name=${icon} .state.size=${'xs'}></ui-icon>
				<span class="mg-leg-label">${label}</span>
				<span class="mg-leg-detail">${detail}</span>
			</button>`;
	}
	render() {
		const {
			min,
			max,
		} = this.range();
		const now = Math.round(clamp(this.totalValue(), min, max));
		this.html`
			<div class="mg"
				data-orientation=${this.orientationFlag}
				data-labels=${this.labelOrientationFlag}
				?data-animated=${this.state.animated !== false}
				?data-show-icon=${this.state.showIcon}
				role="meter"
				aria-label=${this.state.label || 'Meter'}
				aria-valuemin=${min}
				aria-valuemax=${max}
				aria-valuenow=${now}>
				<div class="mg-track" tooltip=${this.state.tooltip}>
					${this.list('items', this.segmentRow)}
				</div>
				<div class="mg-legend" ?hidden=${!this.state.showLegend}>
					${this.list('items', this.legendRow)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-meter-group', UIMeterGroup);
