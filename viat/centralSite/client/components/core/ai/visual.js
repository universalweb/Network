import { getPathForComponent, pageOverview } from './paths.js';
import { componentEntries } from './registry.js';
function snapshot(component, id) {
	if (!component.isConnected) {
		return null;
	}
	const rect = component.getBoundingClientRect();
	const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < globalThis.innerHeight && rect.left < globalThis.innerWidth;
	return {
		id,
		path: getPathForComponent(component),
		tag: component.tagName.toLowerCase(),
		x: Math.round(rect.x),
		y: Math.round(rect.y),
		w: Math.round(rect.width),
		h: Math.round(rect.height),
		visible: rect.width > 0 && rect.height > 0,
		inViewport,
		label: component.getAttribute('aria-label') ?? component.constructor.aiLabel ?? null,
		role: component.constructor.aiRole ?? component.getAttribute('role') ?? null,
	};
}
export function visualPageMap(opts = {}) {
	const onlyVisible = opts.onlyVisible === true;
	const onlyInViewport = opts.onlyInViewport === true;
	const components = [];
	for (const [
		id,
		component,
	] of componentEntries()) {
		const snap = snapshot(component, id);
		if (!snap) {
			continue;
		}
		if (onlyVisible && !snap.visible) {
			continue;
		}
		if (onlyInViewport && !snap.inViewport) {
			continue;
		}
		components.push(snap);
	}
	return {
		viewport: {
			w: globalThis.innerWidth,
			h: globalThis.innerHeight,
			scrollX: globalThis.scrollX,
			scrollY: globalThis.scrollY,
			devicePixelRatio: globalThis.devicePixelRatio,
		},
		document: {
			title: document.title,
			url: globalThis.location.href,
		},
		components,
	};
}
let highlightLayer = null;
function ensureLayer() {
	if (highlightLayer && highlightLayer.isConnected) {
		return highlightLayer;
	}
	const layer = document.createElement('div');
	layer.style.cssText = 'position:fixed;inset:0;z-index:2147483646;';
	layer.dataset.viatAiHighlight = 'true';
	document.documentElement.appendChild(layer);
	highlightLayer = layer;
	return layer;
}
function noopDispose() {}
function removeHighlightBox(box) {
	box.remove();
}
/*
 * Fade-then-remove, driven entirely through setTimeout's extra-args form —
 * first-class module functions with the box passed as the timer argument, so
 * the fade chain allocates no closures.
 */
function fadeHighlightBox(box) {
	box.style.opacity = '0';
	setTimeout(removeHighlightBox, 200, box);
}
export function highlight(component, opts = {}) {
	if (!component?.isConnected) {
		return noopDispose;
	}
	const duration = opts.duration ?? 1200;
	const color = opts.color ?? '#22d3ee';
	const layer = ensureLayer();
	const rect = component.getBoundingClientRect();
	const box = document.createElement('div');
	box.style.cssText = `position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;border:2px solid ${color};border-radius:6px;box-shadow:0 0 0 2px ${color}40;transition:opacity 200ms;`;
	layer.appendChild(box);
	if (duration > 0) {
		setTimeout(fadeHighlightBox, duration, box);
	}
	return function removeHighlight() {
		removeHighlightBox(box);
	};
}
export function clearHighlights() {
	if (highlightLayer) {
		highlightLayer.replaceChildren();
	}
}
function renderTreeNode(nodeName, node, prefix, isLast, isRoot, lines) {
	let branch = '';
	if (!isRoot) {
		branch = isLast ? '└── ' : '├── ';
	}
	const tagPart = node.tag ? ` <${node.tag}>` : '';
	const phasePart = node.phase ? ` :${node.phase}` : '';
	const visPart = node.visible === true ? ' 👁' : '';
	const rolePart = node.role ? ` [${node.role}]` : '';
	const labelPart = node.label ? ` "${node.label}"` : '';
	lines.push(`${prefix}${branch}${nodeName}${tagPart}${phasePart}${visPart}${rolePart}${labelPart}`);
	if (!node.children) {
		return;
	}
	const childPrefix = isRoot ? prefix : prefix + (isLast ? '    ' : '│   ');
	const childEntries = Object.entries(node.children);
	const childEntriesLength = childEntries.length;
	for (let index = 0; index < childEntriesLength; index++) {
		const [
			childName,
			childNode,
		] = childEntries[index];
		renderTreeNode(childName, childNode, childPrefix, index === childEntriesLength - 1, false, lines);
	}
}
export function textPageMap(opts = {}) {
	const overview = pageOverview(opts);
	const lines = [];
	const rootEntries = Object.entries(overview);
	const rootEntriesLength = rootEntries.length;
	for (let index = 0; index < rootEntriesLength; index++) {
		const [
			rootName,
			rootNode,
		] = rootEntries[index];
		renderTreeNode(rootName, rootNode, '', index === rootEntriesLength - 1, true, lines);
	}
	return lines.join('\n');
}
