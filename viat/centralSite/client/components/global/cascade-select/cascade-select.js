/*
	DESCRIPTION: ui-cascade-select — nested option path picker (PrimeVue CascadeSelect).
	Items may carry `children[]`. Each visible depth is a composed ui-listbox
	column. Leaf pick commits value + path. Emits cascade-select:change
	{value,path,item}.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-cascade-select .state.items=${[
	    { label: 'AU', value: 'au', children: [{ label: 'Sydney', value: 'syd' }] },
	  ]} @cascade-select:change=${this.onPath}></ui-cascade-select>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { isArray } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { positionOverlay } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import { listboxItemLabel, listboxItemValue } from '../listbox/listbox.js';
const COLUMN_LIMIT = 4;
/**
 * Direct children of an item, or empty.
 * @param {object} item - Option that may have children.
 * @returns {object[]} Child items.
 */
function itemChildren(item) {
	return isArray(item?.children) ? item.children : [];
}
/**
 * Find an item by value in a flat sibling list.
 * @param {object[]} items - Sibling options.
 * @param {*} itemValue - Selection key.
 * @returns {object|null} Match, or null.
 */
function findByValue(items, itemValue) {
	if (!isArray(items)) {
		return null;
	}
	const itemCount = items.length;
	for (let index = 0; index < itemCount; index += 1) {
		const item = items[index];
		if (item && listboxItemValue(item) === itemValue) {
			return item;
		}
	}
	return null;
}
export class UICascadeSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		cascadeSelect: './cascade-select.css',
	};
	static state = {
		items: [],
		value: '',
		path: [],
		pathLabel: '',
		open: false,
		placeholder: 'Select…',
		disabled: false,
		colCount: 1,
		col0: {
			items: [],
			value: '',
		},
		col1: {
			items: [],
			value: '',
		},
		col2: {
			items: [],
			value: '',
		},
		col3: {
			items: [],
			value: '',
		},
		chevronIcon: {
			name: 'chevron-down',
			size: 'sm',
		},
	};
	outsideArmed = false;
	columnKeys = [
		'col0', 'col1', 'col2', 'col3',
	];
	onConnect() {
		this.syncColumns();
		// path/value must re-sync columns when a consumer sets them after connect.
		this.observe([
			'items',
			'path',
			'value',
		], this.syncColumns);
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
	columnState(index) {
		return this.state[this.columnKeys[index]];
	}
	walkPath() {
		const trail = [];
		let level = isArray(this.state.items) ? this.state.items : [];
		const path = isArray(this.state.path) ? this.state.path : [];
		const pathCount = path.length;
		for (let index = 0; index < pathCount; index += 1) {
			const item = findByValue(level, path[index]);
			if (!item) {
				break;
			}
			trail.push(item);
			level = itemChildren(item);
		}
		return trail;
	}
	syncColumns() {
		const path = isArray(this.state.path) ? this.state.path : [];
		let level = isArray(this.state.items) ? this.state.items : [];
		let count = 1;
		for (let index = 0; index < COLUMN_LIMIT; index += 1) {
			const column = this.columnState(index);
			if (column.items !== level) {
				column.items = level;
			}
			const pathValue = path[index] ?? '';
			if (column.value !== pathValue) {
				column.value = pathValue;
			}
			const selected = pathValue === '' ? null : findByValue(level, pathValue);
			const kids = selected ? itemChildren(selected) : [];
			if (kids.length && index < COLUMN_LIMIT - 1) {
				level = kids;
				count = index + 2;
			} else {
				level = [];
			}
		}
		if (this.state.colCount !== count) {
			this.state.colCount = count;
		}
		this.syncPathLabel();
	}
	syncPathLabel() {
		const trail = this.walkPath();
		const labels = [];
		const trailCount = trail.length;
		for (let index = 0; index < trailCount; index += 1) {
			labels.push(listboxItemLabel(trail[index]));
		}
		const next = labels.join(' / ');
		if (this.state.pathLabel !== next) {
			this.state.pathLabel = next;
		}
	}
	handleListboxChange(domEvent) {
		const item = domEvent.detail?.data?.item;
		if (!item) {
			return;
		}
		const columnIndex = this.indexOfListbox(domEvent.detail?.source);
		if (columnIndex === -1) {
			return;
		}
		const nextPath = [];
		const prior = isArray(this.state.path) ? this.state.path : [];
		for (let index = 0; index < columnIndex; index += 1) {
			nextPath.push(prior[index]);
		}
		nextPath.push(listboxItemValue(item));
		const kids = itemChildren(item);
		if (kids.length && columnIndex < COLUMN_LIMIT - 1) {
			this.state.path = nextPath;
			this.syncColumns();
			return;
		}
		this.state.path = nextPath;
		this.state.value = listboxItemValue(item);
		this.syncColumns();
		this.closeList();
		this.emit('cascade-select:change', {
			value: this.state.value,
			path: nextPath.slice(),
			item,
		});
	}
	/**
	 * Column index for a composed listbox. Must NOT identity-compare
	 * `source.state.items` to `columnState(i).items` — each CE owns a distinct
	 * proxyCache, so shared raw arrays never compare equal across hosts.
	 * @param {Element|null|undefined} source - Emitting ui-listbox.
	 * @returns {number} Column index, or -1.
	 */
	indexOfListbox(source) {
		const raw = source?.getAttribute?.('data-col') ?? source?.dataset?.col;
		const index = Number(raw);
		if (Number.isFinite(index) && index >= 0 && index < COLUMN_LIMIT) {
			return index;
		}
		return -1;
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
			this.setTimeout(UICascadeSelect.armOutsideTimer, 0);
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
		if (domEvent.key === 'ArrowDown' && !this.state.open) {
			domEvent.preventDefault();
			this.toggleOpen();
		}
	}
	hasPath() {
		return this.state.pathLabel !== '';
	}
	isPathEmpty() {
		return this.state.pathLabel === '';
	}
	hideCol1() {
		return this.state.colCount < 2;
	}
	hideCol2() {
		return this.state.colCount < 3;
	}
	hideCol3() {
		return this.state.colCount < 4;
	}
	render() {
		this.html`
			<div class="cs"
				?data-open=${this.state.open}
				?data-disabled=${this.state.disabled}
				@listbox:change=${this.handleListboxChange}
				@keydown=${this.handleKeydown}>
				<button class="cs-trigger" type="button" #trigger
					?disabled=${this.state.disabled}
					aria-haspopup="listbox"
					aria-expanded=${this.state.open ? 'true' : 'false'}
					@click=${this.toggleOpen}>
					<span class="cs-value" ?hidden=${this.isPathEmpty}>${this.state.pathLabel}</span>
					<span class="cs-placeholder" ?hidden=${this.hasPath}>${this.state.placeholder}</span>
					<ui-icon class="cs-icon" .state=${this.state.chevronIcon}></ui-icon>
				</button>
				<div class="cs-panel" #surface popover="manual" @toggle=${this.handleToggle}>
					<ui-listbox class="cs-col" data-col="0" .state=${this.state.col0}></ui-listbox>
					<ui-listbox class="cs-col" data-col="1" ?hidden=${this.hideCol1} .state=${this.state.col1}></ui-listbox>
					<ui-listbox class="cs-col" data-col="2" ?hidden=${this.hideCol2} .state=${this.state.col2}></ui-listbox>
					<ui-listbox class="cs-col" data-col="3" ?hidden=${this.hideCol3} .state=${this.state.col3}></ui-listbox>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-cascade-select', UICascadeSelect);
