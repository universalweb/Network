/*
	DESCRIPTION: ui-menubar — a horizontal application menu bar (File / Edit / View …).
	Extends `ui-menu` to reuse its item layer
	wholesale — list rows, `handleSelect`, `selectIndex`, and the roving
	`move`/`focusItem`/`enabledIndexes`/`focusFirst` all operate on
	`this.state.items` (the OPEN menu's items), and the native-Popover dismiss
	+ `computeAnchor` placement come along for free.
	N triggers feed ONE shared auto-popover. Switching menus does NOT
	close/reopen — PaneTrack slides the live panes (same mechanic as
	ui-nav-section) and resizes the shell. `this.state.items` still points at
	the active menu's items so inherited keyboard roving stays scoped.
	popover="auto" — UA owns Esc + light-dismiss; SurfaceController must NOT
	join the escape stack.
	REJECTED MorphSurface as host — UIMenu documents why: auto popover is the
	top-layer escape; MorphSurface's position:fixed overlay in shadow cannot.
	tk:144 skipped auto menus for this reason, not by accident.
	REJECTED a third sliding-dropdown CE — UIMenu + menu-surface + PaneTrack
	is the mechanism. Visual identity stays in menubar.css (trigger strip,
	11rem menu floor) vs nav-section.css (mega pane).
	REJECTED reusing ui-nav-pane — that pane's policy is nav-links + slot.
	Menu rows are ui-menu-item (ui-menubar-pane).
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
import {
	layoutViewport,
	markSwitch,
	resetViewportSize,
	stampPaneStates,
} from '../../core/dom/paneTrack.js';
import { rafCoalesce, rafCoalesceCancel } from '../../core/dom/rafCoalesce.js';
import { SurfaceController } from '../../core/dom/surfaceController.js';
import { UIMenu } from '../menu/menu.js';
import { UIMenubarPane } from './menubar-pane.js';
export class UIMenubar extends UIMenu {
	static url = import.meta.url;
	static styles = {
		menu: null,
		menuSurface: '../menu/menu-surface.css',
		slidePane: '../../core/dom/slide-pane.css',
		menubar: './menubar.css',
	};
	static state = {
		menus: [],
		items: [],
		side: 'bottom',
		align: 'start',
		offset: 4,
		closeOnScroll: true,
	};
	// Which top-level menu's panel is open (-1 = none). NOT reactive.
	openMenu = -1;
	focusedTrigger = 0;
	keyboardOpen = false;
	escFocusReturn = -1;
	onConnect() {
		super.onConnect?.();
		this.observe('menus', this.stampMenuIndexes);
		this.stampMenuIndexes();
		this.ensureSurfaceCtl();
	}
	ensureSurfaceCtl() {
		this.surfaceCtl ??= new SurfaceController(this, {
			surface: () => {
				return this.refs.surface;
			},
			closeMethod: 'closeFromScroll',
			keepOpen: () => {
				return this.refs.surface;
			},
		});
		return this.surfaceCtl;
	}
	onDisconnect() {
		this.surfaceCtl?.detach();
		rafCoalesceCancel(this);
		super.onDisconnect?.();
	}
	closeFromScroll() {
		if (this.state.closeOnScroll === false) {
			return;
		}
		if (this.openMenu < 0) {
			return;
		}
		this.refs.surface?.hidePopover();
	}
	/* Stamp menuIndex + panelIndex so triggers and panes share one index. */
	stampMenuIndexes() {
		const menus = this.state.menus;
		if (!Array.isArray(menus)) {
			return;
		}
		const count = menus.length;
		for (let index = 0; index < count; index += 1) {
			const menu = menus[index];
			if (menu.menuIndex !== index) {
				menu.menuIndex = index;
			}
			if (menu.panelIndex !== index) {
				menu.panelIndex = index;
			}
		}
		this.syncPanelFlags();
	}
	syncPanelFlags() {
		stampPaneStates(this.findComponents('ui-menubar-pane') || [], this.openMenu);
	}
	layoutPanels() {
		const panelViewport = this.refs.viewport;
		const panes = this.findComponents('ui-menubar-pane') || [];
		const activePanel = this.openMenu;
		if (!panelViewport || !panes.length || activePanel < 0) {
			return;
		}
		let activePane = null;
		const paneCount = panes.length;
		for (let index = 0; index < paneCount; index += 1) {
			const pane = panes[index];
			if (Number(pane.state.panelIndex) === activePanel) {
				activePane = pane;
				break;
			}
		}
		layoutViewport(panelViewport, activePane, {
			minWidthEm: 11,
		});
	}
	scheduleLayout() {
		rafCoalesce(this, this.runPaneLayout);
	}
	runPaneLayout() {
		if (this.isDisconnected) {
			return;
		}
		this.layoutPanels();
		this.position();
	}
	triggerButton(index) {
		if (index < 0) {
			return null;
		}
		// Light html trigger rows — no child CE registry. Same accepted pattern
		// as the previous menubar (captured #bar ref, not a tree walk).
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
		this.state.items = menus[index].items ?? [];
		this.syncPanelFlags();
		const wasOpen = surface.matches(':popover-open');
		markSwitch(surface, wasOpen);
		if (wasOpen) {
			this.scheduleLayout();
			await this.nextFrame();
			if (this.isDisconnected) {
				return;
			}
			if (viaKeyboard) {
				this.focusFirst();
			}
			return;
		}
		this.ensureSurfaceCtl().show();
	}
	moveTrigger(delta) {
		const count = this.state.menus.length;
		if (!count) {
			return;
		}
		const next = (this.focusedTrigger + delta + count) % count;
		this.setFocusedTrigger(next);
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
			case 'ArrowRight': {
				domEvent.preventDefault();
				this.moveTrigger(1);
				break;
			}
			case 'ArrowLeft': {
				domEvent.preventDefault();
				this.moveTrigger(-1);
				break;
			}
			case 'ArrowDown':
			case 'Enter':
			case ' ': {
				domEvent.preventDefault();
				this.openMenuAt(this.focusedTrigger, true);
				break;
			}
			case 'Home': {
				domEvent.preventDefault();
				this.setFocusedTrigger(0);
				break;
			}
			case 'End': {
				domEvent.preventDefault();
				this.setFocusedTrigger(this.state.menus.length - 1);
				break;
			}
			default: {
				break;
			}
		}
	}
	handleKey(domEvent) {
		switch (domEvent.key) {
			case 'ArrowRight': {
				domEvent.preventDefault();
				this.moveTrigger(1);
				break;
			}
			case 'ArrowLeft': {
				domEvent.preventDefault();
				this.moveTrigger(-1);
				break;
			}
			case 'Escape': {
				this.escFocusReturn = this.openMenu;
				break;
			}
			default: {
				super.handleKey(domEvent);
				break;
			}
		}
	}
	handleToggle(domEvent) {
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		if (domEvent.newState === 'open') {
			surface.classList.add('is-open');
			this.activeIndex = -1;
			this.scheduleLayout();
			if (this.keyboardOpen) {
				this.focusFirst();
			}
			if (this.state.closeOnScroll !== false) {
				this.ensureSurfaceCtl().attach();
			}
			return;
		}
		this.surfaceCtl?.detach();
		surface.classList.remove('is-open');
		const closing = this.openMenu;
		this.openMenu = -1;
		this.setTriggerExpanded(closing, false);
		this.syncPanelFlags();
		resetViewportSize(this.refs.viewport);
		if (this.escFocusReturn >= 0) {
			this.setFocusedTrigger(this.escFocusReturn);
			this.escFocusReturn = -1;
		}
	}
	anchorElement() {
		return this.triggerButton(this.openMenu);
	}
	focusItem(index) {
		const item = this.state.items[index];
		if (!item) {
			return;
		}
		const pane = this.findComponent('ui-menubar-pane', (candidate) => {
			return this.isActivePane(candidate);
		});
		const row = pane?.findComponent('ui-menu-item', (candidate) => {
			return this.rowHasValue(candidate, item.value);
		});
		if (row) {
			this.activeIndex = index;
			row.focus();
		}
	}
	isActivePane(pane) {
		return pane.state.active === true;
	}
	rowHasValue(candidate, value) {
		return candidate.state.value === value;
	}
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
		this.closeAfterSelect();
	}
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
			<div #surface class="menu-surface glass" popover="auto" role="menu"
				@toggle=${this.handleToggle} @menu-item:select=${this.handleSelect} @keydown=${this.handleKey}>
				<div #viewport class="slide-viewport">
					${this.list('menus', UIMenubarPane, this.menuKey)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-menubar', UIMenubar);
