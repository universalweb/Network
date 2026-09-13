/*
	DESCRIPTION: Shared mechanics for the NOTICE family — ui-toast and
	ui-notification. Both surface a list of transient cards in a corner, so both
	need the same two things: a vocabulary of kinds, and a way to tell each card
	how deep in the pile it sits.
	Extracted rather than copied. ui-toast already had both, privately; giving
	ui-notification its own copy would have made a third source of truth for a
	set of six strings and left the two components free to disagree about what a
	"warning" is or how a stack layers.
	The depth stamp is deliberately the ONLY thing parameterised — the row tag.
	Both write the same `--stack-i` custom property and the same `data-stack`
	attribute, so each component's CSS derives its own look (offset, scale,
	shadow) from one shared number. Sharing the MECHANISM and leaving the
	appearance to the caller is what keeps this from turning into a config matrix.
	Author: Universal Web
	Date: 2026-08-30
*/
/*
	Deliberately DEPENDENCY-FREE. Importing the framework for a single array check
	pulled all of core into any unit test of this file, which then needed a DOM
	registered before it could assert on six strings. A shared primitive should not
	cost that; `Array.isArray` is the native predicate and needs nothing.
*/
/* default is the neutral card; loading is the only one that implies a spinner. */
export const NOTICE_TYPES = new Set([
	'default',
	'success',
	'info',
	'warning',
	'error',
	'loading',
]);
/**
 * Coerce any caller-supplied kind onto the supported set.
 * @param {string} raw - Requested kind, possibly unknown or undefined.
 * @returns {string} A member of NOTICE_TYPES.
 */
export function normalizeNoticeType(raw) {
	return NOTICE_TYPES.has(raw) ? raw : 'default';
}
/**
 * Resolve one row's id against either family's id key.
 * @param {object} source - A row's state, or an item from the host list.
 * @returns {*} The row identity, or undefined.
 */
function noticeId(source) {
	return source?.id ?? source?.toastId;
}
/**
 * Tell every mounted row how deep it sits, as `--stack-i` (0 = front) plus a
 * matching `data-stack` attribute for selectors.
 *
 * Depth comes from the item's position in the HOST's list, not from DOM order:
 * the rows are painted by list()/filter() and a virtualised or re-keyed pass can
 * mount them in a different order than the data. Matching by id keeps the
 * visual pile agreeing with the array even then, and falls back to DOM index
 * when a row carries no id at all.
 * @param {object} host - The stack component (ui-toast / ui-notification).
 * @param {string} tag - Row tag to stamp, e.g. 'ui-toast-item'.
 * @returns {void}
 */
export function stampStackDepth(host, tag) {
	const items = host.state.items;
	const count = Array.isArray(items) ? items.length : 0;
	const rows = host.findComponents(tag) || [];
	const rowCount = rows.length;
	for (let index = 0; index < rowCount; index += 1) {
		const row = rows[index];
		const rowId = noticeId(row?.state);
		let depth = index;
		for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
			if (noticeId(items[itemIndex]) === rowId) {
				depth = itemIndex;
				break;
			}
		}
		row.style.setProperty('--stack-i', String(depth));
		row.dataset.stack = String(depth);
	}
}
