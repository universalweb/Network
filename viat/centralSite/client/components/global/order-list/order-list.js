/*
	DESCRIPTION: ui-order-list — reorderable list (up/down + pointer drag on handle).
	Items stay raw; the row emits move/drag intents; parent mutates `items`.
	── EVENTS ───────────────────────────────────────────────────────────
	  order-list:input  { items, from, to }  live during drag
	  order-list:change { items, from, to }  commit (drop / button move)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-order-list .state.items=${[{ id, label }]} @order-list:change=${this.onOrder}></ui-order-list>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
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
	};
	handleUp(domEvent) {
		domEvent.stopPropagation();
		this.emit('order-item:move', {
			id: orderId(this.state),
			delta: -1,
		});
	}
	handleDown(domEvent) {
		domEvent.stopPropagation();
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
			clientY: domEvent.clientY,
			pointerId: domEvent.pointerId,
		});
	}
	displayLabel() {
		return this.state.label || this.state.value || this.state.id;
	}
	render() {
		this.html`
			<div class="ol-item" ?data-disabled=${this.state.disabled}>
				<button type="button" class="ol-handle" aria-label="Drag to reorder" @pointerdown=${this.handleDragStart}>
					<ui-icon .state.name=${'grip-vertical'} .state.size=${'sm'}></ui-icon>
				</button>
				<span class="ol-label">${this.displayLabel}</span>
				<button type="button" class="ol-btn" aria-label="Move up" @click=${this.handleUp}>
					<ui-icon .state.name=${'chevron-up'} .state.size=${'sm'}></ui-icon>
				</button>
				<button type="button" class="ol-btn" aria-label="Move down" @click=${this.handleDown}>
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
	dragIndex = -1;
	dragFrom = -1;
	dragDirty = false;
	onDisconnect() {
		this.endDrag();
	}
	handleEvent(domEvent) {
		switch (domEvent.type) {
			case 'pointermove': {
				this.handleDragMove(domEvent);
				break;
			}
			case 'pointerup':
			case 'pointercancel': {
				this.endDrag();
				break;
			}
			default: {
				break;
			}
		}
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
	moveItem(fromIndex, toIndex, live) {
		const items = this.state.items;
		const count = items.length;
		if (fromIndex < 0 || toIndex < 0 || fromIndex >= count || toIndex >= count || fromIndex === toIndex) {
			return false;
		}
		const next = items.slice();
		const [spliced] = next.splice(fromIndex, 1);
		next.splice(toIndex, 0, spliced);
		this.state.items = next;
		const payload = {
			items: next,
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
	handleMove(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const fromIndex = this.indexOfId(data.id);
		this.moveItem(fromIndex, fromIndex + Number(data.delta), false);
	}
	handleDragBegin(domEvent) {
		const id = domEvent.detail?.data?.id;
		const fromIndex = this.indexOfId(id);
		if (fromIndex < 0) {
			return;
		}
		this.dragIndex = fromIndex;
		this.dragFrom = fromIndex;
		this.dragDirty = false;
		const handle = domEvent.detail?.source;
		if (handle?.setPointerCapture && domEvent.detail?.data?.pointerId != null) {
			handle.setPointerCapture(domEvent.detail.data.pointerId);
		}
		globalThis.document?.addEventListener('pointermove', this, true);
		globalThis.document?.addEventListener('pointerup', this, true);
		globalThis.document?.addEventListener('pointercancel', this, true);
	}
	handleDragMove(domEvent) {
		if (this.dragIndex < 0) {
			return;
		}
		const rows = this.getChildren('ui-order-item');
		const count = rows.length;
		const pointY = domEvent.clientY;
		let overIndex = this.dragIndex;
		for (let index = 0; index < count; index += 1) {
			const box = rows[index].getBoundingClientRect();
			if (pointY < box.top + (box.height / 2)) {
				overIndex = index;
				break;
			}
			overIndex = index;
		}
		if (overIndex === this.dragIndex) {
			return;
		}
		if (this.moveItem(this.dragIndex, overIndex, true)) {
			this.dragIndex = overIndex;
			this.dragDirty = true;
		}
	}
	endDrag() {
		if (this.dragIndex < 0) {
			return;
		}
		const fromIndex = this.dragFrom;
		const toIndex = this.dragIndex;
		const dirty = this.dragDirty;
		this.dragIndex = -1;
		this.dragFrom = -1;
		this.dragDirty = false;
		globalThis.document?.removeEventListener('pointermove', this, true);
		globalThis.document?.removeEventListener('pointerup', this, true);
		globalThis.document?.removeEventListener('pointercancel', this, true);
		if (dirty === true) {
			this.emit('order-list:change', {
				items: this.state.items,
				from: fromIndex,
				to: toIndex,
			});
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
			<div class="ol">
				<header class="ol-head" ?hidden=${this.headingHidden}>${this.state.heading}</header>
				<div class="ol-list" @order-item:move=${this.handleMove} @order-item:drag=${this.handleDragBegin}>
					${this.list('items', UIOrderItem, this.itemKey)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-order-list', UIOrderList);
