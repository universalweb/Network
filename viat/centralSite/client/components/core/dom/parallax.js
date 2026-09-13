/*
	DESCRIPTION: Parallax — transform-only scroll shift on a host.
	Consumes observeInView (no second observer stack). Geometry is read once
	per frame via rafCoalesce; writes are translate3d only. prefers-reduced-motion
	disables the effect entirely.
	── USAGE ────────────────────────────────────────────────────────────
	  const layer = Parallax.attach(host, { factor: 0.2, scroller: stage });
	  layer.detach();
	─────────────────────────────────────────────────────────────────────
*/
import { isElement, isFunction } from '../utilities.js';
import { collectScrollTargets } from './hideOnScroll.js';
import { rafCoalesce, rafCoalesceCancel } from './rafCoalesce.js';
import { findScrollableAncestor } from './scrollRoot.js';
import { observeInView } from './viewPort.js';
const layers = new WeakMap();
function motionReduced() {
	return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}
function enterParallaxLayer(element) {
	const layer = layers.get(element);
	layer?.armScroll();
}
export class Parallax {
	constructor(host, options = {}) {
		this.host = host;
		const factor = Number(options.factor);
		this.factor = Number.isFinite(factor) ? factor : 0.18;
		this.axis = options.axis === 'x' ? 'x' : 'y';
		this.scrollerOption = options.scroller;
		this.disposeWatch = null;
		this.scrollTargets = [];
		this.armed = false;
		this.attached = false;
		this.rootElement = null;
	}
	static attach(host, options) {
		const layer = new Parallax(host, options);
		layer.attach();
		return layer;
	}
	static is(value) {
		return value instanceof Parallax;
	}
	resolveRoot() {
		if (isElement(this.scrollerOption)) {
			return this.scrollerOption;
		}
		if (this.scrollerOption === 'nearest') {
			return findScrollableAncestor(this.host, {
				requireOverflow: false,
			});
		}
		return null;
	}
	attach() {
		if (this.attached) {
			this.detach();
		}
		this.attached = true;
		if (!isElement(this.host) || motionReduced()) {
			return;
		}
		layers.set(this.host, this);
		this.rootElement = this.resolveRoot();
		this.disposeWatch = observeInView(this.host, {
			root: this.rootElement,
			once: false,
			applyStyles: false,
			emit: true,
			onEnter: enterParallaxLayer,
		});
	}
	armScroll() {
		if (this.armed) {
			return;
		}
		this.armed = true;
		this.scrollTargets = collectScrollTargets(this.host);
		const targetCount = this.scrollTargets.length;
		for (let index = 0; index < targetCount; index += 1) {
			this.scrollTargets[index].addEventListener('scroll', this, {
				capture: true,
				passive: true,
			});
		}
		this.applyShift();
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'scroll') {
			rafCoalesce(this, this.applyShift);
		}
	}
	viewFrame() {
		return axisFrame(this.rootElement, this.axis);
	}
	applyShift() {
		const host = this.host;
		if (!isElement(host) || !isFunction(host.getBoundingClientRect)) {
			return;
		}
		const box = host.getBoundingClientRect();
		const frame = this.viewFrame();
		const hostMid = this.axis === 'x' ? box.left + (box.width / 2) : box.top + (box.height / 2);
		const shift = (hostMid - frame.mid) * this.factor;
		const x = this.axis === 'x' ? shift : 0;
		const y = this.axis === 'x' ? 0 : shift;
		host.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}
	unsubscribe() {
		this.detach();
	}
	detach() {
		this.attached = false;
		this.armed = false;
		if (isFunction(this.disposeWatch)) {
			this.disposeWatch();
			this.disposeWatch = null;
		}
		rafCoalesceCancel(this);
		const targetCount = this.scrollTargets.length;
		for (let index = 0; index < targetCount; index += 1) {
			this.scrollTargets[index].removeEventListener('scroll', this, {
				capture: true,
			});
		}
		this.scrollTargets = [];
		if (isElement(this.host)) {
			layers.delete(this.host);
			hostClearTransform(this.host);
		}
	}
}
function axisFrame(rootElement, axis) {
	const rootBox = isElement(rootElement) ? rootElement.getBoundingClientRect() : null;
	const horizontal = axis === 'x';
	let extent = globalThis.innerHeight || 0;
	let center = extent / 2;
	if (horizontal) {
		extent = globalThis.innerWidth || 0;
		center = extent / 2;
	}
	if (rootBox) {
		if (horizontal) {
			extent = rootBox.width;
			center = rootBox.left + (rootBox.width / 2);
		} else {
			extent = rootBox.height;
			center = rootBox.top + (rootBox.height / 2);
		}
	}
	return {
		size: extent,
		mid: center,
	};
}
function hostClearTransform(host) {
	host.style.transform = '';
}
/*
	this.parallax(host, options) — WebComponent prototype method. Files the
	layer in gestureUnsubs so disconnect calls unsubscribe() → detach().
*/
export function parallax(host, options) {
	const layer = Parallax.attach(host, options);
	(this.gestureUnsubs ??= new Set()).add(layer);
	return layer;
}
