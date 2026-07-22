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
	  menu:select { value, item, index }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-menu .state.label=${'Actions ▾'} .state.items=${[
	    { label: 'Rename', value: 'rename', kbd: '⌘R' },
	    { label: 'Duplicate', value: 'dup' },
	    { separator: true },
	    { label: 'Delete', value: 'del', danger: true },
	  ]} @menu:select=${e => run(e.detail.data.value)}></ui-menu>
	  <ui-menu .state.align=${'end'}><span slot="trigger">⋮</span></ui-menu>
	──────────────────────────────────────────────────────────────────────
*/
import { computeAnchor } from '../../core/dom/anchor.js';
import { WebComponent } from '../../core/index.js';
import { UIMenuItem } from './menu-item.js';
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
		// Which viewport side the panel opens from (bottom | top | left | right).
		side: 'bottom',
		/*
		 * Cross-axis alignment under the trigger: start | center | end. Center by
		 * default — reads more balanced than a left/right edge.
		 */
		align: 'center',
		offset: 6,
		/*
		 * Grow the trigger to the dropdown's content width so button + panel read as one
		 * block (edges flush under the center placement). `min-` sizing, so a trigger
		 * whose own label is wider is never clipped. Off = natural trigger width.
		 */
		matchWidth: false,
		/*
		 * Close when the pointer leaves the trigger+panel region (the dropdown default).
		 * ui-context-menu opts out — a cursor-summoned menu must persist until pick / Esc,
		 * not vanish on a stray drift.
		 */
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
			// Focus the PANEL, not the first item: an opened menu must show no
			// pre-highlighted item (normal until hover / arrow / click). Keyboard
			// roving still works — the panel is the keydown target and ArrowDown
			// enters the list (move() from activeIndex -1 lands on the first item).
			surface.focus({
				preventScroll: true,
			});
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
		const region = this.keepOpenRect();
		const overRegion = region ? withinPaddedRect(region, domEvent.clientX, domEvent.clientY, pad) : false;
		const overSurface = withinPaddedRect(surface.getBoundingClientRect(), domEvent.clientX, domEvent.clientY, pad);
		if (overRegion || overSurface) {
			// Arm only once the pointer is genuinely inside, so a keyboard-opened
			// menu (pointer parked elsewhere) doesn't close on the first stray move.
			this.pointerArmed = true;
			return;
		}
		if (this.pointerArmed) {
			surface.hidePopover();
		}
	}
	// The non-panel region whose hover keeps the menu open. For a dropdown it is the
	// trigger button; ui-context-menu overrides it to the slotted target box (it has
	// no trigger). Returns a rect-like ({left,top,right,bottom}) or null.
	keepOpenRect() {
		return this.refs.trigger ? this.refs.trigger.getBoundingClientRect() : null;
	}
	position() {
		const trigger = this.refs.trigger;
		const surface = this.refs.surface;
		if (!trigger || !surface) {
			return;
		}
		const surfaceWidth = surface.offsetWidth;
		if (this.state.matchWidth) {
			/*
			 * Match the trigger to the (content-sized) dropdown width BEFORE measuring the
			 * trigger rect below, so a center placement lands the two flush. `min-` never
			 * shrinks a wider trigger; the reflow from the read on the next line applies it.
			 */
			trigger.style.minInlineSize = `${surfaceWidth}px`;
		}
		const placed = computeAnchor(trigger.getBoundingClientRect(), {
			width: surfaceWidth,
			height: surface.offsetHeight,
		}, {
			placement: `${this.state.side}-${this.state.align}`,
			offset: Number(this.state.offset) || 6,
		});
		surface.style.top = `${placed.top}px`;
		surface.style.left = `${placed.left}px`;
		surface.dataset.placement = placed.placement;
	}
	focusItem(index) {
		const item = this.state.items[index];
		if (!item) {
			return;
		}
		// Locate the row COMPONENT by a stable field and call its focus() — no
		// shadow-piercing querySelector (the tabs roving pattern).
		const row = this.findChild('ui-menu-item', (candidate) => {
			return candidate.state.value === item.value;
		});
		if (row) {
			this.activeIndex = index;
			row.focus();
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
	// ONE container listener for the row components' `menu-item:select` event (HARD RULE
	// — no per-item listeners, no closest()). Resolves the index from state.items by value.
	handleSelect(domEvent) {
		domEvent.stopPropagation();
		const value = domEvent.detail?.data?.value;
		const index = this.state.items.findIndex((candidate) => {
			return candidate && candidate.value === value;
		});
		this.selectIndex(index);
	}
	selectIndex(index) {
		const item = this.state.items[index];
		if (!item || item.disabled || item.separator) {
			return;
		}
		this.emit('menu:select', {
			value: item.value,
			item,
			index,
		});
		this.refs.surface?.hidePopover();
	}
	render() {
		this.html`
			<button #trigger class="menu-trigger" type="button"
				popovertarget="menu-pop" aria-haspopup="menu" aria-expanded="false">
				<slot name="trigger">${this.state.label}</slot>
			</button>
			<div #surface class="menu-surface" id="menu-pop" popover="auto" role="menu" tabindex="-1"
				@toggle=${this.handleToggle} @menu-item:select=${this.handleSelect} @keydown=${this.handleKey}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-menu', UIMenu);
