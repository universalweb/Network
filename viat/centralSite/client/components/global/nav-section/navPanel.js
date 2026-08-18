/*
 * Shared panel policy for ui-nav-section / ui-nav-trigger — ONE source of truth.
 * An item opens a dropdown when it has links, an explicit panel flag, or no href
 * (slot-only rich pane). Plain href-only items are top-level links.
 */
export function itemHasPanel(item) {
	if (!item || item.disabled) {
		return false;
	}
	if (item.panel === false) {
		return false;
	}
	if (item.panel === true) {
		return true;
	}
	if (Array.isArray(item.links) && item.links.length > 0) {
		return true;
	}
	return !item.href;
}
