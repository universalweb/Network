/*
	DESCRIPTION: Undo / redo for lane boards. The other half of core/board/moves.js:
	the gate decides whether a move may land, this remembers the ones that did.
	WHAT A BOARD MOVE ACTUALLY CHANGES
	  Exactly two things, at every mutation site on both boards: the ORDER of the
	  master items array, and named FIELDS on individual items (the lane field, and
	  on a schedule `start` / `end`). So a command is a delta of precisely those
	  two — not a serialized board, and not a replayable action log.
	WHY A DELTA AND NOT A SNAPSHOT PAIR
	  A snapshot pair is four lines shorter and costs O(n) memory PER MOVE. These
	  boards are meant to hold tens of thousands of cards, and dragging one card
	  must not copy the other nine thousand nine hundred and ninety-nine. The
	  before-capture is unavoidably O(n); what gets KEPT is only what moved, plus
	  the order array when — and only when — the order actually changed.
	COMMANDS HOLD ITEM REFERENCES
	  Undo works by writing values back onto the SAME objects the board is holding,
	  which is what keeps a parent's carrier in sync without a notify per item. The
	  cost is that a command pins the items it names, so the stack is bounded by
	  `limit` and dropped wholesale by `clear()`.
	── USAGE ────────────────────────────────────────────────────────────
	  history.begin(items, ['lane']);      // after the gate says yes
	  entry.lane = 'doing';                // …the board mutates…
	  history.commit(items, 'transfer');   // nothing changed → nothing pushed
	  history.undo(items);                 // → the command, or null
	  history.commit(columns, 'column-reorder', 'columns');
	  bag tags which array undo/redo must rewrite. Default 'items'.
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-31
*/
import { isArray } from '@universalweb/utilitylib';
import { copyRawItems, replaceItems } from './items.js';
/* Commands kept before the oldest is dropped. Deep enough that a dispatcher can
   walk back a bad batch, shallow enough that the pinned items stay bounded. */
export const DEFAULT_HISTORY_LIMIT = 50;
/**
 * A usable depth, or the default. Zero and negatives are rejected rather than
 * honoured: "keep no history" is what `clear()` and simply not calling `begin`
 * are for, and a silently disabled undo is the worst of the three.
 * @param {*} limit - Caller value.
 * @returns {number} A positive depth.
 */
function normalizeLimit(limit) {
	return Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_HISTORY_LIMIT;
}
/**
 * Read one item's tracked fields into a plain record.
 * @param {object} item - Board item.
 * @param {Array<string>} fields - Field names to read.
 * @returns {object} Field values.
 */
function readFields(item, fields) {
	const values = {};
	const count = fields.length;
	for (let index = 0; index < count; index += 1) {
		values[fields[index]] = item[fields[index]];
	}
	return values;
}
/**
 * Write a record of field values back onto an item.
 * @param {object} item - Board item.
 * @param {object} values - Field values.
 * @returns {void}
 */
function writeFields(item, values) {
	const keys = Object.keys(values);
	const count = keys.length;
	for (let index = 0; index < count; index += 1) {
		item[keys[index]] = values[keys[index]];
	}
}
/**
 * Whether two field records differ on any key.
 * @param {object} before - Values captured before.
 * @param {object} after - Values read after.
 * @returns {boolean} Whether anything changed.
 */
function fieldsDiffer(before, after) {
	const keys = Object.keys(before);
	const count = keys.length;
	for (let index = 0; index < count; index += 1) {
		if (before[keys[index]] !== after[keys[index]]) {
			return true;
		}
	}
	return false;
}
/**
 * Whether two arrays hold the same references in the same positions.
 * IDENTITY, not equality — a reorder moves the same objects around, so deep
 * comparison would report no change on exactly the case this must catch.
 * @param {Array} first - One array.
 * @param {Array} second - The other.
 * @returns {boolean} Whether the order is unchanged.
 */
function sameOrder(first, second) {
	if (first.length !== second.length) {
		return false;
	}
	const count = first.length;
	for (let index = 0; index < count; index += 1) {
		if (first[index] !== second[index]) {
			return false;
		}
	}
	return true;
}
/**
 * Capture the state a command will be diffed against.
 * @param {Array<object>} items - Master list.
 * @param {Array<string>} fields - Fields to track.
 * @returns {{order: Array<object>, values: Array<object>, fields: Array<string>}} Snapshot.
 */
export function captureBoard(items, fields) {
	const list = isArray(items) ? items : [];
	const tracked = isArray(fields) ? fields.slice() : [];
	const order = copyRawItems(list);
	const values = [];
	const count = order.length;
	for (let index = 0; index < count; index += 1) {
		values.push(order[index] ? readFields(order[index], tracked) : {});
	}
	return {
		order,
		values,
		fields: tracked,
	};
}
/**
 * Diff the live list against a snapshot into a command, or null when the move
 * changed nothing. A no-op must not reach the stack — an undo that visibly does
 * nothing is worse than no undo at all.
 * @param {object} snapshot - From captureBoard.
 * @param {Array<object>} items - The live master list, after the mutation.
 * @param {string} [label] - What the move was ('transfer', 'reorder', …).
 * @returns {object|null} Command, or null when nothing changed.
 */
export function diffBoard(snapshot, items, label = '') {
	if (!snapshot) {
		return null;
	}
	const list = isArray(items) ? items : [];
	const fields = snapshot.fields;
	const changes = [];
	const before = snapshot.order;
	const count = before.length;
	for (let index = 0; index < count; index += 1) {
		const item = before[index];
		if (!item) {
			continue;
		}
		const after = readFields(item, fields);
		if (fieldsDiffer(snapshot.values[index], after)) {
			changes.push({
				item,
				before: snapshot.values[index],
				after,
			});
		}
	}
	const liveOrder = copyRawItems(list);
	const orderChanged = !sameOrder(before, liveOrder);
	if (changes.length === 0 && !orderChanged) {
		return null;
	}
	return {
		label,
		changes,
		/* Only carried when the order moved. On a plain cross-lane drop this stays
		   null and the command costs one entry, whatever the board's size. */
		orderBefore: orderChanged ? before : null,
		orderAfter: orderChanged ? liveOrder : null,
	};
}
/**
 * Write one side of a command back onto the live list.
 * @param {Array<object>} items - Live master list (rewritten in place).
 * @param {object} command - From diffBoard.
 * @param {string} side - 'before' or 'after'.
 * @returns {void}
 */
function applyCommand(items, command, side) {
	const order = side === 'before' ? command.orderBefore : command.orderAfter;
	if (order) {
		replaceItems(items, order);
	}
	const changes = command.changes;
	const count = changes.length;
	for (let index = 0; index < count; index += 1) {
		writeFields(changes[index].item, changes[index][side]);
	}
}
export class BoardHistory {
	constructor(limit = DEFAULT_HISTORY_LIMIT) {
		this.limit = normalizeLimit(limit);
		this.done = [];
		this.undone = [];
		this.pending = null;
	}
	/**
	 * Re-depth an existing stack, trimming anything already past the new limit.
	 *
	 * Exists because a component cannot read `this.state` in `onInit` — that runs
	 * inside the constructor, before state is installed — so a board builds its
	 * history at the default depth and applies its configured one on connect.
	 * @param {*} limit - New depth.
	 * @returns {void}
	 */
	setLimit(limit) {
		this.limit = normalizeLimit(limit);
		while (this.done.length > this.limit) {
			this.done.shift();
		}
	}
	get canUndo() {
		return this.done.length > 0;
	}
	get canRedo() {
		return this.undone.length > 0;
	}
	get depth() {
		return this.done.length;
	}
	/**
	 * Newest undoable command, or null. The board reads `bag` here so undo
	 * rewrites columns when the command moved columns, not the items array.
	 * @returns {object|null} Command.
	 */
	peekUndo() {
		const done = this.done;
		return done.length > 0 ? done[done.length - 1] : null;
	}
	/**
	 * Newest redoable command, or null.
	 * @returns {object|null} Command.
	 */
	peekRedo() {
		const undone = this.undone;
		return undone.length > 0 ? undone[undone.length - 1] : null;
	}
	/**
	 * Capture the before-state. Called once the gate has ALLOWED a move, never on
	 * the refused path — a refusal mutates nothing, so there is nothing to diff.
	 * @param {Array<object>} items - Master list.
	 * @param {Array<string>} fields - Fields this board tracks.
	 * @returns {void}
	 */
	begin(items, fields) {
		this.pending = captureBoard(items, fields);
	}
	/** Drop a pending capture without recording anything. */
	abandon() {
		this.pending = null;
	}
	/**
	 * Close the move opened by `begin` and push it if it changed anything.
	 * @param {Array<object>} items - Master list, after the mutation.
	 * @param {string} [label] - Move kind.
	 * @param {string} [bag] - Which array this command rewrites ('items' | 'columns').
	 * @returns {object|null} The pushed command, or null.
	 */
	commit(items, label = '', bag = 'items') {
		const snapshot = this.pending;
		this.pending = null;
		const command = diffBoard(snapshot, items, label);
		if (!command) {
			return null;
		}
		command.bag = bag;
		this.done.push(command);
		/*
		 * A new move invalidates the redo branch. Keeping it would let a redo jump
		 * onto a timeline that no longer exists and write stale lanes back.
		 */
		this.undone.length = 0;
		if (this.done.length > this.limit) {
			this.done.shift();
		}
		return command;
	}
	/**
	 * Undo the newest command.
	 * @param {Array<object>} items - Master list (rewritten in place).
	 * @returns {object|null} The undone command, or null when there is none.
	 */
	undo(items) {
		const command = this.done.pop();
		if (!command) {
			return null;
		}
		applyCommand(items, command, 'before');
		this.undone.push(command);
		return command;
	}
	/**
	 * Redo the most recently undone command.
	 * @param {Array<object>} items - Master list (rewritten in place).
	 * @returns {object|null} The redone command, or null when there is none.
	 */
	redo(items) {
		const command = this.undone.pop();
		if (!command) {
			return null;
		}
		applyCommand(items, command, 'after');
		this.done.push(command);
		return command;
	}
	clear() {
		this.done.length = 0;
		this.undone.length = 0;
		this.pending = null;
	}
}
