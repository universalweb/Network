/*
	DESCRIPTION: ui-menu — a dropdown menu (MUI "Menu"), the base for context-menu
	(#10) and menubar (#41). Built on the NATIVE Popover API: the panel is
	`popover="auto"`, so it renders in the TOP LAYER (escapes transformed /
	overflow-clipped ancestors — which a MorphSurface `position:fixed`-in-shadow
	overlay can't) and gets Esc + outside-click light-dismiss for free. The trigger
	wires it via `popovertarget`. Placement comes from the shared `computeAnchor`
	engine (flip + shift) applied on the `toggle` event; the panel starts hidden
	(opacity 0) and is revealed only after positioning, so there's no centered-flash.
	Keyboard roving (Arrow/Home/End/Enter) works because all `<button role="menuitem">`
	live in ONE shadow root — no cross-shadow focus plumbing. v1 is text + kbd hint +
	checkmark + danger + separators; per-item ICONS are v2 (they'd force a child
	component and cross-shadow focus).
	── EVENTS ───────────────────────────────────────────────────────────
	  menu:select { value, index }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-menu .label=${'Actions ▾'} .items=${[
	    { label: 'Rename', value: 'rename', kbd: '⌘R' },
	    { label: 'Duplicate', value: 'dup' },
	    { separator: true },
	    { label: 'Delete', value: 'del', danger: true },
	  ]} @menu:select=${e => run(e.detail.data.value)}></ui-menu>
	  <ui-menu .placement=${'bottom-end'}><span slot="trigger">⋮</span></ui-menu>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
import { computeAnchor } from '../../core/dom/anchor.js';
// Shared by ui-menu + ui-menubar (both inject user labels into ^html item/trigger
// markup). Named export so the family escapes identically from one source.
export function escapeHtml(value) {
	return String(value).replace(/[&<>"]/g, (char) => {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
		}[char];
	});
}
// True when (x,y) sits inside `rect` grown by `pad` on every edge. The pad
// bridges the trigger↔panel offset gap so a pointer crossing it isn't read as
// "left the menu".
function withinPaddedRect(rect, pointerX, pointerY, pad) {
	return pointerX >= rect.left - pad &&
		pointerX <= rect.right + pad &&
		pointerY >= rect.top - pad &&
		pointerY <= rect.bottom + pad;
}
export class UIMenu extends WebComponent {
	static url = import.meta.url;
	static styles = {
		menu: './menu.css',
	};
	static state = {
		items: [],
		label: 'Menu',
		placement: 'bottom-start',
		offset: 6,
		// Close when the pointer leaves the trigger+panel region (the dropdown
		// default). ui-context-menu opts out — a cursor-summoned menu must persist
		// until pick / Esc, not vanish on a stray drift.
		closeOnLeave: true,
	};
	// Tracks the keyboard-focused item; NOT reactive (open/close must not re-render
	// the panel, which would tear down the live native popover).
	activeIndex = -1;
	// The live document pointermove subscription while open (null when closed), and
	// whether the pointer has entered the region yet — both NON-reactive.
	leaveEntry = null;
	pointerArmed = false;
	// Indexes of selectable (non-separator, non-disabled) items, for roving.
	enabledIndexes() {
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		const out = [];
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			if (item && !item.separator && !item.disabled) {
				out.push(index);
			}
		}
		return out;
	}
	handleToggle(domEvent) {
		const isOpen = domEvent.newState === 'open';
		this.refs.trigger?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		if (isOpen) {
			this.position();
			// Reveal only after positioning → no centered-flash; doubles as the
			// entrance transition hook (see menu.css `.is-open`).
			surface.classList.add('is-open');
			this.activeIndex = -1;
			this.focusFirst();
			this.armLeaveWatch();
		} else {
			surface.classList.remove('is-open');
			this.disarmLeaveWatch();
		}
	}
	// Close-on-leave. Native popover already gives Esc + outside-click dismiss; this
	// adds "pointer left the button AND the panel" — the requested replacement for
	// a scroll listener (move the mouse off → it closes).
	armLeaveWatch() {
		if (!this.state.closeOnLeave || this.leaveEntry) {
			return;
		}
		this.pointerArmed = false;
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
		const surface = this.refs.surface;
		if (!surface || !surface.matches(':popover-open')) {
			return;
		}
		// Pad bridges the trigger↔panel gap (the placement offset + slack).
		const pad = (Number(this.state.offset) || 6) + 6;
		const trigger = this.refs.trigger;
		const overTrigger = trigger ? withinPaddedRect(trigger.getBoundingClientRect(), domEvent.clientX, domEvent.clientY, pad) : false;
		const overSurface = withinPaddedRect(surface.getBoundingClientRect(), domEvent.clientX, domEvent.clientY, pad);
		if (overTrigger || overSurface) {
			// Arm only once the pointer is genuinely inside, so a keyboard-opened
			// menu (pointer parked elsewhere) doesn't close on the first stray move.
			this.pointerArmed = true;
			return;
		}
		if (this.pointerArmed) {
			surface.hidePopover();
		}
	}
	position() {
		const trigger = this.refs.trigger;
		const surface = this.refs.surface;
		if (!trigger || !surface) {
			return;
		}
		const placed = computeAnchor(trigger.getBoundingClientRect(), {
			width: surface.offsetWidth,
			height: surface.offsetHeight,
		}, {
			placement: this.state.placement,
			offset: Number(this.state.offset) || 6,
		});
		surface.style.top = `${placed.top}px`;
		surface.style.left = `${placed.left}px`;
		surface.dataset.placement = placed.placement;
	}
	focusItem(index) {
		const button = this.refs.surface?.querySelector(`button[data-index="${index}"]`);
		if (button) {
			this.activeIndex = index;
			button.focus();
		}
	}
	focusFirst() {
		const indexes = this.enabledIndexes();
		if (indexes.length) {
			this.focusItem(indexes[0]);
		}
	}
	move(delta) {
		const indexes = this.enabledIndexes();
		if (!indexes.length) {
			return;
		}
		const position = indexes.indexOf(this.activeIndex);
		let next;
		if (position === -1) {
			// No current item: enter at the first (down) or last (up) enabled item.
			next = delta > 0 ? indexes[0] : indexes[indexes.length - 1];
		} else {
			next = indexes[(position + delta + indexes.length) % indexes.length];
		}
		this.focusItem(next);
	}
	handleKey(domEvent) {
		switch (domEvent.key) {
			case 'ArrowDown':
				domEvent.preventDefault();
				this.move(1);
				break;
			case 'ArrowUp':
				domEvent.preventDefault();
				this.move(-1);
				break;
			case 'Home': {
				domEvent.preventDefault();
				this.focusFirst();
				break;
			}
			case 'End': {
				domEvent.preventDefault();
				const indexes = this.enabledIndexes();
				if (indexes.length) {
					this.focusItem(indexes[indexes.length - 1]);
				}
				break;
			}
			case 'Enter':
			case ' ':
				domEvent.preventDefault();
				this.selectIndex(this.activeIndex);
				break;
			default:
				break;
		}
	}
	handleClick(domEvent) {
		const button = domEvent.target.closest('button[data-index]');
		if (!button || button.disabled) {
			return;
		}
		this.selectIndex(Number(button.dataset.index));
	}
	selectIndex(index) {
		const item = this.state.items[index];
		if (!item || item.disabled || item.separator) {
			return;
		}
		this.emit('menu:select', {
			value: item.value,
			index,
		});
		this.refs.surface?.hidePopover();
	}
	render() {
		this.html `
			<button #trigger class="menu-trigger" type="button"
				popovertarget="menu-pop" aria-haspopup="menu" aria-expanded="false">
				<slot name="trigger">${this.state.label}</slot>
			</button>
			<div #surface class="menu-surface" id="menu-pop" popover="auto" role="menu"
				@toggle=${this.handleToggle} @click=${this.handleClick} @keydown=${this.handleKey}>
				^html${this.renderItems}
			</div>
		`;
	}
	renderItems() {
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		let markup = '';
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			if (item.separator) {
				markup += '<div class="menu-sep" role="separator"></div>';
				continue;
			}
			const classes = `menu-item${item.danger ? ' is-danger' : ''}${item.checked ? ' is-checked' : ''}`;
			const check = `<span class="menu-check" aria-hidden="true">${item.checked ? '✓' : ''}</span>`;
			const kbd = item.kbd ? `<span class="menu-kbd">${escapeHtml(item.kbd)}</span>` : '';
			markup += `<button type="button" class="${classes}" role="menuitem" data-index="${index}" tabindex="-1"${item.disabled ? ' disabled aria-disabled="true"' : ''}>${check}<span class="menu-label">${escapeHtml(item.label)}</span>${kbd}</button>`;
		}
		return markup;
	}
}
customElements.define('ui-menu', UIMenu);
