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
	Value is a DOTTED id-path (`root.branch.leaf`) — the framework's object-access
	shape, not labels. Display uses ` / ` (presentational; not the value). `pathFor`
	/ `nodeAt` round-trip by node identity. A stored path whose hop is gone fails
	soft to no-selection (never throws). Labels may contain `.`; ids must not.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tree-select .state.items=${nodes} .state.placeholder=${'Pick a file'}
	    @tree-select:change=${this.onPick}></ui-tree-select>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
import { hideOverlay, positionOverlayWhenReady } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import {
	displayPath,
	findTreeItem,
	nodeAt,
	pathFor,
	treeItemValue,
} from '../tree/tree.js';
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
		this.observe('open', this.syncOpen);
	}
	onRendered() {
		this.syncOpen(this.state.open);
	}
	onDisconnect() {
		this.scrollHide?.detach();
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
		hideOverlay(this.refs.surface);
		this.showSurfacePopover(this.refs.surface);
	}
	closeList() {
		this.hideSurfacePopover(this.refs.surface);
	}
	syncOpen(isOpen) {
		if (isOpen) {
			hideOverlay(this.refs.surface);
			this.showSurfacePopover(this.refs.surface);
			return;
		}
		this.hideSurfacePopover(this.refs.surface);
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
		const item = data.item;
		const path = this.pathFor(item);
		if (!path) {
			return;
		}
		this.state.value = path;
		this.closeList();
		this.emit('tree-select:change', {
			value: path,
			item,
		});
	}
	pathFor(node) {
		return pathFor(this.state.items, node);
	}
	nodeAt(path) {
		return nodeAt(this.state.items, path);
	}
	resolvedItem() {
		const path = this.state.value;
		const fromPath = this.nodeAt(path);
		if (fromPath) {
			return fromPath;
		}
		if (path && !String(path).includes('.')) {
			return findTreeItem(this.state.items, path);
		}
		return null;
	}
	selectedLabel() {
		const item = this.resolvedItem();
		if (!item) {
			return this.state.placeholder;
		}
		return displayPath(this.state.items, item);
	}
	isPlaceholder() {
		return !this.resolvedItem();
	}
	caretName() {
		return this.state.open ? 'chevron-up' : 'chevron-down';
	}
	treeValue() {
		const item = this.resolvedItem();
		return item ? treeItemValue(item) : '';
	}
	render() {
		this.html`
			<div class="tree-select" ?data-disabled=${this.state.disabled} ?data-open=${this.state.open}>
				<button type="button" class="tree-select-trigger" data-hover=${'hairline'} #trigger popovertarget="tree-select-pop"
					?disabled=${this.state.disabled}
					aria-haspopup="tree" aria-expanded=${this.state.open ? 'true' : 'false'}>
					<span class="tree-select-label" ?data-placeholder=${this.isPlaceholder}>${this.selectedLabel}</span>
					<ui-icon class="tree-select-caret" .state.name=${this.caretName} .state.size=${'sm'}></ui-icon>
				</button>
				<div class="tree-select-panel glass" #surface id="tree-select-pop" popover="auto" role="dialog"
					@toggle=${this.handleToggle}>
					<input #query class="tree-select-query" type="search" placeholder="Filter…" aria-label="Filter options"
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
