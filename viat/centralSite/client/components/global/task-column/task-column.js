/*
	DESCRIPTION: ui-task-column — one lane on ui-task-board. Renders
	ui-task-card rows and owns card pointer-drag via core/dom/dragReorder.
	The board owns cross-lane moves, column reorder, and the command stack.
	locked: no card drag, no column drag, no drops. collapsed: header only.
	── EVENTS ─────────────────────────────────────────────────
	  task-column:drop { items, from, to, id, clientX, clientY }
	    pointer gesture ended. Always. The board hit-tests columns: another
	    column is a transfer; this column is an in-lane reorder.
	  task-column:change { items, from, to }
	    committed in-lane reorder that was NOT a pointer drop (programmatic
	    moveItem). Pointer drags do not emit this — drop is the gesture.
	  task-column:header-drag { id, clientX, clientY, pointerId }
	    pointerdown on the header (not the collapse control). Board starts
	    column DragReorder when columnReorderable.
	  task-column:header-key { id, key }
	    keydown on the focused header. Board interprets grab/move/drop.
	  task-column:collapse { id, collapsed }
	    collapse control clicked, or Enter on the header while not grabbing.
	  task-column:edit { id, field, value, prior }
	    header label editor committed. The board runs updateColumn.
	Author: Universal Web
	Date: 2026-09-05
*/
import '../icon/icon.js';
import {
	captureRects,
	DragReorder,
	indexFromSlotMids,
	isArray,
	playFlip,
	WebComponent,
} from 'webcomponent';
import { itemKey as keyOf } from '../../core/board/items.js';
import {
	isTopEscapable,
	pushEscapable,
	releaseEscapable,
} from '../../core/escape/escapeStack.js';
import { UITaskCard } from '../task-card/task-card.js';
export class UITaskColumn extends WebComponent {
	static url = import.meta.url;
	static styles = {
		taskColumn: './task-column.css',
	};
	static state = {
		id: '',
		label: '',
		items: [],
		collapsed: false,
		locked: false,
		reorderable: false,
		editingField: '',
	};
	editPrior = '';
	escapeRelease = null;
	slotMids = null;
	firstRects = null;
	headerIsTabStop = false;
	onInit() {
		/**
		 * Do not declare `drag = null` as a class field — fields initialize
		 * AFTER super()/onInit and would wipe this controller.
		 * @engram em:network/code/class-fields-initialize-after-oninit-and-wipe-ctor-setup
		 */
		this.drag = new DragReorder({
			owner: this,
			host: this,
			resolveIndex: 'resolveDragIndex',
			onMove: 'moveItem',
			onEnd: 'handleDragEnd',
		});
		this.flipTick = () => {
			this.applyRowFlip();
		};
	}
	onDisconnect() {
		this.releaseEditorEscape();
		this.drag?.end();
	}
	countLabel() {
		return String(this.state.items?.length || 0);
	}
	onConnect() {
		this.setAttribute('role', 'list');
		this.observe('label', this.syncListLabel, {
			immediate: true,
		});
		this.observe([
			'locked',
			'collapsed',
			'reorderable',
		], this.syncColumnFlags, {
			immediate: true,
		});
	}
	onMount() {
		this.syncColumnFlags();
	}
	syncListLabel() {
		this.setAttribute('aria-label', this.state.label || this.state.id || 'Lane');
	}
	syncColumnFlags() {
		this.toggleAttribute('data-locked', this.state.locked === true);
		this.toggleAttribute('data-collapsed', this.state.collapsed === true);
		this.toggleAttribute('data-reorderable', this.state.reorderable === true && this.state.locked !== true);
		this.syncHeadAttrs();
		this.applyHeaderTabStop();
	}
	syncHeadAttrs() {
		const head = this.refs.head;
		if (!head) {
			return;
		}
		const canReorder = this.state.reorderable === true && this.state.locked !== true;
		if (canReorder) {
			head.setAttribute('role', 'button');
			head.setAttribute('aria-label', this.headLabel());
			if (!head.hasAttribute('aria-grabbed')) {
				head.setAttribute('aria-grabbed', 'false');
			}
		} else {
			head.removeAttribute('role');
			head.removeAttribute('aria-label');
			head.removeAttribute('aria-grabbed');
		}
	}
	headLabel() {
		const label = this.state.label || this.state.id || 'column';
		return `Reorder ${label} column`;
	}
	collapseLabel() {
		const label = this.state.label || this.state.id || 'column';
		if (this.state.collapsed === true) {
			return `Expand ${label}`;
		}
		return `Collapse ${label}`;
	}
	collapseIcon() {
		if (this.state.collapsed === true) {
			return 'chevron-right';
		}
		return 'chevron-down';
	}
	expandedFlag() {
		return this.state.collapsed === true ? 'false' : 'true';
	}
	collapseTabIndex() {
		if (this.state.reorderable === true && this.state.locked !== true) {
			return -1;
		}
		return 0;
	}
	setDropTarget(on) {
		this.toggleAttribute('data-drop-target', on === true);
	}
	setHeaderGrabbed(on) {
		const head = this.refs.head;
		if (!head) {
			return;
		}
		head.toggleAttribute('data-grabbed', on === true);
		head.setAttribute('aria-grabbed', on === true ? 'true' : 'false');
	}
	setHeaderTabStop(on) {
		this.headerIsTabStop = on === true;
		this.applyHeaderTabStop();
	}
	applyHeaderTabStop() {
		const head = this.refs.head;
		if (!head) {
			return;
		}
		const canReorder = this.state.reorderable === true && this.state.locked !== true;
		head.tabIndex = this.headerIsTabStop === true && canReorder ? 0 : -1;
	}
	handleHeaderPointer(domEvent) {
		if (this.state.locked === true) {
			return;
		}
		if (this.state.editingField) {
			return;
		}
		if (domEvent.detail >= 2) {
			return;
		}
		if (this.state.reorderable !== true) {
			return;
		}
		if (domEvent.button != null && domEvent.button !== 0) {
			return;
		}
		domEvent.preventDefault();
		this.emit('task-column:header-drag', {
			id: this.state.id,
			clientX: domEvent.clientX,
			clientY: domEvent.clientY,
			pointerId: domEvent.pointerId,
		});
	}
	handleHeaderKey(domEvent) {
		if (this.state.locked === true) {
			return;
		}
		if (this.state.editingField) {
			return;
		}
		if (this.state.reorderable !== true) {
			return;
		}
		const key = domEvent.key;
		if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown' && key !== ' ' && key !== 'Enter' && key !== 'Escape') {
			return;
		}
		domEvent.preventDefault();
		this.emit('task-column:header-key', {
			id: this.state.id,
			key,
		});
	}
	handleCollapseClick() {
		this.emit('task-column:collapse', {
			id: this.state.id,
			collapsed: this.state.collapsed !== true,
		});
	}
	stopCollapsePointer(domEvent) {
		domEvent.stopPropagation();
	}
	handleLabelDblclick(domEvent) {
		domEvent.stopPropagation();
		domEvent.preventDefault();
		this.beginEdit('label');
	}
	beginEdit(field) {
		if (this.state.locked === true) {
			return false;
		}
		const key = field || 'label';
		this.releaseEditorEscape();
		this.editPrior = this.state[key] ?? '';
		this.state.editingField = key;
		this.escapeRelease = pushEscapable(this);
		this.setTimeout(this.focusEditor, 0);
		return true;
	}
	focusEditor(component) {
		const column = component || this;
		const input = column.refs.edit;
		if (!input) {
			return;
		}
		input.focus();
		input.select();
	}
	releaseEditorEscape() {
		if (this.escapeRelease) {
			this.escapeRelease();
			this.escapeRelease = null;
		} else {
			releaseEscapable(this);
		}
	}
	commitEdit() {
		const field = this.state.editingField;
		if (!field) {
			return;
		}
		const input = this.refs.edit;
		const value = input ? input.value : this.state[field];
		const prior = this.editPrior;
		this.releaseEditorEscape();
		this.state.editingField = '';
		this.emit('task-column:edit', {
			id: this.state.id,
			field,
			value,
			prior,
		});
	}
	cancelEdit() {
		if (!this.state.editingField) {
			return;
		}
		this.releaseEditorEscape();
		this.state.editingField = '';
	}
	handleEditKey(domEvent) {
		if (domEvent.key === 'Enter') {
			domEvent.preventDefault();
			domEvent.stopPropagation();
			this.commitEdit();
			return;
		}
		if (domEvent.key === 'Escape') {
			if (!isTopEscapable(this)) {
				return;
			}
			domEvent.preventDefault();
			domEvent.stopPropagation();
			this.cancelEdit();
		}
	}
	handleEditBlur() {
		if (!this.state.editingField) {
			return;
		}
		this.commitEdit();
	}
	renderHeadLabel() {
		if (this.state.editingField === 'label') {
			return this.htmlElement`
				<input class="task-column-label-input" #edit
					value=${this.state.label}
					aria-label=${'Column title'}
					@keydown=${this.handleEditKey}
					@blur=${this.handleEditBlur}
					@pointerdown=${this.stopCollapsePointer}>
			`;
		}
		return this.htmlElement`
			<span class="task-column-label" @dblclick=${this.handleLabelDblclick}>${this.state.label}</span>
		`;
	}
	itemKey(item, index) {
		return keyOf(item) || index;
	}
	indexOfId(id) {
		const items = this.state.items;
		if (!isArray(items)) {
			return -1;
		}
		const count = items.length;
		const needle = String(id);
		for (let index = 0; index < count; index += 1) {
			if (keyOf(items[index]) === needle) {
				return index;
			}
		}
		return -1;
	}
	/**
	 * Reorder this lane's items in place. Live pointer drags pass live=true
	 * and emit nothing — the board hears about the gesture via drop. A
	 * non-live call emits task-column:change so programmatic reorder still
	 * reaches the board without a pointer.
	 * @param {number} fromIndex - Source index.
	 * @param {number} toIndex - Destination index.
	 * @param {boolean} [live] - True during pointer drag.
	 * @returns {boolean} True when the list mutated.
	 */
	moveItem(fromIndex, toIndex, live) {
		const items = this.state.items;
		if (!isArray(items)) {
			return false;
		}
		const count = items.length;
		if (fromIndex < 0 || toIndex < 0 || fromIndex >= count || toIndex >= count || fromIndex === toIndex) {
			return false;
		}
		if (!this.firstRects) {
			this.firstRects = captureRects(this.rowElements());
		}
		const [spliced] = items.splice(fromIndex, 1);
		items.splice(toIndex, 0, spliced);
		this.stateBus?.notify('items');
		queueMicrotask(this.flipTick);
		if (live !== true) {
			this.emit('task-column:change', {
				items,
				from: fromIndex,
				to: toIndex,
			});
		}
		return true;
	}
	handleDragEnd(info) {
		this.slotMids = null;
		this.emit('task-column:drop', {
			items: this.state.items,
			from: info.from,
			to: info.to,
			id: info.id,
			clientX: info.clientX,
			clientY: info.clientY,
		});
	}
	handleCardDrag(domEvent) {
		if (this.state.locked === true) {
			return;
		}
		if (this.drag.active) {
			return;
		}
		const id = domEvent.detail?.data?.id;
		const fromIndex = this.indexOfId(id);
		if (fromIndex < 0) {
			return;
		}
		const row = this.rowById().get(String(id));
		if (!row) {
			return;
		}
		this.snapshotSlotMids();
		this.drag.start(domEvent, fromIndex, row);
	}
	rowById() {
		const map = new Map();
		const rows = this.getChildren('ui-task-card');
		const count = rows.length;
		for (let index = 0; index < count; index += 1) {
			map.set(keyOf(rows[index].state), rows[index]);
		}
		return map;
	}
	rowElements() {
		const items = this.state.items;
		const rows = this.rowById();
		const elements = [];
		if (!isArray(items)) {
			return elements;
		}
		const count = items.length;
		const dragRow = this.drag?.dragRow;
		for (let index = 0; index < count; index += 1) {
			const row = rows.get(keyOf(items[index]));
			if (!row || row === dragRow) {
				continue;
			}
			elements.push(row);
		}
		return elements;
	}
	resolveDragIndex(pointerEvent) {
		if (!this.slotMids) {
			this.snapshotSlotMids();
		}
		return indexFromSlotMids(this.slotMids, pointerEvent.clientY, this.drag.dragIndex);
	}
	snapshotSlotMids() {
		const items = this.state.items;
		if (!isArray(items)) {
			this.slotMids = null;
			return;
		}
		const rows = this.rowById();
		const row = this.drag.dragRow;
		const previous = row ? row.style.transform : '';
		if (row) {
			row.style.transform = '';
		}
		const count = items.length;
		const mids = [];
		for (let index = 0; index < count; index += 1) {
			const slotRow = rows.get(keyOf(items[index]));
			if (!slotRow) {
				mids.push(0);
				continue;
			}
			const box = slotRow.getBoundingClientRect();
			mids.push(box.top + (box.height / 2));
		}
		if (row) {
			row.style.transform = previous;
		}
		this.slotMids = mids;
	}
	applyRowFlip() {
		if (this.isDisconnected) {
			this.firstRects = null;
			return;
		}
		const first = this.firstRects;
		this.firstRects = null;
		this.drag?.relayoutFollow();
		if (first) {
			playFlip(this.rowElements(), first);
		}
	}
	render() {
		this.html`
			<section class="task-column" data-lane=${this.state.id}>
				<header class="task-column-head" #head
					@pointerdown=${this.handleHeaderPointer}
					@keydown=${this.handleHeaderKey}>
					${this.renderHeadLabel}
					<span class="task-column-count">${this.countLabel}</span>
					<button type="button" class="task-column-collapse" #collapse
						aria-expanded=${this.expandedFlag}
						aria-label=${this.collapseLabel}
						tabindex=${this.collapseTabIndex}
						@pointerdown=${this.stopCollapsePointer}
						@keydown=${this.stopCollapsePointer}
						@click=${this.handleCollapseClick}>
						<ui-icon .state.name=${this.collapseIcon} .state.size=${'sm'}></ui-icon>
					</button>
				</header>
				<div class="task-column-list" #list
					?hidden=${this.state.collapsed}
					@task-card:drag=${this.handleCardDrag}>
					${this.list('items', UITaskCard, this.itemKey)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-task-column', UITaskColumn);
