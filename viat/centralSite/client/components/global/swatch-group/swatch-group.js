/*
	DESCRIPTION: ui-swatch-group — exclusive colour picker. Circular fills,
	not labelled segments — that is why this is not ui-toggle-group.
	Binds `items` via list(); each <ui-swatch> owns its render from
	{value, label?, color, disabled?, active?}. The parent stamps `item.active`
	at event/observe time. Single-select; `value` is the selected id.
	Emits swatch-group:change { value }.
	── USAGE ──────────────────────────────────────────────────
	  <ui-swatch-group .state.items=${[
	    { value: 'oxblood', label: 'Oxblood', color: 'oklch(0.42 0.12 25)' },
	    { value: 'sand', label: 'Sand', color: 'oklch(0.78 0.04 85)' },
	  ]} .state.value=${'oxblood'} @swatch-group:change=${this.onColor}></ui-swatch-group>
*/
import { WebComponent } from 'webcomponent';
import { UISwatch } from '../swatch/swatch.js';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
export class UISwatchGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		swatchGroup: './swatch-group.css',
	};
	static state = {
		items: [],
		value: '',
		size: 'md',
	};
	onConnect() {
		this.observe([
			'value',
			'items',
		], this.syncActive);
		this.syncActive();
	}
	isActive(value) {
		return this.state.value === value;
	}
	syncActive() {
		const items = this.state.items;
		if (!Array.isArray(items)) {
			return;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const active = this.isActive(item?.value);
			if (item && item.active !== active) {
				item.active = active;
			}
		}
	}
	handleSelect(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value === undefined) {
			return;
		}
		if (this.state.value === value) {
			return;
		}
		this.state.value = value;
		this.emit('swatch-group:change', {
			value,
		});
	}
	swatchKey(item) {
		return item.value;
	}
	render() {
		this.html`
			<div
				class="swatch-group"
				data-size=${SIZES.has(this.state.size) ? this.state.size : 'md'}
				role="group"
				@swatch:select=${this.handleSelect}>
				${this.list('items', UISwatch, this.swatchKey)}
			</div>
		`;
	}
}
customElements.define('ui-swatch-group', UISwatchGroup);
