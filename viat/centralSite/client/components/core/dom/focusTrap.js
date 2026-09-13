/*
	DESCRIPTION: FocusTrap — Tab/Shift+Tab cycle for hand-rolled overlays.
	ui-slideout, ui-pulldown and ui-sidebar are the members; ui-modal uses
	native <dialog> and already traps, so it must not consume this.
	Walks slots and nested open shadows — panel-header / close-button live in
	nested shadows, and the body is slotted light DOM, so a querySelectorAll
	on the panel misses both. Moves focus into the root on attach; restores
	the previously-focused element on detach. Release cleanly on disconnect.
	── USAGE ────────────────────────────────────────────────────────────
	  const trap = FocusTrap.attach(panel);
	  trap.detach();          // restore previous focus
	  trap.detach(false);     // stop trapping, keep previous for a later restore
	─────────────────────────────────────────────────────────────────────
*/
import { isElement, isFunction } from '../utilities.js';
function deepestActiveElement() {
	let active = globalThis.document?.activeElement;
	const seen = new Set();
	while (active?.shadowRoot?.activeElement) {
		if (seen.has(active)) {
			break;
		}
		seen.add(active);
		active = active.shadowRoot.activeElement;
	}
	return active;
}
function isBlocked(node) {
	if (!isElement(node)) {
		return true;
	}
	if (node.hasAttribute('hidden') || node.inert === true) {
		return true;
	}
	if (node.getAttribute('aria-hidden') === 'true') {
		return true;
	}
	return false;
}
function isTabbable(node) {
	if (!isElement(node) || isBlocked(node)) {
		return false;
	}
	if (node.hasAttribute('disabled') || node.disabled === true) {
		return false;
	}
	const tabIndexAttr = node.getAttribute('tabindex');
	if (tabIndexAttr === '-1') {
		return false;
	}
	const tagName = node.localName;
	if (tagName === 'a') {
		return node.hasAttribute('href') === true;
	}
	if (tagName === 'button' || tagName === 'select' || tagName === 'textarea') {
		return true;
	}
	if (tagName === 'input') {
		return node.type !== 'hidden';
	}
	if (tagName === 'iframe' || tagName === 'object' || tagName === 'embed') {
		return true;
	}
	if (tagName === 'audio' || tagName === 'video') {
		return node.hasAttribute('controls') === true;
	}
	if (tagName === 'summary') {
		return true;
	}
	if (node.isContentEditable === true) {
		return true;
	}
	if (tabIndexAttr !== null) {
		const tabIndex = Number(tabIndexAttr);
		return Number.isFinite(tabIndex) && tabIndex >= 0;
	}
	return false;
}
function collectFromRoot(root, results, seen) {
	if (!root) {
		return;
	}
	const children = root.children;
	if (!children) {
		return;
	}
	const childCount = children.length;
	for (let index = 0; index < childCount; index += 1) {
		collectFromNode(children[index], results, seen);
	}
}
function collectFromNode(node, results, seen) {
	if (!isElement(node) || isBlocked(node) || seen.has(node)) {
		return;
	}
	seen.add(node);
	if (isTabbable(node)) {
		results.push(node);
	}
	if (node.shadowRoot) {
		collectFromRoot(node.shadowRoot, results, seen);
		return;
	}
	if (node.localName === 'slot' && isFunction(node.assignedElements)) {
		const assigned = node.assignedElements();
		const assignedCount = assigned.length;
		if (assignedCount > 0) {
			for (let index = 0; index < assignedCount; index += 1) {
				collectFromNode(assigned[index], results, seen);
			}
			return;
		}
	}
	collectFromRoot(node, results, seen);
}
function collectFocusables(root) {
	const results = [];
	const seen = new Set();
	if (isElement(root) && root.shadowRoot) {
		collectFromRoot(root.shadowRoot, results, seen);
		return results;
	}
	collectFromRoot(root, results, seen);
	return results;
}
function indexOfNode(nodes, target) {
	const nodeCount = nodes.length;
	for (let index = 0; index < nodeCount; index += 1) {
		if (nodes[index] === target) {
			return index;
		}
	}
	return -1;
}
export class FocusTrap {
	constructor(root) {
		this.root = root;
		this.previousFocus = null;
		this.attached = false;
		this.addedTabIndex = false;
	}
	static attach(root) {
		const trap = new FocusTrap(root);
		trap.attach();
		return trap;
	}
	static is(value) {
		return value instanceof FocusTrap;
	}
	ensureTabIndex() {
		const root = this.root;
		if (!isElement(root) || root.hasAttribute('tabindex')) {
			return;
		}
		root.setAttribute('tabindex', '-1');
		this.addedTabIndex = true;
	}
	clearAddedTabIndex() {
		if (this.addedTabIndex !== true) {
			return;
		}
		this.root?.removeAttribute('tabindex');
		this.addedTabIndex = false;
	}
	moveFocusIn() {
		const root = this.root;
		if (!isElement(root) || isFunction(root.focus) !== true) {
			return;
		}
		const focusables = collectFocusables(root);
		const first = focusables[0];
		if (first && isFunction(first.focus)) {
			first.focus();
			return;
		}
		root.focus();
	}
	restoreFocus() {
		const previous = this.previousFocus;
		this.previousFocus = null;
		if (!previous || isFunction(previous.focus) !== true) {
			return;
		}
		if (previous.isConnected === false) {
			return;
		}
		previous.focus();
	}
	onKeyDown(domEvent) {
		if (domEvent.key !== 'Tab') {
			return;
		}
		const focusables = collectFocusables(this.root);
		const focusableCount = focusables.length;
		if (focusableCount === 0) {
			domEvent.preventDefault();
			if (isFunction(this.root?.focus)) {
				this.root.focus();
			}
			return;
		}
		const active = deepestActiveElement();
		const activeIndex = indexOfNode(focusables, active);
		if (domEvent.shiftKey === true) {
			if (activeIndex <= 0) {
				domEvent.preventDefault();
				focusables[focusableCount - 1].focus();
			}
			return;
		}
		if (activeIndex === -1 || activeIndex === focusableCount - 1) {
			domEvent.preventDefault();
			focusables[0].focus();
		}
	}
	handleEvent(domEvent) {
		switch (domEvent.type) {
			case 'keydown': {
				this.onKeyDown(domEvent);
				break;
			}
			default: {
				break;
			}
		}
	}
	attach() {
		if (this.attached === true) {
			return;
		}
		const root = this.root;
		if (!isElement(root)) {
			return;
		}
		this.attached = true;
		this.previousFocus ??= deepestActiveElement();
		this.ensureTabIndex();
		root.addEventListener('keydown', this);
		this.moveFocusIn();
	}
	detach(restore = true) {
		if (this.attached === true) {
			this.attached = false;
			this.root?.removeEventListener('keydown', this);
			this.clearAddedTabIndex();
		}
		if (restore === true) {
			this.restoreFocus();
		}
	}
}
