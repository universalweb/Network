import { eachComponent } from './registry.js';
import { getPathForComponent } from './paths.js';
function snapshot(component, id) {
	if (!component.isConnected) {
		return null;
	}
	const rect = component.getBoundingClientRect();
	const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
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
	eachComponent((component, id) => {
		const snap = snapshot(component, id);
		if (!snap) {
			return;
		}
		if (onlyVisible && !snap.visible) {
			return;
		}
		if (onlyInViewport && !snap.inViewport) {
			return;
		}
		components.push(snap);
	});
	return {
		viewport: {
			w: window.innerWidth,
			h: window.innerHeight,
			scrollX: window.scrollX,
			scrollY: window.scrollY,
			devicePixelRatio: window.devicePixelRatio,
		},
		document: {
			title: document.title,
			url: location.href,
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
export function highlight(component, opts = {}) {
	if (!component?.isConnected) {
		return () => {};
	}
	const duration = opts.duration ?? 1200;
	const color = opts.color ?? '#22d3ee';
	const layer = ensureLayer();
	const rect = component.getBoundingClientRect();
	const box = document.createElement('div');
	box.style.cssText = `position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;border:2px solid ${color};border-radius:6px;box-shadow:0 0 0 2px ${color}40;transition:opacity 200ms;`;
	layer.appendChild(box);
	const remove = () => {
		box.remove();
	};
	if (duration > 0) {
		setTimeout(() => {
			box.style.opacity = '0';
			setTimeout(remove, 200);
		}, duration);
	}
	return remove;
}
export function clearHighlights() {
	if (highlightLayer) {
		highlightLayer.replaceChildren();
	}
}
