/*
	DESCRIPTION: ui-split-button — x.ai "Try for free" pill: primary action + caret
	menu, ONE visual control. Extends UIMenu (popover panel, leave-dismiss,
	keyboard, ui-menu-item list).
	CRITICAL: panel opens via showPopover() from a same-shadow caret/primary —
	NOT nested ui-button popovertarget (id lookup is tree-scoped; that is why
	the old caret never opened). Open-only on click (no toggle) so openOnHover
	does not race: hover opens → click would otherwise toggle-close.
	── EVENTS ───────────────────────────────────────────────────────────
	  split-button:click  { href? }   — primary half (navigate is native when href)
	  split-button:select { value, item, index, href? }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-split-button .state.label=${'Try for free'} .state.href=${'/signup'}
	    .state.items=${[…]} @split-button:select=${…}></ui-split-button>
*/
import '../icon/icon.js';
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
		href: '',
		target: '',
		tone: 'primary',
		variant: 'solid',
		size: 'md',
		disabled: false,
		tooltip: '',
	};
	keepOpenRect() {
		return this.refs.cluster ? this.refs.cluster.getBoundingClientRect() : super.keepOpenRect();
	}
	/* Place the panel under the whole primary+caret cluster. */
	anchorElement() {
		return this.refs.cluster ?? super.anchorElement();
	}
	handleToggle(domEvent) {
		super.handleToggle(domEvent);
		const isOpen = domEvent.newState === 'open';
		// data-open drives unified open paint + chevron spin (CSS only).
		this.refs.cluster?.toggleAttribute('data-open', isOpen);
	}
	openMenu() {
		const surface = this.refs.surface;
		if (!surface || this.state.disabled || surface.matches(':popover-open')) {
			return;
		}
		// Imperative open — same-shadow panel. Do NOT use popovertarget toggle:
		// openOnHover + native toggle races (hover opens → click closes).
		surface.showPopover();
	}
	closeMenu() {
		const surface = this.refs.surface;
		if (surface?.matches(':popover-open')) {
			surface.hidePopover();
		}
	}
	/* Hover opens; leave-watch / Esc / outside light-dismiss close.
	   Caret + label (no href) only OPEN — never toggle-close on the same control. */
	handleClusterEnter() {
		if (!this.state.openOnHover || this.state.disabled) {
			return;
		}
		this.openMenu();
	}
	handleCaretClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		// Open only. Closing is leave / Esc / light-dismiss / item select —
		// avoids hover→open then click→toggle-close.
		this.openMenu();
	}
	handlePrimaryClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		// Navigation is native when primary is an <a href> — only emit.
		this.emit('split-button:click', {
			href: this.state.href || undefined,
		});
		// No default href → whole pill is the menu control (open).
		if (!this.state.href) {
			domEvent.preventDefault();
			this.openMenu();
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
		this.refs.surface?.hidePopover();
	}
	renderPrimary() {
		const variant = this.state.variant || 'solid';
		const tone = this.state.tone || 'primary';
		const size = this.state.size || 'md';
		const label = this.state.label;
		const tip = this.state.tooltip || undefined;
		// Real anchor when href is set — native ⌘-click / middle-click / status URL.
		if (this.state.href) {
			return this.htmlElement`
				<a class="split-primary"
					data-variant=${variant}
					data-tone=${tone}
					data-size=${size}
					href=${this.state.href}
					target=${this.state.target || undefined}
					rel=${this.state.target === '_blank' ? 'noopener noreferrer' : undefined}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					tooltip=${tip}
					@click=${this.handlePrimaryClick}>${label}</a>
			`;
		}
		return this.htmlElement`
			<button class="split-primary" type="button"
				data-variant=${variant}
				data-tone=${tone}
				data-size=${size}
				?disabled=${this.state.disabled}
				tooltip=${tip}
				@click=${this.handlePrimaryClick}>${label}</button>
		`;
	}
	render() {
		const variant = this.state.variant || 'solid';
		const tone = this.state.tone || 'primary';
		const size = this.state.size || 'md';
		this.html`
			<div #cluster class="split" role="group"
				@pointerenter=${this.handleClusterEnter}>
				${this.renderPrimary}
				<button #trigger class="split-caret" type="button"
					data-variant=${variant}
					data-tone=${tone}
					data-size=${size}
					?disabled=${this.state.disabled}
					aria-haspopup="menu"
					aria-expanded="false"
					aria-label="More actions"
					@click=${this.handleCaretClick}>
					<ui-icon class="split-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</button>
			</div>
			<div #surface class="menu-surface" id="menu-pop" popover="auto" role="menu" tabindex="-1"
				@toggle=${this.handleToggle}
				@menu-item:select=${this.handleSelect}
				@keydown=${this.handleKey}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-split-button', UISplitButton);
