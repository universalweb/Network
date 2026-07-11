/*
	DESCRIPTION: ui-menubar — a horizontal application menu bar (MUI/desktop
	"Menubar": File / Edit / View …). Extends `ui-menu` to reuse its item layer
	wholesale — list rows, `handleClick`, `selectIndex`, and the roving
	`move`/`focusItem`/`enabledIndexes`/`focusFirst` all operate on
	`this.state.items`, and the native-Popover dismiss + `computeAnchor` placement
	come along for free.
	The ONE structural difference from a dropdown: N triggers feed ONE shared panel.
	Switching menus does NOT close/reopen the popover — it writes the active menu's
	items into `this.state.items`, which the patch pass diffs INTO the live panel in
	place (verified: the popover element is not torn down), then repositions under the
	newly-active trigger. That's smoother than a fade-out/fade-in and keeps everything
	in ONE shadow root, so trigger roving (Arrow Left/Right) and hover-switch need no
	cross-shadow focus plumbing.
	Triggers render via `list('menus', this.triggerRow)` (light html — auto-escaped
	labels; no escapeHtml / `^html` string builder). Roving tabindex + aria-expanded
	stay imperative on the live buttons (accepted focusItem pattern).
	Inherited `activeIndex` keeps its base meaning (focused item WITHIN the panel);
	`openMenu` (ours) is which top-level menu's panel is open (-1 = none).
	── EVENTS ───────────────────────────────────────────────────────────
	  menu:select { value, index, menu }   (menu = index of the top-level menu)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-menubar .state.menus=${[
	    { label: 'File', items: [{ label: 'New', value: 'new', kbd: '⌘N' }, { separator: true }, { label: 'Quit', value: 'quit', danger: true }] },
	    { label: 'Edit', items: [{ label: 'Undo', value: 'undo', kbd: '⌘Z' }, { label: 'Redo', value: 'redo' }] },
	  ]} @menu:select=${e => run(e.detail.data)}></ui-menubar>
	──────────────────────────────────────────────────────────────────────
*/
import { html } from 'webcomponent';
import { computeAnchor } from '../../core/dom/anchor.js';
import { UIMenu } from '../menu/menu.js';
import { UIMenuItem } from '../menu/menu-item.js';
export class UIMenubar extends UIMenu {
	static url = import.meta.url;
	// Reuse the dropdown panel + item styles; menubar.css only adds the trigger strip.
	static styles = {
		menu: '../menu/menu.css',
		menubar: './menubar.css',
	};
	static state = {
		menus: [],
		items: [],
		side: 'bottom',
		align: 'start',
		offset: 4,
	};
	// Which top-level menu's panel is open (-1 = none). NOT reactive — switching
	// menus drives the panel via the `items` swap, not a re-render of this field.
	openMenu = -1;
	// Roving-tabindex cursor across the trigger strip.
	focusedTrigger = 0;
	// Set before showPopover/switch so opening via keyboard focuses the first item
	// while opening via mouse (click/hover) does not steal focus into the panel.
	keyboardOpen = false;
	// Stashed by Escape (handled before native dismiss) so the close path can return
	// focus to the invoking trigger; -1 when the close was an outside-click dismiss.
	escFocusReturn = -1;
	onConnect() {
		super.onConnect?.();
		this.observe('menus', this.stampMenuIndexes);
		this.stampMenuIndexes();
	}
	/* Stamp menuIndex onto each top-level menu so light rows can bind data-menu. */
	stampMenuIndexes() {
		const menus = this.state.menus;
		if (!Array.isArray(menus)) {
			return;
		}
		const count = menus.length;
		for (let index = 0; index < count; index += 1) {
			menus[index].menuIndex = index;
		}
	}
	triggerButton(index) {
		if (index < 0) {
			return null;
		}
		// Same accepted pattern as UIMenu.focusItem: query the raw list row inside a
		// captured ref (triggers stay light html — no child component registry).
		return this.refs.bar?.querySelector(`button[data-menu="${index}"]`);
	}
	setTriggerExpanded(index, expanded) {
		this.triggerButton(index)?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
	}
	setFocusedTrigger(index) {
		const previous = this.triggerButton(this.focusedTrigger);
		if (previous) {
			previous.tabIndex = -1;
		}
		this.focusedTrigger = index;
		const next = this.triggerButton(index);
		if (next) {
			next.tabIndex = 0;
			next.focus();
		}
	}
	async openMenuAt(index, viaKeyboard) {
		const surface = this.refs.surface;
		const menus = this.state.menus;
		if (!surface || !menus[index]) {
			return;
		}
		this.setTriggerExpanded(this.openMenu, false);
		this.openMenu = index;
		this.keyboardOpen = Boolean(viaKeyboard);
		this.setTriggerExpanded(index, true);
		// Swap the shared panel's content to this menu (patch pass → diffs in place,
		// popover survives). Wait a frame so offsetWidth/Height reflect the new items
		// BEFORE positioning (else we'd anchor with stale dimensions).
		this.state.items = menus[index].items ?? [];
		const wasOpen = surface.matches(':popover-open');
		await this.nextFrame();
		if (this.isDisconnected) {
			return;
		}
		if (wasOpen) {
			// Switching while already open: relocate under the new trigger in place.
			this.position();
			if (viaKeyboard) {
				this.focusFirst();
			}
		} else {
			// First open: showPopover fires `toggle` → handleToggle positions + reveals
			// (and focuses the first item when keyboardOpen).
			surface.showPopover();
		}
	}
	moveTrigger(delta) {
		const count = this.state.menus.length;
		if (!count) {
			return;
		}
		const next = (this.focusedTrigger + delta + count) % count;
		this.setFocusedTrigger(next);
		// Desktop behavior: arrowing across the bar while a menu is open switches the
		// open menu and keeps keyboard focus inside it.
		if (this.openMenu >= 0) {
			this.openMenuAt(next, true);
		}
	}
	handleBarClick(domEvent) {
		const trigger = domEvent.target.closest('button[data-menu]');
		if (!trigger) {
			return;
		}
		const index = Number(trigger.dataset.menu);
		this.setFocusedTrigger(index);
		if (this.openMenu === index && this.refs.surface?.matches(':popover-open')) {
			this.refs.surface.hidePopover();
		} else {
			this.openMenuAt(index, false);
		}
	}
	handleBarHover(domEvent) {
		// Hover only switches when a menu is ALREADY open (classic menubar feel).
		if (this.openMenu < 0) {
			return;
		}
		const trigger = domEvent.target.closest('button[data-menu]');
		if (!trigger) {
			return;
		}
		const index = Number(trigger.dataset.menu);
		if (index !== this.openMenu) {
			this.setFocusedTrigger(index);
			this.openMenuAt(index, false);
		}
	}
	handleBarKey(domEvent) {
		switch (domEvent.key) {
			case 'ArrowRight':
				domEvent.preventDefault();
				this.moveTrigger(1);
				break;
			case 'ArrowLeft':
				domEvent.preventDefault();
				this.moveTrigger(-1);
				break;
			case 'ArrowDown':
			case 'Enter':
			case ' ':
				domEvent.preventDefault();
				this.openMenuAt(this.focusedTrigger, true);
				break;
			case 'Home':
				domEvent.preventDefault();
				this.setFocusedTrigger(0);
				break;
			case 'End':
				domEvent.preventDefault();
				this.setFocusedTrigger(this.state.menus.length - 1);
				break;
			default:
				break;
		}
	}
	// Panel-level keys: add cross-menu Left/Right (so arrowing works with focus INSIDE
	// the panel too) + Escape focus-return; everything else falls to the inherited
	// within-menu roving (Up/Down/Home/End/Enter/Space).
	handleKey(domEvent) {
		switch (domEvent.key) {
			case 'ArrowRight':
				domEvent.preventDefault();
				this.moveTrigger(1);
				break;
			case 'ArrowLeft':
				domEvent.preventDefault();
				this.moveTrigger(-1);
				break;
			case 'Escape':
				// Let native popover dismiss run; mark the trigger to refocus on close.
				this.escFocusReturn = this.openMenu;
				break;
			default:
				super.handleKey(domEvent);
				break;
		}
	}
	// Fully overrides UIMenu.handleToggle: position under the ACTIVE trigger, and on
	// close reset openMenu / aria + return focus to the trigger when appropriate.
	handleToggle(domEvent) {
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		if (domEvent.newState === 'open') {
			this.position();
			surface.classList.add('is-open');
			this.activeIndex = -1;
			if (this.keyboardOpen) {
				this.focusFirst();
			}
		} else {
			surface.classList.remove('is-open');
			const closing = this.openMenu;
			this.openMenu = -1;
			this.setTriggerExpanded(closing, false);
			if (this.escFocusReturn >= 0) {
				this.setFocusedTrigger(this.escFocusReturn);
				this.escFocusReturn = -1;
			}
		}
	}
	position() {
		const surface = this.refs.surface;
		const trigger = this.triggerButton(this.openMenu);
		if (!surface || !trigger) {
			return;
		}
		const placed = computeAnchor(trigger.getBoundingClientRect(), {
			width: surface.offsetWidth,
			height: surface.offsetHeight,
		}, {
			placement: `${this.state.side}-${this.state.align}`,
			offset: Number(this.state.offset) || 4,
		});
		surface.style.top = `${placed.top}px`;
		surface.style.left = `${placed.left}px`;
		surface.dataset.placement = placed.placement;
	}
	// Adds the top-level menu index to the inherited select payload.
	selectIndex(index) {
		const item = this.state.items[index];
		if (!item || item.disabled || item.separator) {
			return;
		}
		this.emit('menu:select', {
			value: item.value,
			index,
			menu: this.openMenu,
		});
		this.refs.surface?.hidePopover();
	}
	/* Light html trigger — label auto-escaped. tabindex/aria-expanded owned
	   imperatively by setFocusedTrigger / setTriggerExpanded after mount. */
	triggerRow(item) {
		const index = item.menuIndex;
		const tabIndex = index === this.focusedTrigger ? 0 : -1;
		return html`<button type="button" class="menubar-trigger" role="menuitem" aria-haspopup="menu" aria-expanded="false" data-menu=${index} tabindex=${tabIndex}>${item.label}</button>`;
	}
	menuKey(item, index) {
		return item.id ?? item.label ?? index;
	}
	render() {
		this.html`
			<div #bar class="menubar" role="menubar"
				@click=${this.handleBarClick} @keydown=${this.handleBarKey} @pointerover=${this.handleBarHover}>
				${this.list('menus', this.triggerRow, this.menuKey)}
			</div>
			<div #surface class="menu-surface" popover="auto" role="menu"
				@toggle=${this.handleToggle} @menu-item:select=${this.handleSelect} @keydown=${this.handleKey}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-menubar', UIMenubar);
