import { globalState } from '../state/globalState.js';
/*
 * Reactive `document.title`, driven by a reserved global-state key. The binding
 * is a MODULE-level observer on the shared global bus, so it outlives every
 * component (AppView included): once activated, setting the bound key updates
 * the page title whether AppView is mounted, closed, or never existed — the
 * "direct DOM change when AppView is closed" the title feature needs.
 */
let titleSubscription = null;
let activeTitleKey = 'title';
function applyDocumentTitle(value) {
	if (typeof value === 'string' && document.title !== value) {
		document.title = value;
	}
}
/**
 * Module-scope bus handler — invoked with the new value on every change to the
 * bound key. First-class function, zero per-call closure.
 */
function handleTitleChange(value) {
	applyDocumentTitle(value);
}
/**
 * Reflect `globalState[key]` → `document.title`. Idempotent and module-scoped,
 * so the binding survives any component lifecycle. Re-pointing to a different
 * key tears the previous subscription down. Returns the active Subscription.
 */
export function syncDocumentTitle(key = 'title') {
	if (titleSubscription) {
		titleSubscription.unsubscribe();
	}
	activeTitleKey = key;
	applyDocumentTitle(globalState.get(key));
	titleSubscription = globalState.bus.subscribe(key, handleTitleChange);
	return titleSubscription;
}
/**
 * Set the page title. Writes `document.title` IMMEDIATELY (direct DOM, works
 * with AppView closed) AND the bound global key, so components reading
 * `globalState[key]` react too. The observer's own write then no-ops on the
 * equality guard.
 */
export function setDocumentTitle(value, key = activeTitleKey) {
	if (typeof value === 'string') {
		document.title = value;
	}
	globalState.proxy[key] = value;
}
/**
 * Auto-activate the default `title` key so `globalState.title = '…'` just works
 * out of the box. Guarded for non-DOM realms (SSR / workers).
 */
if (typeof document !== 'undefined') {
	syncDocumentTitle('title');
}
