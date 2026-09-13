/*
	DESCRIPTION: The master-items model shared by every lane board — ui-task-board
	(lanes are columns, position is ordinal) and ui-schedule-board (lanes are
	resources, position is time). Both keep one flat master `items` array as the
	source of truth and derive lanes from it; this module owns that derivation and
	nothing else.
	WHY A MODULE, NOT A BASE CLASS
	  A board's LANE MODEL is shared; its POSITION MODEL is not. Subclassing would
	  drag ui-order-list's ordinal reorder into a time canvas, which is already
	  REJECTED in ui-schedule-board's header for that reason. So the mechanism is
	  shared here and every policy — conflicts, tracks, snapping, permissions —
	  stays with the caller, reached through `decorate`.
	THE LANE FIELD IS CONFIGURABLE, AND THAT IS THE POINT
	  ui-task-board grouped on `item.lane`, ui-schedule-board on `item.resourceId`.
	  Same operation, two spellings, and one job could never be one shape. Naming
	  the field at the call site is not just migration relief: a dispatch board has
	  to show ONE job list grouped by status on a board and by technician on a
	  schedule, without the data changing underneath. A hard-coded field forbids
	  that; `laneField` is what makes the two views combinable later.
	MASTER ARRAYS ARE REWRITTEN IN PLACE, NEVER REASSIGNED
	  A board's `items` usually arrives from a parent's state carrier. Assigning a
	  new array replaces the carrier's reference and the parent silently keeps the
	  old one, so `replaceItems` splices and lets the caller notify.
	── USAGE ────────────────────────────────────────────────────────────
	  groupIntoLanes(columns, items, { laneField: 'lane' })
	  groupIntoLanes(resources, assignments, {
	    laneField: 'resourceId',
	    decorate: (lane) => { markConflicts(lane.items); },
	  })
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
/*
 * `@universalweb/utilitylib`, not the `webcomponent` bare specifier: that alias
 * is resolved by the browser importmap and does not exist to Node, so a pure
 * module imported straight by a node --test file must reach for the real
 * package. schedule-board/lanes.js takes the same route for the same reason.
 */
import { hasValue, isArray } from '@universalweb/utilitylib';
import { STATE_PATH } from '../state/state.js';
import { getValueAtPath } from '../utilities.js';
/* Walk at most this many wrappers. A stored proxy-of-proxy is one extra layer;
   more than a handful is a cycle, not a deeper wrap. */
const UNWRAP_DEPTH = 8;
// @engram em:network/code/replaceitems-must-unwrap-state-proxies-before-pushing-into-m — never store a proxy as a master slot
/**
 * The raw object a state/tracking proxy wraps. Non-proxies pass through.
 * Pushing a proxy into a proxied master stores the wrapper as the slot's raw
 * value; the next read wraps it again, and a later field write through that
 * chain recurses in the set trap until the stack blows.
 * @param {*} entry - Board item, possibly a reactive proxy.
 * @returns {*} The underlying object, or `entry` when it is not a proxy.
 */
export function unwrapBoardItem(entry) {
	let current = entry;
	for (let depth = 0; depth < UNWRAP_DEPTH; depth += 1) {
		if (!current || typeof current !== 'object') {
			return current;
		}
		const meta = current[STATE_PATH];
		if (meta === undefined) {
			return current;
		}
		let raw = current;
		if (meta.target != null) {
			raw = meta.target;
		} else if (meta.component?.STATE != null && meta.path) {
			raw = getValueAtPath(meta.component.STATE, meta.path);
		} else if (typeof meta.realm?.read === 'function') {
			raw = meta.realm.read(meta.path);
		}
		if (raw === current) {
			return current;
		}
		current = raw;
	}
	return current;
}
/**
 * Shallow copy of a master list with every slot unwrapped. History captures
 * and diffs identity against these, not against per-read wrappers.
 * @param {Array<object>} items - Master list, possibly proxied.
 * @returns {Array<object>} Raw objects in the same order.
 */
export function copyRawItems(items) {
	const list = isArray(items) ? items : [];
	const count = list.length;
	const raw = [];
	for (let index = 0; index < count; index += 1) {
		raw.push(unwrapBoardItem(list[index]));
	}
	return raw;
}
/* The field a board buckets on when the caller names none. */
export const DEFAULT_LANE_FIELD = 'lane';
/* The field an item's identity is read from when the caller names none. */
export const DEFAULT_DATA_KEY = 'id';
/**
 * One item's identity as a string. Falls back to `label` so a board still works
 * on hand-written fixtures that never got ids — an item with neither is '',
 * which findItem treats as no match rather than matching every other blank.
 * @param {object} item - Board item.
 * @param {string} [dataKey] - Field holding the identity.
 * @returns {string} The identity, or '' when the item has none.
 */
export function itemKey(item, dataKey = DEFAULT_DATA_KEY) {
	if (!item) {
		return '';
	}
	const value = item[dataKey];
	if (hasValue(value) && value !== '') {
		return String(value);
	}
	return String(item.label || '');
}
/**
 * Find one item in the master list by identity.
 * @param {Array<object>} items - Master list.
 * @param {*} id - Identity to match.
 * @param {string} [dataKey] - Field holding the identity.
 * @returns {object|null} The item, or null.
 */
export function findItem(items, id, dataKey = DEFAULT_DATA_KEY) {
	if (!isArray(items)) {
		return null;
	}
	const needle = String(id);
	/* A blank needle would match every unidentified item; nothing is safer. */
	if (needle === '') {
		return null;
	}
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		if (itemKey(items[index], dataKey) === needle) {
			return items[index];
		}
	}
	return null;
}
/**
 * Rewrite the master list IN PLACE. The caller notifies its own bus afterwards —
 * this module has no view of the component's reactivity.
 * @param {Array<object>} items - The live master array to rewrite.
 * @param {Array<object>} next - Replacement contents.
 * @returns {boolean} Whether the write happened.
 */
export function replaceItems(items, next) {
	if (!isArray(items) || !isArray(next)) {
		return false;
	}
	const rawNext = copyRawItems(next);
	items.length = 0;
	const count = rawNext.length;
	for (let index = 0; index < count; index += 1) {
		items.push(rawNext[index]);
	}
	return true;
}
/**
 * The lane id a column/resource descriptor declares.
 * @param {object} column - Lane descriptor.
 * @param {number} index - Position, used when the descriptor names no id.
 * @returns {string} Lane id.
 */
export function laneIdOf(column, index) {
	if (!column) {
		return String(index);
	}
	return String(column.id || column.value || index);
}
/**
 * Bucket a flat master list into lanes, in the order the columns declare.
 *
 * Every lane is emitted even when empty — a board with a lane missing is a
 * layout that changes shape as work moves through it, which is exactly what a
 * column-per-status board must not do.
 * @param {Array<object>} columns - Lane descriptors `{ id | value, label, … }`.
 * @param {Array<object>} items - Master item list.
 * @param {object} [options] - Grouping knobs.
 * @param {string} [options.laneField] - Item field naming its lane.
 * @param {Function} [options.decorate] - Called with each built lane; may mutate
 * it (conflicts, tracks, counts). Return value ignored — policy, not a filter.
 * @param {Function} [options.accept] - `(item, laneId) => boolean` extra filter,
 * for a board that also windows by date.
 * @returns {Array<{id: string, label: string, items: Array<object>, collapsed: boolean, locked: boolean}>} Lanes.
 */
export function groupIntoLanes(columns, items, options = {}) {
	const laneField = options.laneField || DEFAULT_LANE_FIELD;
	const decorate = options.decorate;
	const accept = options.accept;
	const columnList = isArray(columns) ? columns : [];
	const itemList = isArray(items) ? items : [];
	const columnCount = columnList.length;
	const itemCount = itemList.length;
	const lanes = [];
	for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
		const column = columnList[columnIndex];
		const laneId = laneIdOf(column, columnIndex);
		const laneItems = [];
		for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
			const entry = itemList[itemIndex];
			if (!entry || String(entry[laneField]) !== laneId) {
				continue;
			}
			if (accept && !accept(entry, laneId)) {
				continue;
			}
			laneItems.push(entry);
		}
		const lane = {
			id: laneId,
			label: column?.label || laneId,
			items: laneItems,
			collapsed: column?.collapsed === true,
			locked: column?.locked === true,
		};
		if (decorate) {
			decorate(lane, column);
		}
		lanes.push(lane);
	}
	return lanes;
}
