/*
	DESCRIPTION: ui-filter-bar-item — one filter-bar descriptor row. Delegates
	to a shipped control by `type` (search / select / combobox / toggle /
	date-range / multi-select). Select type forwards allLabel (default All)
	onto ui-select so the empty option stays after a pick. Toggle descriptors
	forward selectAll / clearable / overflow onto ui-toggle-group. Multi-select
	mounts the shipped ui-multi-select (filterable by default) and reports
	through the same handleValue multi path as toggle. Emits
	filter-bar-item:change { key, value }.
	Author: Universal Web
	Date: 2026-08-30
*/
import '../combobox/combobox.js';
import '../date-input/date-input.js';
import '../multi-select/multi-select.js';
import '../search-input/search-input.js';
import '../select/select.js';
import '../toggle-group/toggle-group.js';
import {
	isArray, isPlainObject, isTrue, WebComponent,
} from 'webcomponent';
/* Shared empty selection — a fresh [] per render would be a new identity every
   pass and churn the child's state assignment for no reason. */
const EMPTY_VALUES = Object.freeze([]);
export class UIFilterBarItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		filterBarItem: './filter-bar-item.css',
	};
	static state = {
		key: '',
		label: '',
		/* eslint-disable-next-line no-restricted-syntax -- descriptor kind, plan-8 */
		type: 'search',
		options: [],
		value: '',
		placeholder: '',
		size: 'md',
		extra: false,
		/*
		 * `toggle` only — ui-toggle-group already supports multi-selection
		 * (`multiple` + `values[]`); this forwards it so a filter can hold several
		 * choices at once instead of replacing the previous one. In multi mode the
		 * descriptor's `value` IS the array. `selectAll` / `clearable` / `overflow`
		 * forward onto the group — they are group-level rails, not options.
		 */
		multiple: false,
		selectAll: false,
		clearable: false,
		overflow: 'auto',
		filterable: true,
		disabled: false,
		allLabel: 'All',
	};
	beforeRender() {
		this.toggleAttribute('data-extra', this.state.extra === true);
		this.dataset.kind = this.state.type || 'search';
	}
	isMultiValue() {
		return this.state.multiple === true || this.state.type === 'multi-select';
	}
	handleValue(domEvent) {
		const data = domEvent.detail?.data;
		/* Multi mode reports the whole active set under `values`. */
		if (this.isMultiValue()) {
			this.emit('filter-bar-item:change', {
				key: this.state.key,
				value: this.resolveMultiValue(data),
			});
			return;
		}
		this.emit('filter-bar-item:change', {
			key: this.state.key,
			value: data?.value ?? '',
		});
	}
	resolveMultiValue(data) {
		return isArray(data?.values) ? data.values : EMPTY_VALUES;
	}
	handleFrom(domEvent) {
		this.emitRange('from', domEvent.detail?.data?.value ?? '');
	}
	handleTo(domEvent) {
		this.emitRange('to', domEvent.detail?.data?.value ?? '');
	}
	emitRange(side, next) {
		const current = this.state.value;
		const range = {
			from: '',
			to: '',
		};
		if (isPlainObject(current)) {
			range.from = current.from || '';
			range.to = current.to || '';
		}
		if (side === 'from') {
			range.from = next;
		} else {
			range.to = next;
		}
		this.emit('filter-bar-item:change', {
			key: this.state.key,
			value: range,
		});
	}
	rangeFrom() {
		const current = this.state.value;
		if (isPlainObject(current)) {
			return current.from || '';
		}
		return '';
	}
	rangeTo() {
		const current = this.state.value;
		if (isPlainObject(current)) {
			return current.to || '';
		}
		return '';
	}
	renderControl() {
		const kind = this.state.type;
		if (kind === 'select') {
			return this.renderSelect();
		}
		if (kind === 'combobox') {
			return this.renderCombobox();
		}
		if (kind === 'toggle') {
			return this.renderToggle();
		}
		if (kind === 'date-range') {
			return this.renderDateRange();
		}
		if (kind === 'multi-select') {
			return this.renderMultiSelect();
		}
		return this.renderSearch();
	}
	renderSearch() {
		return this.htmlElement`
			<ui-search-input
				.state.value=${this.state.value || ''}
				.state.placeholder=${this.state.placeholder || this.state.label || ''}
				.state.size=${this.state.size || 'md'}
				.state.debounce=${0}
				@search-input:input=${this.handleValue}></ui-search-input>
		`;
	}
	renderSelect() {
		return this.htmlElement`
			<ui-select
				.state.items=${this.state.options}
				.state.value=${this.state.value || ''}
				.state.size=${this.state.size || 'md'}
				.state.allLabel=${this.state.allLabel}
				@select:change=${this.handleValue}></ui-select>
		`;
	}
	renderCombobox() {
		return this.htmlElement`
			<ui-combobox
				.state.items=${this.state.options}
				.state.value=${this.state.value || ''}
				.state.placeholder=${this.state.placeholder || this.state.label || ''}
				@combobox:change=${this.handleValue}></ui-combobox>
		`;
	}
	renderToggle() {
		return this.htmlElement`
			<ui-toggle-group
				.state.items=${this.state.options}
				.state.multiple=${this.state.multiple === true}
				.state.values=${this.toggleValues()}
				.state.value=${this.toggleValue()}
				.state.size=${this.state.size || 'md'}
				.state.selectAll=${this.state.selectAll === true}
				.state.clearable=${this.state.clearable === true}
				.state.overflow=${this.state.overflow || 'auto'}
				@toggle-group:change=${this.handleValue}></ui-toggle-group>
		`;
	}
	/* Multi mode drives `values[]`; single mode drives `value`. Each returns the
	   empty shape for the other so a mode flip cannot carry stale selection. */
	toggleValues() {
		if (this.state.multiple !== true) {
			return EMPTY_VALUES;
		}
		return isArray(this.state.value) ? this.state.value : EMPTY_VALUES;
	}
	toggleValue() {
		if (this.state.multiple === true) {
			return '';
		}
		return this.state.value || '';
	}
	multiSelectValues() {
		return isArray(this.state.value) ? this.state.value : EMPTY_VALUES;
	}
	renderMultiSelect() {
		return this.htmlElement`
			<ui-multi-select
				.state.items=${this.state.options}
				.state.values=${this.multiSelectValues()}
				.state.filterable=${this.state.filterable !== false}
				.state.placeholder=${this.state.placeholder || this.state.label || ''}
				.state.disabled=${isTrue(this.state.disabled)}
				@multi-select:change=${this.handleValue}></ui-multi-select>
		`;
	}
	renderDateRange() {
		return this.htmlElement`
			<div class="fbi-range flex items-center gap-2">
				<ui-date-input
					.state.value=${this.rangeFrom}
					.state.size=${this.state.size || 'md'}
					@date-input:change=${this.handleFrom}></ui-date-input>
				<ui-date-input
					.state.value=${this.rangeTo}
					.state.size=${this.state.size || 'md'}
					@date-input:change=${this.handleTo}></ui-date-input>
			</div>
		`;
	}
	render() {
		this.html`
			<div class="fbi" data-kind=${this.state.type}>
				${this.renderControl}
			</div>
		`;
	}
}
customElements.define('ui-filter-bar-item', UIFilterBarItem);
