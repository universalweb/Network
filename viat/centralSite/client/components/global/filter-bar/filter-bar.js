/*
	DESCRIPTION: ui-filter-bar — composition shell that turns descriptor
	filters into a composite criteria object for ui-collection.filterArg.
	Layout + composite state only. Each descriptor mounts a shipped control.
	Selection chrome lives ON the control (a toggle-group paints its own pressed
	options and optional All/clear rails; multi-select owns chip-clear).
	Layout is one wrapping .fb-row. collapsible hides extras behind More.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-filter-bar
	    .state.filters=${[{ key: 'q', type: 'search', label: 'Search' },
	      { key: 'status', type: 'select', label: 'Status',
	        options: [{ value: 'open', label: 'Open' }] }]}
	    @filter-bar:change=${this.handleFilters}></ui-filter-bar>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import '../button/button.js';
import { isArray, isPlainObject, WebComponent } from 'webcomponent';
import { UIFilterBarItem } from '../filter-bar-item/filter-bar-item.js';
export class UIFilterBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		filterBar: './filter-bar.css',
	};
	static state = {
		filters: [],
		value: {},
		collapsible: false,
		size: 'md',
	};
	onConnect() {
		const seed = this.state.value;
		this.liveValue = isPlainObject(seed) ? {
			...seed,
		} : {};
		this.on('filter-bar-item:change', this.handleItemChange);
		this.observe([
			'filters',
			'size',
			'collapsible',
		], this.syncFilterFlags);
		this.syncFilterFlags();
	}
	syncHostFlags() {
		this.toggleAttribute('data-collapsible', this.state.collapsible === true);
	}
	syncFilterFlags() {
		this.syncHostFlags();
		const series = this.state.filters;
		if (!isArray(series)) {
			return;
		}
		const size = this.state.size || 'md';
		const count = series.length;
		for (let index = 0; index < count; index += 1) {
			const item = series[index];
			if (!item || !isPlainObject(item)) {
				continue;
			}
			const extra = index > 0;
			if (item.extra !== extra) {
				item.extra = extra;
			}
			if (item.size !== size) {
				item.size = size;
			}
			const current = this.liveValue[item.key];
			if (current === undefined) {
				continue;
			}
			if (item.value !== current) {
				item.value = current;
			}
		}
	}
	emitValue() {
		this.emit('filter-bar:change', {
			value: {
				...this.liveValue,
			},
		});
	}
	writeKey(key, value) {
		this.liveValue = {
			...this.liveValue,
			[key]: value,
		};
		this.syncFilterFlags();
		this.emitValue();
	}
	handleItemChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data || !data.key) {
			return;
		}
		this.writeKey(data.key, data.value);
	}
	handleMore() {
		this.toggleAttribute('data-more', !this.hasAttribute('data-more'));
	}
	hideMore() {
		return this.state.collapsible !== true;
	}
	filterKey(item) {
		return item.key;
	}
	render() {
		this.html`
			<div class="fb-row">
				${this.list('filters', UIFilterBarItem, this.filterKey)}
				<div class="fb-more" ?hidden=${this.hideMore}>
					<ui-button
						.state.label=${'More'}
						.state.variant=${'ghost'}
						.state.size=${'sm'}
						@button:click=${this.handleMore}></ui-button>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-filter-bar', UIFilterBar);
