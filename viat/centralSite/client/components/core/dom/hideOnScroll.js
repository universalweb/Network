/*
	DESCRIPTION: Shared scroll → hide utility for overlays (menubar, menu, nav,
	dropdowns). Capture-phase listener on every scroll root that can actually
	move the page — window PLUS each shadow-crossing overflow ancestor of the
	owner. `scroll` is NOT composed: a window-only listener is deaf to a
	scroller inside a shadow tree (preview `.stage`).
	Skip scrolls that originate inside `keepOpen` (the open PANEL, never the
	preview stage / host — if keepOpen contains the scroll root, every scroll
	is ignored).
	── USAGE ────────────────────────────────────────────────────────────
	  const hide = new HideOnScroll(this, 'closeFromScroll', {
	    keepOpen: () => this.refs.surface,
	  });
	  hide.attach();  // when panel opens
	  hide.detach();  // when panel closes / disconnect
	  // closeFromScroll() { this.refs.surface?.hidePopover(); }
	─────────────────────────────────────────────────────────────────────
*/
import { findScrollableAncestor } from './scrollRoot.js';
/**
 * Window + each overflow ancestor of `owner`, walking through shadow hosts.
 * @param {Element|object|null|undefined} owner - Overlay host (element) or a test stub.
 * @returns {Array<Window|EventTarget>} Listen targets.
 */
export function collectScrollTargets(owner) {
	const targets = [globalThis];
	if (!owner || owner.nodeType !== 1) {
		return targets;
	}
	const seen = new Set();
	let node = owner;
	while (node) {
		const scroller = findScrollableAncestor(node, {
			requireOverflow: false,
		});
		if (!scroller || seen.has(scroller)) {
			break;
		}
		seen.add(scroller);
		targets.push(scroller);
		const ancestor = scroller.parentNode;
		node = ancestor && ancestor.nodeType === 11 ? ancestor.host : ancestor;
	}
	return targets;
}
/**
 * True when the scroll originated inside `keepOpen` (panel or its descendants).
 * Prefers composedPath so a shadow-internal scroller still matches.
 * @param {Element} keepOpen - Open panel root.
 * @param {Event} domEvent - Scroll event.
 * @returns {boolean} Whether the scroll target sits inside the panel.
 */
export function scrollEventInside(keepOpen, domEvent) {
	if (!keepOpen) {
		return false;
	}
	const path = typeof domEvent.composedPath === 'function' ? domEvent.composedPath() : [];
	const pathCount = path.length;
	for (let index = 0; index < pathCount; index += 1) {
		if (path[index] === keepOpen) {
			return true;
		}
	}
	const target = domEvent.target;
	return Boolean(target && target.nodeType === 1 && keepOpen.contains(target));
}
/**
 * EventListener-object controller: one shared instance per host, zero per-scroll alloc.
 * Invokes `owner[methodName](domEvent)` on any capture-phase scroll outside keepOpen.
 */
export class HideOnScroll {
	/**
	 * Bind a hide handler on `owner` for capture-phase scroll outside keepOpen.
	 * @param {object} owner - Component (or plain object) that owns the hide handler.
	 * @param {string} methodName - Method name on owner to call on scroll.
	 * @param {{keepOpen?: () => Element|null|undefined}} [options] - Optional live keep-open root resolver.
	 */
	constructor(owner, methodName, options = {}) {
		this.owner = owner;
		this.methodName = methodName;
		this.resolveKeepOpen = typeof options.keepOpen === 'function' ? options.keepOpen : null;
		this.attached = false;
		this.targets = [];
	}
	/**
	 * EventListener interface — capture scroll on each collected root.
	 * @param {Event} domEvent - Scroll event.
	 */
	handleEvent(domEvent) {
		if (domEvent.type !== 'scroll') {
			return;
		}
		const keepOpen = this.resolveKeepOpen?.() ?? null;
		if (keepOpen && scrollEventInside(keepOpen, domEvent)) {
			return;
		}
		const handler = this.owner?.[this.methodName];
		if (typeof handler === 'function') {
			handler.call(this.owner, domEvent);
		}
	}
	attach() {
		if (this.attached) {
			return;
		}
		const targets = collectScrollTargets(this.owner);
		const targetCount = targets.length;
		for (let index = 0; index < targetCount; index += 1) {
			targets[index].addEventListener('scroll', this, {
				capture: true,
				passive: true,
			});
		}
		this.targets = targets;
		this.attached = true;
	}
	detach() {
		if (!this.attached) {
			return;
		}
		const targets = this.targets;
		const targetCount = targets.length;
		for (let index = 0; index < targetCount; index += 1) {
			targets[index].removeEventListener('scroll', this, {
				capture: true,
			});
		}
		this.targets = [];
		this.attached = false;
	}
}
