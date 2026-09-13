/*
	DESCRIPTION: ui-combobox — searchable single-select (Combobox).
	items: [{ value, label, disabled? }]. Emits combobox:change { value, item }.
	Closes on option select, Escape, outside pointerdown, and when items is
	emptied. A filter miss keeps the list open so emptyMessage can show.
*/
import '../icon/icon.js';
import {
	isArray, isEmpty, isString, noValue, WebComponent,
} from 'webcomponent';
import { hideOverlay, positionOverlayWhenReady } from '../../core/dom/anchor.js';
import { SurfaceController } from '../../core/dom/surfaceController.js';
import { isTopEscapable } from '../../core/escape/escapeStack.js';
import { UIComboboxOption } from '../combobox-option/combobox-option.js';
export class UICombobox extends WebComponent {
	static url = import.meta.url;
	static styles = {
		combobox: './combobox.css',
	};
	static state = {
		items: [],
		value: '',
		query: '',
		open: false,
		disabled: false,
		placeholder: 'Search…',
		emptyMessage: 'No results.',
		filtered: [],
	};
	onConnect() {
		this.syncFiltered();
		this.observe(['items', 'query'], this.syncFiltered);
		// aria-selected only — no need to re-filter when just the value moves.
		this.observe('value', this.syncSelectedFlags);
		this.observe('items', this.closeWhenItemsEmpty);
		this.observe('value', this.syncQueryFromValue);
		this.observe('open', this.syncOpen);
	}
	onRendered() {
		this.syncOpen(this.state.open);
	}
	onDisconnect() {
		this.surfaceCtl?.detach();
	}
	ensureSurfaceCtl() {
		this.surfaceCtl ??= new SurfaceController(this, {
			surface: () => {
				return this.refs.surface;
			},
			closeMethod: 'closeList',
			keepOpen: () => {
				return this.refs.surface;
			},
			listenEscape: false,
			outside: true,
		});
		return this.surfaceCtl;
	}
	positionPanel() {
		positionOverlayWhenReady(this.refs.surface, this.refs.trigger, {
			placement: 'bottom-start',
			offset: 6,
			matchWidth: true,
		});
	}
	handleToggle(domEvent) {
		const isOpen = domEvent.newState === 'open';
		if (this.state.open !== isOpen) {
			this.state.open = isOpen;
		}
		if (isOpen) {
			this.positionPanel();
		}
	}
	syncQueryFromValue() {
		const value = this.state.value;
		if (!value) {
			return;
		}
		const items = this.state.items;
		const count = items.length;
		for (let index = 0; index < count; index++) {
			const item = items[index];
			if (item && item.value === value) {
				const label = item.label || String(item.value);
				if (this.state.query !== label) {
					this.state.query = label;
				}
				return;
			}
		}
	}
	syncFiltered() {
		const query = String(this.state.query || '').trim().toLowerCase();
		const items = this.state.items;
		const next = [];
		/*
		 * `closeWhenItemsEmpty` observes this same key and already treats a null
		 * item list as an expected input (its `noValue` guard), so this has to
		 * tolerate one too. It is registered FIRST, so without this an app that
		 * clears `items` threw here before the close handler ever ran — taking the
		 * render down instead of emptying the list.
		 */
		if (!isArray(items)) {
			this.state.filtered = next;
			return;
		}
		const count = items.length;
		for (let index = 0; index < count; index++) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const row = isString(item) ? {
				value: item,
				label: item,
			} : item;
			if (!query) {
				next.push(row);
				continue;
			}
			const label = String(row.label || row.value || '').toLowerCase();
			const value = String(row.value || '').toLowerCase();
			if (label.includes(query) || value.includes(query)) {
				next.push(row);
			}
		}
		this.state.filtered = next;
		this.syncSelectedFlags();
	}
	/*
	 * `role="option"` REQUIRES aria-selected, and an option row cannot know the
	 * combobox's value on its own, so the flag is stamped from here.
	 *
	 * It stamps through `this.state.filtered` — the BOUND key — rather than
	 * onto the source items. That is the ui-listbox pattern and it is what makes
	 * the write repaint: a deep write reaches the list spot only on the path the
	 * list is actually bound to. Stamping the same objects via `state.items`
	 * mutates the data and notifies `items.N.selected`, which this list never
	 * listens to, so the flip is invisible.
	 */
	syncSelectedFlags() {
		const rows = this.state.filtered;
		if (!isArray(rows)) {
			return;
		}
		const selectedValue = this.state.value;
		// Guarded so the empty default value cannot mark an empty-valued row.
		const hasSelection = selectedValue !== '' && selectedValue != null;
		const count = rows.length;
		for (let index = 0; index < count; index += 1) {
			const row = rows[index];
			if (!row) {
				continue;
			}
			const isSelected = hasSelection && row.value === selectedValue;
			if (row.selected !== isSelected) {
				row.selected = isSelected;
			}
		}
	}
	closeWhenItemsEmpty() {
		if (this.state.open && (noValue(this.state.items) || isEmpty(this.state.items))) {
			this.closeList();
		}
	}
	openList() {
		if (this.state.disabled) {
			return;
		}
		hideOverlay(this.refs.surface);
		this.showSurfacePopover(this.refs.surface);
	}
	closeList() {
		if (this.state.open) {
			this.state.open = false;
		}
		this.hideSurfacePopover(this.refs.surface);
	}
	syncOpen(isOpen) {
		const ctl = this.ensureSurfaceCtl();
		if (isOpen) {
			hideOverlay(this.refs.surface);
			ctl.show();
			ctl.attach();
		} else {
			ctl.hide();
			ctl.detach();
		}
	}
	handleInput(domEvent) {
		domEvent.stopPropagation();
		this.state.query = domEvent.target.value;
		this.openList();
		this.emit('combobox:input', {
			value: this.state.query,
		});
	}
	handleFocus() {
		this.openList();
	}
	handleOptionSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data || data.disabled) {
			return;
		}
		this.state.value = data.value;
		this.state.query = data.label || String(data.value);
		this.closeList();
		this.emit('combobox:change', {
			value: data.value,
			item: data,
		});
	}
	handleKeydown(domEvent) {
		if (domEvent.key === 'Escape' && this.state.open) {
			// Only the most recent open layer answers Escape.
			if (!isTopEscapable(this)) {
				return;
			}
			domEvent.preventDefault();
			this.closeList();
			return;
		}
		if (domEvent.key === 'ArrowDown' && !this.state.open) {
			domEvent.preventDefault();
			this.openList();
		}
	}
	optionKey(item) {
		return item.value;
	}
	render() {
		this.html`
			<div class="combobox" ?data-open=${this.state.open} ?data-disabled=${this.state.disabled}
				@combobox-option:select=${this.handleOptionSelect}>
				<div class="combobox-control" data-hover=${'hairline'} #trigger>
					<input class="combobox-input" type="text"
						placeholder=${this.state.placeholder}
						?disabled=${this.state.disabled}
						$value="query"
						@input=${this.handleInput}
						@focus=${this.handleFocus}
						@keydown=${this.handleKeydown}
						aria-expanded=${this.state.open ? 'true' : 'false'}
						aria-autocomplete="list"
						role="combobox">
					<ui-icon class="combobox-icon" .state.name=${'chevrons-up-down'} .state.size=${'sm'}></ui-icon>
				</div>
				<div class="combobox-list glass" #surface popover="manual" role="listbox" @toggle=${this.handleToggle}>
					${this.list('filtered', UIComboboxOption, this.optionKey)}
					<div class="combobox-empty" ?hidden=${this.state.filtered.length > 0}>${this.state.emptyMessage}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-combobox', UICombobox);
