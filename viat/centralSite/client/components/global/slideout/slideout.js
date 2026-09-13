import '../panel-header/panel-header.js';
import {
	classList, FocusTrap, lockScroll, SNAP_CURVE, SNAP_MS, unlockScroll, WebComponent,
} from 'webcomponent';
import {
	isTopEscapable,
	pushEscapable,
	releaseEscapable,
} from '../../core/escape/escapeStack.js';
/* Resting closed transforms, mirrored from slideout.css — settle animates to
   exactly these so clearing the inline transform afterwards is a no-op. */
const CLOSED_X_END = 'translateX(calc(100% + var(--space-6)))';
const CLOSED_X_START = 'translateX(calc(-100% - var(--space-6)))';
const SIDES = new Set(['start', 'end']);
const SKINS = new Set(['solid', 'floor']);
/*
 * `<ui-slideout>` — edge slide-out panel (backdrop + surface + header + body).
 *
 * Blank-slate primitive. Compose header controls via named slots; body is the
 * default slot; `footer` is optional and collapses when empty. Drag-to-dismiss
 * is on by default for the whole surface.
 *
 * NOT A BASE CLASS for ui-sidebar or ui-pulldown, deliberately. The mechanic is
 * already shared through core/gestures/dragSnap.js — all three compose that one
 * engine. Absorbing the other two would mean growing a y axis for the pulldown
 * and a docked/overlay viewport mode plus a nav rail for the sidebar, which is
 * one component taking on three roles rather than a shared mechanism. Blank
 * slate is the point.
 *
 * Config:
 * - `open` — pane visible
 * - `side` — `end` (default, inline-end) | `start`
 * - `heading` — uppercase-centered title (via `<ui-panel-header>`)
 * - `showClose` — trailing close control
 * - `closeLabel` — a11y label for close
 * - `closeIcon` — lucide name forwarded through panel-header → close-button
 * - `dragToClose` — dragSnap dismiss (default true). Same spelling and same
 *   opt-out semantic as `ui-pulldown`: enabled unless explicitly `false`, so a
 *   caller that leaves it undefined still gets it. One concept, one name.
 * - `modal` — show the dim layer (default true)
 * - `dismissable` — outside click closes (default true)
 * - `backdrop` — deprecated alias of `modal`. Kept so existing callers
 *   (notification-panel, overlay preview demos) keep working.
 * - `blockScroll` — lock background page scroll while open (default false)
 * - `skin` — `solid` (frosted fill) | `floor` (no panel fill; chrome + cards
 *   paint themselves)
 *
 * Events: `slideout:open` · `slideout:close` · `slideout:after-close`
 * (after the close snap finishes) · re-emits `panel-header:close`.
 *
 *   <ui-slideout .state.open=${open} .state.heading=${'Notifications'} .state.showClose=${true}>
 *     <button slot="header-end" type="button">Clear All</button>
 *     …body…
 *     <div slot="footer">…</div>
 *   </ui-slideout>
 */
export class UISlideout extends WebComponent {
	static url = import.meta.url;
	static styles = {
		slideout: './slideout.css',
	};
	static state = {
		open: false,
		side: 'end',
		heading: '',
		showClose: true,
		closeLabel: 'Close',
		closeIcon: 'x',
		dragToClose: true,
		backdrop: true,
		modal: true,
		dismissable: true,
		blockScroll: false,
		skin: 'solid',
	};
	panelWidth = 0;
	dragController = null;
	closeTimer = null;
	focusTrap = null;
	focusArmTimer = null;
	outsideAbort = null;
	scrollLocked = false;
	onConnect() {
		this.reflectViewport();
		this.applyBackdropAlias();
		this.observe('open', this.syncOpenAttr);
		this.observe('side', this.syncSideAndDrag);
		this.observe('skin', this.syncSkinAttr);
		this.observe('dragToClose', this.installDragClose);
		this.observe('backdrop', this.syncBackdropFromAlias);
		this.observe('modal', this.syncModalToBackdrop);
		this.observe('dismissable', this.syncDismissable);
		this.observe('blockScroll', this.syncBlockScroll);
		this.syncOpenAttr(this.state.open);
		this.syncSideAttr(this.state.side);
		this.syncSkinAttr(this.state.skin);
		this.syncModalAttr();
		// Registered once, guarded per press; the hotkey registry sweeps it on
		// disconnect, so there is no listener to unwind by hand.
		this.hotKey('escape', this.handleEscape, {
			preventDefault: false,
		});
	}
	onDisconnect() {
		this.releaseOutsideDismiss();
		this.closeTimer?.clear();
		if (this.hasAttribute('data-closing') === true) {
			this.finishClose(this);
		} else {
			this.releaseScrollLock();
			this.releaseFocusTrap(true);
		}
		releaseEscapable(this);
	}
	/*
	 * A slideout is a hand-rolled overlay — no `<dialog>`, no `popover="auto"` — so
	 * the UA never dismisses it and Escape has to be wired here. The stack guard
	 * means a drawer sitting UNDER something newer keeps quiet and lets the top
	 * layer take the key.
	 *
	 * `preventDefault: false` on the registration and prevent by hand only when we
	 * actually close, so a shut slideout never swallows Escape from anyone else.
	 */
	handleEscape(keyEvent) {
		if (this.state.open !== true || !isTopEscapable(this)) {
			return;
		}
		keyEvent.preventDefault();
		this.close();
	}
	/* Refs are live after first render — install drag here, not onConnect. */
	onMount() {
		this.installDragClose();
		this.wireCollapse(this.refs.footerwrap);
		this.syncModalAttr();
		if (this.state.open === true) {
			this.armOutsideDismiss();
			this.acquireScrollLock();
			this.armFocusTrap();
		}
	}
	wireCollapse(wrap) {
		const slot = wrap?.querySelector('slot');
		if (!slot) {
			return;
		}
		const sync = () => {
			wrap.toggleAttribute('hidden', slot.assignedElements().length === 0);
		};
		slot.addEventListener('slotchange', sync);
		sync();
	}
	applyBackdropAlias() {
		const backdropOn = this.state.backdrop === true;
		const modalOn = this.state.modal === true;
		if (backdropOn === modalOn) {
			return;
		}
		if (backdropOn === false && modalOn === true) {
			this.state.modal = false;
			return;
		}
		this.state.backdrop = modalOn;
	}
	syncBackdropFromAlias(value) {
		if (this.state.modal !== value) {
			this.state.modal = value;
		}
		this.syncModalAttr();
		this.armOutsideDismiss();
	}
	syncModalToBackdrop(value) {
		if (this.state.backdrop !== value) {
			this.state.backdrop = value;
		}
		this.syncModalAttr();
		this.armOutsideDismiss();
	}
	syncDismissable() {
		this.armOutsideDismiss();
	}
	syncModalAttr() {
		this.toggleAttribute('data-modal', this.state.modal === true);
	}
	syncBlockScroll() {
		if (this.state.open === true && this.state.blockScroll === true) {
			this.acquireScrollLock();
			return;
		}
		if (this.state.open === true && this.state.blockScroll !== true) {
			this.releaseScrollLock();
		}
	}
	acquireScrollLock() {
		if (this.scrollLocked === true) {
			return;
		}
		if (this.state.blockScroll !== true) {
			return;
		}
		lockScroll(this);
		this.scrollLocked = true;
	}
	releaseScrollLock() {
		if (this.scrollLocked !== true) {
			return;
		}
		this.scrollLocked = false;
		unlockScroll();
	}
	armFocusTrapSoon() {
		(this.focusArmTimer ??= this.createTimeout(this.armFocusTrap, 0)).run();
	}
	armFocusTrap(component) {
		const host = component || this;
		const panel = host.refs.panel;
		if (!panel) {
			return;
		}
		if (host.focusTrap) {
			host.focusTrap.attach();
			return;
		}
		host.focusTrap = FocusTrap.attach(panel);
	}
	disarmFocusTrap() {
		this.focusTrap?.detach(false);
	}
	releaseFocusTrap(restore) {
		if (!this.focusTrap) {
			return;
		}
		this.focusTrap.detach(restore === true);
		if (restore === true) {
			this.focusTrap = null;
		}
	}
	armOutsideDismiss() {
		this.releaseOutsideDismiss();
		if (this.state.open !== true) {
			return;
		}
		if (this.state.dismissable !== true) {
			return;
		}
		if (this.state.modal === true) {
			return;
		}
		const doc = globalThis.document;
		if (!doc) {
			return;
		}
		this.outsideAbort = new AbortController();
		doc.addEventListener('pointerdown', this, {
			capture: true,
			signal: this.outsideAbort.signal,
		});
	}
	releaseOutsideDismiss() {
		this.outsideAbort?.abort();
		this.outsideAbort = null;
	}
	handleOutsidePointer(domEvent) {
		if (this.state.open !== true || this.state.dismissable !== true) {
			return;
		}
		const path = typeof domEvent.composedPath === 'function' ? domEvent.composedPath() : [];
		const panel = this.refs.panel;
		if (panel && path.includes(panel)) {
			return;
		}
		this.close();
	}
	handleEvent(domEvent) {
		switch (domEvent.type) {
			case 'pointerdown': {
				this.handleOutsidePointer(domEvent);
				break;
			}
			default: {
				break;
			}
		}
	}
	syncOpenAttr(isOpen) {
		if (isOpen) {
			this.closeTimer?.clear();
			this.toggleAttribute('data-closing', false);
			this.toggleAttribute('data-open', true);
			this.syncModalAttr();
			pushEscapable(this);
			this.armOutsideDismiss();
			this.acquireScrollLock();
			this.armFocusTrapSoon();
			return;
		}
		const wasOpen = this.hasAttribute('data-open');
		this.toggleAttribute('data-open', false);
		releaseEscapable(this);
		this.releaseOutsideDismiss();
		this.disarmFocusTrap();
		if (!wasOpen) {
			this.toggleAttribute('data-closing', false);
			this.releaseScrollLock();
			this.releaseFocusTrap(true);
			return;
		}
		this.toggleAttribute('data-closing', true);
		(this.closeTimer ??= this.createTimeout(this.finishClose, SNAP_MS)).run();
	}
	finishClose(component) {
		const host = component || this;
		const shouldEmit = host.hasAttribute('data-closing') === true;
		host.toggleAttribute('data-closing', false);
		host.releaseScrollLock();
		host.releaseFocusTrap(true);
		if (shouldEmit === true) {
			host.emit('slideout:after-close', {
				open: false,
			});
		}
	}
	syncSideAndDrag(side) {
		this.syncSideAttr(side);
		this.installDragClose();
	}
	syncSideAttr(side) {
		const next = SIDES.has(side) ? side : 'end';
		this.dataset.side = next;
		if (next !== this.state.side) {
			this.state.side = next;
		}
	}
	syncSkinAttr(skin) {
		const next = SKINS.has(skin) ? skin : 'solid';
		this.dataset.skin = next;
		if (next !== this.state.skin) {
			this.state.skin = next;
		}
	}
	open() {
		this.closeTimer?.clear();
		this.toggleAttribute('data-closing', false);
		if (this.state.open) {
			return;
		}
		this.state.open = true;
		this.emit('slideout:open', {
			open: true,
		});
	}
	close() {
		if (!this.state.open) {
			return;
		}
		this.state.open = false;
		this.emit('slideout:close', {
			open: false,
		});
	}
	toggle() {
		if (this.state.open) {
			this.close();
			return;
		}
		this.open();
	}
	handleBackdropClick() {
		if (this.state.dismissable !== true) {
			return;
		}
		this.close();
	}
	handleHeaderClose() {
		this.close();
	}
	/* Closing-only drag: panel is inert while closed, so there is no surface
	   left to start an opening drag — the host owns open(). Whole surface is
	   grabbable; pan-y + x-axis clamp keep scroll/taps working. */
	installDragClose() {
		if (this.dragController) {
			this.dragController.destroy();
			this.gestureUnsubs?.delete(this.dragController);
			this.dragController = null;
		}
		if (this.state.dragToClose === false) {
			return;
		}
		const panel = this.refs.panel;
		if (!panel) {
			return;
		}
		const opensToward = this.state.side === 'start' ? 'right' : 'left';
		this.dragController = this.dragSnap(panel, {
			axis: 'x',
			opensToward,
			enabled: (domEvent) => {
				return this.state.open === true && this.state.dragToClose !== false && this.isDragSurface(domEvent);
			},
			isOpen: () => {
				return this.state.open === true;
			},
			extent: () => {
				return this.panelWidth;
			},
			onStart: () => {
				this.beginPanelDrag();
			},
			onMove: (progress, delta) => {
				this.trackPanelDrag(delta);
			},
			onSettle: (shouldOpen) => {
				this.settlePanelDrag(shouldOpen);
			},
		});
	}
	/*
	 * Drag-to-dismiss owns the panel chrome. Presses on buttons, links, and
	 * fields stay with those controls — a close tap must not become a snap.
	 */
	isDragSurface(domEvent) {
		const target = domEvent.target;
		if (!target) {
			return false;
		}
		if (target === this.refs.panel) {
			return true;
		}
		if (target.closest?.('button, a, input, textarea, select, ui-close-button, ui-icon-button, ui-search-input')) {
			return false;
		}
		return this.refs.panel?.contains(target) === true;
	}
	measurePanel() {
		const panel = this.refs.panel;
		if (!panel) {
			return 0;
		}
		return panel.getBoundingClientRect().width || panel.offsetWidth || 0;
	}
	beginPanelDrag() {
		this.panelWidth = this.measurePanel();
		this.refs.panel?.classList.add('is-dragging');
	}
	trackPanelDrag(delta) {
		const panel = this.refs.panel;
		if (!panel) {
			return;
		}
		/* For side=start, engine opensToward=right so closing delta is negative
		   (leftward); for side=end, opensToward=left → closing delta positive. */
		panel.style.transform = `translateX(${delta}px)`;
	}
	closedTransform() {
		return this.state.side === 'start' ? CLOSED_X_START : CLOSED_X_END;
	}
	settlePanelDrag(shouldOpen) {
		const panel = this.refs.panel;
		if (!panel) {
			return;
		}
		panel.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		panel.style.transform = shouldOpen ? 'none' : this.closedTransform();
		if (shouldOpen) {
			this.open();
		} else {
			this.close();
		}
		this.setTimeout(() => {
			panel.style.transform = '';
			panel.style.transition = '';
			panel.classList.remove('is-dragging');
		}, SNAP_MS);
	}
	render() {
		/* No internal <portal> — slots must stay in THIS shadow root. Callers that
		   need top-layer escape wrap the host: <portal to="body"><ui-slideout>… */
		this.html`
			<div
				class="slideout"
				data-side=${this.state.side}
				data-skin=${this.state.skin}
				?data-open=${this.state.open}>
				<div
					class="slideout-backdrop"
					?hidden=${!this.state.modal}
					@click=${this.handleBackdropClick}></div>
				<aside
					class=${classList('slideout-panel', () => {
						return this.state.skin !== 'floor' && 'glass';
					})}
					role="dialog"
					tabindex="-1"
					aria-label=${this.state.heading}
					aria-modal=${this.state.modal && this.state.open ? 'true' : 'false'}
					#panel
					?inert=${!this.state.open}>
					<ui-panel-header
						class="slideout-head"
						.state.heading=${this.state.heading}
						.state.showClose=${this.state.showClose}
						.state.closeLabel=${this.state.closeLabel}
						.state.closeIcon=${this.state.closeIcon}
						@panel-header:close=${this.handleHeaderClose}>
						<slot name="header-start" slot="start"></slot>
						<slot name="header-end" slot="end"></slot>
					</ui-panel-header>
					<div class="slideout-body">
						<slot></slot>
					</div>
					<div class="slideout-foot" #footerwrap>
						<slot name="footer"></slot>
					</div>
				</aside>
			</div>
		`;
	}
}
customElements.define('ui-slideout', UISlideout);
