/*
	DESCRIPTION: ui-listbox — inline list selection.
	Items {id,label,value,disabled?} via list('items') — filter hides rows
	(?hidden) so active stamps on items still hit the list deep-write path.
	Rows are this.partial (flat — no child CE). Single mode tracks `value`;
	multi tracks `values[]`. Optional Select all (multi only, off by default)
	toggles the VISIBLE selectable set — first click writes those values,
	second click (already all-visible-selected) writes []. Disabled and
	filtered-out rows are skipped. Emits listbox:change {value,values,item,items}.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-listbox .state.items=${[{id:'a',label:'Alpha',value:'a'}]}
	    .state.value=${'a'} @listbox:change=${this.onPick}></ui-listbox>
	  Multi: .state.multiple=${true} .state.values=${['a','c']}
	─────────────────────────────────────────────────────────────────────
*/
import {
	hasValue,
	isArray,
	isString,
	WebComponent,
} from 'webcomponent';
/**
 * Selection key for a standard item.
 * @param {object} item - Component-standard item.
 * @returns {*} value, else id, else empty string.
 */
export function listboxItemValue(item) {
	if (!item) {
		return '';
	}
	if (hasValue(item.value)) {
		return item.value;
	}
	if (hasValue(item.id)) {
		return item.id;
	}
	return '';
}
/**
 * Visible label for a standard item.
 * @param {object} item - Component-standard item.
 * @returns {string} label, else stringified value.
 */
export function listboxItemLabel(item) {
	if (!item) {
		return '';
	}
	if (isString(item.label) && item.label) {
		return item.label;
	}
	return String(listboxItemValue(item));
}
/**
 * Key for list()/filter() rows.
 * @param {object} item - Component-standard item.
 * @returns {string|number} id, else value.
 */
export function listboxItemKey(item) {
	return item?.id ?? listboxItemValue(item);
}
export class UIListbox extends WebComponent {
	static url = import.meta.url;
	static styles = {
		listbox: './listbox.css',
	};
	static state = {
		items: [],
		value: '',
		values: [],
		multiple: false,
		disabled: false,
		filterable: false,
		query: '',
		emptyMessage: 'No results.',
		filtered: [],
		showSelectAll: false,
	};
	// Keyboard cursor — not reactive (must not tear the list on arrow).
	focusIndex = -1;
	onConnect() {
		this.syncFiltered();
		this.observe([
			'items',
			'query',
		], this.syncFiltered);
		this.observe([
			'value',
			'values',
			'items',
			'multiple',
		], this.syncActive);
		this.observe('query', this.clampFocus);
		this.syncActive();
	}
	isSelected(itemValue) {
		if (this.state.multiple === true) {
			const values = this.state.values;
			return isArray(values) && values.indexOf(itemValue) !== -1;
		}
		return this.state.value === itemValue;
	}
	/**
	 * Stamp membership + focus paint on the bound `items` key (§6):
	 * - `selected` = in the value set (multi checkmark / single chosen)
	 * - `active` = keyboard focus face only (not multi membership)
	 */
	syncActive() {
		const items = this.state.items;
		if (!isArray(items)) {
			return;
		}
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const member = this.isSelected(listboxItemValue(item));
			if (item.selected !== member) {
				item.selected = member;
			}
			// Single-select: the chosen row also carries active highlight.
			// Multi: active is reserved for keyboard focus (syncFocused).
			if (this.state.multiple !== true) {
				if (item.active !== member) {
					item.active = member;
				}
			}
		}
	}
	keepItem(item) {
		if (!item) {
			return false;
		}
		const query = String(this.state.query || '').trim().toLowerCase();
		if (!query) {
			return true;
		}
		const label = listboxItemLabel(item).toLowerCase();
		const value = String(listboxItemValue(item)).toLowerCase();
		return label.includes(query) || value.includes(query);
	}
	syncFiltered() {
		const items = isArray(this.state.items) ? this.state.items : [];
		const next = [];
		const itemCount = items.length;
		// Stamp `visible` on items so list('items') deep-write repaints ?hidden
		// when query changes (host keepItem is not a bound-path dependency).
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const visible = this.keepItem(item);
			if (item.visible !== visible) {
				item.visible = visible;
			}
			if (visible) {
				next.push(item);
			}
		}
		this.state.filtered = next;
	}
	visibleIndexes() {
		const items = isArray(this.state.items) ? this.state.items : [];
		const indexes = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (item && !item.disabled && item.visible !== false) {
				indexes.push(index);
			}
		}
		return indexes;
	}
	clampFocus() {
		const indexes = this.visibleIndexes();
		if (!indexes.length) {
			this.focusIndex = -1;
			this.syncFocused();
			return;
		}
		if (indexes.indexOf(this.focusIndex) === -1) {
			this.focusIndex = indexes[0];
			this.syncFocused();
		}
	}
	syncFocused() {
		const items = this.state.items;
		if (!isArray(items)) {
			return;
		}
		const itemCount = items.length;
		const multi = this.state.multiple === true;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const focused = index === this.focusIndex;
			// Multi: keyboard face uses `active`. Single: active already = selected.
			if (multi === true && item.active !== focused) {
				item.active = focused;
			}
			if (item.focused !== focused) {
				item.focused = focused;
			}
		}
	}
	selectedValues() {
		if (this.state.multiple === true) {
			return isArray(this.state.values) ? this.state.values.slice() : [];
		}
		return this.state.value === '' ? [] : [this.state.value];
	}
	hideSelectAll() {
		return this.state.multiple !== true || this.state.showSelectAll !== true;
	}
	visibleSelectableValues() {
		const items = isArray(this.state.items) ? this.state.items : [];
		const next = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item || item.disabled || item.visible === false) {
				continue;
			}
			next.push(listboxItemValue(item));
		}
		return next;
	}
	allVisibleSelected() {
		const visible = this.visibleSelectableValues();
		if (visible.length === 0) {
			return false;
		}
		const chosen = new Set(this.selectedValues());
		const count = visible.length;
		for (let index = 0; index < count; index += 1) {
			if (!chosen.has(visible[index])) {
				return false;
			}
		}
		return true;
	}
	allVisiblePressed() {
		return this.allVisibleSelected() ? 'true' : 'false';
	}
	handleSelectAll() {
		if (this.state.disabled || this.hideSelectAll()) {
			return;
		}
		const visible = this.visibleSelectableValues();
		if (visible.length === 0) {
			return;
		}
		if (this.allVisibleSelected()) {
			this.state.values = [];
		} else {
			this.state.values = visible;
		}
		this.emit('listbox:change', {
			value: null,
			values: this.selectedValues(),
			item: null,
			items: this.selectedItems(),
		});
	}
	selectedItems() {
		const chosen = new Set(this.selectedValues());
		const items = isArray(this.state.items) ? this.state.items : [];
		const out = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (item && chosen.has(listboxItemValue(item))) {
				out.push(item);
			}
		}
		return out;
	}
	applySelection(item) {
		if (this.state.disabled || !item || item.disabled) {
			return;
		}
		const itemValue = listboxItemValue(item);
		if (this.state.multiple === true) {
			const next = new Set(isArray(this.state.values) ? this.state.values : []);
			if (next.has(itemValue)) {
				next.delete(itemValue);
			} else {
				next.add(itemValue);
			}
			this.state.values = Array.from(next);
		} else if (this.state.value === itemValue) {
			/* Single-select: a second click on the chosen row clears. */
			this.state.value = '';
		} else {
			this.state.value = itemValue;
		}
		this.emit('listbox:change', {
			value: this.state.multiple === true ? itemValue : this.state.value,
			values: this.selectedValues(),
			item,
			items: this.selectedItems(),
		});
	}
	handleItemClick(_domEvent, item) {
		this.focusIndex = isArray(this.state.items) ? this.state.items.indexOf(item) : -1;
		this.syncFocused();
		this.applySelection(item);
	}
	moveFocus(delta) {
		const indexes = this.visibleIndexes();
		if (!indexes.length) {
			return;
		}
		const position = indexes.indexOf(this.focusIndex);
		let next;
		if (position === -1) {
			next = delta > 0 ? indexes[0] : indexes[indexes.length - 1];
		} else {
			next = indexes[(position + delta + indexes.length) % indexes.length];
		}
		this.focusIndex = next;
		this.syncFocused();
	}
	handleKey(domEvent) {
		if (this.state.disabled) {
			return;
		}
		switch (domEvent.key) {
			case 'ArrowDown': {
				domEvent.preventDefault();
				this.moveFocus(1);
				break;
			}
			case 'ArrowUp': {
				domEvent.preventDefault();
				this.moveFocus(-1);
				break;
			}
			case 'Home': {
				domEvent.preventDefault();
				const indexes = this.visibleIndexes();
				if (indexes.length) {
					this.focusIndex = indexes[0];
					this.syncFocused();
				}
				break;
			}
			case 'End': {
				domEvent.preventDefault();
				const indexes = this.visibleIndexes();
				if (indexes.length) {
					this.focusIndex = indexes[indexes.length - 1];
					this.syncFocused();
				}
				break;
			}
			case 'Enter':
			case ' ': {
				domEvent.preventDefault();
				const item = isArray(this.state.items) ? this.state.items[this.focusIndex] : null;
				this.applySelection(item);
				break;
			}
			default: {
				break;
			}
		}
	}
	stopNative(domEvent) {
		domEvent.stopPropagation();
	}
	itemRow(item) {
		// Bind list('items'): membership + filter visibility stamp items.* —
		// list deep-write repaint only tracks the bound key path.
		return this.partial`
			<button type="button" class="listbox-item" role="option"
				?hidden=${item?.visible === false}
				?disabled=${item?.disabled}
				?data-selected=${item?.selected === true}
				?data-active=${item?.active}
				?data-focused=${item?.focused}
				aria-selected=${item?.selected === true ? 'true' : 'false'}
				@click=${this.handleItemClick}>
				<span class="listbox-check">${item?.selected === true ? '✓' : ''}</span>
				<span class="listbox-label">${listboxItemLabel(item)}</span>
			</button>`;
	}
	hasVisible() {
		return this.state.filtered.length > 0;
	}
	render() {
		this.html`
			<div class="listbox"
				?data-disabled=${this.state.disabled}
				?data-multiple=${this.state.multiple}
				?data-filterable=${this.state.filterable}>
				<input class="listbox-filter" type="search"
					?hidden=${this.state.filterable !== true}
					?disabled=${this.state.disabled}
					placeholder="Filter…"
					$value="query"
					@input=${this.stopNative}>
				<button
					class="listbox-select-all"
					type="button"
					?hidden=${this.hideSelectAll}
					aria-pressed=${this.allVisiblePressed}
					@click=${this.handleSelectAll}>Select all</button>
				<div class="listbox-list" role="listbox"
					tabindex=${this.state.disabled ? '-1' : '0'}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					aria-multiselectable=${this.state.multiple ? 'true' : 'false'}
					@keydown=${this.handleKey}>
					${this.list('items', this.itemRow, listboxItemKey)}
					<div class="listbox-empty" ?hidden=${this.hasVisible}>${this.state.emptyMessage}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-listbox', UIListbox);
