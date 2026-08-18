/*
	DESCRIPTION: ui-combobox — searchable single-select (Combobox).
	items: [{ value, label, disabled? }]. Emits combobox:change { value, item }.
	Closes on option select, Escape, outside pointerdown, and when items is
	emptied. A filter miss keeps the list open so emptyMessage can show.
*/
import '../icon/icon.js';
import { isEmpty } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { positionOverlay } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
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
	outsideArmed = false;
	onConnect() {
		this.syncFiltered();
		this.observe(['items', 'query'], this.syncFiltered);
		this.observe('items', this.closeWhenItemsEmpty);
		this.observe('value', this.syncQueryFromValue);
		this.observe('open', this.syncOpen);
	}
	onRendered() {
		this.syncPopoverFromState(this.state.open);
	}
	onDisconnect() {
		this.scrollHide?.detach();
		this.disarmOutside();
	}
	ensureScrollHide() {
		this.scrollHide ??= new HideOnScroll(this, 'closeFromScroll', {
			keepOpen: () => {
				return this.refs.surface;
			},
		});
		return this.scrollHide;
	}
	closeFromScroll() {
		this.closeList();
	}
	positionPanel() {
		positionOverlay(this.refs.surface, this.refs.trigger, {
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
			this.ensureScrollHide().attach();
			return;
		}
		this.scrollHide?.detach();
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
		const count = items.length;
		for (let index = 0; index < count; index++) {
			const item = items[index];
			if (!item) {
				continue;
			}
			if (!query) {
				next.push(item);
				continue;
			}
			const label = String(item.label || item.value || '').toLowerCase();
			const value = String(item.value || '').toLowerCase();
			if (label.includes(query) || value.includes(query)) {
				next.push(item);
			}
		}
		this.state.filtered = next;
	}
	closeWhenItemsEmpty() {
		if (this.state.open && isEmpty(this.state.items)) {
			this.closeList();
		}
	}
	openList() {
		if (this.state.disabled) {
			return;
		}
		this.refs.surface?.showPopover?.();
	}
	closeList() {
		this.refs.surface?.hidePopover?.();
	}
	/**
	 * Arm document capture listener after open settles so the same click that
	 * opened the list does not immediately close it.
	 * Timer callback is (component) — UWC setTimeout first-arg shape.
	 */
	syncOpen(isOpen) {
		this.syncPopoverFromState(isOpen);
		this.syncOutsideListener(isOpen);
	}
	syncPopoverFromState(isOpen) {
		const surface = this.refs.surface;
		if (!surface || typeof surface.showPopover !== 'function') {
			return;
		}
		const showing = surface.matches(':popover-open');
		if (isOpen && !showing) {
			surface.showPopover();
			return;
		}
		if (!isOpen && showing) {
			surface.hidePopover();
		}
	}
	syncOutsideListener(isOpen) {
		if (isOpen) {
			this.setTimeout(UICombobox.armOutsideTimer, 0);
			return;
		}
		this.disarmOutside();
	}
	static armOutsideTimer(component) {
		component.armOutside();
	}
	armOutside() {
		if (this.outsideArmed || !this.state.open) {
			return;
		}
		this.outsideArmed = true;
		globalThis.document?.addEventListener('pointerdown', this, true);
	}
	disarmOutside() {
		if (!this.outsideArmed) {
			return;
		}
		this.outsideArmed = false;
		globalThis.document?.removeEventListener('pointerdown', this, true);
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'pointerdown') {
			this.handleOutsidePointer(domEvent);
		}
	}
	handleOutsidePointer(domEvent) {
		if (!this.state.open) {
			return;
		}
		const path = domEvent.composedPath();
		const pathCount = path.length;
		for (let index = 0; index < pathCount; index++) {
			if (path[index] === this) {
				return;
			}
		}
		this.closeList();
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
			<div class="cb" ?data-open=${this.state.open} ?data-disabled=${this.state.disabled}
				@combobox-option:select=${this.handleOptionSelect}>
				<div class="cb-control" #trigger>
					<input class="cb-input" type="text"
						placeholder=${this.state.placeholder}
						?disabled=${this.state.disabled}
						$value="query"
						@input=${this.handleInput}
						@focus=${this.handleFocus}
						@keydown=${this.handleKeydown}
						aria-expanded=${this.state.open ? 'true' : 'false'}
						aria-autocomplete="list"
						role="combobox">
					<ui-icon class="cb-icon" .state.name=${'chevrons-up-down'} .state.size=${'sm'}></ui-icon>
				</div>
				<div class="cb-list" #surface popover="manual" role="listbox" @toggle=${this.handleToggle}>
					${this.list('filtered', UIComboboxOption, this.optionKey)}
					<div class="cb-empty" ?hidden=${this.state.filtered.length > 0}>${this.state.emptyMessage}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-combobox', UICombobox);
