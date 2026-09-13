/*
	DESCRIPTION: ui-meter-group — stacked proportional meter.
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
import {
	hasValue,
	isArray,
	isNumber,
	isTrue,
	WebComponent,
} from 'webcomponent';
function meterItemKey(item, index) {
	return String(item?.id ?? item?.label ?? index);
}
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
	itemFromTarget(target) {
		const items = this.state.items;
		if (!isArray(items) || !target) {
			return null;
		}
		const needle = target.dataset?.id;
		if (!hasValue(needle) || needle === '') {
			return null;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (this.itemId(entry, index) === String(needle)) {
				return entry;
			}
		}
		return null;
	}
	itemId(item, index) {
		if (!item) {
			return String(index);
		}
		if (hasValue(item.id) && item.id !== '') {
			return String(item.id);
		}
		if (hasValue(item.label) && item.label !== '') {
			return String(item.label);
		}
		return String(index);
	}
	// @engram em:network/code/meter-group-light-row-click-item-is-not-the-source-entry — match by id, stamp source
	handleSegmentClick(domEvent, item) {
		const items = this.state.items;
		const resolved = item || this.itemFromTarget(domEvent.currentTarget);
		if (!isArray(items) || !resolved) {
			return;
		}
		const selectedId = this.itemId(resolved, -1);
		const count = items.length;
		let index = -1;
		let source = resolved;
		/*
		 * `resolved` can be a stale row from an earlier render, so the live entry
		 * is located by id rather than trusted from the click.
		 */
		for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
			const entry = items[itemIndex];
			if (entry && this.itemId(entry, itemIndex) === selectedId) {
				index = itemIndex;
				source = entry;
				break;
			}
		}
		/* A second click on the live segment clears it, rather than re-selecting. */
		const deselect = isTrue(source.active);
		const changedIndexes = [];
		for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
			const entry = items[itemIndex];
			if (!entry) {
				continue;
			}
			const isActive = !deselect && entry === source;
			if (entry.active !== isActive) {
				entry.active = isActive;
				changedIndexes.push(itemIndex);
			}
		}
		/*
		 * The rows belong to the caller's array, so a deep write never reaches
		 * the state proxy — it traps `state.items = …`, not `items[i].active`.
		 * Notify each flipped index as `items.N.active` so ListSpot's multiPath
		 * drain patches `data-active` on the EXISTING node (transform / fill
		 * can ease). A top-level `items` notify skips same-ref light rows; a
		 * key that folds `active` remounts the row and the CSS never sees a
		 * from-state. Reassigning `state.items` would fight the parent's
		 * carrier binding and lag a click behind.
		 */
		const changedCount = changedIndexes.length;
		for (let notifyIndex = 0; notifyIndex < changedCount; notifyIndex += 1) {
			this.stateBus?.notify(`items.${changedIndexes[notifyIndex]}.active`);
		}
		this.state.activeIndex = deselect ? null : source.id ?? index;
		this.emit('meter-group:select', {
			id: deselect ? null : source.id,
			item: deselect ? null : source,
			index: deselect ? -1 : index,
		});
	}
	/* Light row — share is a plain value from (item, group). */
	segmentRow(item) {
		return this.partial`
			<button type="button" class="meter-group-seg"
				data-tone=${this.itemTone(item)}
				data-id=${item?.id ?? item?.label ?? ''}
				?data-active=${isTrue(item?.active)}
				style=${item?.color ? `background:${item.color};--meter-group-share:${this.itemShare(item)}` : `--meter-group-share:${this.itemShare(item)}`}
				tooltip=${this.itemTip(item)}
				aria-label=${this.itemTip(item)}
				@click=${this.handleSegmentClick}></button>`;
	}
	legendRow(item) {
		return this.partial`
			<button type="button" class="meter-group-leg"
				data-mark=${this.state.showIcon === true && item?.icon ? 'icon' : 'dot'}
				data-tone=${this.itemTone(item)}
				data-id=${item?.id ?? item?.label ?? ''}
				?data-active=${isTrue(item?.active)}
				tooltip=${this.itemTip(item)}
				@click=${this.handleSegmentClick}>
				<span class="meter-group-swatch" style=${item?.color ? `background:${item.color}` : ''}></span>
				<ui-icon class="meter-group-icon" .state.name=${item?.icon || ''} .state.size=${'xs'}></ui-icon>
				<span class="meter-group-leg-label">${item?.label || ''}</span>
				<span class="meter-group-leg-detail">${this.itemPercent(item)}%</span>
			</button>`;
	}
	rangeMin() {
		return this.range().min;
	}
	rangeMax() {
		return this.range().max;
	}
	meterNow() {
		const bounds = this.range();
		return Math.round(clamp(this.totalValue(), bounds.min, bounds.max));
	}
	render() {
		this.html`
			<div class="meter-group"
				data-orientation=${this.orientationFlag}
				data-labels=${this.labelOrientationFlag}
				?data-animated=${this.state.animated !== false}
				?data-show-icon=${this.state.showIcon}
				role="meter"
				aria-label=${this.state.label || 'Meter'}
				aria-valuemin=${this.rangeMin}
				aria-valuemax=${this.rangeMax}
				aria-valuenow=${this.meterNow}>
				<div class="meter-group-track" tooltip=${this.state.tooltip}>
					${this.list('items', this.segmentRow, meterItemKey)}
				</div>
				<div class="meter-group-legend" ?hidden=${!this.state.showLegend}>
					${this.list('items', this.legendRow, meterItemKey)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-meter-group', UIMeterGroup);
