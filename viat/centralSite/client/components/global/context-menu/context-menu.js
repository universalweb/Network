/*
	DESCRIPTION: ui-context-menu — a right-click / long-press menu (MUI/Radix
	"Context Menu"). Extends `ui-menu`: it INHERITS the item schema, `renderItems`,
	keyboard roving, `handleKey`/`handleClick`/`selectIndex` and the native-Popover
	dismiss — the ONLY differences from a dropdown are (1) there is no trigger
	button; the host's slotted content IS the trigger region, and (2) the panel
	opens at the POINTER, not under an anchor. So we override just `render()`
	(slot + surface, no button) and `position()` (anchor a 0×0 rect at the cursor),
	and listen for `contextmenu` on the host to open it.
	The surface is `popover="auto"` → top layer (escapes transformed / clipped
	ancestors) + free Esc / outside-click dismiss. `contextmenu` fires AFTER the
	outside-pointerdown that light-dismisses any open auto-popover, so by the time
	we open, the previous instance is already closed — the `:popover-open` guard
	covers the rare browser that defers that dismiss.
	── EVENTS ───────────────────────────────────────────────────────────
	  menu:select { value, index }   (inherited from ui-menu)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-context-menu .state.items=${[
	    { label: 'Open', value: 'open', kbd: '↵' },
	    { label: 'Rename', value: 'rename' },
	    { separator: true },
	    { label: 'Delete', value: 'del', danger: true },
	  ]} @menu:select=${e => run(e.detail.data.value)}>
	    <div class="card">Right-click me</div>
	  </ui-context-menu>
	──────────────────────────────────────────────────────────────────────
*/
import { computeAnchor } from '../../core/dom/anchor.js';
import { UIMenu } from '../menu/menu.js';
import { UIMenuItem } from '../menu/menu-item.js';
export class UIContextMenu extends UIMenu {
	static url = import.meta.url;
	// Reuse the dropdown's panel + item styles; `context-menu.css` only flips the
	// host to display:contents (it must not box the wrapped target).
	static styles = {
		menu: '../menu/menu.css',
		context: './context-menu.css',
	};
	static state = {
		items: [],
		side: 'bottom',
		align: 'start',
		offset: 2,
		// OPT-IN leave-close. A cursor-summoned menu defaults to PERSISTENT (opens AT
		// the pointer with no trigger to fall back onto → it must not vanish when the
		// pointer drifts off). Set true to inherit ui-menu's "leave the panel → close".
		closeOnLeave: false,
		// One-at-a-time by default (OS behavior): opening any context menu closes other
		// exclusive ones via the document bus. Set false to let this menu COEXIST with
		// others opened by right-clicking elsewhere.
		exclusive: true,
	};
	// Last pointer position (viewport coords) the menu was summoned at.
	pointerX = 0;
	pointerY = 0;
	// Document outside-pointerdown subscription while open (manual popover owns dismiss).
	dismissEntry = null;
	onConnect() {
		// Host is display:contents and sits in the event path → slotted-content
		// contextmenu bubbles here. `this.on` is auto-cleaned on disconnect.
		this.on('contextmenu', this.handleContextMenu);
		// Listen on the document bus for ANY context menu opening — an exclusive menu
		// closes itself when a DIFFERENT one opens (single-menu OS behavior).
		this.delegate('context-menu:open', this.handleSiblingOpen);
	}
	handleSiblingOpen(domEvent) {
		if (domEvent.detail?.source === this || this.state.exclusive !== true) {
			return;
		}
		const surface = this.refs.surface;
		if (surface && surface.matches(':popover-open')) {
			surface.hidePopover();
		}
	}
	handleContextMenu(domEvent) {
		domEvent.preventDefault();
		this.pointerX = domEvent.clientX;
		this.pointerY = domEvent.clientY;
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		if (surface.matches(':popover-open')) {
			// Already open: just relocate to the new cursor point.
			this.position();
			return;
		}
		this.openAtPointer();
	}
	async openAtPointer() {
		// The surface is `popover="manual"`, NOT `auto`: an auto popover opened inside
		// the contextmenu handler is light-dismissed by the right-click's OWN trailing
		// real pointer events (macOS/Chromium — opens-then-vanishes, "only stays while
		// the button is held"; a deferred open never reliably wins that race). Manual
		// takes no free light-dismiss, so it stays put like an OS menu — we own the
		// dismissal (outside-pointerdown / Esc / select) instead.
		await this.nextFrame();
		if (this.isDisconnected) {
			return;
		}
		const surface = this.refs.surface;
		if (surface && !surface.matches(':popover-open')) {
			surface.showPopover();
			// Announce on the document bus so other EXCLUSIVE context menus close —
			// `emit`'s detail.source is this menu, so siblings skip the emitter.
			this.emit('context-menu:open', {});
		}
		// Arm own outside-dismiss only AFTER another frame, so the opening gesture's
		// own trailing pointerup/click can't instantly close it (the rebuilt-the-bug trap).
		await this.nextFrame();
		if (this.isDisconnected || !surface || !surface.matches(':popover-open')) {
			return;
		}
		this.armDismiss();
	}
	armDismiss() {
		if (this.dismissEntry) {
			return;
		}
		this.dismissEntry = this.addEvent('pointerdown', this.handleOutsidePointer, globalThis.document, {
			capture: true,
		});
	}
	disarmDismiss() {
		this.dismissEntry?.unsubscribe();
		this.dismissEntry = null;
	}
	handleOutsidePointer(domEvent) {
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		// A right-button press elsewhere is a RELOCATE (contextmenu re-summons), not a
		// dismiss — let it through. A click INSIDE the surface (composed path) keeps it.
		if (domEvent.button === 2 || domEvent.composedPath().includes(surface)) {
			return;
		}
		surface.hidePopover();
	}
	// Manual popovers forgo the auto popover's free Esc dismiss, so add it (the base
	// handleKey never handled Escape — it relied on the browser).
	handleKey(domEvent) {
		if (domEvent.key === 'Escape') {
			domEvent.preventDefault();
			this.refs.surface?.hidePopover();
			return;
		}
		super.handleKey(domEvent);
	}
	// Tear the outside-dismiss listener down whenever the surface closes (select / Esc /
	// outside-click all hidePopover → a `closed` toggle lands here).
	handleToggle(domEvent) {
		super.handleToggle(domEvent);
		if (domEvent.newState !== 'open') {
			this.disarmDismiss();
		}
	}
	// closeOnLeave keep-open region. There is NO trigger button — the slotted content
	// IS the boxed target, so the menu must persist while the pointer is over EITHER
	// the panel (handled by the base) or the box, and close only when it leaves both.
	// The host is display:contents (no box of its own), so measure the union of the
	// slotted children's rects rather than the host.
	keepOpenRect() {
		const nodes = this.children;
		let minLeft = Infinity;
		let minTop = Infinity;
		let maxRight = -Infinity;
		let maxBottom = -Infinity;
		for (let index = 0; index < nodes.length; index += 1) {
			const rect = nodes[index].getBoundingClientRect();
			if (rect.width === 0 && rect.height === 0) {
				continue;
			}
			minLeft = Math.min(minLeft, rect.left);
			minTop = Math.min(minTop, rect.top);
			maxRight = Math.max(maxRight, rect.right);
			maxBottom = Math.max(maxBottom, rect.bottom);
		}
		if (minLeft === Infinity) {
			return null;
		}
		return {
			left: minLeft,
			top: minTop,
			right: maxRight,
			bottom: maxBottom,
		};
	}
	position() {
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		const x = this.pointerX;
		const y = this.pointerY;
		const placed = computeAnchor({
			top: y,
			left: x,
			bottom: y,
			right: x,
			width: 0,
			height: 0,
		}, {
			width: surface.offsetWidth,
			height: surface.offsetHeight,
		}, {
			placement: `${this.state.side}-${this.state.align}`,
			offset: Number(this.state.offset) || 2,
		});
		surface.style.top = `${placed.top}px`;
		surface.style.left = `${placed.left}px`;
		surface.dataset.placement = placed.placement;
	}
	render() {
		this.html`
			<slot></slot>
			<div #surface class="menu-surface" popover="manual" role="menu" tabindex="-1"
				@toggle=${this.handleToggle} @menu-item:select=${this.handleSelect} @keydown=${this.handleKey}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-context-menu', UIContextMenu);
