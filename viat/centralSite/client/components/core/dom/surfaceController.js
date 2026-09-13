/*
	DESCRIPTION: Open/close + dismiss controller for one popover SURFACE.
	Keyed to the surface element — a host may own several mixed auto/manual
	(context-menu). Composition, not a base class. HideOnScroll is the in-house
	precedent.
	Auto vs manual is read from the surface `popover` attribute and is never
	flattened:
	  auto   — UA already Esc + light-dismisses; do NOT join escapeStack.
	  manual — no UA dismiss. Optional stack membership, optional global Esc
	           listener, optional outside pointerdown.
	Does NOT own FLIP morph, anchoring, or glass. Hover-card Escape stays with
	the card (tk:160) — pass esc:false.
	── USAGE ────────────────────────────────────────────────────────────
	  this.overlayCtl ??= new SurfaceController(this, {
	    surface: () => this.refs.overlay,
	    closeMethod: 'runClose',
	    keepOpen: () => this.refs.surface,
	    listenEscape: true,
	    outside: false,
	  });
	  this.overlayCtl.show();
	  this.overlayCtl.attach();
	  this.overlayCtl.detach();
	  this.overlayCtl.hide();
	─────────────────────────────────────────────────────────────────────
*/
import { isTopEscapable, syncEscapable } from '../escape/escapeStack.js';
import { isFunction, isTrue } from '../utilities.js';
import { HideOnScroll } from './hideOnScroll.js';
import { hideSurfacePopover, showSurfacePopover } from './manualPopover.js';
const byOwner = new WeakMap();
function pathContains(path, node) {
	const count = path.length;
	for (let index = 0; index < count; index += 1) {
		if (path[index] === node) {
			return true;
		}
	}
	return false;
}
/**
 * EventListener-object controller: one instance per (owner, surface).
 * Invokes `owner[closeMethod]()` on dismiss.
 */
export class SurfaceController {
	/**
	 * Cached controller for a live surface node. Keyed to the ELEMENT so a
	 * host with several popovers (mixed auto/manual) holds several controllers.
	 * @param {object} owner - Component that owns closeMethod / showSurfacePopover.
	 * @param {Element} surface - The popover surface element.
	 * @param {object} [options] - closeMethod, keepOpen, esc, listenEscape, outside, scroll.
	 * @returns {SurfaceController} Existing or new controller.
	 */
	static for(owner, surface, options) {
		let perSurface = byOwner.get(owner);
		if (!perSurface) {
			perSurface = new WeakMap();
			byOwner.set(owner, perSurface);
		}
		let controller = perSurface.get(surface);
		if (!controller) {
			controller = new SurfaceController(owner, {
				...options,
				surface,
			});
			perSurface.set(surface, controller);
		}
		return controller;
	}
	/**
	 * Bind dismiss + show/hide to one surface of `owner`.
	 * @param {object} owner - Component (or test stub) that owns the close handler.
	 * @param {object} [options] - surface (Element or resolver), closeMethod, keepOpen, esc, listenEscape, outside, scroll.
	 */
	constructor(owner, options = {}) {
		this.owner = owner;
		this.closeMethod = options.closeMethod || 'closeFromSurface';
		this.fixedSurface = isFunction(options.surface) ? null : options.surface;
		this.resolveSurface = isFunction(options.surface) ? options.surface : () => {
			return this.fixedSurface;
		};
		this.keepOpenFn = isFunction(options.keepOpen) ? options.keepOpen : () => {
			return this.surfaceEl();
		};
		this.escOpt = options.esc;
		this.listenEscape = isTrue(options.listenEscape);
		this.outsideOpt = options.outside;
		this.scroll = options.scroll !== false;
		this.scrollHide = null;
		this.attached = false;
		this.outsideArmed = false;
		this.armTimer = 0;
	}
	static onArmOutside(controller) {
		controller.addOutside();
	}
	surfaceEl() {
		return this.resolveSurface.call(this.owner) ?? null;
	}
	popoverType() {
		const surface = this.surfaceEl();
		return surface?.getAttribute?.('popover') || '';
	}
	isManual() {
		return this.popoverType() === 'manual';
	}
	wantsEsc() {
		if (isTrue(this.escOpt)) {
			return true;
		}
		if (this.escOpt === false) {
			return false;
		}
		return this.isManual();
	}
	wantsOutside() {
		if (isTrue(this.outsideOpt)) {
			return true;
		}
		if (this.outsideOpt === false) {
			return false;
		}
		return this.isManual();
	}
	show() {
		const surface = this.surfaceEl();
		if (!surface) {
			return;
		}
		showSurfacePopover.call(this.owner, surface);
	}
	hide() {
		const surface = this.surfaceEl();
		if (!surface) {
			return;
		}
		hideSurfacePopover.call(this.owner, surface);
	}
	/**
	 * EventListener interface — capture outside pointerdown and (opt-in) Esc.
	 * @param {Event} domEvent - keydown or pointerdown.
	 */
	handleEvent(domEvent) {
		if (domEvent.type === 'keydown') {
			this.handleKey(domEvent);
			return;
		}
		if (domEvent.type === 'pointerdown') {
			this.handleOutside(domEvent);
		}
	}
	handleKey(domEvent) {
		if (domEvent.key !== 'Escape') {
			return;
		}
		if (!isTopEscapable(this.owner)) {
			return;
		}
		domEvent.preventDefault();
		this.requestClose();
	}
	handleOutside(domEvent) {
		const path = isFunction(domEvent.composedPath) ? domEvent.composedPath() : [];
		if (pathContains(path, this.owner)) {
			return;
		}
		const surface = this.surfaceEl();
		if (surface && pathContains(path, surface)) {
			return;
		}
		this.requestClose();
	}
	requestClose() {
		const handler = this.owner?.[this.closeMethod];
		if (isFunction(handler)) {
			handler.call(this.owner);
		}
	}
	attach() {
		if (this.attached) {
			return;
		}
		this.attached = true;
		if (this.scroll) {
			this.scrollHide ??= new HideOnScroll(this.owner, this.closeMethod, {
				keepOpen: this.keepOpenFn,
			});
			this.scrollHide.attach();
		}
		if (this.wantsEsc()) {
			syncEscapable(this.owner, true);
			if (this.listenEscape) {
				globalThis.addEventListener('keydown', this);
			}
		}
		if (this.wantsOutside()) {
			this.armTimer = globalThis.setTimeout(SurfaceController.onArmOutside, 0, this);
		}
	}
	addOutside() {
		this.armTimer = 0;
		if (!this.attached || this.outsideArmed) {
			return;
		}
		this.outsideArmed = true;
		globalThis.document?.addEventListener('pointerdown', this, true);
	}
	detach() {
		if (this.armTimer) {
			globalThis.clearTimeout(this.armTimer);
			this.armTimer = 0;
		}
		if (this.outsideArmed) {
			this.outsideArmed = false;
			globalThis.document?.removeEventListener('pointerdown', this, true);
		}
		if (this.listenEscape) {
			globalThis.removeEventListener('keydown', this);
		}
		if (this.wantsEsc()) {
			syncEscapable(this.owner, false);
		}
		this.scrollHide?.detach();
		this.attached = false;
	}
}
