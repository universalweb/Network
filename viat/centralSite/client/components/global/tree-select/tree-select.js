/*
	DESCRIPTION: ui-tree-select — form select over hierarchical tree data.
	Trigger + overlay; the panel hosts <ui-tree> (no second flatten).
	The panel is `popover="auto"` so it paints in the top layer (escapes
	preview `.demo` paint-contain / overflow clip). HideOnScroll dismisses
	on any ancestor scroller, including shadow-tree stage scroll.
	── EVENTS ───────────────────────────────────────────────────────────
	  tree-select:change { value, item }
	  tree-select:open { open }
	  tree-select:close { open }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tree-select .state.items=${nodes} .state.placeholder=${'Pick a file'}
	    @tree-select:change=${this.onPick}></ui-tree-select>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
import { positionOverlay } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import { findTreeItem, treeItemLabel, treeItemValue } from '../tree/tree.js';
export class UITreeSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		treeSelect: './tree-select.css',
	};
	static state = {
		items: [],
		value: '',
		placeholder: 'Select…',
		open: false,
		disabled: false,
		query: '',
		expandDepth: 1,
		emptyMessage: 'No matches.',
	};
	onConnect() {
		this.observe('open', this.syncPopoverFromState);
	}
	onRendered() {
		this.syncPopoverFromState(this.state.open);
	}
	onDisconnect() {
		this.scrollHide?.detach();
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
			this.emit('tree-select:open', {
				open: true,
			});
			return;
		}
		this.scrollHide?.detach();
		this.emit('tree-select:close', {
			open: false,
		});
	}
	openList() {
		if (this.state.disabled === true) {
			return;
		}
		this.refs.surface?.showPopover?.();
	}
	closeList() {
		this.refs.surface?.hidePopover?.();
	}
	handleQuery(domEvent) {
		domEvent.stopPropagation();
		this.state.query = domEvent.target.value;
		this.openList();
		this.emit('tree-select:input', {
			value: this.state.query,
		});
	}
	handleTreeSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data || data.item?.disabled === true) {
			return;
		}
		this.state.value = data.value;
		this.closeList();
		this.emit('tree-select:change', {
			value: data.value,
			item: data.item,
		});
	}
	selectedLabel() {
		const item = findTreeItem(this.state.items, this.state.value);
		if (!item) {
			return this.state.placeholder;
		}
		return treeItemLabel(item);
	}
	isPlaceholder() {
		const item = findTreeItem(this.state.items, this.state.value);
		return !item;
	}
	caretName() {
		return this.state.open ? 'chevron-up' : 'chevron-down';
	}
	treeValue() {
		const item = findTreeItem(this.state.items, this.state.value);
		return item ? treeItemValue(item) : this.state.value;
	}
	render() {
		this.html`
			<div class="ts" ?data-disabled=${this.state.disabled} ?data-open=${this.state.open}>
				<button type="button" class="ts-trigger" #trigger popovertarget="ts-pop"
					?disabled=${this.state.disabled}
					aria-haspopup="tree" aria-expanded=${this.state.open ? 'true' : 'false'}>
					<span class="ts-label" ?data-placeholder=${this.isPlaceholder}>${this.selectedLabel}</span>
					<ui-icon class="ts-caret" .state.name=${this.caretName} .state.size=${'sm'}></ui-icon>
				</button>
				<div class="ts-panel" #surface id="ts-pop" popover="auto" role="dialog"
					@toggle=${this.handleToggle}>
					<input #query class="ts-query" type="search" placeholder="Filter…" aria-label="Filter options"
						$value="query" @input=${this.handleQuery}>
					<ui-tree
						.state.items=${this.state.items}
						.state.value=${this.treeValue}
						.state.filter=${this.state.query}
						.state.expandDepth=${this.state.expandDepth}
						.state.emptyMessage=${this.state.emptyMessage}
						@tree:select=${this.handleTreeSelect}></ui-tree>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-tree-select', UITreeSelect);
