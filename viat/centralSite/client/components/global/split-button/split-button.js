/*
	DESCRIPTION: ui-split-button — x.ai "Try for free" pill: primary action + caret
	menu, ONE visual control. Extends UIMenu (popover panel, leave-dismiss,
	keyboard, ui-menu-item list).
	CRITICAL: panel opens via showPopover() from a same-shadow caret —
	NOT nested ui-button popovertarget (id lookup is tree-scoped; that is why
	the old caret never opened). Caret click latches the menu open (survives
	pointer leave); a second caret click closes and restores hover-open.
	── EVENTS ───────────────────────────────────────────────────────────
	  split-button:click  { href? }           — primary half (navigate is native when href)
	  split-button:toggle { open }            — caret latch (open/close)
	  split-button:select { value, item, index, href? }
	  Unified (default): the pill is ONE button — caret click fires
	  split-button:click AND latches the menu (survives pointer-leave).
	  Hover-open is transient; a trigger click promotes it to pinned.
	  Split (`state.split=${true}`): halves are independent. Primary fires
	  click; caret is the dropdown latch (same latchMenu mechanic).
	REJECTED a new hover-pin module, and rejected copying ui-menu /
	ui-menubar / ui-nav-section / ui-hover-card — none of those implement
	hover-transient + click-latch. UIMenu has no hover-open-from-closed;
	menubar hover only switches an already-open panel; nav-section click
	TOGGLES closed; hover-card has no click pin. This component already
	owns menuLatched for split:true — unified caret now uses that same
	method. Auto popover: do NOT join the escape stack. UA still
	light-dismisses a click outside the surface; latchMenu re-opens
	pinned after that dismiss (the caret lives outside the popover).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-split-button .state.label=${'Try for free'} .state.href=${'/signup'}
	    .state.items=${[…]} @split-button:select=${…}></ui-split-button>
*/
import '../icon/icon.js';
import '../invert-arrow/invert-arrow.js';
import { UIMenu } from '../menu/menu.js';
import { UIMenuItem } from '../menu-item/menu-item.js';
export class UISplitButton extends UIMenu {
	static url = import.meta.url;
	static styles = {
		// Drop UIMenu's menu.css (:host + .menu-trigger) — cluster owns layout.
		menu: null,
		menuSurface: '../menu/menu-surface.css',
		splitButton: './split-button.css',
	};
	static state = {
		label: 'Action',
		items: [],
		side: 'bottom',
		align: 'end',
		offset: 6,
		matchWidth: false,
		closeOnLeave: true,
		// Open the panel when the pointer enters the pill (x.ai hover affordance).
		openOnHover: true,
		/*
		 * false = one control (default). true = halves are independent:
		 * hover-open is caret-only. Caret is always the dropdown latch.
		 */
		split: false,
		href: '',
		target: '',
		tone: 'primary',
		variant: 'solid',
		size: 'md',
		disabled: false,
		tooltip: '',
		leadIcon: '',
		activeLeadIcon: '',
	};
	keepOpenRect() {
		return this.refs.cluster ? this.refs.cluster.getBoundingClientRect() : super.keepOpenRect();
	}
	/* Place the panel under the whole primary+caret cluster. */
	anchorElement() {
		return this.refs.cluster ?? super.anchorElement();
	}
	/* Click-opened menu stays open across pointer leave until the caret is
	   clicked again (or Esc / light-dismiss / item select). Non-reactive. */
	menuLatched = false;
	/* After a click-close, ignore hover-open until the pointer leaves. */
	hoverArmed = true;
	/*
	 * True between caret pointerdown and pointerup. Auto-popover
	 * light-dismisses the caret (outside the surface) on pointerdown, which
	 * would otherwise clear menuLatched before click can toggle the pin.
	 */
	caretPointerDown = false;
	handleToggle(domEvent) {
		super.handleToggle(domEvent);
		const isOpen = domEvent.newState === 'open';
		// data-open drives unified open paint + chevron spin (CSS only).
		this.refs.cluster?.toggleAttribute('data-open', isOpen);
		if (!isOpen && !this.caretPointerDown) {
			this.menuLatched = false;
		}
	}
	handleCaretPointerDown() {
		this.caretPointerDown = true;
	}
	handleCaretPointerUp() {
		this.caretPointerDown = false;
	}
	handlePointerWatch(domEvent) {
		if (this.menuLatched) {
			return;
		}
		super.handlePointerWatch(domEvent);
	}
	openMenu() {
		const surface = this.refs.surface;
		if (!surface || this.state.disabled || surface.matches(':popover-open')) {
			return;
		}
		// Imperative open — same-shadow panel. Do NOT use popovertarget toggle:
		// openOnHover + native toggle races (hover opens → click closes).
		this.showSurfacePopover(surface);
	}
	closeMenu() {
		const surface = this.refs.surface;
		if (surface?.matches(':popover-open')) {
			surface.hidePopover();
		}
	}
	/* Hover opens unless split mode (caret-only) or a click-close disarmed hover. */
	handleClusterEnter() {
		if (this.state.split || !this.hoverArmed || !this.state.openOnHover || this.state.disabled) {
			return;
		}
		this.openMenu();
	}
	handleClusterLeave() {
		this.hoverArmed = true;
	}
	handleCaretEnter() {
		if (!this.state.split || !this.hoverArmed || !this.state.openOnHover || this.state.disabled) {
			return;
		}
		this.openMenu();
	}
	handleCaretClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		if (!this.state.split) {
			this.handlePrimaryClick(domEvent);
		}
		this.latchMenu();
	}
	/*
	 * Promote hover-open to pinned, or toggle pinned closed.
	 * Auto-popover light-dismisses the caret (it sits outside the surface)
	 * on the same pointerdown — menuOpen is then false and we re-show
	 * latched. Do not flatten popover to manual.
	 */
	latchMenu() {
		const surface = this.refs.surface;
		const menuOpen = Boolean(surface?.matches(':popover-open'));
		if (this.menuLatched) {
			this.menuLatched = false;
			this.hoverArmed = false;
			this.closeMenu();
			this.emit('split-button:toggle', {
				open: false,
			});
			return;
		}
		this.menuLatched = true;
		if (!menuOpen) {
			this.openMenu();
		}
		this.emit('split-button:toggle', {
			open: true,
		});
	}
	handlePrimaryClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		this.emit('split-button:click', {
			href: this.state.href || undefined,
		});
		if (!this.state.href) {
			domEvent.preventDefault();
		}
	}
	selectIndex(index) {
		const item = this.state.items[index];
		if (!item || item.disabled || item.separator) {
			return;
		}
		// Feature event only — do not re-emit base menu:select (leaks base API).
		// Navigation is native when the menu-item is an <a href>.
		this.emit('split-button:select', {
			value: item.value,
			item,
			index,
			href: item.href,
		});
		this.closeAfterSelect();
	}
	renderPrimary() {
		// Real anchor when href is set — native ⌘-click / middle-click / status URL.
		if (this.state.href) {
			return this.htmlElement`
				<a class="split-primary"
					data-variant=${this.state.variant || 'solid'}
					data-tone=${this.state.tone || 'primary'}
					data-size=${this.state.size || 'md'}
					href=${this.state.href}
					target=${this.state.target || undefined}
					rel=${this.state.target === '_blank' ? 'noopener noreferrer' : undefined}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					tooltip=${this.state.tooltip || undefined}
					@click=${this.handlePrimaryClick}>${this.state.label}</a>
			`;
		}
		return this.htmlElement`
			<button class="split-primary" type="button"
				data-variant=${this.state.variant || 'solid'}
				data-tone=${this.state.tone || 'primary'}
				data-size=${this.state.size || 'md'}
				?disabled=${this.state.disabled}
				tooltip=${this.state.tooltip || undefined}
				@click=${this.handlePrimaryClick}>${this.state.label}</button>
		`;
	}
	render() {
		this.html`
			<div #cluster class="split" role="group"
				?data-split=${this.state.split}
				@pointerenter=${this.handleClusterEnter}
				@pointerleave=${this.handleClusterLeave}>
				${this.renderPrimary}
				<button #trigger class="split-caret" type="button"
					data-variant=${this.state.variant || 'solid'}
					data-tone=${this.state.tone || 'primary'}
					data-size=${this.state.size || 'md'}
					?disabled=${this.state.disabled}
					aria-haspopup="menu"
					aria-expanded="false"
					aria-label="More actions"
					@pointerenter=${this.handleCaretEnter}
					@pointerdown=${this.handleCaretPointerDown}
					@pointerup=${this.handleCaretPointerUp}
					@click=${this.handleCaretClick}>
					<span class="split-seam" aria-hidden="true"></span>
					<ui-invert-arrow class="split-chevron" .state.size=${'sm'}></ui-invert-arrow>
				</button>
			</div>
			<div #surface class="menu-surface glass" id="menu-pop" popover="auto" role="menu" tabindex="-1"
				@toggle=${this.handleToggle}
				@menu-item:select=${this.handleSelect}
				@keydown=${this.handleKey}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-split-button', UISplitButton);
