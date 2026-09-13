/*
	DESCRIPTION: ui-hover-card — content that appears on hover/focus.
	Slots: name="trigger"; default = card body. openDelay / closeDelay in ms.
	Surface is `popover="manual"` (top-layer) so it escapes preview clip.
	HideOnScroll dismisses on stage / page scroll, Escape dismisses by key.
*/
import { WebComponent } from 'webcomponent';
import { positionOverlayWhenReady } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import { isTopEscapable, syncEscapable } from '../../core/escape/escapeStack.js';
const SIDE_PLACEMENT = {
	top: 'top-start',
	bottom: 'bottom-start',
	start: 'left-start',
	end: 'right-start',
};
export class UIHoverCard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		hoverCard: './hover-card.css',
	};
	static state = {
		open: false,
		openDelay: 200,
		closeDelay: 150,
		// top | bottom | start | end
		side: 'bottom',
	};
	openTimer = null;
	closeTimer = null;
	/*
	 * This opens on FOCUS as well as hover, so WCAG 1.4.13 applies: the card must
	 * be dismissable WITHOUT moving pointer hover or keyboard focus. A
	 * `popover="manual"` surface gets no UA light-dismiss, and a keydown bound to
	 * this subtree would never fire while the pointer merely hovers, so the key
	 * has to be global. The hotkey registry is the house mechanism for that (same
	 * as control-center / slideout / sidebar) and it sweeps its own entry on
	 * disconnect, so there is no listener to unwind by hand.
	 */
	onConnect() {
		this.hotKey('escape', this.handleEscape, {
			preventDefault: false,
		});
	}
	onDisconnect() {
		this.scrollHide?.detach();
		this.clearTimers();
		syncEscapable(this, false);
	}
	/*
	 * `preventDefault: false` on the registration, then prevent by hand only when
	 * this card actually dismisses — a closed hover-card must not swallow Escape
	 * from whoever else wants it. The stack guard keeps it to the top layer: these
	 * open on hover, so one can easily appear above a modal, and without the guard
	 * a single Escape would take both.
	 */
	handleEscape(keyEvent) {
		if (this.state.open !== true || !isTopEscapable(this)) {
			return;
		}
		keyEvent.preventDefault();
		this.dismiss();
	}
	// Drop any pending open/close and hide now. Shared by Escape and scroll —
	// both mean "this card is done", and they had the same two lines each.
	dismiss() {
		this.clearTimers();
		this.refs.surface?.hidePopover?.();
	}
	ensureScrollHide() {
		this.scrollHide ??= new HideOnScroll(this, 'closeFromScroll', {
			keepOpen: () => {
				return this.refs.surface;
			},
		});
		return this.scrollHide;
	}
	closeFromScroll() {
		this.dismiss();
	}
	positionPanel() {
		const side = this.state.side;
		positionOverlayWhenReady(this.refs.surface, this.refs.trigger, {
			placement: SIDE_PLACEMENT[side] || 'bottom-start',
			offset: 8,
		});
	}
	handleToggle(domEvent) {
		const isOpen = domEvent.newState === 'open';
		if (this.state.open !== isOpen) {
			this.state.open = isOpen;
		}
		// Keyed off the popover's OWN toggle rather than the open/close intent, so
		// stack membership can never drift from what is actually on screen.
		syncEscapable(this, isOpen);
		if (isOpen) {
			this.positionPanel();
			this.ensureScrollHide().attach();
			return;
		}
		this.scrollHide?.detach();
	}
	clearTimers() {
		if (this.openTimer) {
			this.openTimer.clear();
			this.openTimer = null;
		}
		if (this.closeTimer) {
			this.closeTimer.clear();
			this.closeTimer = null;
		}
	}
	scheduleOpen() {
		this.clearTimers();
		const delay = Number(this.state.openDelay) || 0;
		this.openTimer = this.setTimeout(this.commitOpen, delay);
	}
	scheduleClose() {
		this.clearTimers();
		const delay = Number(this.state.closeDelay) || 0;
		this.closeTimer = this.setTimeout(this.commitClose, delay);
	}
	commitOpen(component) {
		const owner = component || this;
		owner.openTimer = null;
		owner.refs.surface?.showPopover?.();
	}
	commitClose(component) {
		const owner = component || this;
		owner.closeTimer = null;
		owner.refs.surface?.hidePopover?.();
	}
	handleEnter() {
		this.scheduleOpen();
	}
	handleLeave() {
		this.scheduleClose();
	}
	handleFocusIn() {
		this.scheduleOpen();
	}
	handleFocusOut() {
		this.scheduleClose();
	}
	render() {
		this.html`
			<div class="hover-card" data-side=${this.state.side} ?data-open=${this.state.open}
				@pointerenter=${this.handleEnter}
				@pointerleave=${this.handleLeave}
				@focusin=${this.handleFocusIn}
				@focusout=${this.handleFocusOut}>
				<div class="hover-card-trigger" #trigger><slot name="trigger"></slot></div>
				<div class="hover-card-surface glass" #surface popover="manual" role="tooltip" @toggle=${this.handleToggle}>
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-hover-card', UIHoverCard);
