import './network-stats/network-stats.js';
import '../../global/icon/icon.js';
import { WebComponent } from 'webcomponent';
const SNAP_MS = 320;
const SNAP_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const DRAG_THRESHOLD_PX = 6;
const SNAP_THRESHOLD = 0.3;
const SNAP_VELOCITY = 0.5;
export class GlobalSidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalSidebar: './global-sidebar.css',
	};
	static attrs = {
		open: false,
		inert: true,
	};
	pointerId = null;
	startX = 0;
	startTime = 0;
	delta = 0;
	dragMoved = false;
	dragOpenFrom = false;
	shellWidth = 0;
	suppressNextClick = false;
	get mode() {
		const v = this.globalState.environment?.viewport;
		if (!v) {
			return 'docked';
		}
		if (v.w === 'xs' || v.w === 'sm' || v.h === 'short') {
			return 'overlay';
		}
		if (v.w === 'md') {
			return 'floating';
		}
		return 'docked';
	}
	get hostClasses() {
		return `sidebar mode-${this.mode}`;
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
		this.classList.value = this.hostClasses;
		this.delegate('viewport:change', this.handleViewportChange);
		this.delegate('toggle-sidebar', this.handleToggleEvent);
	}
	handleToggleEvent() {
		this.toggle();
	}
	handleViewportChange() {
		this.classList.value = this.hostClasses;
	}
	closeIconState() {
		return {
			name: 'x',
			size: 'md',
		};
	}
	measureShell() {
		const shell = this.refs.shell;
		if (!shell) {
			return;
		}
		this.shellWidth = shell.getBoundingClientRect().width || shell.offsetWidth || 0;
	}
	resetShellTransform(shell) {
		shell.style.transform = '';
		shell.style.transition = '';
		shell.classList.remove('is-dragging');
	}
	clamp(value, min, max) {
		if (value < min) {
			return min;
		}
		if (value > max) {
			return max;
		}
		return value;
	}
	startDrag(domEvent, fromEdge) {
		// Only the overlay mode (mobile) supports swipe gestures. In docked
		// and floating modes the sidebar is permanently positioned, so drag
		// would just clobber the layout.
		if (this.mode !== 'overlay') {
			return;
		}
		if (this.pointerId !== null || (domEvent.button !== undefined && domEvent.button !== 0)) {
			return;
		}
		this.pointerId = domEvent.pointerId;
		this.startX = domEvent.clientX;
		this.startTime = performance.now();
		this.delta = 0;
		this.dragMoved = false;
		this.dragOpenFrom = fromEdge ? false : this.attrs.open;
		this.measureShell();
		this.addDragListeners();
	}
	addDragListeners() {
		this.dragAbort = new AbortController();
		this.dragUnsubs = [
			this.delegate('pointermove', this.handlePointerMove),
			this.delegate('pointerup', this.handlePointerEnd),
			this.delegate('pointercancel', this.handlePointerEnd),
		];
		globalThis.addEventListener('blur', this.handleWindowBlur, {
			signal: this.dragAbort.signal,
		});
	}
	removeDragListeners() {
		if (this.dragUnsubs) {
			for (let i = 0; i < this.dragUnsubs.length; i++) {
				this.dragUnsubs[i]();
			}
			this.dragUnsubs = null;
		}
		this.dragAbort?.abort();
		this.dragAbort = null;
	}
	handleWindowBlur = () => {
		if (this.pointerId === null) {
			return;
		}
		this.handlePointerEnd({
			pointerId: this.pointerId,
		});
	};
	handleEdgePointerDown = (domEvent) => {
		this.startDrag(domEvent, true);
	};
	handleShellPointerDown = (domEvent) => {
		// When open, the user can swipe right on the shell itself to dismiss.
		// Skip when the press lands on the close button (let the click run).
		const close = this.refs.close;
		if (close && (domEvent.target === close || close.contains?.(domEvent.target))) {
			return;
		}
		if (!this.attrs.open) {
			return;
		}
		this.startDrag(domEvent, false);
	};
	handlePointerMove = (domEvent) => {
		if (domEvent.pointerId !== this.pointerId) {
			return;
		}
		const raw = domEvent.clientX - this.startX;
		// `delta` is normalized to "distance pulled" along the gesture's axis.
		// Opening = dragging left (negative raw) from the right edge.
		// Closing = dragging right (positive raw) from the open shell.
		this.delta = this.dragOpenFrom ? Math.max(0, raw) : Math.min(0, raw);
		if (!this.dragMoved && Math.abs(raw) > DRAG_THRESHOLD_PX) {
			this.dragMoved = true;
			this.refs.shell?.classList.add('is-dragging');
		}
		if (!this.dragMoved) {
			return;
		}
		const shell = this.refs.shell;
		if (!shell || !this.shellWidth) {
			return;
		}
		// Position the shell along the swipe. When closing, the shell starts
		// at 0 and follows the finger right; when opening, it starts off-
		// screen at shellWidth and follows the finger left.
		const baseX = this.dragOpenFrom ? 0 : this.shellWidth;
		const targetX = this.clamp(baseX + this.delta, 0, this.shellWidth);
		shell.style.transition = 'none';
		shell.style.transform = `translateX(${targetX}px)`;
	};
	handlePointerEnd = (domEvent) => {
		if (domEvent.pointerId !== this.pointerId) {
			return;
		}
		this.pointerId = null;
		this.removeDragListeners();
		if (!this.dragMoved) {
			return;
		}
		this.suppressNextClick = true;
		const elapsed = Math.max(performance.now() - this.startTime, 1);
		const distance = Math.abs(this.delta);
		const speed = distance / elapsed;
		const ratio = this.shellWidth ? distance / this.shellWidth : 0;
		const shouldFlip = ratio >= SNAP_THRESHOLD || speed >= SNAP_VELOCITY;
		const goingOpen = this.dragOpenFrom ? !shouldFlip : shouldFlip;
		this.snapTo(goingOpen);
	};
	snapTo(open) {
		const shell = this.refs.shell;
		if (!shell) {
			return;
		}
		shell.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		shell.style.transform = open ? 'translateX(0)' : `translateX(${this.shellWidth || shell.offsetWidth || 0}px)`;
		if (open) {
			this.openSidebar();
		} else {
			this.close();
		}
		this.setTimeout(() => {
			// Clear the inline transform once the snap completes so the
			// stylesheet's class-driven transform (mode-overlay open/closed)
			// takes over again on subsequent layout/viewport changes.
			this.resetShellTransform(shell);
		}, SNAP_MS);
	}
	handleClickCapture = (domEvent) => {
		if (!this.suppressNextClick) {
			return;
		}
		this.suppressNextClick = false;
		domEvent.stopPropagation();
		domEvent.preventDefault();
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="sidebar-edge" @pointerdown=${this.handleEdgePointerDown}></div>
			<div class="sidebar-backdrop" @click=${this.close}></div>
			<aside class="sidebar-shell" #shell
				@pointerdown=${this.handleShellPointerDown}
				@click=${this.handleClickCapture}>
				<button #close type="button" class="sidebar-close" aria-label="Close sidebar" @click=${this.close}>
					<ui-icon .state=${this.closeIconState}></ui-icon>
				</button>
				<network-stats></network-stats>
			</aside>
		`;
	}
}
customElements.define('global-sidebar', GlobalSidebar);
