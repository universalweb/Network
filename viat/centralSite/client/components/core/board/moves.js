/*
	DESCRIPTION: The move gate — ONE predicate consulted before any lane board
	commits a move. Read-only boards, declarative transition rules, WIP limits and
	a caller's own veto are not four features; they are four answers to the same
	question, asked at the same instant, and a board that grew four separate
	checks would ask it four times in four places and disagree with itself.
	A MOVE is the unit both boards mutate through: an item changing lane, ordinal
	position, or time. `from === to` is an in-lane reorder — it moves no work
	between lanes, so it can never breach a WIP limit or a transition rule, and
	the gate says so rather than making every caller remember it.
	`kind: 'column-reorder'` is the same idea at the other axis: the lanes
	themselves change order, no work enters or leaves a lane, so WIP and
	transitions are skipped. readOnly and canMove still apply.
	WHY IT IS SYNCHRONOUS
	  PrimeUI offers async validators and confirm dialogs before a move lands.
	  Those are deliberately NOT here: making the verdict a promise would make
	  every drop path async, and a pointer-driven drop cannot wait — it would have
	  to paint the move, then rip it back out. The honest shape for that is
	  optimistic apply plus a rollback, which is what the command stack is for.
	  This gate stays a pure function so a drag can consult it mid-flight.
	── USAGE ────────────────────────────────────────────────────────────
	  const verdict = evaluateMove({ from: 'todo', to: 'doing', item }, {
	    wipLimits: { doing: 3 },
	    transitions: { todo: ['doing'], doing: ['todo', 'done'] },
	  }, lanes);
	  if (!verdict.allowed) { return; }
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import { isArray, isPlainObject } from '@universalweb/utilitylib';
/* The verdict every allowed move returns. Frozen — it is handed out repeatedly
   and a caller writing to it would poison every later answer. */
export const MOVE_OK = Object.freeze({
	allowed: true,
	reason: '',
});
/**
 * Build a refusal. Separate from MOVE_OK so the reason is always a string a
 * caller can surface, never an empty verdict nobody can explain to a user.
 * @param {string} rule - Which rule refused ('read-only', 'transition', 'wip', 'veto').
 * @param {string} reason - Human-readable explanation.
 * @returns {{allowed: boolean, rule: string, reason: string}} Refusal verdict.
 */
function refuse(rule, reason) {
	return {
		allowed: false,
		rule,
		reason,
	};
}
/**
 * How many items a lane holds right now.
 * @param {Array<{id: string, items: Array}>} lanes - Current lanes.
 * @param {string} laneId - Lane to count.
 * @returns {number} Item count, 0 when the lane is unknown.
 */
export function laneCount(lanes, laneId) {
	if (!isArray(lanes)) {
		return 0;
	}
	const needle = String(laneId);
	const count = lanes.length;
	for (let index = 0; index < count; index += 1) {
		const lane = lanes[index];
		if (lane && String(lane.id) === needle) {
			return isArray(lane.items) ? lane.items.length : 0;
		}
	}
	return 0;
}
/**
 * The WIP cap declared for a lane, or -1 when it has none.
 *
 * A cap can be declared per lane (`{ doing: 3 }`) or as a bare number, which
 * caps EVERY lane — the common case for a board that just wants one ceiling.
 * @param {object|number} limits - Cap declaration.
 * @param {string} laneId - Lane being entered.
 * @returns {number} The cap, or -1 for uncapped.
 */
export function wipLimitFor(limits, laneId) {
	if (typeof limits === 'number') {
		return Number.isFinite(limits) && limits >= 0 ? limits : -1;
	}
	if (!isPlainObject(limits)) {
		return -1;
	}
	const declared = limits[laneId];
	if (typeof declared !== 'number' || !Number.isFinite(declared) || declared < 0) {
		return -1;
	}
	return declared;
}
/**
 * Whether a transition from one lane to another is declared legal.
 *
 * A source with NO entry is unrestricted. Declaring rules for two columns must
 * not silently freeze the other six — a partial rule set is a partial rule set,
 * not a whitelist. Declare an empty array to seal a lane deliberately.
 * @param {object} transitions - Map of source lane to allowed targets.
 * @param {string} from - Lane being left.
 * @param {string} to - Lane being entered.
 * @returns {boolean} Whether the path is allowed.
 */
export function transitionAllowed(transitions, from, to) {
	if (!isPlainObject(transitions)) {
		return true;
	}
	const allowed = transitions[from];
	if (!isArray(allowed)) {
		return true;
	}
	const needle = String(to);
	const count = allowed.length;
	for (let index = 0; index < count; index += 1) {
		if (String(allowed[index]) === needle) {
			return true;
		}
	}
	return false;
}
/**
 * The single verdict. Checks run most-fundamental first so the reason a caller
 * shows names the real obstacle: a read-only board is not "over its WIP limit".
 * @param {object} move - `{ item, id, from, to, kind? }`. `from === to` is a
 * reorder. `kind: 'column-reorder'` skips WIP and transitions.
 * @param {object} [rules] - `{ readOnly, transitions, wipLimits, canMove }`.
 * @param {Array<object>} [lanes] - Current lanes, for counting WIP.
 * @returns {{allowed: boolean, rule?: string, reason: string}} Verdict.
 */
export function evaluateMove(move, rules = {}, lanes = []) {
	if (!move) {
		return refuse('invalid', 'No move to evaluate.');
	}
	if (rules.readOnly === true) {
		return refuse('read-only', 'This board is read-only.');
	}
	const from = String(move.from ?? '');
	const to = String(move.to ?? '');
	/*
	 * An in-lane reorder moves no work between lanes. It cannot breach a WIP cap
	 * (the count is unchanged) and it is not a transition, so both are skipped
	 * rather than being spelled out at every call site. A caller that wants to
	 * forbid reordering still can, through canMove.
	 * Column reorder is the same fact at the other axis: from/to are column
	 * ids, not item lanes, and treating them as a transfer would trip
	 * transitions/WIP that do not apply to shuffling the lanes themselves.
	 */
	const crossesLanes = move.kind !== 'column-reorder' && from !== to;
	if (crossesLanes && !transitionAllowed(rules.transitions, from, to)) {
		return refuse('transition', `Moving from ${from} to ${to} is not allowed.`);
	}
	if (crossesLanes) {
		const limit = wipLimitFor(rules.wipLimits, to);
		if (limit >= 0 && laneCount(lanes, to) >= limit) {
			return refuse('wip', `${to} is at its limit of ${limit}.`);
		}
	}
	if (typeof rules.canMove === 'function') {
		const verdict = rules.canMove(move);
		if (verdict === false) {
			return refuse('veto', 'This move was refused.');
		}
		/* A returned STRING is a refusal carrying its own reason — the shape a
		   caller reaches for when it wants to explain itself. */
		if (typeof verdict === 'string' && verdict !== '') {
			return refuse('veto', verdict);
		}
	}
	return MOVE_OK;
}
