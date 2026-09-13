/*
	DESCRIPTION: ui-menu — a dropdown menu, the base for context-menu
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
	Item pick closes the auto popover via closeAfterSelect(). Set
	closeOnSelect:false to keep it open for multi-pick. Enter/Space share
	that path (handleKey → selectIndex). Auto popovers stay OFF the
	escape stack.
	REJECTED lifting ui-multi-select stay-open — that component never
	calls hidePopover after listbox:change because it is a different
	surface (ui-listbox + popover=manual + SurfaceController). Folding
	menus onto it would flatten auto→manual and force escape-stack
	registration that escapeStack.js forbids.
	REJECTED a per-component flag on menubar / split-button / nav-section /
	context-menu — they share UIMenu.selectIndex or a copy of hidePopover.
	REJECTED a per-item closeOnSelect on ui-menu-item — keyboard goes
	through selectIndex; one dropdown-level policy.
	REJECTED stuffing this into SurfaceController — that is
	open/close/dismiss, not item-select policy.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-menu .state.label=${'Actions ▾'} .state.items=${[
	    { label: 'Rename', value: 'rename', kbd: '⌘R' },
	    { label: 'Duplicate', value: 'dup' },
	    { separator: true },
	    { label: 'Delete', value: 'del', danger: true },
	  ]} @menu:select=${e => run(e.detail.data.value)}></ui-menu>
	  <ui-menu .state.align=${'end'}><span slot="trigger">⋮</span></ui-menu>
	  <ui-menu .state.closeOnSelect=${false} .state.items=${[...]}></ui-menu>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { applyAnchor, computeAnchor } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import { WebComponent } from '../../core/index.js';
import { UIMenuItem } from '../menu-item/menu-item.js';
function itemIsSelectable(item) {
	if (!item || item.separator === true) {
		return false;
	}
	return item.checkable === true || item.checked === true || item.active === true;
}
function itemsAreSelectable(items) {
	if (!Array.isArray(items)) {
		return false;
	}
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		if (itemIsSelectable(items[index])) {
			return true;
		}
	}
	return false;
}
// True when (x,y) sits inside `rect` grown by `pad` on every edge. The pad
// bridges the trigger↔panel offset gap so a pointer crossing it isn't read as
// "left the menu". Exported for nav-section / other leave-watch consumers.
export function withinPaddedRect(rect, pointerX, pointerY, pad) {
	return pointerX >= rect.left - pad &&
		pointerX <= rect.right + pad &&
		pointerY >= rect.top - pad &&
		pointerY <= rect.bottom + pad;
}
export class UIMenu extends WebComponent {
	static url = import.meta.url;
	static styles = {
		menuSurface: './menu-surface.css',
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
		// Close when the page (or any ancestor scroll root) scrolls. Shared
		// HideOnScroll util — menubar/nav-section also use it.
		closeOnScroll: true,
		/*
		 * Close the auto popover after an item pick (click and Enter/Space).
		 * Default true — today's behaviour. false keeps the panel open so
		 * the caller can pick several items without reopening.
		 */
		closeOnSelect: true,
		/*
		 * Group default lead glyph. Applied to items that omit `icon`.
		 * Empty + no selectable items = no reserved slot (Cut/Copy/Paste).
		 * Empty + any checkable/checked/active item = auto `circle` / `check`
		 * so the gutter is reserved and the row does not collapse on select.
		 * Set leadIcon '' on a pure action menu to keep the slot closed.
		 * `activeLeadIcon` replaces the lead when the item is selected.
		 */
		leadIcon: '',
		activeLeadIcon: '',
		/*
		 * Trigger icon. When set, the trigger is icon-only (label remains the
		 * accessible name). Empty = the current text trigger.
		 */
		icon: '',
	};
	onConnect() {
		this.observe([
			'items', 'leadIcon', 'activeLeadIcon',
		], this.applyLeadDefaults);
		this.applyLeadDefaults();
	}
	applyLeadDefaults() {
		const selectable = itemsAreSelectable(this.state.items);
		const idle = this.state.leadIcon || (selectable ? 'circle' : '');
		const selected = this.state.activeLeadIcon || (selectable ? 'check' : '');
		if (!idle && !selected) {
			return;
		}
		const items = this.state.items;
		if (!items || !items.length) {
			return;
		}
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item || item.separator === true) {
				continue;
			}
			if (idle && !item.icon) {
				item.icon = idle;
			}
			if (selected && !item.activeIcon) {
				item.activeIcon = selected;
			}
		}
	}
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
	ensureScrollHide() {
		this.scrollHide ??= new HideOnScroll(this, 'closeFromScroll', {
			keepOpen: () => {
				return this.refs.surface;
			},
		});
		return this.scrollHide;
	}
	closeFromScroll() {
		if (this.state.closeOnScroll === false) {
			return;
		}
		this.refs.surface?.hidePopover();
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
			if (this.state.closeOnScroll !== false) {
				this.ensureScrollHide().attach();
			}
		} else {
			this.scrollHide?.detach();
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
	/* Placement anchor element. Split-button / menubar override when the visual
	   anchor is a cluster or a bar trigger, not `#trigger`. */
	anchorElement() {
		return this.flyoutAnchor ?? this.refs.trigger ?? null;
	}
	showFrom(anchor) {
		this.flyoutAnchor = anchor ?? null;
		this.showSurfacePopover(this.refs.surface);
	}
	position() {
		const anchor = this.anchorElement();
		const surface = this.refs.surface;
		if (!anchor || !surface) {
			return;
		}
		const surfaceWidth = surface.offsetWidth;
		if (this.state.matchWidth && anchor === this.refs.trigger) {
			/*
			 * Match the trigger to the (content-sized) dropdown width BEFORE measuring the
			 * trigger rect below, so a center placement lands the two flush. `min-` never
			 * shrinks a wider trigger; the reflow from the read on the next line applies it.
			 */
			anchor.style.minInlineSize = `${surfaceWidth}px`;
		}
		const placed = computeAnchor(anchor.getBoundingClientRect(), {
			width: surfaceWidth,
			height: surface.offsetHeight,
		}, {
			placement: `${this.state.side}-${this.state.align}`,
			offset: Number(this.state.offset) || 6,
		});
		applyAnchor(surface, placed);
	}
	focusItem(index) {
		const item = this.state.items[index];
		if (!item) {
			return;
		}
		// Locate the row COMPONENT by a stable field and call its focus() — no
		// shadow-piercing querySelector (the tabs roving pattern).
		const row = this.findComponent('ui-menu-item', (candidate) => {
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
			href: item.href,
		});
		// Navigation is native when the row is an <a href> — do not location.assign.
		this.closeAfterSelect();
	}
	closeAfterSelect() {
		if (this.state.closeOnSelect === false) {
			return;
		}
		this.refs.surface?.hidePopover();
	}
	hasTriggerIcon() {
		return Boolean(this.state.icon);
	}
	hideTriggerIcon() {
		return !this.state.icon;
	}
	hideTriggerLabel() {
		return Boolean(this.state.icon);
	}
	render() {
		this.html`
			<button #trigger class="menu-trigger" part="trigger" type="button"
				?data-icon=${this.hasTriggerIcon}
				aria-label=${this.state.label}
				popovertarget="menu-pop" aria-haspopup="menu" aria-expanded="false">
				<slot name="trigger">
					<ui-icon class="menu-trigger-icon" ?hidden=${this.hideTriggerIcon} .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
					<span class="menu-trigger-label" ?hidden=${this.hideTriggerLabel}>${this.state.label}</span>
				</slot>
			</button>
			<div #surface class="menu-surface glass" id="menu-pop" popover="auto" role="menu" tabindex="-1"
				@toggle=${this.handleToggle} @menu-item:select=${this.handleSelect} @keydown=${this.handleKey}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-menu', UIMenu);
