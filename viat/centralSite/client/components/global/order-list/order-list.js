/*
	DESCRIPTION: ui-order-list — reorderable list (up/down + pointer drag on handle).
	Items stay raw; the row emits move/drag intents; parent mutates `items`.
	Pointer drag uses core/dom/dragReorder (state machine) + core/dom/flip
	(neighbor motion). prefers-reduced-motion skips FLIP, not the reorder.
	── EVENTS ───────────────────────────────────────────────────────────
	  order-list:input  { items, from, to }  live during drag
	  order-list:change { items, from, to }  commit (drop / button move)
	  order-item:select { id, additive, range }  click on the label (not the
	    handle or move buttons). additive = ctrl/cmd, range = shift.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-order-list .state.items=${[{ id, label }]} @order-list:change=${this.onOrder}></ui-order-list>
	──────────────────────────────────────────────────────────────────────
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
function orderId(item) {
	if (!item) {
		return '';
	}
	if (item.id != null && item.id !== '') {
		return String(item.id);
	}
	return String(item.label || item.value || '');
}
export class UIOrderItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		orderList: './order-list.css',
	};
	static state = {
		id: '',
		label: '',
		value: '',
		disabled: false,
		selected: false,
	};
	/*
	 * Guarded like `handleDragStart` is. `.order-list-item[data-disabled]` sets
	 * `pointer-events: none`, but that is a PAINT-level guard: it stops the
	 * mouse and nothing else. Without this a frozen row could still be reordered
	 * by keyboard, and by any programmatic caller.
	 */
	handleUp(domEvent) {
		domEvent.stopPropagation();
		if (this.state.disabled === true) {
			return;
		}
		this.emit('order-item:move', {
			id: orderId(this.state),
			delta: -1,
		});
	}
	handleDown(domEvent) {
		domEvent.stopPropagation();
		if (this.state.disabled === true) {
			return;
		}
		this.emit('order-item:move', {
			id: orderId(this.state),
			delta: 1,
		});
	}
	handleDragStart(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		domEvent.preventDefault();
		if (domEvent.currentTarget?.setPointerCapture && domEvent.pointerId != null) {
			domEvent.currentTarget.setPointerCapture(domEvent.pointerId);
		}
		this.emit('order-item:drag', {
			id: orderId(this.state),
			clientX: domEvent.clientX,
			clientY: domEvent.clientY,
			pointerId: domEvent.pointerId,
		});
	}
	displayLabel() {
		return this.state.label || this.state.value || this.state.id;
	}
	handleSelect(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('order-item:select', {
			id: orderId(this.state),
			additive: domEvent.metaKey === true || domEvent.ctrlKey === true,
			range: domEvent.shiftKey === true,
		});
	}
	render() {
		this.html`
			<div class="order-list-item" ?data-disabled=${this.state.disabled}
				aria-selected=${this.state.selected === true ? 'true' : 'false'}>
				<button type="button" class="order-list-handle" aria-label="Drag to reorder"
					?disabled=${this.state.disabled}
					@pointerdown=${this.handleDragStart}>
					<ui-icon .state.name=${'grip-vertical'} .state.size=${'sm'}></ui-icon>
				</button>
				<span class="order-list-label" @click=${this.handleSelect}>${this.displayLabel}</span>
				<button type="button" class="order-list-btn" aria-label="Move up"
					?disabled=${this.state.disabled}
					@click=${this.handleUp}>
					<ui-icon .state.name=${'chevron-up'} .state.size=${'sm'}></ui-icon>
				</button>
				<button type="button" class="order-list-btn" aria-label="Move down"
					?disabled=${this.state.disabled}
					@click=${this.handleDown}>
					<ui-icon .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</button>
			</div>
		`;
	}
}
customElements.define('ui-order-item', UIOrderItem);
export class UIOrderList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		orderList: './order-list.css',
	};
	static state = {
		items: [],
		heading: '',
	};
	slotMids = null;
	firstRects = null;
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
			onCommit: 'commitDrag',
			onEnd: 'handleDragEnd',
		});
		/*
		 * queueMicrotask has no thisArg — cached forwarder to applyRowFlip
		 * (method shorthand). The old arrow class field is gone.
		 */
		this.flipTick = () => {
			this.applyRowFlip();
		};
	}
	onDisconnect() {
		this.drag?.end();
	}
	indexOfId(id) {
		const items = this.state.items;
		const count = items.length;
		const needle = String(id);
		for (let index = 0; index < count; index += 1) {
			if (orderId(items[index]) === needle) {
				return index;
			}
		}
		return -1;
	}
	/**
	 * Reorder items. Live drag emits order-list:input; button moves and drag
	 * drop emit order-list:change (one commit).
	 * @param {number} fromIndex - Source index.
	 * @param {number} toIndex - Destination index.
	 * @param {boolean} [live] - True during pointer drag.
	 * @returns {boolean} True when the list mutated.
	 */
	// @engram em:network/code/ui-order-list-must-splice-the-source-items-array — splice source, never reassign
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
		/*
		 * Splice mutates the source array in place. That never hits
		 * StateProxyHandler.set, so the list binding would not see the new
		 * order. Notify the path; do not reassign `state.items` (plainEqual
		 * swallows a same-members new ref, and a child reassignment fights a
		 * parent carrier `.state.items=${…}`).
		 */
		// @engram em:network/code/a-deep-write-into-a-state-array-member-never-reaches-the-pro — splice never traps; notify the list path
		this.stateBus?.notify('items');
		queueMicrotask(this.flipTick);
		const payload = {
			items,
			from: fromIndex,
			to: toIndex,
		};
		if (live === true) {
			this.emit('order-list:input', payload);
		} else {
			this.emit('order-list:change', payload);
		}
		return true;
	}
	commitDrag(fromIndex, toIndex) {
		this.emit('order-list:change', {
			items: this.state.items,
			from: fromIndex,
			to: toIndex,
		});
	}
	handleDragEnd(info) {
		this.slotMids = null;
		this.emit('order-list:drop', {
			items: this.state.items,
			from: info.from,
			to: info.to,
			id: info.id,
			clientX: info.clientX,
			clientY: info.clientY,
		});
	}
	handleMove(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const fromIndex = this.indexOfId(data.id);
		this.moveItem(fromIndex, fromIndex + Number(data.delta), false);
	}
	handleDragBegin(domEvent) {
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
		/*
		 * liveChildren is connect-order. moveBefore does not re-register, so
		 * the array index is not visual/items order — look up by id.
		 */
		const map = new Map();
		const rows = this.getChildren('ui-order-item');
		const count = rows.length;
		for (let index = 0; index < count; index += 1) {
			map.set(orderId(rows[index].state), rows[index]);
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
			const row = rows.get(orderId(items[index]));
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
			const slotRow = rows.get(orderId(items[index]));
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
	headingHidden() {
		return !this.state.heading;
	}
	itemKey(item, index) {
		return orderId(item) || index;
	}
	render() {
		this.html`
			<div class="order-list">
				<header class="order-list-head" ?hidden=${this.headingHidden}>${this.state.heading}</header>
				<div class="order-list-list" @order-item:move=${this.handleMove} @order-item:drag=${this.handleDragBegin}>
					${this.list('items', UIOrderItem, this.itemKey)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-order-list', UIOrderList);
