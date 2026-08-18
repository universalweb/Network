/*
	DESCRIPTION: ui-nav-section — a site / app nav strip for top bars and panels.
	Text or icon triggers open ONE shared dropdown shell. Switching open items
	slides the active panel under the new trigger (x.ai/api-style) and resizes
	the shell to the pane. Plain `href` items are links with no panel.
	Extends UIMenu for leave-watch + pad geometry (keepOpenRect = bar).
	── EVENTS ───────────────────────────────────────────────────────────
	  nav-section:open   { id, index }
	  nav-section:close  { id, index }
	  nav-section:select { id, item, index, href? }
*/
import { applyAnchor, computeAnchor } from '../../core/dom/anchor.js';
import { HideOnScroll } from '../../core/dom/hideOnScroll.js';
import { UIMenu } from '../menu/menu.js';
import { UINavPane } from '../nav-pane/nav-pane.js';
import { UINavTrigger } from '../nav-trigger/nav-trigger.js';
import { itemHasPanel } from './navPanel.js';
export class UINavSection extends UIMenu {
	static url = import.meta.url;
	static styles = {
		// Drop UIMenu trigger chrome — we only need the shared panel surface.
		menu: null,
		menuSurface: '../menu/menu-surface.css',
		navSection: './nav-section.css',
	};
	static state = {
		items: [],
		// Keep UIMenu leave-watch knobs.
		side: 'bottom',
		align: 'center',
		offset: 8,
		closeOnLeave: true,
		closeOnScroll: true,
		// Open panel on pointerenter (desktop mega-nav). Click still toggles.
		openOnHover: true,
		// Unused by nav but present so UIMenu chain-merge is quiet.
		label: '',
		matchWidth: false,
	};
	// Which items[] index's panel is open (-1 = closed). NON-reactive.
	openIndex = -1;
	openPanelIndex = -1;
	// Last open index before close — suppresses reopen on the same click that
	// light-dismissed the popover (trigger is outside the surface).
	lastOpenIndex = -1;
	closedAt = 0;
	focusedTrigger = 0;
	keyboardOpen = false;
	escFocusReturn = -1;
	layoutFrame = null;
	onConnect() {
		this.observe('items', this.stampItems);
		this.stampItems();
		this.scrollHide ??= new HideOnScroll(this, 'closeFromScroll', {
			keepOpen: () => {
				return this.refs.surface;
			},
		});
	}
	onMount() {
		this.syncPaneSlots();
		this.syncTriggerFlags();
	}
	onRender() {
		this.queueSlotSync();
	}
	onDisconnect() {
		this.scrollHide?.detach();
		this.disarmLeaveWatch();
		if (this.layoutFrame != null) {
			cancelAnimationFrame(this.layoutFrame);
			this.layoutFrame = null;
		}
	}
	closeFromScroll() {
		if (this.state.closeOnScroll === false) {
			return;
		}
		this.refs.surface?.hidePopover();
	}
	/*
	 * Structural stamp only (itemIndex / hasPanel / panelIndex / panelId).
	 * NEVER write open/focus paint flags onto items — deep writes re-notify
	 * observe('items') → stampItems → freeze (hover was the hot path).
	 * expanded/tabStop/active/slideOffset go to live child components only.
	 */
	stampItems() {
		const items = this.state.items;
		if (!Array.isArray(items)) {
			return;
		}
		const count = items.length;
		let panelCursor = 0;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const hasPanel = itemHasPanel(item);
			if (item.itemIndex !== index) {
				item.itemIndex = index;
			}
			if (item.hasPanel !== hasPanel) {
				item.hasPanel = hasPanel;
			}
			if (hasPanel) {
				const panelId = item.id || item.label || `panel-${panelCursor}`;
				if (item.panelIndex !== panelCursor) {
					item.panelIndex = panelCursor;
				}
				if (item.panelId !== panelId) {
					item.panelId = panelId;
				}
				panelCursor += 1;
			} else if (item.panelIndex !== -1) {
				item.panelIndex = -1;
			}
		}
		this.syncTriggerFlags();
		this.syncPanelFlags();
	}
	queueSlotSync() {
		this.nextFrame().then(() => {
			if (!this.isDisconnected) {
				this.syncPaneSlots();
			}
		});
	}
	/*
	 * Named light-DOM views (`slot="products"`) land in the matching
	 * ui-nav-pane light DOM so its default <slot> projects them.
	 */
	syncPaneSlots() {
		const panes = this.findComponents('ui-nav-pane');
		if (!panes?.length) {
			return;
		}
		const paneById = new Map();
		const paneCount = panes.length;
		for (let index = 0; index < paneCount; index += 1) {
			const pane = panes[index];
			const paneId = pane.state?.panelId || pane.state?.id;
			if (paneId) {
				paneById.set(paneId, pane);
			}
		}
		const candidates = [];
		const hostKids = this.childNodes;
		const hostCount = hostKids.length;
		for (let index = 0; index < hostCount; index += 1) {
			candidates.push(hostKids[index]);
		}
		for (let index = 0; index < paneCount; index += 1) {
			const paneKids = panes[index].childNodes;
			const kidCount = paneKids.length;
			for (let kidIndex = 0; kidIndex < kidCount; kidIndex += 1) {
				candidates.push(paneKids[kidIndex]);
			}
		}
		const candidateCount = candidates.length;
		for (let index = 0; index < candidateCount; index += 1) {
			const node = candidates[index];
			if (node.nodeType !== 1) {
				continue;
			}
			const slotName = node.getAttribute('slot') || node.dataset?.navSlot;
			if (!slotName) {
				continue;
			}
			const target = paneById.get(slotName);
			if (!target || node.parentNode === target) {
				continue;
			}
			node.removeAttribute('slot');
			node.dataset.navSlot = slotName;
			target.append(node);
		}
	}
	/* Paint open/focus onto live trigger rows — not the items array. */
	syncTriggerFlags() {
		const triggers = this.findComponents('ui-nav-trigger') || [];
		const count = triggers.length;
		for (let index = 0; index < count; index += 1) {
			const trigger = triggers[index];
			const itemIndex = Number(trigger.state.itemIndex);
			const expanded = itemIndex === this.openIndex;
			const tabStop = itemIndex === this.focusedTrigger;
			if (trigger.state.expanded !== expanded) {
				trigger.state.expanded = expanded;
			}
			if (trigger.state.tabStop !== tabStop) {
				trigger.state.tabStop = tabStop;
			}
		}
	}
	/* Paint slide/active onto live panes — not the items array. */
	syncPanelFlags() {
		const panes = this.findComponents('ui-nav-pane') || [];
		const activePanel = this.openPanelIndex;
		const count = panes.length;
		for (let index = 0; index < count; index += 1) {
			const pane = panes[index];
			const panelIndex = Number(pane.state.panelIndex);
			const active = activePanel >= 0 && panelIndex === activePanel;
			const slideOffset = activePanel >= 0 ? panelIndex - activePanel : 0;
			if (pane.state.active !== active) {
				pane.state.active = active;
			}
			if (pane.state.slideOffset !== slideOffset) {
				pane.state.slideOffset = slideOffset;
			}
		}
	}
	/* Leave-watch region = whole trigger bar (UIMenu default is #trigger). */
	keepOpenRect() {
		return this.refs.bar ? this.refs.bar.getBoundingClientRect() : null;
	}
	/* focus:false for hover open — focus() re-fires pointerenter and freezes. */
	setFocusedTrigger(index, options) {
		const shouldFocus = !options || options.focus !== false;
		this.focusedTrigger = index;
		this.syncTriggerFlags();
		if (!shouldFocus) {
			return;
		}
		const row = this.findComponent('ui-nav-trigger', (candidate) => {
			return candidate.state.itemIndex === index;
		});
		row?.focus();
	}
	async openAt(index, viaKeyboard) {
		const items = this.state.items;
		const item = items[index];
		const surface = this.refs.surface;
		if (!surface || !item || !itemHasPanel(item)) {
			return;
		}
		this.openIndex = index;
		this.openPanelIndex = item.panelIndex;
		this.keyboardOpen = Boolean(viaKeyboard);
		this.syncTriggerFlags();
		this.syncPanelFlags();
		const wasOpen = surface.matches(':popover-open');
		if (wasOpen) {
			// Switching menus while open — suppress first-open scale/fade re-trigger.
			surface.dataset.switch = '';
			this.layoutPanels();
			this.position();
		} else {
			delete surface.dataset.switch;
			surface.showPopover();
		}
		this.emit('nav-section:open', {
			id: item.id,
			index,
		});
	}
	closePanel() {
		const surface = this.refs.surface;
		if (surface?.matches(':popover-open')) {
			surface.hidePopover();
		} else {
			this.resetOpenState();
		}
	}
	resetOpenState() {
		const closing = this.openIndex;
		const item = this.state.items[closing];
		this.lastOpenIndex = closing;
		this.closedAt = performance.now();
		this.openIndex = -1;
		this.openPanelIndex = -1;
		this.syncTriggerFlags();
		this.syncPanelFlags();
		this.resetViewportSize();
		if (closing >= 0 && item) {
			this.emit('nav-section:close', {
				id: item.id,
				index: closing,
			});
		}
	}
	resetViewportSize() {
		const panelViewport = this.refs.viewport;
		if (!panelViewport) {
			return;
		}
		panelViewport.style.width = '';
		panelViewport.style.height = '';
	}
	layoutPanels() {
		const panelViewport = this.refs.viewport;
		const panes = this.findComponents('ui-nav-pane') || [];
		const activePanel = this.openPanelIndex;
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
		if (!activePane) {
			return;
		}
		const contentWidth = Math.ceil(Math.max(
			activePane.offsetWidth || 0,
			activePane.getBoundingClientRect().width || 0
		));
		const contentHeight = Math.ceil(Math.max(
			activePane.offsetHeight || 0,
			activePane.getBoundingClientRect().height || 0
		));
		// Soft floor (~8rem) — content can still grow; avoid locking every panel to 11rem.
		const rootSize = Number.parseFloat(getComputedStyle(globalThis.document.documentElement).fontSize) || 16;
		const minWidth = Math.ceil(8 * rootSize);
		if (contentWidth > 0) {
			panelViewport.style.width = `${Math.max(minWidth, contentWidth)}px`;
		}
		if (contentHeight > 0) {
			panelViewport.style.height = `${contentHeight}px`;
		}
	}
	scheduleLayout() {
		if (this.layoutFrame != null) {
			cancelAnimationFrame(this.layoutFrame);
		}
		this.layoutFrame = requestAnimationFrame(() => {
			this.layoutFrame = null;
			if (this.isDisconnected) {
				return;
			}
			this.syncPaneSlots();
			this.layoutPanels();
			this.position();
		});
	}
	position() {
		const surface = this.refs.surface;
		const trigger = this.findComponent('ui-nav-trigger', (candidate) => {
			return candidate.state.itemIndex === this.openIndex;
		});
		const control = trigger?.refs?.control || trigger;
		if (!surface || !control) {
			return;
		}
		const placed = computeAnchor(control.getBoundingClientRect(), {
			width: surface.offsetWidth,
			height: surface.offsetHeight,
		}, {
			placement: `${this.state.side}-${this.state.align}`,
			offset: Number(this.state.offset) || 8,
		});
		applyAnchor(surface, placed);
	}
	handleToggle(domEvent) {
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		if (domEvent.newState === 'open') {
			surface.classList.add('is-open');
			this.scheduleLayout();
			this.nextFrame().then(() => {
				if (!this.isDisconnected) {
					this.scheduleLayout();
				}
			});
			if (this.keyboardOpen) {
				surface.focus({
					preventScroll: true,
				});
			}
			this.armLeaveWatch();
			if (this.state.closeOnScroll !== false) {
				this.scrollHide?.attach();
			}
		} else {
			this.scrollHide?.detach();
			surface.classList.remove('is-open');
			this.disarmLeaveWatch();
			const returnFocus = this.escFocusReturn;
			this.resetOpenState();
			if (returnFocus >= 0) {
				this.setFocusedTrigger(returnFocus);
				this.escFocusReturn = -1;
			}
		}
	}
	/* ONE container listener — rows emit nav-trigger:select (no closest). */
	handleTriggerSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = Number(data.index);
		const item = this.state.items[index];
		if (!item || item.disabled) {
			return;
		}
		// Same-trigger click that light-dismissed the popover: don't reopen.
		if (
			data.hasPanel &&
			this.lastOpenIndex === index &&
			performance.now() - this.closedAt < 400
		) {
			this.lastOpenIndex = -1;
			this.setFocusedTrigger(index);
			return;
		}
		this.setFocusedTrigger(index);
		if (!data.hasPanel) {
			this.emit('nav-section:select', {
				id: item.id,
				item,
				index,
				href: data.href || item.href,
			});
			if (this.openIndex >= 0) {
				this.closePanel();
			}
			return;
		}
		if (this.openIndex === index && this.refs.surface?.matches(':popover-open')) {
			this.closePanel();
		} else {
			this.openAt(index, false);
		}
	}
	/* ONE container listener — rows emit nav-trigger:hover (no closest). */
	handleTriggerHover(domEvent) {
		if (!this.state.openOnHover) {
			return;
		}
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = Number(data.index);
		const item = this.state.items[index];
		if (!item || item.disabled) {
			return;
		}
		if (!data.hasPanel) {
			if (this.openIndex >= 0) {
				this.closePanel();
			}
			return;
		}
		if (this.openIndex !== index) {
			// Do not focus on hover — would re-enter pointerenter → openAt loop.
			this.setFocusedTrigger(index, {
				focus: false,
			});
			this.openAt(index, false);
		}
	}
	handleBarKey(domEvent) {
		const count = this.state.items.length;
		if (!count) {
			return;
		}
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
			case ' ': {
				const item = this.state.items[this.focusedTrigger];
				if (item && itemHasPanel(item)) {
					domEvent.preventDefault();
					this.openAt(this.focusedTrigger, true);
				}
				break;
			}
			case 'Escape':
				if (this.openIndex >= 0) {
					domEvent.preventDefault();
					this.escFocusReturn = this.openIndex;
					this.closePanel();
				}
				break;
			case 'Home':
				domEvent.preventDefault();
				this.setFocusedTrigger(0);
				break;
			case 'End':
				domEvent.preventDefault();
				this.setFocusedTrigger(count - 1);
				break;
			default:
				break;
		}
	}
	moveTrigger(delta) {
		const count = this.state.items.length;
		if (!count) {
			return;
		}
		const next = (this.focusedTrigger + delta + count) % count;
		this.setFocusedTrigger(next);
		const item = this.state.items[next];
		if (this.openIndex >= 0 && item && itemHasPanel(item)) {
			this.openAt(next, true);
		}
	}
	handleSurfaceKey(domEvent) {
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
				this.escFocusReturn = this.openIndex;
				break;
			default:
				break;
		}
	}
	handlePaneSelect(domEvent) {
		domEvent.stopPropagation();
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.emit('nav-section:select', {
			id: data.id,
			item: data.item,
			index: data.index,
			href: data.href,
		});
		const href = data.href;
		if (!href || href === '#') {
			this.closePanel();
		}
	}
	itemKey(item, index) {
		return item.id ?? item.label ?? index;
	}
	render() {
		// Site nav — disclosure pattern, not application menubar.
		// Panes: filter() keeps only panel-capable items (no shadow panels[] array).
		this.html`
			<nav class="nav-section" aria-label="Section">
				<div #bar class="nav-bar"
					@nav-trigger:select=${this.handleTriggerSelect}
					@nav-trigger:hover=${this.handleTriggerHover}
					@keydown=${this.handleBarKey}>
					${this.list('items', UINavTrigger, this.itemKey)}
				</div>
				<div #surface class="menu-surface nav-surface" popover="auto" tabindex="-1"
					@toggle=${this.handleToggle}
					@keydown=${this.handleSurfaceKey}
					@nav-pane:select=${this.handlePaneSelect}>
					<div #viewport class="nav-viewport">
						${this.filter('items', UINavPane, itemHasPanel, this.itemKey)}
					</div>
				</div>
			</nav>
		`;
	}
}
customElements.define('ui-nav-section', UINavSection);
