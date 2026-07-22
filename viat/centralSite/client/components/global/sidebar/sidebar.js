import '../icon/icon.js';
import { SNAP_CURVE, SNAP_MS, WebComponent } from 'webcomponent';
// `<ui-sidebar>` — a responsive drawer. Not a bar; it does not compose
// `<ui-bar>`. Slots its panel content; offers a backdrop, a close button, and
// a swipe-to-open/close gesture driven by the shared `dragSnap` engine (axis
// x). When `responsive` is on, mode is derived from the live viewport width:
//
//   flyout  — ultra-wide: bare panel beside content (float gap off the edge)
//   coverup — mid: frosted overlay drawer (flush to edge, no float gap)
//   full    — narrow: full-viewport menu (no edge strip, equal inline pad)
//
// Mode is re-applied on every `viewport:resize` (not only bucket changes) so
// crossing the numeric thresholds below is reactive mid-resize.
// Bare flyout only when the dashboard's max width (1536px) + dock rail + drawer
// all fit side-by-side — ≈2204px, rounded up for a comfortable gap.
const FLYOUT_MIN_WIDTH = 2300;
// Below this: full-screen menu. Matches the app shell's mobile bucket (sm = 768).
const FULL_MAX_WIDTH = 768;
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
		responsive: true,
		// Optional force: 'flyout' | 'coverup' | 'full' | '' (auto from viewport).
		mode: '',
		// The open()/close()/toggle() METHODS are the trigger API — a project wires
		// its own button to them (the Viat shell binds its top-bar button this way).
		// A document hotkey is offered for zero-wiring control (auto-swept on
		// disconnect; '' opts out — the shell sets the \ | keys in app.js instead).
		hotkey: '\\',
	};
	shellWidth = 0;
	dragFromOpen = false;
	lastDefaultOpen = null;
	lastMode = null;
	/**
	 * Resolved layout mode. Forced `state.mode` wins when valid; otherwise
	 * width thresholds (and short-height demotion from flyout → coverup).
	 */
	get mode() {
		const forced = this.state.mode;
		if (forced && MODES.has(forced)) {
			return forced;
		}
		if (!this.state.responsive) {
			return 'flyout';
		}
		const view = this.global.environment?.viewport;
		if (!view) {
			return 'coverup';
		}
		const width = view.width ?? 0;
		if (width < FULL_MAX_WIDTH) {
			return 'full';
		}
		// Ultra-wide + enough vertical room → bare flyout. Height-starved wide
		// screens still get coverup so the drawer does not crowd the chrome.
		if (width >= FLYOUT_MIN_WIDTH && view.h !== 'short') {
			return 'flyout';
		}
		return 'coverup';
	}
	// Bare flyout defaults open (room beside the dashboard). Coverup + full
	// never auto-open — user opens via toggle / swipe / hotkey.
	get defaultOpen() {
		return this.mode === 'flyout';
	}
	toggle() {
		if (this.attrs.open) {
			this.close();
		} else {
			this.openSidebar();
		}
	}
	close() {
		this.attrs.open = false;
	}
	openSidebar() {
		this.attrs.open = true;
	}
	onConnect() {
		if (this.state.hotkey) {
			this.hotKey(this.state.hotkey, this.handleHotkey);
		}
	}
	handleHotkey() {
		this.toggle();
	}
	onMount() {
		this.applyMode();
		// resize = every coalesced size tick (crosses FLYOUT/FULL thresholds mid-bucket).
		// change = bucket transitions (w/h/orientation) — still applied for completeness.
		this.delegate('viewport:resize', this.handleViewportChange);
		this.delegate('viewport:change', this.handleViewportChange);
		this.delegate('sidebar:toggle', this.handleToggleEvent);
		// Forced mode writes from outside re-apply host data-mode without a resize.
		this.observe('mode', this.handleModeStateChange);
		this.observe('side', this.handleModeStateChange);
		this.observe('backdrop', this.handleModeStateChange);
		this.observe('closeButton', this.handleModeStateChange);
		if (this.state.swipe) {
			this.installSwipe();
		}
	}
	handleToggleEvent() {
		this.toggle();
	}
	handleViewportChange() {
		this.applyMode();
	}
	handleModeStateChange() {
		this.applyMode();
	}
	/**
	 * Sync host data-* for CSS and open/close defaults when the resolved mode
	 * (or defaultOpen policy) crosses a threshold. Idempotent.
	 */
	applyMode() {
		const nextMode = this.mode;
		/* Host decoration as data-* ATTRIBUTES (CSS targets :host([data-side])
		   /:host([data-mode]) …), set imperatively because the host isn't
		   template-rendered and `mode` is a viewport-derived getter. */
		this.dataset.side = this.state.side;
		this.dataset.mode = nextMode;
		this.toggleAttribute('data-no-backdrop', !this.state.backdrop);
		this.toggleAttribute('data-no-close', !this.state.closeButton);
		const modeChanged = nextMode !== this.lastMode;
		this.lastMode = nextMode;
		const wantOpen = this.defaultOpen;
		if (wantOpen !== this.lastDefaultOpen) {
			if (wantOpen) {
				this.openSidebar();
			} else {
				this.close();
			}
			this.lastDefaultOpen = wantOpen;
		}
		// Mode swap while open: clear any mid-drag inline transform so the new
		// shell geometry (full vs partial width) takes over cleanly.
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
		// CSS hides it in full mode (no edge strip); dragSnap no-ops when
		// the target has no hit area.
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
				<button #close type="button" class="sidebar-close" aria-label="Close sidebar" @click=${this.close}>
					<ui-icon .state.name=${'x'} .state.size=${'md'}></ui-icon>
				</button>
				<slot></slot>
			</aside>
		`;
	}
}
customElements.define('ui-sidebar', UISidebar);
