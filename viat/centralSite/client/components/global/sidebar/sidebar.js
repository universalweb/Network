import { WebComponent, SNAP_MS, SNAP_CURVE } from 'webcomponent';
import '../icon/icon.js';
// `<ui-sidebar>` — a responsive drawer. Not a bar; it does not compose
// `<ui-bar>`. Slots its panel content; offers a backdrop, a close button, and
// a swipe-to-open/close gesture driven by the shared `dragSnap` engine (axis
// x). When `responsive` is on, the flyout / cover-up mode is derived from the
// viewport. First production consumer of the Phase 0 gesture engine.
// Minimum viewport width for the BARE flyout. Narrower than this the drawer
// would overlap the dashboard, so the frosted cover-up runs instead. Derived:
// the dashboard's 1536px max-width, centred past the 68px dock rail, clears a
// 300px drawer only at ≈2204px — rounded up here for a comfortable gap.
const FLYOUT_MIN_WIDTH = 2300;
export class UISidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		sidebar: './sidebar.css',
	};
	static attrs = {
		open: false,
		inert: true,
	};
	static state = {
		side: 'right',
		swipe: true,
		backdrop: true,
		closeButton: true,
		responsive: true,
		closeIconState: {
			name: 'x',
			size: 'md',
		},
	};
	shellWidth = 0;
	dragFromOpen = false;
	lastDefaultOpen = null;
	get mode() {
		if (!this.state.responsive) {
			return 'flyout';
		}
		const viewport = this.globalState.environment?.viewport;
		if (!viewport) {
			return 'coverup';
		}
		// A BARE flyout only when the viewport genuinely has room: wide enough
		// to hold the dashboard at its full max width AND the drawer beside it
		// without overlap (see FLYOUT_MIN_WIDTH). Anything narrower, or
		// height-starved, gets the frosted cover-up drawer instead.
		if (viewport.width >= FLYOUT_MIN_WIDTH && viewport.h !== 'short') {
			return 'flyout';
		}
		return 'coverup';
	}
	// Every bare flyout is, by definition, on a screen wide enough to host it
	// without crowding the dashboard — so show it by default. The cover-up
	// never opens itself.
	get defaultOpen() {
		return this.mode === 'flyout';
	}
	get hostClasses() {
		const parts = ['sidebar', `side-${this.state.side}`, `mode-${this.mode}`];
		if (!this.state.backdrop) {
			parts.push('no-backdrop');
		}
		if (!this.state.closeButton) {
			parts.push('no-close');
		}
		return parts.join(' ');
	}
	toggle() {
		const next = !this.attrs.open;
		this.attrs.open = next;
		this.attrs.inert = !next;
	}
	close() {
		this.attrs.open = false;
		this.attrs.inert = true;
	}
	openSidebar() {
		this.attrs.open = true;
		this.attrs.inert = false;
	}
	onMount() {
		this.applyMode();
		this.delegate('viewport:change', this.handleViewportChange);
		this.delegate('toggle-sidebar', this.handleToggleEvent);
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
	// Reconcile host classes with the current mode, and apply the default
	// visibility — but only when the viewport crosses the "show by default"
	// (xxl) threshold. Between crossings the top bar's toggle button is free
	// to override it.
	applyMode() {
		this.classList.value = this.hostClasses;
		const wantOpen = this.defaultOpen;
		if (wantOpen !== this.lastDefaultOpen) {
			if (wantOpen) {
				this.openSidebar();
			} else {
				this.close();
			}
			this.lastDefaultOpen = wantOpen;
		}
	}
	installSwipe() {
		const opensToward = this.state.side === 'left' ? 'right' : 'left';
		// The off-screen edge sensor — always initiates an opening drag.
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
	snapTo(open) {
		const shell = this.refs.shell;
		if (!shell) {
			return;
		}
		const closedOffset = this.state.side === 'left' ? -this.shellWidth : this.shellWidth;
		shell.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		shell.style.transform = open ? 'translateX(0)' : `translateX(${closedOffset}px)`;
		if (open) {
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
		
		this.html`
			<div class="sidebar-edge" #edge></div>
			<div class="sidebar-backdrop" @click=${this.close}></div>
			<aside class="sidebar-shell" #shell>
				<button #close type="button" class="sidebar-close" aria-label="Close sidebar" @click=${this.close}>
					<ui-icon .state=${this.state.closeIconState}></ui-icon>
				</button>
				<slot></slot>
			</aside>
		`;
	}
}
customElements.define('ui-sidebar', UISidebar);
