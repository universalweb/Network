/*
	selectionLock — drag-selection suppression shared by the pointer gesture
	engines (dragSnap, dragTrack).
	While a gesture tracks document-wide pointer moves, the browser paints a text
	selection across whatever the pointer sweeps — the top bar's own shadow text
	("VIAT" / "COMMAND TERMINAL"), the sidebar, a carousel. Two complementary
	vetoes hold for the drag's lifetime, because neither alone is complete:
	  - `user-select: none` on the document root is the PRIMARY guard. It is a
	    defined INHERITED property, so it crosses every shadow boundary into a
	    component's own shadow text — where the highlighted bar markup actually
	    lives. (A `selectstart` listener on `document` would miss a selection
	    anchored inside a shadow tree unless the event is `composed`, which is not
	    reliable across engines.) It is applied at pointerdown, before the first
	    move can paint anything.
	  - the `selectstart` veto is the SECONDARY guard, for the one case the root
	    toggle misses: a descendant that re-asserts `user-select: text` (e.g.
	    ai-chat) which a document-sweeping drag happens to pass over.
	Ref-counted so overlapping gestures (multi-touch, nested tracks) release the
	lock only when the LAST one ends — a leaked lock would disable selection
	app-wide with no obvious cause, so the acquire/release calls must stay
	balanced at the call sites.
*/
let lockCount = 0;
let previousUserSelect = '';
let previousWebkitUserSelect = '';
function vetoSelection(domEvent) {
	domEvent.preventDefault();
}
export function lockSelection() {
	lockCount += 1;
	if (lockCount !== 1) {
		return;
	}
	const root = globalThis.document.documentElement;
	previousUserSelect = root.style.userSelect;
	previousWebkitUserSelect = root.style.webkitUserSelect;
	root.style.userSelect = 'none';
	root.style.webkitUserSelect = 'none';
	globalThis.document.addEventListener('selectstart', vetoSelection);
}
export function unlockSelection() {
	if (lockCount === 0) {
		return;
	}
	lockCount -= 1;
	if (lockCount !== 0) {
		return;
	}
	const root = globalThis.document.documentElement;
	root.style.userSelect = previousUserSelect;
	root.style.webkitUserSelect = previousWebkitUserSelect;
	globalThis.document.removeEventListener('selectstart', vetoSelection);
}
