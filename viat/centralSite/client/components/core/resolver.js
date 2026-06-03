/*
	Component resolver — scans rendered DOM for undefined custom elements and
	dynamically imports the module that defines them, so callers don't have to
	hand-import every tag they use.

	Tag → path convention: `<root>-<rest>`. The first `-` splits a registered
	root prefix from the rest; `_` in the rest is the path separator (so `-`
	stays free for multi-word segments); the last segment is also the file name.
		ui-button                  -> <ui>/button/button.js
		ui-wallet-panel            -> <ui>/wallet-panel/wallet-panel.js
		user-dashboard_center-bar  -> <user>/dashboard/center-bar/center-bar.js

	A tag with no `-` is a native element, never a component — the `:not(:defined)`
	scan never matches those. A tag whose prefix is not a registered root is a
	foreign component the resolver leaves alone (manual import, as before).
*/
const roots = new Map();
const inFlight = new Map();
const failed = new Set();
export function registerRoot(prefix, baseUrl) {
	roots.set(prefix, String(baseUrl).replace(/\/+$/, ''));
}
export function getRoots() {
	return roots;
}
export function resolveTagUrl(tag) {
	const dash = tag.indexOf('-');
	if (dash === -1) {
		return null;
	}
	const base = roots.get(tag.slice(0, dash));
	if (!base) {
		return null;
	}
	const segments = tag.slice(dash + 1).split('_');
	return `${base}/${segments.join('/')}/${segments[segments.length - 1]}.js`;
}
/**
 * Imports the module for one tag. Returns a Promise that settles when the tag
 * is defined, or null when there's nothing to do (already defined / unknown
 * root / known-failed). Concurrent and repeat calls share one in-flight task.
 */
export function resolveTag(tag) {
	if (customElements.get(tag)) {
		return null;
	}
	const pending = inFlight.get(tag);
	if (pending) {
		return pending;
	}
	if (failed.has(tag)) {
		return null;
	}
	const url = resolveTagUrl(tag);
	if (!url) {
		return null;
	}
	const task = import(url).then(() => {
		inFlight.delete(tag);
		return customElements.whenDefined(tag);
	}, (error) => {
		inFlight.delete(tag);
		failed.add(tag);
		console.error(`[resolver] failed to load <${tag}> from ${url}`, error);
	});
	inFlight.set(tag, task);
	return task;
}
/**
 * Scans a rendered subtree for undefined custom elements and resolves each tag
 * once. Non-blocking by contract: it kicks off imports and returns the pending
 * tasks (or null) so the caller decides whether to await — the render path
 * does not, lazy children upgrade on their own.
 */
export function scanAndResolve(root) {
	if (!root || !root.querySelectorAll) {
		return null;
	}
	const undefinedEls = root.querySelectorAll(':not(:defined)');
	if (undefinedEls.length === 0) {
		return null;
	}
	const seen = new Set();
	let tasks = null;
	for (let index = 0; index < undefinedEls.length; index++) {
		const tag = undefinedEls[index].localName;
		if (seen.has(tag)) {
			continue;
		}
		seen.add(tag);
		const task = resolveTag(tag);
		if (task) {
			(tasks ??= []).push(task);
		}
	}
	return tasks;
}
