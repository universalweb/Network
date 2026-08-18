/*
	DESCRIPTION: ui-multi-select — chip-trigger multi picker (PrimeVue MultiSelect).
	Composes ui-listbox (multiple + optional filter) and ui-chip for the value
	display. `values` is a seed (uncontrolled after connect) to avoid a
	controlled-array wasted-set echo. Emits multi-select:change {values,items}.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-multi-select .state.items=${[{id:'a',label:'Alpha',value:'a'}]}
	    .state.values=${['a']} .state.filterable=${true}
	    @multi-select:change=${this.onPick}></ui-multi-select>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { isArray } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { positionOverlay } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import { UIChip } from '../chip/chip.js';
import { listboxItemKey, listboxItemLabel, listboxItemValue } from '../listbox/listbox.js';
export class UIMultiSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		multiSelect: './multi-select.css',
	};
	static state = {
		items: [],
		values: [],
		chipItems: [],
		open: false,
		filterable: false,
		placeholder: 'Select…',
		disabled: false,
		emptyMessage: 'No results.',
		panel: {
			items: [],
			values: [],
			multiple: true,
			filterable: false,
			disabled: false,
			emptyMessage: 'No results.',
		},
		chevronIcon: {
			name: 'chevrons-up-down',
			size: 'sm',
		},
	};
	liveValues = [];
	outsideArmed = false;
	onConnect() {
		const seed = isArray(this.state.values) ? this.state.values : [];
		this.liveValues = seed.slice();
		this.syncPanelMeta();
		this.state.panel.items = isArray(this.state.items) ? this.state.items : [];
		this.state.panel.values = this.liveValues.slice();
		this.rebuildChips();
		this.observe([
			'items',
			'filterable',
			'disabled',
			'emptyMessage',
		], this.syncPanelFromHost);
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
	syncPanelMeta() {
		const panel = this.state.panel;
		panel.multiple = true;
		panel.filterable = this.state.filterable === true;
		panel.disabled = this.state.disabled === true;
		panel.emptyMessage = this.state.emptyMessage;
	}
	syncPanelFromHost() {
		this.syncPanelMeta();
		const items = isArray(this.state.items) ? this.state.items : [];
		if (this.state.panel.items !== items) {
			this.state.panel.items = items;
		}
		this.rebuildChips();
	}
	rebuildChips() {
		const chosen = new Set(this.liveValues);
		const items = isArray(this.state.items) ? this.state.items : [];
		const chips = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const value = listboxItemValue(item);
			if (!chosen.has(value)) {
				continue;
			}
			chips.push({
				label: listboxItemLabel(item),
				value,
				removable: this.state.disabled !== true,
				disabled: this.state.disabled === true,
				size: 'sm',
			});
		}
		this.state.chipItems = chips;
	}
	selectedItems() {
		const chosen = new Set(this.liveValues);
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
	emitChange(items) {
		this.emit('multi-select:change', {
			values: this.liveValues.slice(),
			items: items || this.selectedItems(),
		});
	}
	commitValues(values, items) {
		this.liveValues = isArray(values) ? values.slice() : [];
		this.state.panel.values = this.liveValues.slice();
		this.rebuildChips();
		this.emitChange(items);
	}
	handleListboxChange(domEvent) {
		const data = domEvent.detail?.data;
		this.commitValues(data?.values, data?.items);
	}
	handleChipRemove(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value === undefined) {
			return;
		}
		const next = [];
		const current = this.liveValues;
		const count = current.length;
		for (let index = 0; index < count; index += 1) {
			if (current[index] !== value) {
				next.push(current[index]);
			}
		}
		this.commitValues(next);
	}
	toggleOpen() {
		if (this.state.disabled) {
			return;
		}
		const surface = this.refs.surface;
		if (surface?.matches(':popover-open')) {
			surface.hidePopover();
			return;
		}
		surface?.showPopover?.();
	}
	closeList() {
		this.refs.surface?.hidePopover?.();
	}
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
			this.setTimeout(UIMultiSelect.armOutsideTimer, 0);
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
		for (let index = 0; index < pathCount; index += 1) {
			if (path[index] === this) {
				return;
			}
		}
		this.closeList();
	}
	handleKeydown(domEvent) {
		if (domEvent.key === 'Escape' && this.state.open) {
			domEvent.preventDefault();
			this.closeList();
			return;
		}
		if ((domEvent.key === 'Enter' || domEvent.key === ' ') && !this.state.disabled) {
			const path = domEvent.composedPath();
			const pathCount = path.length;
			for (let index = 0; index < pathCount; index += 1) {
				if (path[index]?.classList?.contains('ms-trigger')) {
					domEvent.preventDefault();
					this.toggleOpen();
					return;
				}
			}
		}
		if (domEvent.key === 'ArrowDown' && !this.state.open) {
			domEvent.preventDefault();
			this.toggleOpen();
		}
	}
	hasChips() {
		return this.state.chipItems.length > 0;
	}
	render() {
		this.html`
			<div class="ms"
				?data-open=${this.state.open}
				?data-disabled=${this.state.disabled}
				@listbox:change=${this.handleListboxChange}
				@chip:remove=${this.handleChipRemove}
				@keydown=${this.handleKeydown}>
				<div class="ms-trigger" #trigger role="combobox"
					tabindex=${this.state.disabled ? '-1' : '0'}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					aria-haspopup="listbox"
					aria-expanded=${this.state.open ? 'true' : 'false'}
					@click=${this.toggleOpen}>
					<span class="ms-chips">
						${this.list('chipItems', UIChip, listboxItemKey)}
						<span class="ms-placeholder" ?hidden=${this.hasChips}>${this.state.placeholder}</span>
					</span>
					<span class="ms-icon" aria-hidden="true">
						<ui-icon .state=${this.state.chevronIcon}></ui-icon>
					</span>
				</div>
				<div class="ms-panel" #surface popover="manual" @toggle=${this.handleToggle}>
					<ui-listbox .state=${this.state.panel}></ui-listbox>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-multi-select', UIMultiSelect);
