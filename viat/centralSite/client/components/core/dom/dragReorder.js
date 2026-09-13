/*
	DESCRIPTION: Pointer-capture list-reorder controller. Owns the drag state
	machine (dragIndex/dragFrom/dragDirty/dragLocked/dragRow/dragId), pointer
	capture, move/up/cancel wiring, and the dragged-row follow transform.
	It NEVER touches the data — resolveIndex / onMove / onCommit / locked are
	caller policy. That is what lets one mechanism serve an ordinal list, a
	lane board, and a time-positioned board (resolveIndex becomes a snap).
	── USAGE ────────────────────────────────────────────────────────────
	  const ctl = new DragReorder({
	    owner: this,
	    host: this,
	    resolveIndex: 'resolveDragIndex',  // → source index, or snapped start minutes
	    onMove: 'moveItem',                // (from, to, live) → boolean; called even when from === to
	    onCommit: 'commitDrag',            // (from, to)
	    locked: 'dragIsLocked',            // optional → boolean
	  });
	  ctl.start(pointerEvent, fromIndex, rowElement);
	─────────────────────────────────────────────────────────────────────
*/
import { lockSelection, unlockSelection } from '../gestures/selectionLock.js';
import { playFlip, prefersReducedMotion } from './flip.js';
import { rafCoalesce, rafCoalesceCancel } from './rafCoalesce.js';
/**
 * Slot index whose midpoint the pointer is in (or the last slot).
 * `slotMids[i]` is the rest-Y of positional slot i — not item identity.
 * After a splice, slot geometry stays put; only occupancy changes.
 * @param {Array<number>} slotMids - Mid-Y of each positional slot.
 * @param {number} pointY - Pointer clientY.
 * @param {number} fallbackIndex - Used when the list is empty.
 * @returns {number} Slot index under the pointer.
 */
export function indexFromSlotMids(slotMids, pointY, fallbackIndex) {
	if (!slotMids) {
		return fallbackIndex;
	}
	const count = slotMids.length;
	if (count === 0) {
		return fallbackIndex;
	}
	let overIndex = fallbackIndex;
	for (let index = 0; index < count; index += 1) {
		if (pointY < slotMids[index]) {
			overIndex = index;
			break;
		}
		overIndex = index;
	}
	return overIndex;
}
export class DragReorder {
	/**
	 * Pointer-drag controller. Policy callbacks may be functions or method names on `owner`.
	 * @param {object} options - resolveIndex, onMove, onCommit, locked, owner, host.
	 */
	constructor(options) {
		this.owner = options.owner ?? null;
		this.host = options.host ?? null;
		this.resolveIndex = options.resolveIndex;
		this.onMove = options.onMove;
		this.onCommit = options.onCommit;
		this.onEnd = options.onEnd;
		this.locked = options.locked;
		this.dragIndex = -1;
		this.dragFrom = -1;
		this.dragDirty = false;
		this.dragLocked = false;
		this.dragRow = null;
		this.dragId = '';
		this.grabOffsetX = 0;
		this.grabOffsetY = 0;
		this.layoutLeft = 0;
		this.layoutTop = 0;
		this.pendingX = 0;
		this.pendingY = 0;
		this.dropFollowX = 0;
		this.dropFollowY = 0;
		/*
		 * queueMicrotask has no thisArg channel — one cached forwarder to the
		 * method (js-style tier-3). Logic stays on relayoutFollow.
		 */
		this.afterMoveTick = () => {
			this.relayoutFollow();
		};
	}
	static is(value) {
		return value instanceof DragReorder;
	}
	get active() {
		return this.dragIndex >= 0;
	}
	/**
	 * Invoke a policy callback. String names resolve on `owner`.
	 * @param {Function|string|null|undefined} policy - Callback or method name.
	 * @param {...*} args - Arguments.
	 * @returns {*} Policy return value.
	 */
	callPolicy(policy, ...args) {
		if (typeof policy === 'string') {
			const method = this.owner?.[policy];
			if (typeof method !== 'function') {
				return undefined;
			}
			return method.apply(this.owner, args);
		}
		if (typeof policy !== 'function') {
			return undefined;
		}
		return policy.apply(this.owner, args);
	}
	/**
	 * Begin a pointer drag. `pointerEvent` may be a PointerEvent or a UWC
	 * custom event whose `detail.data` carries clientX/Y/pointerId/id.
	 * @param {Event} pointerEvent - Pointer or intent event.
	 * @param {number} fromIndex - Absolute source index.
	 * @param {Element} rowElement - Row that follows the pointer.
	 */
	start(pointerEvent, fromIndex, rowElement) {
		if (this.dragIndex >= 0 || fromIndex < 0 || !rowElement) {
			return;
		}
		if (this.locked && this.callPolicy(this.locked) === true) {
			return;
		}
		const data = pointerEvent?.detail?.data;
		const clientX = Number(data?.clientX ?? pointerEvent.clientX);
		const clientY = Number(data?.clientY ?? pointerEvent.clientY);
		const pointerId = data?.pointerId ?? pointerEvent.pointerId;
		this.dragIndex = fromIndex;
		this.dragFrom = fromIndex;
		this.dragDirty = false;
		this.dragRow = rowElement;
		this.dragId = data?.id != null && data.id !== '' ? String(data.id) : '';
		this.pendingX = Number.isFinite(clientX) ? clientX : 0;
		this.pendingY = Number.isFinite(clientY) ? clientY : 0;
		const box = rowElement.getBoundingClientRect();
		this.grabOffsetX = this.pendingX - box.left;
		this.grabOffsetY = this.pendingY - box.top;
		this.layoutLeft = box.left;
		this.layoutTop = box.top;
		rowElement.classList.add('is-dragging');
		this.host?.classList.add('is-reordering');
		lockSelection();
		this.dragLocked = true;
		const captureTarget = pointerEvent?.detail?.source ??
			pointerEvent?.currentTarget ??
			rowElement;
		if (captureTarget?.setPointerCapture && pointerId != null) {
			captureTarget.setPointerCapture(pointerId);
		}
		globalThis.document?.addEventListener('pointermove', this, true);
		globalThis.document?.addEventListener('pointerup', this, true);
		globalThis.document?.addEventListener('pointercancel', this, true);
	}
	handleEvent(domEvent) {
		switch (domEvent.type) {
			case 'pointermove': {
				this.handleMove(domEvent);
				break;
			}
			case 'pointerup':
			case 'pointercancel': {
				this.end();
				break;
			}
			default: {
				break;
			}
		}
	}
	handleMove(domEvent) {
		if (this.dragIndex < 0) {
			return;
		}
		this.pendingY = domEvent.clientY;
		this.pendingX = domEvent.clientX;
		rafCoalesce(this, this.onDragFrame);
	}
	onDragFrame() {
		if (this.dragIndex < 0) {
			return;
		}
		this.applyFollow();
		this.maybeReorder();
	}
	applyFollow() {
		if (this.dragIndex < 0 || !this.dragRow) {
			return;
		}
		const followX = this.pendingX - this.grabOffsetX - this.layoutLeft;
		const followY = this.pendingY - this.grabOffsetY - this.layoutTop;
		this.dragRow.style.transform = `translate(${followX}px, ${followY}px)`;
	}
	/**
	 * After the row moves to a new slot, reset the follow origin to the new
	 * rest box so the pointer offset stays correct.
	 */
	relayoutFollow() {
		const row = this.dragRow;
		if (this.dragIndex < 0 || !row) {
			return;
		}
		row.style.transform = '';
		const box = row.getBoundingClientRect();
		this.layoutLeft = box.left;
		this.layoutTop = box.top;
		this.applyFollow();
	}
	maybeReorder() {
		if (this.locked && this.callPolicy(this.locked) === true) {
			return;
		}
		const toIndex = this.callPolicy(this.resolveIndex, {
			clientX: this.pendingX,
			clientY: this.pendingY,
		});
		if (!Number.isFinite(toIndex) || toIndex < 0) {
			return;
		}
		const fromIndex = this.dragIndex;
		const moved = this.callPolicy(this.onMove, fromIndex, toIndex, true);
		if (moved === false) {
			return;
		}
		this.dragIndex = toIndex;
		this.dragDirty = true;
		queueMicrotask(this.afterMoveTick);
	}
	/**
	 * End the drag. Commits when the source order changed. Safe to call when
	 * idle (no-op). Disconnect paths must call this so capture/lock release.
	 */
	end() {
		if (this.dragIndex < 0) {
			return;
		}
		rafCoalesceCancel(this);
		const fromIndex = this.dragFrom;
		const toIndex = this.dragIndex;
		const dirty = this.dragDirty;
		const dropId = this.dragId;
		const dropX = this.pendingX;
		const dropY = this.pendingY;
		const row = this.dragRow;
		const followX = row ? this.pendingX - this.grabOffsetX - this.layoutLeft : 0;
		const followY = row ? this.pendingY - this.grabOffsetY - this.layoutTop : 0;
		this.dropFollowX = followX;
		this.dropFollowY = followY;
		this.dragIndex = -1;
		this.dragFrom = -1;
		this.dragDirty = false;
		this.dragRow = null;
		this.dragId = '';
		if (this.dragLocked === true) {
			unlockSelection();
			this.dragLocked = false;
		}
		globalThis.document?.removeEventListener('pointermove', this, true);
		globalThis.document?.removeEventListener('pointerup', this, true);
		globalThis.document?.removeEventListener('pointercancel', this, true);
		this.callPolicy(this.onEnd, {
			from: fromIndex,
			to: toIndex,
			id: dropId,
			clientX: dropX,
			clientY: dropY,
			dirty,
			row,
			followX,
			followY,
		});
		if (dirty === true) {
			this.callPolicy(this.onCommit, fromIndex, toIndex);
		}
		if (row) {
			row.classList.remove('is-dragging');
			row.style.transform = '';
			if (row.isConnected && prefersReducedMotion() !== true) {
				const last = row.getBoundingClientRect();
				const first = new Map();
				first.set(row, {
					left: last.left + followX,
					top: last.top + followY,
				});
				playFlip([row], first);
			}
		}
		this.host?.classList.remove('is-reordering');
	}
}
