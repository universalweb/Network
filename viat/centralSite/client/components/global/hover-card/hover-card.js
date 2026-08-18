/*
	DESCRIPTION: ui-hover-card — content that appears on hover/focus.
	Slots: name="trigger"; default = card body. openDelay / closeDelay in ms.
	Surface is `popover="manual"` (top-layer) so it escapes preview clip.
	HideOnScroll dismisses on stage / page scroll.
*/
import { WebComponent } from 'webcomponent';
import { positionOverlay } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
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
	onDisconnect() {
		this.scrollHide?.detach();
		this.clearTimers();
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
		this.clearTimers();
		this.refs.surface?.hidePopover?.();
	}
	positionPanel() {
		const side = this.state.side;
		positionOverlay(this.refs.surface, this.refs.trigger, {
			placement: SIDE_PLACEMENT[side] || 'bottom-start',
			offset: 8,
		});
	}
	handleToggle(domEvent) {
		const isOpen = domEvent.newState === 'open';
		if (this.state.open !== isOpen) {
			this.state.open = isOpen;
		}
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
			<div class="hc" data-side=${this.state.side} ?data-open=${this.state.open}
				@pointerenter=${this.handleEnter}
				@pointerleave=${this.handleLeave}
				@focusin=${this.handleFocusIn}
				@focusout=${this.handleFocusOut}>
				<div class="hc-trigger" #trigger><slot name="trigger"></slot></div>
				<div class="hc-surface" #surface popover="manual" role="tooltip" @toggle=${this.handleToggle}>
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-hover-card', UIHoverCard);
