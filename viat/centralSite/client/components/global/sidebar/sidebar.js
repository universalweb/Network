import '../icon/icon.js';
import '../nav/nav.js';
import { SNAP_CURVE, SNAP_MS, WebComponent } from 'webcomponent';
import {
	isTopEscapable,
	pushEscapable,
	releaseEscapable,
} from '../../core/escape/escapeStack.js';
/*
 * `<ui-sidebar>` — a responsive drawer. Not a bar; it does not compose
 * `<ui-bar>`. Owns an optional ui-nav rail when `groups` / `heading` are set
 * (`density` slim = icon rail, full = labeled groups + search). Still slots
 * extra panel content. Backdrop, close button, and swipe-to-open/close via
 * `dragSnap` (axis x).
 *
 * `swipe` is deliberately NOT spelled `dragToClose` like ui-slideout and
 * ui-pulldown: those gate dismissal only, while this gates BOTH drags — the
 * off-screen edge sensor that OPENS and the shell drag that closes. One flag,
 * two gestures, so a narrower name would misdescribe it.
 *
 * NOT BUILT ON ui-slideout: the drag mechanic is already shared via dragSnap
 * (whose header names this component's swipe as one of the two private copies it
 * absorbed), and what is left — docked-vs-overlay viewport modes, the nav rail,
 * density — is this component's own policy, which a blank-slate edge panel has
 * no concept of.
 *
 * Adaptivity is `this.reflectViewport()` (`data-vw` on the host). Mode is a
 * declared `data-mode` (default `flyout`), not a width-derived ladder. Geometry
 * is `data-vw` × `data-mode` × `data-density` in CSS:
 *
 *   mobile  (xs/sm)  full      labeled full-viewport overlay
 *   mobile  (xs/sm)  full+slim icons-only overlay rail (does not reflow)
 *   mobile  (xs/sm)  flyout    labeled full-viewport overlay (same as full)
 *   desktop (md+)    full      overlay drawer
 *   desktop (md+)    flyout    docked rail beside content (default)
 *   both             coverup   overlay drawer
 *
 * Selecting a nav link closes the drawer only while overlaying (xs/sm, or a
 * declared overlay mode). Desktop flyout stays open so the rail remains.
 *
 * `defaultOpen` (opt-in) rests the drawer OPEN in every docked case and closed
 * in every overlaying one, re-evaluated on viewport change until the user
 * toggles it by hand.
 */
const MODES = new Set([
	'flyout', 'coverup', 'full',
]);
export class UISidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		sidebar: './sidebar.css',
	};
	static attrs = {
		open: false,
	};
	static state = {
		side: 'right',
		swipe: true,
		backdrop: true,
		closeButton: true,
		mode: 'flyout',
		// Start open wherever the drawer can sit BESIDE the content instead of on top
		// of it (see applyDefaultOpen). Opt-in: every existing consumer keeps the
		// closed-at-rest behaviour it was written against.
		defaultOpen: false,
		// The open()/close()/toggle() METHODS are the trigger API — a project wires
		// its own button to them (the Viat shell binds its top-bar button this way).
		// A document hotkey is offered for zero-wiring control (auto-swept on
		// disconnect; '' opts out — the shell sets the \ | keys in app.js instead).
		hotkey: '\\',
		density: 'full',
		heading: '',
		caption: '',
		groups: [],
		query: '',
		searchPlaceholder: 'filter…',
		showSearch: true,
		showBrand: true,
		showDensityToggle: true,
		showProfile: false,
		profileName: '',
		profileCaption: '',
		profileSrc: '',
		profileVariant: 'row',
		showSettings: true,
	};
	shellWidth = 0;
	dragFromOpen = false;
	lastMode = null;
	// Latches on the first hand-driven toggle/swipe — after that `defaultOpen`
	// stops steering, so a resize never re-opens a drawer the user just shut.
	userToggled = false;
	get mode() {
		const nextMode = this.state.mode;
		if (MODES.has(nextMode)) {
			return nextMode;
		}
		return 'flyout';
	}
	isOverlay() {
		const vw = this.getAttribute('data-vw');
		if (vw === 'xs' || vw === 'sm') {
			return true;
		}
		return this.mode !== 'flyout';
	}
	toggle() {
		this.userToggled = true;
		if (this.attrs.open) {
			this.close();
		} else {
			this.openSidebar();
		}
	}
	/*
	 * `defaultOpen`: rest OPEN wherever the drawer docks beside the content rather
	 * than covering it — which is exactly `!isOverlay()` (desktop md+ in the docked
	 * `flyout` mode). Re-evaluated from applyViewportBucket, so shrinking to xs/sm
	 * retracts the rail instead of stranding a full-viewport overlay over the page.
	 */
	applyDefaultOpen() {
		if (this.state.defaultOpen !== true || this.userToggled === true) {
			return;
		}
		const shouldOpen = !this.isOverlay();
		if (shouldOpen === this.attrs.open) {
			return;
		}
		this.attrs.open = shouldOpen;
		this.emitOpenChange(shouldOpen);
	}
	close() {
		this.attrs.open = false;
		releaseEscapable(this);
		this.emitOpenChange(false);
	}
	openSidebar() {
		this.attrs.open = true;
		/*
		 * Only an OVERLAYING drawer is dismissible. A docked rail (desktop flyout)
		 * is part of the layout, not something covering the page, so Escape must
		 * leave it alone — the same distinction handleNavSelect already draws.
		 */
		if (this.isOverlay()) {
			pushEscapable(this);
		}
		this.emitOpenChange(true);
	}
	/*
	 * `preventDefault: false` on the registration; we prevent by hand only when we
	 * actually close, so a shut (or merely docked) sidebar never swallows Escape
	 * from whatever else wants it.
	 */
	handleEscape(keyEvent) {
		if (this.attrs.open !== true || !this.isOverlay() || !isTopEscapable(this)) {
			return;
		}
		keyEvent.preventDefault();
		this.close();
	}
	emitOpenChange(isOpen) {
		this.emit('sidebar:change', {
			open: isOpen,
		});
	}
	onConnect() {
		this.reflectViewport();
		this.applyMode();
		this.applyDefaultOpen();
		if (this.state.hotkey) {
			this.hotKey(this.state.hotkey, this.handleHotkey);
		}
		this.hotKey('escape', this.handleEscape, {
			preventDefault: false,
		});
	}
	onDisconnect() {
		releaseEscapable(this);
	}
	/*
	 * Ride the ONE `viewport:change` subscription reflectViewport already owns
	 * rather than registering a second listener for the same signal (the suite pins
	 * that count, and a parallel subscription is exactly the duplication
	 * reflectViewport was introduced to retire). `data-vw` is written by super
	 * first, so `isOverlay()` reads the new bucket.
	 */
	applyViewportBucket() {
		super.applyViewportBucket();
		this.applyDefaultOpen();
	}
	handleHotkey() {
		this.toggle();
	}
	onMount() {
		this.delegate('sidebar:toggle', this.handleToggleEvent);
		this.observe('mode', this.handleModeStateChange);
		this.observe('side', this.handleModeStateChange);
		this.observe('backdrop', this.handleModeStateChange);
		this.observe('closeButton', this.handleModeStateChange);
		this.observe('density', this.handleModeStateChange);
		if (this.state.swipe) {
			this.installSwipe();
		}
	}
	handleToggleEvent() {
		this.toggle();
	}
	handleModeStateChange() {
		this.applyMode();
	}
	handleNavSelect() {
		if (this.isOverlay()) {
			this.close();
		}
	}
	/*
	 * Host decoration as data-* attributes (CSS targets :host([data-mode])
	 * / :host([data-vw])). The host is not template-rendered, so these are
	 * stamped from state here. `data-vw` is owned by reflectViewport.
	 */
	applyMode() {
		const nextMode = this.mode;
		this.dataset.side = this.state.side;
		this.dataset.mode = nextMode;
		this.dataset.density = this.state.density === 'slim' ? 'slim' : 'full';
		this.toggleAttribute('data-no-backdrop', !this.state.backdrop);
		this.toggleAttribute('data-no-close', !this.state.closeButton);
		const modeChanged = nextMode !== this.lastMode;
		this.lastMode = nextMode;
		if (modeChanged && !this.refs.shell?.classList.contains('is-dragging')) {
			const shell = this.refs.shell;
			if (shell) {
				shell.style.transform = '';
				shell.style.transition = '';
			}
		}
	}
	installSwipe() {
		const opensToward = this.state.side === 'left' ? 'right' : 'left';
		// The off-screen edge sensor — always initiates an opening drag.
		// CSS hides it on mobile labeled-full (no edge strip); dragSnap
		// no-ops when the target has no hit area.
		this.dragSnap(this.refs.edge, {
			axis: 'x',
			opensToward,
			isOpen: () => {
				return false;
			},
			extent: () => {
				return this.shellWidth;
			},
			onStart: (startedOpen) => {
				this.beginDrag(startedOpen);
			},
			onMove: (progress) => {
				this.trackDrag(progress);
			},
			onSettle: (shouldOpen) => {
				this.settleDrag(shouldOpen);
			},
		});
		// The shell itself — a closing drag, only while open and clear of the
		// close button (so its click still runs).
		this.dragSnap(this.refs.shell, {
			axis: 'x',
			opensToward,
			enabled: (domEvent) => {
				return this.attrs.open === true && !this.onCloseButton(domEvent);
			},
			isOpen: () => {
				return this.attrs.open === true;
			},
			extent: () => {
				return this.shellWidth;
			},
			onStart: (startedOpen) => {
				this.beginDrag(startedOpen);
			},
			onMove: (progress) => {
				this.trackDrag(progress);
			},
			onSettle: (shouldOpen) => {
				this.settleDrag(shouldOpen);
			},
		});
	}
	onCloseButton(domEvent) {
		const closeButton = this.refs.close;
		if (!closeButton) {
			return false;
		}
		const target = domEvent.target;
		return target === closeButton || closeButton.contains?.(target) === true;
	}
	measureShell() {
		const shell = this.refs.shell;
		if (!shell) {
			return 0;
		}
		return shell.getBoundingClientRect().width || shell.offsetWidth || 0;
	}
	beginDrag(startedOpen) {
		this.dragFromOpen = startedOpen;
		this.shellWidth = this.measureShell();
		this.refs.shell?.classList.add('is-dragging');
	}
	trackDrag(progress) {
		const shell = this.refs.shell;
		if (!shell || !this.shellWidth) {
			return;
		}
		// `progress` is the engine's 0..1 travel fraction toward the other
		// state — already clamped. Closing slides the shell from on-screen out
		// to `closedOffset`; opening slides it the other way.
		const closedOffset = this.state.side === 'left' ? -this.shellWidth : this.shellWidth;
		const targetX = this.dragFromOpen ? progress * closedOffset : closedOffset * (1 - progress);
		shell.style.transition = 'none';
		shell.style.transform = `translateX(${targetX}px)`;
	}
	settleDrag(shouldOpen) {
		this.userToggled = true;
		this.snapTo(shouldOpen);
	}
	snapTo(shouldOpen) {
		const shell = this.refs.shell;
		if (!shell) {
			return;
		}
		shell.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		// Closed target reads from the CSS var, which folds in the float gap (when
		// any), so the settle lands exactly where the stylesheet's resting closed
		// state sits — no last-frame jump when the inline transform is cleared.
		shell.style.transform = shouldOpen ? 'translateX(0)' : 'translateX(var(--shell-closed-x))';
		if (shouldOpen) {
			this.openSidebar();
		} else {
			this.close();
		}
		this.setTimeout(() => {
			// Hand control back to the stylesheet's class-driven transform.
			shell.style.transform = '';
			shell.style.transition = '';
			shell.classList.remove('is-dragging');
		}, SNAP_MS);
	}
	hideNav() {
		return !(this.state.groups?.length) && !this.state.heading;
	}
	handleNavDensity(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value !== 'slim' && value !== 'full') {
			return;
		}
		if (this.state.density !== value) {
			this.state.density = value;
		}
		this.dataset.density = value;
		this.emit('sidebar:density', {
			value,
		});
	}
	render() {
		/*
		 * inert rides the SHELL, not the host. Inerting the host would also suppress
		 * pointer events on the edge swipe-sensor (inert kills pointerdown across the
		 * whole shadow subtree — verified), the very sensor the CSS keeps live while
		 * closed so the drawer can be dragged open. The off-screen panel is the only
		 * thing that must leave the tab/interaction tree; derive it reactively from
		 * `this.attrs.open` (the reactive attrs channel re-patches on open/close).
		 */
		this.html`
			<div class="sidebar-edge" #edge></div>
			<div class="sidebar-backdrop" @click=${this.close}></div>
			<aside class="sidebar-shell" #shell ?inert=${!this.attrs.open}>
				<button #close type="button" class="sidebar-close" part="close" aria-label="Close sidebar" @click=${this.close}>
					<span class="sidebar-close-face">
						<ui-icon .state.name=${'x'} .state.size=${'md'}></ui-icon>
					</span>
				</button>
				<ui-nav ?hidden=${this.hideNav}
					.state.heading=${this.state.heading}
					.state.caption=${this.state.caption}
					.state.groups=${this.state.groups}
					.state.query=${this.state.query}
					.state.searchPlaceholder=${this.state.searchPlaceholder}
					.state.showSearch=${this.state.showSearch}
					.state.showBrand=${this.state.showBrand}
					.state.density=${this.state.density}
					.state.showDensityToggle=${this.state.showDensityToggle}
					.state.showProfile=${this.state.showProfile}
					.state.profileName=${this.state.profileName}
					.state.profileCaption=${this.state.profileCaption}
					.state.profileSrc=${this.state.profileSrc}
					.state.profileVariant=${this.state.profileVariant}
					.state.showSettings=${this.state.showSettings}
					@nav:select=${this.handleNavSelect}
					@nav:density=${this.handleNavDensity}>
				</ui-nav>
				<slot></slot>
			</aside>
		`;
	}
}
customElements.define('ui-sidebar', UISidebar);
