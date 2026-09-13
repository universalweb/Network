/*
	DESCRIPTION: ui-task-board — multi-lane board. Each lane is ui-task-column
	of ui-task-card rows (column owns card drag). Dropping a card onto another
	lane rewrites `item.lane` and restamps. Master `items` is the source of
	truth; do not reassign it under a parent carrier — splice/notify.
	MOVE RULES — core/board/moves.js gates every move before it lands.
	  readOnly · wipLimits `{ doing: 3 }` or a bare number · transitions
	  `{ todo: ['doing'] }` (a lane with no entry is unrestricted; [] seals it).
	── KEYBOARD ───────────────────────────────────────────────
	  Grab / move / drop, not modifier+arrows. Escape can only cancel a
	  move that is IN PROGRESS; an immediate-commit chord has nothing to
	  cancel. Space grabs the focused card or drops it; arrows while
	  grabbed aim the slot (up/down in-lane, left/right across columns);
	  Escape cancels; Enter activates (inline-edit the label) unless a
	  grab is in progress, in which case it drops. Pointer drag is unchanged.
	  Dblclick also activates. Right-click emits card-context-menu; the host
	  owns the menu (compose ui-context-menu — the board does not).
	  Columns, when columnReorderable: the same model on the header —
	  Space grab/drop, left/right aim, Escape cancel. Enter drops when
	  grabbing and toggles collapse when not. Exclusive with a card grab.
	  Drag a column by its header.
	── EVENTS ─────────────────────────────────────────────────
	  task-board:change { items, id, lane }
	  task-board:select { id, item, lane, ids, items, additive, range }
	    click / shift-range / ctrl-or-cmd toggle. ids/items are the set.
	  task-board:move { id, item, from, to, kind }  CANCELABLE — preventDefault()
	    refuses the move. Fires before anything is written.
	  task-board:refused { …move, rule, reason }  why a move did not land
	    (rule: read-only | transition | wip | veto | locked).
	  task-board:history { direction, label, canUndo, canRedo }  after undo/redo.
	  task-board:column-reorder { columns, id, from, to }
	    from/to are indices. Goes through the move gate and history.
	  task-board:column-collapse { id, collapsed }
	  task-board:card-create | card-update | card-delete  CANCELABLE veto
	    (same shape as task-board:move). After a landed item mutation,
	    task-board:change also fires with `kind`.
	  task-board:column-create | column-update | column-delete  CANCELABLE.
	    Field edits do not reorder; placeColumn is the only order mutation.
	  task-board:card-activate { id, item, lane }
	  task-board:card-context-menu { card, column, position }
	── HISTORY ──────────────────────────────────────────────
	  undo() / redo() → boolean. Only moves that LANDED are recorded, so a
	  refusal leaves no phantom command. readOnly blocks both directions.
	  historyLimit bounds the stack (each command pins the items it names).
	── SELECTION ────────────────────────────────────────────
	  selectionMode: 'multiple' (default) | 'single' | 'none'.
	  Click replaces, shift ranges along the painted lanes, ctrl/cmd toggles.
	  selectedItems() / clearSelection() / selectAll() are the bulk surface.
	── USAGE ──────────────────────────────────────────────────
	  <ui-task-board
	    .state.columns=${[{ id: 'todo', label: 'Todo' }]}
		.state.items=${[{ id: 'a', label: 'Wire pump', lane: 'todo' }]}
	    .state.wipLimits=${{ doing: 3 }}
	    @task-board:change=${this.onBoard}></ui-task-board>
	  Group the SAME items by another axis — columns of technicians, not statuses:
	  <ui-task-board .state.laneField=${'tech'} .state.columns=${crew}></ui-task-board>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import {
	DragReorder,
	indexFromSlotMids,
	isArray,
	WebComponent,
} from 'webcomponent';
import { BoardHistory } from '../../core/board/history.js';
import {
	copyRawItems,
	findItem,
	groupIntoLanes,
	itemKey,
	laneIdOf,
	replaceItems,
} from '../../core/board/items.js';
import { evaluateMove } from '../../core/board/moves.js';
import {
	BoardSelection,
	visibleKeys,
} from '../../core/board/selection.js';
import { UITaskColumn } from '../task-column/task-column.js';
function pointInBox(clientX, clientY, box) {
	return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom;
}
/**
 * Next unlocked lane index in `delta` direction, or `fromIndex` when none.
 * Locked columns are not drop targets for cards or for column reorder.
 * @param {Array<{locked?: boolean}>} lanes - Lane descriptors.
 * @param {number} fromIndex - Current index.
 * @param {number} delta - +1 or -1.
 * @returns {number} Unlocked index.
 */
function nextUnlockedIndex(lanes, fromIndex, delta) {
	if (!isArray(lanes) || delta === 0) {
		return fromIndex;
	}
	const count = lanes.length;
	let index = fromIndex + delta;
	while (index >= 0 && index < count) {
		if (lanes[index].locked !== true) {
			return index;
		}
		index += delta;
	}
	return fromIndex;
}
/**
 * Resolve a view-array entry to the master object in `members`.
 * Identity first; itemKey if the view holds a clone or a state proxy of the
 * same card. Never returns an object that is not already a master member.
 * @param {object} entry - View entry.
 * @param {Set<object>} members - Master items that live in this lane.
 * @param {string} dataKey - Identity field.
 * @returns {object|null} The master member, or null.
 */
function memberFromOrdered(entry, members, dataKey) {
	if (!entry) {
		return null;
	}
	if (members.has(entry)) {
		return entry;
	}
	const key = itemKey(entry, dataKey);
	if (!key) {
		return null;
	}
	for (const member of members) {
		if (itemKey(member, dataKey) === key) {
			return member;
		}
	}
	return null;
}
export class UITaskBoard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		taskBoard: './task-board.css',
	};
	static state = {
		columns: [],
		items: [],
		lanes: [],
		/*
		 * Which item field names its lane, and which holds its identity. Named
		 * rather than hard-coded so ONE job list can be grouped by status here and
		 * by technician on ui-schedule-board without the data changing shape.
		 */
		laneField: 'lane',
		dataKey: 'id',
		/*
		 * Move rules. All optional, all consulted by ONE gate before a move lands
		 * (core/board/moves.js) — a board that grew four separate checks would ask
		 * the same question in four places and eventually disagree with itself.
		 * wipLimits: `{ doing: 3 }` per lane, or a bare number capping every lane.
		 * transitions: `{ todo: ['doing'] }`. A lane with no entry is unrestricted;
		 * an empty array seals it.
		 */
		readOnly: false,
		wipLimits: null,
		transitions: null,
		/* Commands kept for undo. Each pins the items it names, so this is the
		   knob that bounds what the stack holds onto. */
		historyLimit: 50,
		/*
		 * Click selection. 'multiple' is the dispatch default (shift-range and
		 * ctrl/cmd toggle). 'single' replaces. 'none' ignores clicks.
		 */
		selectionMode: 'multiple',
		/*
		 * Drag columns by the header and keyboard-reorder them. Off until a
		 * caller asks — existing boards must not grow a second drag surface.
		 */
		columnReorderable: false,
	};
	onInit() {
		/*
		 * Cached forwarder, not a per-call arrow: the gate invokes this as a bare
		 * function, so a method reference would arrive without `this`. Same shape
		 * as ui-schedule-board's loadLanesForwarder.
		 */
		this.moveProbe = (move) => {
			return this.probeMove(move);
		};
		/*
		 * Default depth here, configured depth on connect: `onInit` runs inside the
		 * WebComponent constructor, where `this.state` does not exist yet. Reading
		 * state here throws on construction — which is why every other onInit body
		 * in this file only assigns forwarders and plain objects.
		 */
		this.history = new BoardHistory();
		this.selection = new BoardSelection();
		this.focusId = '';
		this.focusColumnId = '';
		this.cardGrab = null;
		this.columnGrab = null;
		this.pendingBag = null;
		this.columnSlotMids = null;
		this.decorateLane = (lane) => {
			this.stampLaneFlags(lane);
		};
		this.cardSerial = 0;
		this.columnSerial = 0;
		this.columnDrag = new DragReorder({
			owner: this,
			host: this,
			resolveIndex: 'resolveColumnIndex',
			onMove: 'moveColumnLive',
			onEnd: 'handleColumnDragEnd',
			locked: 'columnDragIsLocked',
		});
	}
	/*
	 * What undo has to put back. A column board moves work between lanes and
	 * reorders within one, so the lane field plus the array order is the whole
	 * story — ui-schedule-board tracks its clock fields on top of the same list.
	 */
	trackedFields() {
		return [
			this.laneField(),
			'label',
			'description',
			'priority',
			'assignee',
			'badge',
		];
	}
	trackedColumnFields() {
		return [
			'label',
			'wipLimit',
			'collapsed',
			'locked',
		];
	}
	/*
	 * The imperative half of the veto, as a CANCELABLE event — the house pattern
	 * for "a parent can hijack" (ui-tracker's tracker:select). It rides in as the
	 * gate's `canMove` predicate so there is still only one gate, and the
	 * component's public surface stays an event rather than a state callback.
	 */
	probeMove(move) {
		const kind = move?.kind;
		let eventName = 'task-board:move';
		if (kind === 'card-create') {
			eventName = 'task-board:card-create';
		} else if (kind === 'card-update') {
			eventName = 'task-board:card-update';
		} else if (kind === 'card-delete') {
			eventName = 'task-board:card-delete';
		} else if (kind === 'column-create') {
			eventName = 'task-board:column-create';
		} else if (kind === 'column-update') {
			eventName = 'task-board:column-update';
		} else if (kind === 'column-delete') {
			eventName = 'task-board:column-delete';
		}
		return this.emit(eventName, move, {
			cancelable: true,
		}) !== false;
	}
	moveRules() {
		return {
			readOnly: this.state.readOnly === true,
			wipLimits: this.mergedWipLimits(),
			transitions: this.state.transitions,
			canMove: this.moveProbe,
		};
	}
	mergedWipLimits() {
		const declared = this.state.wipLimits;
		if (typeof declared === 'number') {
			return declared;
		}
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		const merged = declared && typeof declared === 'object' ? {
			...declared,
		} : {};
		const count = columns.length;
		for (let index = 0; index < count; index += 1) {
			const column = columns[index];
			if (typeof column?.wipLimit === 'number') {
				merged[laneIdOf(column, index)] = column.wipLimit;
			}
		}
		return merged;
	}
	/**
	 * Ask the gate, and on a refusal snap the lanes back.
	 *
	 * The column has ALREADY moved the card in its own copy by the time the
	 * board hears about it, so a refusal that only returns leaves the screen
	 * showing a move that never happened. Rebuilding the lanes from the untouched
	 * master is what puts the card back where it belongs.
	 * @param {object} move - `{ id, item, from, to }`.
	 * @param {string} [bag] - Which array this command rewrites.
	 * @returns {boolean} Whether the move may proceed.
	 */
	allowMove(move, bag = 'items') {
		const verdict = evaluateMove(move, this.moveRules(), this.state.lanes);
		if (verdict.allowed) {
			/* Captured only on the ALLOWED path — a refusal mutates nothing, so
			   there would be nothing to diff it against. */
			const list = bag === 'columns' ? this.state.columns : this.state.items;
			const fields = bag === 'columns' ? this.trackedColumnFields() : this.trackedFields();
			this.pendingBag = bag;
			this.history.begin(list, fields);
			return true;
		}
		if (bag !== 'columns') {
			this.syncLanes();
		}
		this.emit('task-board:refused', {
			...move,
			rule: verdict.rule,
			reason: verdict.reason,
		});
		this.announce(verdict.reason);
		return false;
	}
	/**
	 * Close a move: record it, then announce it. Both mutation sites end here
	 * rather than each emitting its own change — they were already emitting the
	 * identical payload, and a recorded-but-unannounced move (or the reverse) is
	 * the drift that splitting them invites.
	 * @param {object} move - The same descriptor the gate saw.
	 * @param {string} [bag] - Which array this command rewrote.
	 * @returns {void}
	 */
	commitMove(move, bag) {
		const usedBag = bag || this.pendingBag || 'items';
		this.pendingBag = null;
		const list = usedBag === 'columns' ? this.state.columns : this.state.items;
		const command = this.history.commit(list, move.kind, usedBag);
		if (usedBag === 'columns') {
			if (move.kind === 'column-reorder') {
				this.emit('task-board:column-reorder', {
					columns: this.state.columns,
					id: move.id,
					from: move.fromIndex,
					to: move.toIndex,
				});
			}
		} else {
			this.emit('task-board:change', {
				items: this.state.items,
				id: move.id,
				lane: move.to,
				kind: move.kind,
			});
		}
		/*
		 * A landed move changes what undo can reach, so the history event fires
		 * here too — not only after undo/redo. Without it a consumer wiring undo
		 * buttons has to reach into `board.history` to know when to enable them,
		 * which makes an internal the public API.
		 */
		if (command) {
			this.emitHistory('commit', command.label);
		}
		const kind = move.kind || '';
		if (usedBag === 'columns') {
			const columnLabel = move.item?.label || move.id || 'column';
			if (kind === 'column-update') {
				this.announce(`Updated ${columnLabel} column.`);
				return;
			}
			if (kind === 'column-create') {
				this.announce(`Added ${columnLabel} column.`);
				return;
			}
			if (kind === 'column-delete') {
				this.announce(`Removed ${columnLabel} column.`);
				return;
			}
			this.announce(`Moved ${columnLabel} column.`);
			return;
		}
		const entry = this.findItem(move.id);
		const label = entry?.label || move.item?.label || move.id || 'Card';
		if (kind === 'card-update') {
			this.announce(`Updated ${label}.`);
			return;
		}
		if (kind === 'card-create') {
			this.announce(`Added ${label}.`);
			return;
		}
		if (kind === 'card-delete') {
			this.announce(`Removed ${label}.`);
			return;
		}
		this.announce(`Moved ${label} to ${move.to || 'the board'}.`);
	}
	emitHistory(direction, label) {
		this.emit('task-board:history', {
			direction,
			label,
			canUndo: this.history.canUndo,
			canRedo: this.history.canRedo,
		});
	}
	/**
	 * Step the history and republish. Read-only blocks BOTH directions: a board
	 * nobody may move is not a board whose past anyone may rewrite.
	 * @param {string} direction - 'undo' or 'redo'.
	 * @returns {boolean} Whether a command was applied.
	 */
	stepHistory(direction) {
		if (this.state.readOnly === true) {
			return false;
		}
		const peek = direction === 'redo' ? this.history.peekRedo() : this.history.peekUndo();
		if (!peek) {
			return false;
		}
		const usedBag = peek.bag === 'columns' ? 'columns' : 'items';
		const list = usedBag === 'columns' ? this.state.columns : this.state.items;
		let command = null;
		if (direction === 'redo') {
			command = this.history.redo(list);
		} else {
			command = this.history.undo(list);
		}
		if (!command) {
			return false;
		}
		this.stateBus?.notify(usedBag);
		this.syncLanes();
		this.retouchHistory(command);
		if (usedBag === 'columns') {
			this.emit('task-board:column-reorder', {
				columns: this.state.columns,
				id: '',
				from: '',
				to: '',
			});
		} else {
			this.emit('task-board:change', {
				items: this.state.items,
				id: '',
				lane: '',
			});
		}
		this.emitHistory(direction, command.label);
		this.announce(direction === 'undo' ? 'Move undone.' : 'Move redone.');
		return true;
	}
	undo() {
		return this.stepHistory('undo');
	}
	redo() {
		return this.stepHistory('redo');
	}
	onConnect() {
		this.observe([
			'columns',
			'items',
			'laneField',
			'dataKey',
			'columnReorderable',
		], this.syncLanes);
		this.observe('historyLimit', this.syncHistoryLimit, {
			immediate: true,
		});
		this.observe('selectionMode', this.syncSelectionMode, {
			immediate: true,
		});
		this.syncLanes();
		this.setAttribute('role', 'region');
		this.setAttribute('aria-label', 'Task board');
	}
	onMount() {
		this.syncCardTabStops();
		this.syncColumnTabStops();
	}
	onDisconnect() {
		this.columnDrag?.end();
	}
	syncHistoryLimit() {
		this.history.setLimit(this.state.historyLimit);
	}
	syncSelectionMode() {
		this.selection.setMode(this.state.selectionMode);
		this.selection.stamp(this.state.items, this.dataKey());
	}
	syncLanes() {
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		this.state.lanes = groupIntoLanes(columns, this.state.items, {
			laneField: this.laneField(),
			decorate: this.decorateLane,
		});
		this.style.setProperty('--task-board-cols', String(Math.max(columns.length, 1)));
		this.selection.prune(this.state.items, this.dataKey());
		this.selection.stamp(this.state.items, this.dataKey());
		this.syncCardTabStops();
		this.syncColumnTabStops();
		this.paintGrab();
	}
	stampLaneFlags(lane) {
		lane.reorderable = this.state.columnReorderable === true;
	}
	laneField() {
		return this.state.laneField || 'lane';
	}
	dataKey() {
		return this.state.dataKey || 'id';
	}
	columnFromEvent(domEvent) {
		const source = domEvent.detail?.source;
		if (source?.localName === 'ui-task-column') {
			return source;
		}
		return null;
	}
	columnAtPoint(clientX, clientY) {
		const columns = this.findComponents('ui-task-column') || [];
		const count = columns.length;
		for (let index = 0; index < count; index += 1) {
			const column = columns[index];
			if (pointInBox(clientX, clientY, column.getBoundingClientRect())) {
				return column;
			}
		}
		return null;
	}
	findItem(id) {
		return findItem(this.state.items, id, this.dataKey());
	}
	visibleKeys() {
		return visibleKeys(this.state.lanes, this.dataKey());
	}
	selectedItems() {
		return this.selection.items(this.state.items, this.dataKey());
	}
	clearSelection() {
		this.selection.clear();
		this.selection.stamp(this.state.items, this.dataKey());
	}
	selectAll() {
		this.selection.selectAll(this.visibleKeys());
		this.selection.stamp(this.state.items, this.dataKey());
	}
	publishSelection(id, modifiers) {
		const entry = this.findItem(id);
		this.selection.stamp(this.state.items, this.dataKey());
		this.emit('task-board:select', {
			id,
			item: entry,
			lane: entry?.[this.laneField()] || '',
			ids: this.selection.ids(),
			items: this.selection.items(this.state.items, this.dataKey()),
			additive: modifiers?.additive === true,
			range: modifiers?.range === true,
		});
	}
	handleCardSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id;
		if (!id) {
			return;
		}
		const modifiers = {
			additive: data?.additive === true,
			range: data?.range === true,
		};
		this.selection.apply(id, modifiers, this.visibleKeys());
		this.publishSelection(id, modifiers);
	}
	writeMaster(next) {
		if (!replaceItems(this.state.items, next)) {
			return;
		}
		this.stateBus?.notify('items');
		this.syncLanes();
	}
	writeColumns(next) {
		if (!replaceItems(this.state.columns, next)) {
			return false;
		}
		this.stateBus?.notify('columns');
		this.syncLanes();
		return true;
	}
	columnIndexOf(id) {
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		const needle = String(id);
		const count = columns.length;
		for (let index = 0; index < count; index += 1) {
			if (laneIdOf(columns[index], index) === needle) {
				return index;
			}
		}
		return -1;
	}
	columnById(id) {
		const needle = String(id);
		const columns = this.columns();
		const count = columns.length;
		for (let index = 0; index < count; index += 1) {
			if (String(columns[index].state.id) === needle) {
				return columns[index];
			}
		}
		return null;
	}
	columnLockedAt(index) {
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		return columns[index]?.locked === true;
	}
	laneIsLocked(laneId) {
		const lanes = isArray(this.state.lanes) ? this.state.lanes : [];
		const needle = String(laneId);
		const count = lanes.length;
		for (let index = 0; index < count; index += 1) {
			if (String(lanes[index].id) === needle) {
				return lanes[index].locked === true;
			}
		}
		return false;
	}
	laneIsCollapsed(laneId) {
		const lanes = isArray(this.state.lanes) ? this.state.lanes : [];
		const needle = String(laneId);
		const count = lanes.length;
		for (let index = 0; index < count; index += 1) {
			if (String(lanes[index].id) === needle) {
				return lanes[index].collapsed === true;
			}
		}
		return false;
	}
	refuseLocked(move, reason) {
		this.syncLanes();
		this.emit('task-board:refused', {
			...move,
			rule: 'locked',
			reason,
		});
		this.announce(reason);
	}
	columnDragIsLocked() {
		return this.state.columnReorderable !== true || this.state.readOnly === true;
	}
	/**
	 * Reorder columns in place through the same gate and history as a card
	 * move. The parent's columns array is rewritten, never reassigned.
	 * @param {number} fromIndex - Source index.
	 * @param {number} toIndex - Destination index.
	 * @returns {boolean} Whether the reorder landed.
	 */
	placeColumn(fromIndex, toIndex) {
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		const count = columns.length;
		if (fromIndex < 0 || toIndex < 0 || fromIndex >= count || toIndex >= count || fromIndex === toIndex) {
			return false;
		}
		if (this.columnLockedAt(fromIndex) || this.columnLockedAt(toIndex)) {
			const blocked = columns[this.columnLockedAt(fromIndex) ? fromIndex : toIndex];
			this.refuseLocked({
				id: laneIdOf(blocked, this.columnLockedAt(fromIndex) ? fromIndex : toIndex),
				from: laneIdOf(columns[fromIndex], fromIndex),
				to: laneIdOf(columns[toIndex], toIndex),
				kind: 'column-reorder',
			}, 'A locked column cannot be moved.');
			return false;
		}
		const source = columns[fromIndex];
		const dest = columns[toIndex];
		const move = {
			id: laneIdOf(source, fromIndex),
			item: source,
			from: laneIdOf(source, fromIndex),
			to: laneIdOf(dest, toIndex),
			kind: 'column-reorder',
			fromIndex,
			toIndex,
		};
		if (!this.allowMove(move, 'columns')) {
			return false;
		}
		const next = copyRawItems(columns);
		const [spliced] = next.splice(fromIndex, 1);
		next.splice(toIndex, 0, spliced);
		this.writeColumns(next);
		this.commitMove(move, 'columns');
		this.focusColumnId = move.id;
		this.setTimeout(this.onFocusColumnPending, 0);
		return true;
	}
	// @engram em:network/code/ui-task-board-drop-then-change-duplicates-and-reverts — view array is not membership
	/**
	 * Reorder items master already agrees live in `laneId`. The view array is
	 * not a membership authority — a stale source list after a cross-lane drop
	 * still holds the moved card, and trusting it would stamp the card back and
	 * splice the same object in twice. Foreign entries are ignored; omitted
	 * members keep their master order at the end of the lane block.
	 * @param {string} laneId - Lane whose members are being reordered.
	 * @param {Array<object>} ordered - View order; membership is taken from master.
	 * @returns {void}
	 */
	applyLaneOrder(laneId, ordered) {
		const items = isArray(this.state.items) ? this.state.items : [];
		const laneField = this.laneField();
		const laneIdStr = String(laneId);
		const members = new Set();
		const kept = [];
		let insertAt = -1;
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (entry && String(entry[laneField]) === laneIdStr) {
				members.add(entry);
				if (insertAt < 0) {
					insertAt = kept.length;
				}
				continue;
			}
			kept.push(entry);
		}
		if (insertAt < 0) {
			insertAt = kept.length;
		}
		const placed = new Set();
		const laneOrder = [];
		const orderedList = isArray(ordered) ? ordered : [];
		const orderedCount = orderedList.length;
		const key = this.dataKey();
		for (let index = 0; index < orderedCount; index += 1) {
			const member = memberFromOrdered(orderedList[index], members, key);
			if (!member || placed.has(member)) {
				continue;
			}
			placed.add(member);
			laneOrder.push(member);
		}
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (!members.has(entry) || placed.has(entry)) {
				continue;
			}
			placed.add(entry);
			laneOrder.push(entry);
		}
		const placedCount = laneOrder.length;
		for (let index = 0; index < placedCount; index += 1) {
			kept.splice(insertAt, 0, laneOrder[index]);
			insertAt += 1;
		}
		this.writeMaster(kept);
	}
	handleLaneChange(domEvent) {
		const column = this.columnFromEvent(domEvent);
		if (!column) {
			return;
		}
		/* from === to: a reorder moves no work between lanes, so the gate skips
		   WIP and transitions and only read-only / a caller veto can refuse it. */
		if (!this.allowMove({
			id: '',
			item: null,
			from: column.state.id,
			to: column.state.id,
			kind: 'reorder',
		})) {
			return;
		}
		const data = domEvent.detail?.data;
		const ordered = isArray(data?.items) ? data.items : (column.state.items || []);
		this.applyLaneOrder(column.state.id, ordered);
		this.commitMove({
			id: '',
			to: column.state.id,
			kind: 'reorder',
		});
	}
	/**
	 * Slot index in `column` for a drop at `clientY`. Dest rows do not include
	 * the dragged card, so a sentinel at the list bottom lets indexFromSlotMids
	 * return destCount (append) when the pointer is past the last mid.
	 * @param {object} column - Destination ui-task-column.
	 * @param {number} clientY - Pointer Y.
	 * @returns {number} Insert index among current dest members.
	 */
	dropIndexInLane(column, clientY) {
		const items = isArray(column?.state.items) ? column.state.items : [];
		const destCount = items.length;
		if (destCount === 0) {
			return 0;
		}
		const rows = column.rowById();
		const key = this.dataKey();
		const mids = [];
		for (let index = 0; index < destCount; index += 1) {
			const row = rows.get(itemKey(items[index], key));
			if (!row) {
				mids.push(0);
				continue;
			}
			const box = row.getBoundingClientRect();
			mids.push(box.top + (box.height / 2));
		}
		const listHost = column.refs?.list;
		if (listHost) {
			mids.push(listHost.getBoundingClientRect().bottom);
		}
		return indexFromSlotMids(mids, clientY, destCount);
	}
	/**
	 * Place `entry` at `destIndex` among items that already share its lane.
	 * Call after the lane field is written. Does not notify — writeMaster does.
	 * @param {object} entry - The moved item (already stamped to the dest lane).
	 * @param {number} destIndex - Index among dest-lane members.
	 * @returns {Array<object>} Next master contents.
	 */
	masterWithItemAtLaneIndex(entry, destIndex) {
		const items = isArray(this.state.items) ? this.state.items : [];
		const laneField = this.laneField();
		const laneId = String(entry[laneField] ?? '');
		const next = [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (items[index] !== entry) {
				next.push(items[index]);
			}
		}
		const slot = Number.isFinite(destIndex) && destIndex > 0 ? destIndex : 0;
		let seen = 0;
		let insertAt = next.length;
		const nextCount = next.length;
		for (let index = 0; index < nextCount; index += 1) {
			if (String(next[index][laneField]) !== laneId) {
				continue;
			}
			if (seen === slot) {
				insertAt = index;
				break;
			}
			seen += 1;
		}
		next.splice(insertAt, 0, entry);
		return next;
	}
	handleLaneDrop(domEvent) {
		const data = domEvent.detail?.data;
		if (!data?.id) {
			return;
		}
		const source = this.columnFromEvent(domEvent);
		const dest = this.columnAtPoint(data.clientX, data.clientY);
		if (!source) {
			return;
		}
		if (!dest) {
			this.syncLanes();
			return;
		}
		if (dest.state.locked === true) {
			this.refuseLocked({
				id: data.id,
				item: this.findItem(data.id),
				from: String(source.state.id),
				to: String(dest.state.id),
				kind: dest === source ? 'reorder' : 'transfer',
			}, 'This column is locked.');
			return;
		}
		if (dest === source) {
			if (Number(data.from) === Number(data.to)) {
				return;
			}
			if (!this.allowMove({
				id: data.id,
				item: this.findItem(data.id),
				from: String(source.state.id),
				to: String(source.state.id),
				kind: 'reorder',
			})) {
				return;
			}
			const ordered = isArray(data.items) ? data.items : (source.state.items || []);
			this.applyLaneOrder(source.state.id, ordered);
			this.commitMove({
				id: data.id,
				to: source.state.id,
				kind: 'reorder',
			});
			return;
		}
		const destIndex = this.dropIndexInLane(dest, data.clientY);
		this.placeCard(data.id, dest.state.id, destIndex);
	}
	/**
	 * One mutation for pointer transfer and keyboard drop. In-lane pointer
	 * reorder still goes through applyLaneOrder because the column has already
	 * spliced its view.
	 * @param {string} id - Card identity.
	 * @param {string} destLaneId - Destination lane.
	 * @param {number} destIndex - Index among dest-lane members.
	 * @returns {boolean} Whether the move landed.
	 */
	placeCard(id, destLaneId, destIndex) {
		const entry = this.findItem(id);
		if (!entry) {
			return false;
		}
		const laneField = this.laneField();
		const from = String(entry[laneField] ?? '');
		const to = String(destLaneId);
		const kind = from === to ? 'reorder' : 'transfer';
		if (this.laneIsLocked(to)) {
			this.refuseLocked({
				id,
				item: entry,
				from,
				to,
				kind,
			}, 'This column is locked.');
			return false;
		}
		if (!this.allowMove({
			id,
			item: entry,
			from,
			to,
			kind,
		})) {
			return false;
		}
		if (from === to) {
			const ordered = this.laneMembers(to);
			const next = [];
			const count = ordered.length;
			for (let index = 0; index < count; index += 1) {
				if (ordered[index] !== entry) {
					next.push(ordered[index]);
				}
			}
			const slot = Number.isFinite(destIndex) && destIndex > 0 ? Math.min(destIndex, next.length) : 0;
			next.splice(slot, 0, entry);
			this.applyLaneOrder(to, next);
		} else {
			entry[laneField] = to;
			this.writeMaster(this.masterWithItemAtLaneIndex(entry, destIndex));
		}
		this.commitMove({
			id,
			to,
			kind,
		});
		this.focusId = id;
		this.setTimeout(this.onFocusPending, 0);
		return true;
	}
	nextCardId() {
		this.cardSerial += 1;
		return `card-${this.cardSerial}`;
	}
	nextColumnId() {
		this.columnSerial += 1;
		return `column-${this.columnSerial}`;
	}
	addCard(item, laneId, index) {
		const laneField = this.laneField();
		const key = this.dataKey();
		const raw = item && typeof item === 'object' ? {
			...item,
		} : {};
		if (!raw[key]) {
			raw[key] = this.nextCardId();
		}
		raw[laneField] = String(laneId);
		const id = itemKey(raw, key);
		const dest = String(laneId);
		if (this.laneIsLocked(dest)) {
			this.refuseLocked({
				id,
				item: raw,
				from: '',
				to: dest,
				kind: 'card-create',
			}, 'This column is locked.');
			return null;
		}
		const move = {
			id,
			item: raw,
			from: '',
			to: dest,
			kind: 'card-create',
		};
		if (!this.allowMove(move)) {
			return null;
		}
		const next = copyRawItems(this.state.items);
		const members = this.laneMembers(dest);
		const slot = Number.isFinite(index) ? Math.max(0, Math.min(index, members.length)) : members.length;
		const insertAt = this.masterIndexForLaneSlot(dest, slot);
		next.splice(insertAt, 0, raw);
		this.writeMaster(next);
		this.commitMove(move);
		this.focusId = id;
		this.setTimeout(this.onFocusPending, 0);
		return raw;
	}
	masterIndexForLaneSlot(laneId, slot) {
		const items = isArray(this.state.items) ? this.state.items : [];
		const laneField = this.laneField();
		const needle = String(laneId);
		let seen = 0;
		let lastLaneIndex = -1;
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (!entry || String(entry[laneField]) !== needle) {
				continue;
			}
			if (seen === slot) {
				return index;
			}
			lastLaneIndex = index;
			seen += 1;
		}
		if (lastLaneIndex >= 0) {
			return lastLaneIndex + 1;
		}
		return count;
	}
	updateCard(id, patch) {
		const entry = this.findItem(id);
		if (!entry || !patch || typeof patch !== 'object') {
			return false;
		}
		const laneField = this.laneField();
		const from = String(entry[laneField] ?? '');
		const to = patch[laneField] === undefined ? from : String(patch[laneField]);
		if (this.laneIsLocked(from) || this.laneIsLocked(to)) {
			this.refuseLocked({
				id,
				item: entry,
				from,
				to,
				kind: 'card-update',
				patch,
			}, 'This column is locked.');
			return false;
		}
		const move = {
			id,
			item: entry,
			from,
			to,
			kind: 'card-update',
			patch,
		};
		if (!this.allowMove(move)) {
			return false;
		}
		const keys = Object.keys(patch);
		const keyCount = keys.length;
		for (let index = 0; index < keyCount; index += 1) {
			const field = keys[index];
			if (field === 'id') {
				continue;
			}
			entry[field] = patch[field];
		}
		this.stateBus?.notify('items');
		this.syncLanes();
		this.retouchCard(id);
		this.commitMove(move);
		return true;
	}
	retouchCard(id) {
		const entry = this.findItem(id);
		const card = this.cardById(id);
		if (!card || !entry) {
			return;
		}
		card.assignState({
			label: entry.label,
			description: entry.description,
			priority: entry.priority,
			assignee: entry.assignee,
			badge: entry.badge,
		});
	}
	retouchColumn(id) {
		const index = this.columnIndexOf(id);
		const column = this.columnById(id);
		if (!column || index < 0) {
			return;
		}
		const descriptor = this.state.columns[index];
		column.assignState({
			label: descriptor.label,
			collapsed: descriptor.collapsed === true,
			locked: descriptor.locked === true,
		});
	}
	retouchHistory(command) {
		if (!command || !isArray(command.changes)) {
			return;
		}
		const count = command.changes.length;
		const key = this.dataKey();
		const usedBag = command.bag === 'columns' ? 'columns' : 'items';
		for (let index = 0; index < count; index += 1) {
			const entry = command.changes[index].item;
			if (!entry) {
				continue;
			}
			if (usedBag === 'columns') {
				this.retouchColumn(String(entry.id || ''));
				continue;
			}
			this.retouchCard(itemKey(entry, key));
		}
	}
	removeCard(id) {
		const entry = this.findItem(id);
		if (!entry) {
			return false;
		}
		const laneField = this.laneField();
		const from = String(entry[laneField] ?? '');
		if (this.laneIsLocked(from)) {
			this.refuseLocked({
				id,
				item: entry,
				from,
				to: from,
				kind: 'card-delete',
			}, 'This column is locked.');
			return false;
		}
		const move = {
			id,
			item: entry,
			from,
			to: from,
			kind: 'card-delete',
		};
		if (!this.allowMove(move)) {
			return false;
		}
		const next = [];
		const items = copyRawItems(this.state.items);
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (items[index] !== entry && itemKey(items[index], this.dataKey()) !== String(id)) {
				next.push(items[index]);
			}
		}
		this.writeMaster(next);
		this.commitMove(move);
		return true;
	}
	addColumn(column, index) {
		const raw = column && typeof column === 'object' ? {
			...column,
		} : {};
		if (!raw.id) {
			raw.id = this.nextColumnId();
		}
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		const slot = Number.isFinite(index) ? Math.max(0, Math.min(index, columns.length)) : columns.length;
		const move = {
			id: String(raw.id),
			item: raw,
			from: '',
			to: String(raw.id),
			kind: 'column-create',
			fromIndex: slot,
			toIndex: slot,
		};
		if (!this.allowMove(move, 'columns')) {
			return null;
		}
		const next = copyRawItems(columns);
		next.splice(slot, 0, raw);
		this.writeColumns(next);
		this.commitMove(move, 'columns');
		return raw;
	}
	updateColumn(id, patch) {
		const index = this.columnIndexOf(id);
		if (index < 0 || !patch || typeof patch !== 'object') {
			return false;
		}
		const columns = this.state.columns;
		const column = columns[index];
		if (column.locked === true && patch.locked !== false) {
			this.refuseLocked({
				id,
				item: column,
				from: String(id),
				to: String(id),
				kind: 'column-update',
				patch,
			}, 'This column is locked.');
			return false;
		}
		const move = {
			id: String(id),
			item: column,
			from: String(id),
			to: String(id),
			kind: 'column-update',
			patch,
		};
		if (!this.allowMove(move, 'columns')) {
			return false;
		}
		const keys = Object.keys(patch);
		const keyCount = keys.length;
		for (let fieldIndex = 0; fieldIndex < keyCount; fieldIndex += 1) {
			const field = keys[fieldIndex];
			if (field === 'id') {
				continue;
			}
			column[field] = patch[field];
		}
		this.stateBus?.notify('columns');
		this.syncLanes();
		this.retouchColumn(id);
		this.commitMove(move, 'columns');
		return true;
	}
	removeColumn(id) {
		const index = this.columnIndexOf(id);
		if (index < 0) {
			return false;
		}
		const columns = this.state.columns;
		const column = columns[index];
		if (column.locked === true) {
			this.refuseLocked({
				id,
				item: column,
				from: String(id),
				to: String(id),
				kind: 'column-delete',
			}, 'A locked column cannot be removed.');
			return false;
		}
		const move = {
			id: String(id),
			item: column,
			from: String(id),
			to: String(id),
			kind: 'column-delete',
			fromIndex: index,
			toIndex: index,
		};
		if (!this.allowMove(move, 'columns')) {
			return false;
		}
		const next = copyRawItems(columns);
		next.splice(index, 1);
		this.writeColumns(next);
		this.commitMove(move, 'columns');
		return true;
	}
	activateCard(id) {
		const entry = this.findItem(id);
		if (!entry) {
			return false;
		}
		this.selection.apply(id, {}, this.visibleKeys());
		this.publishSelection(id, {});
		this.emit('task-board:card-activate', {
			id,
			item: entry,
			lane: entry[this.laneField()] || '',
		});
		const card = this.cardById(id);
		card?.beginEdit('label');
		return true;
	}
	handleCardActivate(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		this.activateCard(id);
	}
	handleCardEdit(domEvent) {
		const data = domEvent.detail?.data;
		if (!data?.id || !data.field) {
			return;
		}
		const landed = this.updateCard(data.id, {
			[data.field]: data.value,
		});
		if (!landed) {
			const card = this.cardById(data.id);
			card?.cancelEdit();
		}
	}
	handleCardContextMenu(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id;
		if (!id) {
			return;
		}
		const entry = this.findItem(id);
		const laneId = entry ? String(entry[this.laneField()] ?? '') : '';
		this.emit('task-board:card-context-menu', {
			card: entry,
			column: laneId,
			position: {
				x: data.clientX,
				y: data.clientY,
			},
		});
	}
	handleColumnEdit(domEvent) {
		const data = domEvent.detail?.data;
		if (!data?.id || !data.field) {
			return;
		}
		const patch = {
			[data.field]: data.value,
		};
		const landed = this.updateColumn(data.id, patch);
		if (!landed) {
			const column = this.columnById(data.id);
			column?.cancelEdit();
		}
	}
	laneMembers(laneId) {
		const items = isArray(this.state.items) ? this.state.items : [];
		const members = [];
		const laneField = this.laneField();
		const needle = String(laneId);
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (entry && String(entry[laneField]) === needle) {
				members.push(entry);
			}
		}
		return members;
	}
	announce(text) {
		const live = this.refs.live;
		if (!live) {
			return;
		}
		live.textContent = '';
		live.textContent = text || '';
	}
	columns() {
		return this.findComponents('ui-task-column') || [];
	}
	cardById(id) {
		const needle = String(id);
		const key = this.dataKey();
		const cards = this.findComponents('ui-task-card') || [];
		const count = cards.length;
		for (let index = 0; index < count; index += 1) {
			if (itemKey(cards[index].state, key) === needle) {
				return cards[index];
			}
		}
		return null;
	}
	syncCardTabStops() {
		const cards = this.findComponents('ui-task-card') || [];
		const count = cards.length;
		if (count === 0) {
			return;
		}
		const key = this.dataKey();
		const laneField = this.laneField();
		let focusId = this.focusId;
		let focusOk = false;
		if (focusId) {
			for (let index = 0; index < count; index += 1) {
				const card = cards[index];
				if (card.state.disabled === true) {
					continue;
				}
				if (this.laneIsCollapsed(card.state[laneField])) {
					continue;
				}
				if (itemKey(card.state, key) === focusId) {
					focusOk = true;
					break;
				}
			}
		}
		if (focusOk !== true) {
			focusId = '';
			for (let index = 0; index < count; index += 1) {
				const card = cards[index];
				if (card.state.disabled === true) {
					continue;
				}
				if (this.laneIsCollapsed(card.state[laneField])) {
					continue;
				}
				focusId = itemKey(card.state, key);
				break;
			}
			this.focusId = focusId;
		}
		for (let index = 0; index < count; index += 1) {
			const card = cards[index];
			const disabled = card.state.disabled === true;
			const collapsed = this.laneIsCollapsed(card.state[laneField]);
			card.tabIndex = !disabled && collapsed !== true && itemKey(card.state, key) === focusId ? 0 : -1;
		}
	}
	syncColumnTabStops(component) {
		const board = component || this;
		const columns = board.columns();
		const count = columns.length;
		if (count === 0) {
			return;
		}
		const enabled = board.state.columnReorderable === true && board.state.readOnly !== true;
		if (enabled !== true) {
			for (let index = 0; index < count; index += 1) {
				columns[index].setHeaderTabStop(false);
			}
			return;
		}
		let focusId = board.focusColumnId;
		const focusIndex = board.columnIndexOf(focusId);
		if (focusIndex < 0 || board.columnLockedAt(focusIndex)) {
			focusId = '';
			const descriptors = isArray(board.state.columns) ? board.state.columns : [];
			const descCount = descriptors.length;
			for (let index = 0; index < descCount; index += 1) {
				if (descriptors[index].locked !== true) {
					focusId = laneIdOf(descriptors[index], index);
					break;
				}
			}
			board.focusColumnId = focusId;
		}
		for (let index = 0; index < count; index += 1) {
			const column = columns[index];
			const id = String(column.state.id);
			const locked = column.state.locked === true;
			column.setHeaderTabStop(enabled && locked !== true && id === focusId);
		}
	}
	onFocusPending(component) {
		const board = component || this;
		board.syncCardTabStops();
		board.paintGrab();
		const card = board.cardById(board.focusId);
		if (card) {
			card.focus();
		}
	}
	onFocusColumnPending(component) {
		const board = component || this;
		board.syncColumnTabStops();
		board.paintGrab();
		const column = board.columnById(board.focusColumnId);
		const head = column?.refs.head;
		if (head) {
			head.focus();
		}
	}
	paintGrab() {
		const cardGrab = this.cardGrab;
		const columnGrab = this.columnGrab;
		const grabbedId = cardGrab ? cardGrab.id : '';
		const destLane = cardGrab ? cardGrab.destLane : '';
		const cards = this.findComponents('ui-task-card') || [];
		const cardCount = cards.length;
		const key = this.dataKey();
		for (let index = 0; index < cardCount; index += 1) {
			const card = cards[index];
			card.setGrabbed(itemKey(card.state, key) === grabbedId);
		}
		const columns = this.columns();
		const columnCount = columns.length;
		const descriptors = isArray(this.state.columns) ? this.state.columns : [];
		let grabbedColumnId = '';
		let destColumnId = '';
		if (columnGrab) {
			grabbedColumnId = String(columnGrab.id);
			const dest = descriptors[columnGrab.destIndex];
			destColumnId = dest ? laneIdOf(dest, columnGrab.destIndex) : '';
		}
		for (let index = 0; index < columnCount; index += 1) {
			const column = columns[index];
			const columnId = String(column.state.id);
			column.setHeaderGrabbed(columnId === grabbedColumnId);
			const dropLane = cardGrab ? destLane : destColumnId;
			column.setDropTarget(columnId === dropLane);
		}
	}
	handleCardKey(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id;
		const key = data?.key;
		if (!id || !key) {
			return;
		}
		switch (key) {
			case 'ArrowUp': {
				this.stepFocusOrGrab(id, 0, -1);
				break;
			}
			case 'ArrowDown': {
				this.stepFocusOrGrab(id, 0, 1);
				break;
			}
			case 'ArrowLeft': {
				this.stepFocusOrGrab(id, -1, 0);
				break;
			}
			case 'ArrowRight': {
				this.stepFocusOrGrab(id, 1, 0);
				break;
			}
			case ' ': {
				this.toggleGrab(id);
				break;
			}
			case 'Enter': {
				if (this.cardGrab) {
					this.dropGrab();
					break;
				}
				this.activateCard(id);
				break;
			}
			case 'Escape': {
				this.cancelGrab();
				this.cancelColumnGrab();
				break;
			}
			default: {
				break;
			}
		}
	}
	toggleGrab(id) {
		if (this.cardGrab && this.cardGrab.id === id) {
			this.dropGrab();
			return;
		}
		if (this.cardGrab) {
			this.cancelGrab();
		}
		this.grabCard(id);
	}
	grabCard(id) {
		const entry = this.findItem(id);
		if (!entry) {
			return;
		}
		if (this.columnGrab) {
			this.columnGrab = null;
		}
		const laneId = String(entry[this.laneField()] ?? '');
		const members = this.laneMembers(laneId);
		let fromIndex = 0;
		const count = members.length;
		for (let index = 0; index < count; index += 1) {
			if (members[index] === entry) {
				fromIndex = index;
				break;
			}
		}
		this.cardGrab = {
			id,
			fromLane: laneId,
			fromIndex,
			destLane: laneId,
			destIndex: fromIndex,
		};
		this.focusId = id;
		this.paintGrab();
		this.announce(`Grabbed ${entry.label || id}. Arrow keys choose a slot, Space drops, Escape cancels.`);
	}
	cancelGrab() {
		if (!this.cardGrab) {
			return;
		}
		this.cardGrab = null;
		this.paintGrab();
		this.announce('Move cancelled.');
	}
	dropGrab() {
		const grab = this.cardGrab;
		if (!grab) {
			return;
		}
		this.cardGrab = null;
		this.paintGrab();
		const landed = this.placeCard(grab.id, grab.destLane, grab.destIndex);
		if (!landed) {
			this.cardGrab = grab;
			this.paintGrab();
		}
	}
	stepFocusOrGrab(id, laneDelta, itemDelta) {
		if (this.cardGrab) {
			this.aimGrab(laneDelta, itemDelta);
			return;
		}
		this.moveFocus(id, laneDelta, itemDelta);
	}
	aimGrab(laneDelta, itemDelta) {
		const grab = this.cardGrab;
		if (!grab) {
			return;
		}
		const columns = isArray(this.state.lanes) ? this.state.lanes : [];
		const columnCount = columns.length;
		let laneIndex = 0;
		for (let index = 0; index < columnCount; index += 1) {
			if (String(columns[index].id) === String(grab.destLane)) {
				laneIndex = index;
				break;
			}
		}
		const nextLane = nextUnlockedIndex(columns, laneIndex, laneDelta);
		const destLane = String(columns[nextLane].id);
		const destCount = this.laneMembers(destLane).length;
		const maxIndex = destLane === grab.fromLane ? Math.max(0, destCount - 1) : destCount;
		let destIndex = grab.destIndex;
		if (laneDelta !== 0) {
			destIndex = Math.min(grab.destIndex, maxIndex);
		}
		destIndex = Math.max(0, Math.min(maxIndex, destIndex + itemDelta));
		grab.destLane = destLane;
		grab.destIndex = destIndex;
		this.paintGrab();
		const laneLabel = columns[nextLane].label || destLane;
		this.announce(`Drop on ${laneLabel}, position ${destIndex + 1}.`);
	}
	moveFocus(id, laneDelta, itemDelta) {
		const lanes = isArray(this.state.lanes) ? this.state.lanes : [];
		const key = this.dataKey();
		let laneIndex = 0;
		let itemIndex = 0;
		const laneCount = lanes.length;
		for (let lanePos = 0; lanePos < laneCount; lanePos += 1) {
			const members = isArray(lanes[lanePos].items) ? lanes[lanePos].items : [];
			const memberCount = members.length;
			for (let memberPos = 0; memberPos < memberCount; memberPos += 1) {
				if (itemKey(members[memberPos], key) === String(id)) {
					laneIndex = lanePos;
					itemIndex = memberPos;
				}
			}
		}
		const nextLane = nextUnlockedIndex(lanes, laneIndex, laneDelta);
		if (lanes[nextLane]?.collapsed === true) {
			return;
		}
		const destMembers = isArray(lanes[nextLane]?.items) ? lanes[nextLane].items : [];
		const destCount = destMembers.length;
		if (destCount === 0) {
			return;
		}
		let nextItem = Math.min(itemIndex, destCount - 1);
		if (laneDelta === 0) {
			nextItem = itemIndex + itemDelta;
		}
		if (nextItem < 0 || nextItem >= destCount) {
			return;
		}
		const nextId = itemKey(destMembers[nextItem], key);
		if (!nextId) {
			return;
		}
		this.focusId = nextId;
		this.onFocusPending();
	}
	resolveColumnIndex(pointerEvent) {
		if (!this.columnSlotMids) {
			this.snapshotColumnMids();
		}
		return indexFromSlotMids(this.columnSlotMids, pointerEvent.clientX, this.columnDrag.dragIndex);
	}
	snapshotColumnMids() {
		const columns = this.columns();
		const row = this.columnDrag.dragRow;
		const previous = row ? row.style.transform : '';
		if (row) {
			row.style.transform = '';
		}
		const count = columns.length;
		const mids = [];
		for (let index = 0; index < count; index += 1) {
			const box = columns[index].getBoundingClientRect();
			mids.push(box.left + (box.width / 2));
		}
		if (row) {
			row.style.transform = previous;
		}
		this.columnSlotMids = mids;
	}
	/**
	 * Pointer-follow only. Splicing here would mutate before history.begin,
	 * so the drop commits through placeColumn.
	 * @param {number} fromIndex - Drag source.
	 * @param {number} toIndex - Slot under the pointer.
	 * @returns {boolean} Whether the aimed slot may be taken.
	 */
	moveColumnLive(fromIndex, toIndex) {
		if (fromIndex === toIndex) {
			return false;
		}
		if (this.columnLockedAt(fromIndex) || this.columnLockedAt(toIndex)) {
			return false;
		}
		return true;
	}
	handleColumnDragEnd(info) {
		this.columnSlotMids = null;
		if (!info || info.from === info.to) {
			return;
		}
		this.placeColumn(info.from, info.to);
	}
	handleColumnHeaderDrag(domEvent) {
		if (this.columnDragIsLocked()) {
			return;
		}
		if (this.columnDrag.active) {
			return;
		}
		const data = domEvent.detail?.data;
		const id = data?.id;
		if (!id) {
			return;
		}
		if (this.columnGrab) {
			this.columnGrab = null;
		}
		if (this.cardGrab) {
			this.cardGrab = null;
			this.paintGrab();
		}
		const fromIndex = this.columnIndexOf(id);
		if (fromIndex < 0 || this.columnLockedAt(fromIndex)) {
			return;
		}
		const column = this.columnById(id);
		if (!column) {
			return;
		}
		this.snapshotColumnMids();
		this.columnDrag.start(domEvent, fromIndex, column);
	}
	handleColumnHeaderKey(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id;
		const key = data?.key;
		if (!id || !key) {
			return;
		}
		switch (key) {
			case 'ArrowLeft':
			case 'ArrowUp': {
				this.stepColumnFocusOrGrab(id, -1);
				break;
			}
			case 'ArrowRight':
			case 'ArrowDown': {
				this.stepColumnFocusOrGrab(id, 1);
				break;
			}
			case ' ': {
				this.toggleColumnGrab(id);
				break;
			}
			case 'Enter': {
				if (this.columnGrab) {
					this.dropColumn();
					break;
				}
				const index = this.columnIndexOf(id);
				const columns = isArray(this.state.columns) ? this.state.columns : [];
				this.setColumnCollapsed(id, columns[index]?.collapsed !== true);
				break;
			}
			case 'Escape': {
				this.cancelColumnGrab();
				break;
			}
			default: {
				break;
			}
		}
	}
	handleColumnCollapse(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id;
		if (!id) {
			return;
		}
		this.setColumnCollapsed(id, data.collapsed === true);
	}
	setColumnCollapsed(id, collapsed) {
		const index = this.columnIndexOf(id);
		if (index < 0) {
			return false;
		}
		const columns = this.state.columns;
		const column = columns[index];
		const next = collapsed === true;
		if (column.collapsed === next) {
			return false;
		}
		column.collapsed = next;
		this.stateBus?.notify('columns');
		this.syncLanes();
		this.emit('task-board:column-collapse', {
			id: String(id),
			collapsed: next,
		});
		const label = column.label || id;
		this.announce(next ? `Collapsed ${label}.` : `Expanded ${label}.`);
		return true;
	}
	toggleColumnGrab(id) {
		if (this.columnGrab && this.columnGrab.id === id) {
			this.dropColumn();
			return;
		}
		if (this.columnGrab) {
			this.cancelColumnGrab();
		}
		this.grabColumn(id);
	}
	grabColumn(id) {
		if (this.columnDragIsLocked()) {
			return;
		}
		const fromIndex = this.columnIndexOf(id);
		if (fromIndex < 0 || this.columnLockedAt(fromIndex)) {
			return;
		}
		if (this.cardGrab) {
			this.cardGrab = null;
		}
		this.columnGrab = {
			id: String(id),
			fromIndex,
			destIndex: fromIndex,
		};
		this.focusColumnId = String(id);
		this.paintGrab();
		const column = this.state.columns[fromIndex];
		this.announce(`Grabbed ${column?.label || id} column. Arrow keys choose a slot, Space drops, Escape cancels.`);
	}
	cancelColumnGrab() {
		if (!this.columnGrab) {
			return;
		}
		this.columnGrab = null;
		this.paintGrab();
		this.announce('Move cancelled.');
	}
	dropColumn() {
		const grab = this.columnGrab;
		if (!grab) {
			return;
		}
		this.columnGrab = null;
		this.paintGrab();
		if (grab.fromIndex === grab.destIndex) {
			this.announce('Move cancelled.');
			return;
		}
		const landed = this.placeColumn(grab.fromIndex, grab.destIndex);
		if (!landed) {
			this.columnGrab = grab;
			this.paintGrab();
		}
	}
	stepColumnFocusOrGrab(id, delta) {
		if (this.columnGrab) {
			this.aimColumn(delta);
			return;
		}
		this.moveColumnFocus(id, delta);
	}
	aimColumn(delta) {
		const grab = this.columnGrab;
		if (!grab) {
			return;
		}
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		const next = nextUnlockedIndex(columns, grab.destIndex, delta);
		grab.destIndex = next;
		this.paintGrab();
		const dest = columns[next];
		const label = dest?.label || laneIdOf(dest, next);
		this.announce(`Drop as ${label} column, position ${next + 1}.`);
	}
	moveColumnFocus(id, delta) {
		const columns = isArray(this.state.columns) ? this.state.columns : [];
		const fromIndex = this.columnIndexOf(id);
		if (fromIndex < 0) {
			return;
		}
		const next = nextUnlockedIndex(columns, fromIndex, delta);
		if (next === fromIndex) {
			return;
		}
		this.focusColumnId = laneIdOf(columns[next], next);
		this.onFocusColumnPending();
	}
	laneKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<div class="task-board"
				@task-column:change=${this.handleLaneChange}
				@task-column:drop=${this.handleLaneDrop}
				@task-column:header-drag=${this.handleColumnHeaderDrag}
				@task-column:header-key=${this.handleColumnHeaderKey}
				@task-column:collapse=${this.handleColumnCollapse}
				@task-card:select=${this.handleCardSelect}
				@task-card:key=${this.handleCardKey}
				@task-card:activate=${this.handleCardActivate}
				@task-card:edit=${this.handleCardEdit}
				@task-card:context-menu=${this.handleCardContextMenu}
				@task-column:edit=${this.handleColumnEdit}>
				${this.list('lanes', UITaskColumn, this.laneKey)}
				<div class="task-board-live" #live aria-live="polite" aria-atomic="true"></div>
			</div>
		`;
	}
}
customElements.define('ui-task-board', UITaskBoard);
