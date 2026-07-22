/*
	DESCRIPTION: ui-toggle-group — a segmented single/multi selector (1H · 24H · 7D …).
	Binds `items` straight off state via `list()` — items pass through as-is; each
	<ui-toggle-option> owns its render from its own fields + defaults. The parent owns
	selection only: it stamps `item.active` at EVENT/observe time (never a per-render
	loop) and the deep flag write flows to the child through the list binding. Sizing
	is group config → CSS custom properties on the container (no per-item copies).
	Single mode tracks `value`; multi mode tracks `values[]`. Emits `toggle-group:change`.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-toggle-group .state.items=${[
	    { value: '1h', label: '1H' }, { value: '24h', label: '24H' }, { value: '7d', label: '7D' },
	  ]} .state.value=${'24h'}></ui-toggle-group>
	  A parent listens with a template event, never addEventListener:
	  <ui-toggle-group … @toggle-group:change=${this.handleRange}></ui-toggle-group>   // e.detail.data.value
	  Multi: .state.multiple=${true} .state.values=${['a','c']} → detail.data.values is the active set.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import { UIToggleOption } from './toggle-option.js';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
export class UIToggleGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toggleGroup: './toggle-group.css',
	};
	static state = {
		items: [],
		value: '',
		values: [],
		multiple: false,
		size: 'md',
	};
	isActive(value) {
		if (this.state.multiple === true) {
			return Array.isArray(this.state.values) && this.state.values.indexOf(value) !== -1;
		}
		return this.state.value === value;
	}
	onConnect() {
		/*
		 * Selection is parent-owned but lives ON the bound items as a deep flag —
		 * stamped here whenever the selection inputs change (event-time, not a
		 * per-render map). Deep `item.active` writes notify the list binding,
		 * which routes them into the existing children via assignState.
		 */
		this.observe([
			'value',
			'values',
			'items',
			'multiple',
		], this.syncActive);
		this.syncActive();
	}
	syncActive() {
		const items = this.state.items;
		if (!Array.isArray(items)) {
			return;
		}
		for (let index = 0; index < items.length; index += 1) {
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
		if (this.state.multiple === true) {
			const next = new Set(Array.isArray(this.state.values) ? this.state.values : []);
			if (next.has(value)) {
				next.delete(value);
			} else {
				next.add(value);
			}
			this.state.values = Array.from(next);
		} else {
			this.state.value = value;
		}
		this.emit('toggle-group:change', {
			value: this.state.multiple === true ? value : this.state.value,
			values: this.state.multiple === true ? this.state.values : [this.state.value],
		});
	}
	render() {
		this.html`
			<div
				class="tg"
				data-size=${SIZES.has(this.state.size) ? this.state.size : 'md'}
				role="group" @toggle-group:select=${this.handleSelect}>
				${this.list('items', UIToggleOption, this.optionKey)}
			</div>
		`;
	}
	optionKey(item) {
		return item.value;
	}
}
customElements.define('ui-toggle-group', UIToggleGroup);
