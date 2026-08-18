import '../icon/icon.js';
import { computeAnchor } from 'webcomponent';
import { withinPaddedRect } from '../menu/menu.js';
import { MorphSurface } from '../morph-surface/morph-surface.js';
/*
 * `<ui-popover>` — compact morph popover (/ Base UI Popover options).
 * Grows from its trigger; transparent outside-click catcher (no page dim).
 *
 * Options: side · align · offset · heading · description · showArrow ·
 * openOnHover · openDelay · closeDelay · open (controlled via MorphSurface).
 *
 * Usage:
 *   <ui-popover .state.label=${'Account ▾'} .state.heading=${'Signed in as'}
 *     .state.side=${'bottom'} .state.align=${'center'}>
 *     …body…
 *   </ui-popover>
 */
const SIDES = new Set([
	'top',
	'bottom',
	'left',
	'right',
]);
const ALIGNS = new Set([
	'start',
	'center',
	'end',
]);
function normalizeSide(side) {
	return SIDES.has(side) ? side : 'bottom';
}
function normalizeAlign(align) {
	return ALIGNS.has(align) ? align : 'center';
}
export class UIPopover extends MorphSurface {
	static url = import.meta.url;
	static styles = {
		popover: './popover.css',
	};
	static state = {
		label: 'Open',
		heading: '',
		description: '',
		// Preferred side of the trigger; may flip on collision.
		side: 'bottom',
		// Cross-axis alignment under the preferred side.
		align: 'center',
		// Gap between trigger and surface (px). Maps to computeAnchor offset.
		offset: 8,
		// Pointer triangle toward the trigger.
		showArrow: false,
		// Open on hover (Base UI openOnHover) in addition to click.
		openOnHover: false,
		openDelay: 200,
		closeDelay: 120,
	};
	// Hover open/close timer handles (ComponentTimeout).
	hoverOpenTimer = null;
	hoverCloseTimer = null;
	// Document pointermove while hover-open — bridges the trigger↔surface gap.
	leaveEntry = null;
	pointerArmed = false;
	// Snappier than floating-panel — cult-ui popover spring is tighter.
	openDuration() {
		return 300;
	}
	closeDuration() {
		return 200;
	}
	anchorGap() {
		const gap = Number(this.state.offset);
		return Number.isFinite(gap) ? gap : 8;
	}
	// Placement from side + align (PopoverContent align / side).
	positionSurface() {
		const overlay = this.refs.overlay;
		const surface = this.refs.surface;
		if (!overlay || !surface) {
			return;
		}
		const overlayBox = overlay.getBoundingClientRect();
		const side = normalizeSide(this.state.side);
		const align = normalizeAlign(this.state.align);
		const placed = computeAnchor(this.fromRect(), {
			width: surface.offsetWidth,
			height: surface.offsetHeight,
		}, {
			placement: `${side}-${align}`,
			offset: this.anchorGap(),
			flip: true,
			shift: true,
		});
		surface.style.setProperty('--ms-anchor-top', `${placed.top - overlayBox.top}px`);
		surface.style.setProperty('--ms-anchor-left', `${placed.left - overlayBox.left}px`);
		surface.dataset.placement = placed.placement;
		const [
			resolvedSide,
			resolvedAlign,
		] = String(placed.placement).split('-');
		surface.dataset.side = resolvedSide || side;
		surface.dataset.align = resolvedAlign || align;
	}
	onConnect() {
		super.onConnect();
		this.hoverOpenTimer = this.createTimeout(this.fireHoverOpen, this.state.openDelay);
		this.hoverCloseTimer = this.createTimeout(this.fireHoverClose, this.state.closeDelay);
	}
	onDisconnect() {
		super.onDisconnect();
		this.hoverOpenTimer?.clear();
		this.hoverCloseTimer?.clear();
		this.disarmLeaveWatch();
	}
	fireHoverOpen(component) {
		component.runOpen();
	}
	fireHoverClose(component) {
		component.runClose();
	}
	armHoverOpen() {
		if (!this.state.openOnHover) {
			return;
		}
		this.hoverCloseTimer?.clear();
		const delay = Number(this.state.openDelay);
		this.hoverOpenTimer?.run(null, Number.isFinite(delay) ? delay : 200);
	}
	armHoverClose() {
		if (!this.state.openOnHover) {
			return;
		}
		this.hoverOpenTimer?.clear();
		const delay = Number(this.state.closeDelay);
		this.hoverCloseTimer?.run(null, Number.isFinite(delay) ? delay : 120);
	}
	cancelHoverClose() {
		this.hoverCloseTimer?.clear();
	}
	handleTriggerPointerEnter() {
		this.armHoverOpen();
	}
	handleTriggerPointerLeave() {
		this.hoverOpenTimer?.clear();
		/*
		 * Once open, leave-watch owns close so the trigger→surface gap does not
		 * fire a premature pointerleave close (the overlay used to steal the
		 * pointer the instant it appeared).
		 */
		if (this.state.openOnHover && this.state.open) {
			return;
		}
		this.armHoverClose();
	}
	handleSurfacePointerEnter() {
		this.cancelHoverClose();
	}
	handleSurfacePointerLeave() {
		if (this.state.openOnHover && this.state.open) {
			return;
		}
		this.armHoverClose();
	}
	armLeaveWatch() {
		if (!this.state.openOnHover || this.leaveEntry) {
			return;
		}
		this.pointerArmed = true;
		this.leaveEntry = this.addEvent('pointermove', this.handlePointerWatch, globalThis.document, {
			passive: true,
		});
	}
	disarmLeaveWatch() {
		this.leaveEntry?.unsubscribe();
		this.leaveEntry = null;
		this.pointerArmed = false;
	}
	handlePointerWatch(domEvent) {
		if (!this.state.openOnHover || !this.state.open) {
			return;
		}
		const pad = this.anchorGap() + 10;
		const pointerX = domEvent.clientX;
		const pointerY = domEvent.clientY;
		const trigger = this.refs.trigger;
		const surface = this.refs.surface;
		const overTrigger = trigger ? withinPaddedRect(trigger.getBoundingClientRect(), pointerX, pointerY, pad) : false;
		const overSurface = surface ? withinPaddedRect(surface.getBoundingClientRect(), pointerX, pointerY, pad) : false;
		if (overTrigger || overSurface) {
			this.hoverCloseTimer?.clear();
			this.pointerArmed = true;
			return;
		}
		if (this.pointerArmed) {
			this.armHoverClose();
		}
	}
	runOpen() {
		const wasOpen = this.state.open;
		super.runOpen();
		if (!wasOpen && this.state.open) {
			this.emit('popover:open', {
				open: true,
			});
			this.armLeaveWatch();
		}
	}
	runClose() {
		const wasOpen = this.state.open;
		this.disarmLeaveWatch();
		super.runClose();
		if (wasOpen && !this.state.open) {
			this.emit('popover:close', {
				open: false,
			});
		}
	}
	render() {
		this.html`
			<button
				class="pp-trigger"
				type="button"
				#trigger
				aria-haspopup="dialog"
				aria-expanded=${() => {
					return this.state.open ? 'true' : 'false';
				}}
				@click=${this.handleTriggerClick}
				@pointerenter=${this.handleTriggerPointerEnter}
				@pointerleave=${this.handleTriggerPointerLeave}>
				<slot name="trigger">${this.state.label}</slot>
			</button>
			<div class="pp-overlay" #overlay popover="manual" ?data-hover=${this.state.openOnHover}>
				<div class="pp-backdrop" @click=${this.handleBackdropClick}></div>
				<div
					class="pp-surface"
					#surface
					role="dialog"
					aria-label=${this.state.heading || this.state.label}
					@pointerenter=${this.handleSurfacePointerEnter}
					@pointerleave=${this.handleSurfacePointerLeave}>
					<div
						class="pp-arrow"
						?hidden=${!this.state.showArrow}
						aria-hidden="true"></div>
					<div class="pp-heading" ?hidden=${!this.state.heading}>${this.state.heading}</div>
					<p class="pp-description" ?hidden=${!this.state.description}>${this.state.description}</p>
					<div class="pp-body"><slot></slot></div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-popover', UIPopover);
