/*
	DESCRIPTION: Selection for lane boards. Click, shift-range and ctrl/cmd
	toggle are one mechanism, not three handlers, and both boards ask it the
	same way: an identity, the modifier flags, and the VISIBLE order.
	WHY A MODULE, NOT LISTBOX
	  ui-listbox is a form control over value/values. It has no shift-range,
	  and its identity is `item.value`. A board ranges over the painted order
	  of cards — column-major on a task board, resource-then-time on a
	  schedule — which the caller names per click as `orderedIds`. Sharing
	  listbox would drag form-control value semantics into a dispatch board.
	WHY A SET OF KEYS, NOT A FLAG ALONE
	  Membership is view state. The Set is the source of truth; `stamp` writes
	  `item.selected` onto the live objects so list rows paint, the same parent-
	  writes-the-flag pattern as ui-listbox. Range and toggle consult the Set,
	  not a scan of the master list.
	THE ANCHOR
	  A plain click and a toggle move it. A shift-range does NOT — that is
	  what lets a dispatcher grow and shrink one range from the same origin.
	── USAGE ────────────────────────────────────────────────────────────
	  selection.apply('pump', { additive: false, range: true }, visibleKeys);
	  selection.stamp(items);
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-09-02
*/
import { isArray } from '@universalweb/utilitylib';
import { itemKey } from './items.js';
const MODES = new Set([
	'single',
	'multiple',
	'none',
]);
/**
 * Normalize a caller mode. Anything unknown becomes multiple — that is the
 * PrimeUI-parity default, and a typo must not silently disable selection.
 * @param {*} mode - Caller value.
 * @returns {'single'|'multiple'|'none'} A known mode.
 */
function normalizeMode(mode) {
	const token = String(mode || '');
	if (MODES.has(token)) {
		return token;
	}
	return 'multiple';
}
/**
 * Modifier flags from a pointer event. Boards pass these through, never the
 * event itself — the module must not depend on a DOM shape.
 * @param {MouseEvent|KeyboardEvent|null} [domEvent] - Click or key event.
 * @returns {{additive: boolean, range: boolean}} Modifier flags.
 */
export function clickModifiers(domEvent) {
	if (!domEvent) {
		return {
			additive: false,
			range: false,
		};
	}
	return {
		additive: domEvent.metaKey === true || domEvent.ctrlKey === true,
		range: domEvent.shiftKey === true,
	};
}
/**
 * Lane-major identity list: every item in the first lane, then the next, in
 * the order each lane already holds. That is the visual order a shift-range
 * walks — not master-array order, which a regroup would scramble.
 * @param {Array<{items?: Array}>} lanes - Current lanes.
 * @param {string} [dataKey] - Identity field.
 * @returns {Array<string>} Visible identities, blanks dropped.
 */
export function visibleKeys(lanes, dataKey) {
	const keys = [];
	if (!isArray(lanes)) {
		return keys;
	}
	const laneCount = lanes.length;
	for (let laneIndex = 0; laneIndex < laneCount; laneIndex += 1) {
		const entries = lanes[laneIndex]?.items;
		if (!isArray(entries)) {
			continue;
		}
		const itemCount = entries.length;
		for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
			const key = itemKey(entries[itemIndex], dataKey);
			if (key !== '') {
				keys.push(key);
			}
		}
	}
	return keys;
}
/**
 * Index of an identity in a visible-order list, or -1.
 * @param {Array<string>} orderedIds - Visible identities.
 * @param {string} key - Identity to find.
 * @returns {number} Index, or -1.
 */
function indexOfKey(orderedIds, key) {
	if (!isArray(orderedIds)) {
		return -1;
	}
	const count = orderedIds.length;
	for (let index = 0; index < count; index += 1) {
		if (String(orderedIds[index]) === key) {
			return index;
		}
	}
	return -1;
}
export class BoardSelection {
	constructor(mode = 'multiple') {
		this.mode = normalizeMode(mode);
		this.chosen = new Set();
		this.anchor = '';
	}
	get size() {
		return this.chosen.size;
	}
	has(id) {
		const key = String(id || '');
		return key !== '' && this.chosen.has(key);
	}
	ids() {
		return Array.from(this.chosen);
	}
	/**
	 * Selected items in MASTER order, not click order — bulk moves must follow
	 * the board, not the sequence the dispatcher happened to click.
	 * @param {Array<object>} items - Master list.
	 * @param {string} [dataKey] - Identity field.
	 * @returns {Array<object>} Selected items.
	 */
	items(items, dataKey) {
		const selected = [];
		if (!isArray(items)) {
			return selected;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (entry && this.chosen.has(itemKey(entry, dataKey))) {
				selected.push(entry);
			}
		}
		return selected;
	}
	/**
	 * Re-mode an existing selection. Switching to single keeps the anchor (or
	 * the first remaining id) and drops the rest; `none` clears.
	 * @param {*} mode - Caller value.
	 * @returns {void}
	 */
	setMode(mode) {
		const next = normalizeMode(mode);
		this.mode = next;
		if (next === 'none') {
			this.clear();
			return;
		}
		if (next === 'single' && this.chosen.size > 1) {
			const keep = this.anchor || this.ids()[0] || '';
			this.select(keep);
		}
	}
	clear() {
		this.chosen.clear();
		this.anchor = '';
	}
	select(id) {
		const key = String(id || '');
		this.chosen.clear();
		if (key === '') {
			this.anchor = '';
			return;
		}
		this.chosen.add(key);
		this.anchor = key;
	}
	toggle(id) {
		const key = String(id || '');
		if (key === '') {
			return;
		}
		if (this.chosen.has(key)) {
			this.chosen.delete(key);
		} else {
			this.chosen.add(key);
		}
		this.anchor = key;
	}
	/**
	 * Select the inclusive span between the anchor and `id` along `orderedIds`.
	 * Missing anchor or an id off the list falls back to a plain select — a
	 * range with no origin is just a click.
	 * @param {string} id - Range end.
	 * @param {Array<string>} orderedIds - Visual order.
	 * @param {boolean} [additive] - Union with the current set (ctrl+shift).
	 * @returns {void}
	 */
	rangeTo(id, orderedIds, additive = false) {
		const key = String(id || '');
		if (key === '') {
			return;
		}
		const anchorKey = this.anchor;
		const fromIndex = indexOfKey(orderedIds, anchorKey);
		const toIndex = indexOfKey(orderedIds, key);
		if (fromIndex < 0 || toIndex < 0) {
			this.select(key);
			return;
		}
		const start = Math.min(fromIndex, toIndex);
		const end = Math.max(fromIndex, toIndex);
		if (additive !== true) {
			this.chosen.clear();
		}
		for (let index = start; index <= end; index += 1) {
			const next = String(orderedIds[index] || '');
			if (next !== '') {
				this.chosen.add(next);
			}
		}
	}
	selectAll(orderedIds) {
		if (this.mode !== 'multiple' || !isArray(orderedIds)) {
			return;
		}
		this.chosen.clear();
		const count = orderedIds.length;
		let last = '';
		for (let index = 0; index < count; index += 1) {
			const key = String(orderedIds[index] || '');
			if (key !== '') {
				this.chosen.add(key);
				last = key;
			}
		}
		this.anchor = last;
	}
	/**
	 * Drop identities that are no longer on the board. A job that left must not
	 * stay selected — bulk handlers would then name ghosts.
	 * @param {Array<object>} items - Master list.
	 * @param {string} [dataKey] - Identity field.
	 * @returns {void}
	 */
	prune(items, dataKey) {
		if (this.chosen.size === 0) {
			return;
		}
		const live = new Set();
		if (isArray(items)) {
			const count = items.length;
			for (let index = 0; index < count; index += 1) {
				const key = itemKey(items[index], dataKey);
				if (key !== '') {
					live.add(key);
				}
			}
		}
		const held = this.ids();
		const heldCount = held.length;
		for (let index = 0; index < heldCount; index += 1) {
			if (!live.has(held[index])) {
				this.chosen.delete(held[index]);
			}
		}
		if (this.anchor !== '' && !this.chosen.has(this.anchor)) {
			this.anchor = this.ids()[0] || '';
		}
	}
	/**
	 * Write `selected` onto every master item. Rows paint from that flag; the
	 * Set stays the source of truth.
	 * @param {Array<object>} items - Master list.
	 * @param {string} [dataKey] - Identity field.
	 * @returns {void}
	 */
	stamp(items, dataKey) {
		if (!isArray(items)) {
			return;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const entry = items[index];
			if (!entry) {
				continue;
			}
			const next = this.chosen.has(itemKey(entry, dataKey));
			if (entry.selected !== next) {
				entry.selected = next;
			}
		}
	}
	/**
	 * Resolve a click. `none` ignores it. `single` always replaces. `multiple`
	 * reads the flags: range from the anchor, additive toggle, else replace.
	 * @param {*} id - Clicked identity.
	 * @param {{additive?: boolean, range?: boolean}|null} [modifiers] - Flags.
	 * @param {Array<string>} [orderedIds] - Visual order for a range.
	 * @returns {{kind: string, ids: Array<string>}} What happened.
	 */
	apply(id, modifiers, orderedIds) {
		const key = String(id || '');
		if (key === '' || this.mode === 'none') {
			return {
				kind: 'none',
				ids: this.ids(),
			};
		}
		const additive = modifiers?.additive === true;
		const range = modifiers?.range === true;
		if (this.mode === 'single' || (additive !== true && range !== true)) {
			this.select(key);
			return {
				kind: 'replace',
				ids: this.ids(),
			};
		}
		if (range === true) {
			this.rangeTo(key, orderedIds, additive);
			return {
				kind: 'range',
				ids: this.ids(),
			};
		}
		this.toggle(key);
		return {
			kind: 'toggle',
			ids: this.ids(),
		};
	}
}
