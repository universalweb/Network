/*
	DESCRIPTION: lockScroll / unlockScroll — refcounted page-scroll lock for
	hand-rolled overlays. First acquire snapshots overflow, scroll offsets, and
	the scrollbar gutter on documentElement, body, scrollingElement, and the
	nearest overflow ancestor (findScrollableAncestor through shadow — the
	preview stage is a scroller). Last release restores those exact inline
	styles and scroll positions. padding-inline-end compensates the gutter so
	unlocking does not shift the page sideways.
	── USAGE ────────────────────────────────────────────────────────────
	  lockScroll(host);
	  unlockScroll();
	─────────────────────────────────────────────────────────────────────
*/
import { isElement } from '../utilities.js';
import { findScrollableAncestor } from './scrollRoot.js';
let lockCount = 0;
let saved = null;
function snapshotNode(node) {
	if (!isElement(node) || !node.style) {
		return null;
	}
	return {
		node,
		overflow: node.style.overflow,
		overflowX: node.style.overflowX,
		overflowY: node.style.overflowY,
		paddingInlineEnd: node.style.paddingInlineEnd,
		scrollTop: node.scrollTop,
		scrollLeft: node.scrollLeft,
	};
}
function verticalGutter(node) {
	if (!isElement(node)) {
		return 0;
	}
	return Math.max(0, node.offsetWidth - node.clientWidth);
}
function addSnapshot(nodes, seen, node) {
	if (!isElement(node) || seen.has(node)) {
		return;
	}
	seen.add(node);
	const snap = snapshotNode(node);
	if (snap) {
		nodes.push(snap);
	}
}
function applyLock(snap, gutter) {
	const node = snap.node;
	node.style.overflow = 'hidden';
	if (gutter <= 0) {
		return;
	}
	const computedPad = globalThis.getComputedStyle(node).paddingInlineEnd;
	const padValue = Number.parseFloat(computedPad) || 0;
	node.style.paddingInlineEnd = `${padValue + gutter}px`;
}
function restoreSnap(snap) {
	const node = snap.node;
	node.style.overflow = snap.overflow;
	node.style.overflowX = snap.overflowX;
	node.style.overflowY = snap.overflowY;
	node.style.paddingInlineEnd = snap.paddingInlineEnd;
	node.scrollTop = snap.scrollTop;
	node.scrollLeft = snap.scrollLeft;
}
export function lockScroll(anchor) {
	lockCount += 1;
	if (lockCount !== 1) {
		return;
	}
	const doc = globalThis.document;
	if (!doc) {
		return;
	}
	const root = doc.documentElement;
	const body = doc.body;
	const scrolling = doc.scrollingElement;
	const ancestor = isElement(anchor) ? findScrollableAncestor(anchor) : null;
	const seen = new Set();
	const nodes = [];
	addSnapshot(nodes, seen, root);
	addSnapshot(nodes, seen, body);
	addSnapshot(nodes, seen, scrolling);
	addSnapshot(nodes, seen, ancestor);
	const gutter = Math.max(
		verticalGutter(root),
		verticalGutter(scrolling),
		typeof globalThis.innerWidth === 'number' && root ? Math.max(0, globalThis.innerWidth - root.clientWidth) : 0
	);
	saved = {
		nodes,
		windowX: globalThis.scrollX || 0,
		windowY: globalThis.scrollY || 0,
	};
	const nodeCount = nodes.length;
	for (let index = 0; index < nodeCount; index += 1) {
		applyLock(nodes[index], gutter);
	}
}
export function unlockScroll() {
	if (lockCount === 0) {
		return;
	}
	lockCount -= 1;
	if (lockCount !== 0) {
		return;
	}
	if (!saved) {
		return;
	}
	const nodes = saved.nodes;
	const nodeCount = nodes.length;
	for (let index = 0; index < nodeCount; index += 1) {
		restoreSnap(nodes[index]);
	}
	if (typeof globalThis.scrollTo === 'function') {
		globalThis.scrollTo(saved.windowX, saved.windowY);
	}
	saved = null;
}
