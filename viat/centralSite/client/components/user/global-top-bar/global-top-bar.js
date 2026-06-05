import '../../global/app-bar/app-bar.js';
import '../../global/icon/icon.js';
import '../../global/theme-select/theme-select.js';
import { SNAP_CURVE, SNAP_MS, WebComponent } from 'webcomponent';
import { clampOffset, offsetIsOpen } from './pulldownOffset.js';
// `<global-top-bar>` — the Viat top bar. A thin composition over `<ui-app-bar>`:
// it slots the brand block + theme select and supplies the three action items.
// The drag-to-open-pulldown coupling lives *here*, not in the built-in — it
// attaches `this.dragSnap` to the composed `<ui-app-bar>` and emits the
// `pulldown:*` protocol the pulldown component listens for.
const FLOAT_GAP_PX = 16;
export class GlobalTopBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalTopBar: './global-top-bar.css',
	};
	static state = {
		appBar: {
			actions: [
				{
					id: 'agent',
					icon: 'bot',
					tooltip: 'Local Agent',
					onClick: 'toggle-pulldown',
					animate: 'rainbow',
				},
				{
					id: 'settings',
					icon: 'settings',
					tooltip: 'Settings',
					onClick: 'open-settings',
					animate: 'settings',
				},
				{
					id: 'sidebar',
					icon: 'panel-left',
					tooltip: 'Sidebar',
					onClick: 'toggle-sidebar',
					animate: 'sidebar',
				},
			],
		},
		subtitle: 'COMMAND TERMINAL',
		sepIconState: {
			name: 'chevron-right',
			size: 'xs',
		},
	};
	open = false;
	naturalTop = 0;
	naturalBottom = 0;
	dragStartOffset = 0;
	onConnect() {
		this.delegate('pulldown:state', this.handlePulldownState);
		this.syncViewportClass();
		this.delegate('viewport:change', this.handleViewportChange);
		this.windowAbort = new AbortController();
		globalThis.addEventListener('resize', this.handleResize, {
			signal: this.windowAbort.signal,
		});
	}
	onMount() {
		const appBar = this.refs.appbar;
		if (appBar) {
			appBar.style.touchAction = 'none';
			appBar.style.cursor = 'grab';
		}
		// The pulldown drag — the shared engine, attached to the app bar. The
		// top bar's flip ratio is measured against the viewport height while
		// its travel extent is `maxOffset()`; `snapExtent` keeps both faithful.
		this.dragSnap(appBar, {
			axis: 'y',
			opensToward: 'down',
			isOpen: () => {
				return offsetIsOpen(this.currentRenderedOffset(), this.maxOffset());
			},
			extent: () => {
				return this.maxOffset();
			},
			snapExtent: () => {
				return globalThis.innerHeight;
			},
			onStart: () => {
				this.handleDragStart();
			},
			onMove: (progress, delta) => {
				this.handleDragMove(delta);
			},
			onSettle: (shouldOpen) => {
				this.snapTo(shouldOpen);
			},
		});
	}
	onDisconnect() {
		this.windowAbort?.abort();
		this.windowAbort = null;
	}
	syncViewportClass() {
		const bucket = this.globalState?.environment?.viewport?.w ?? 'lg';
		const next = [];
		const current = (this.classList.value || '').split(/\s+/);
		for (let index = 0; index < current.length; index += 1) {
			const token = current[index];
			if (token && !token.startsWith('vw-')) {
				next.push(token);
			}
		}
		next.push(`vw-${bucket}`);
		this.classList.value = next.join(' ');
	}
	handleViewportChange() {
		this.syncViewportClass();
	}
	handleResize = () => {
		if (this.naturalBottom === 0) {
			return;
		}
		this.measureNatural();
		if (this.open) {
			const appBar = this.refs.appbar;
			appBar.style.transition = 'none';
			appBar.style.transform = `translateY(${this.maxOffset()}px)`;
			this.emit('pulldown:drag', {
				progress: 1,
				barTop: this.naturalTop + this.maxOffset(),
			});
		}
	};
	maxOffset() {
		return Math.max(0, globalThis.innerHeight - this.naturalBottom - FLOAT_GAP_PX);
	}
	/**
	 * The bar's LIVE rendered vertical offset (px), read from the computed
	 * transform matrix so it reflects the real on-screen position mid-snap — not
	 * the committed `open` boolean. The drag keys off this so a gesture that
	 * begins while the 320ms snap is still animating tracks the bar from where it
	 * actually is, instead of teleporting to the boolean's end.
	 * @returns {number} The current translateY of the app bar in pixels.
	 */
	currentRenderedOffset() {
		const appBar = this.refs.appbar;
		if (!appBar) {
			return 0;
		}
		const transform = getComputedStyle(appBar).transform;
		if (!transform || transform === 'none') {
			return 0;
		}
		return new DOMMatrixReadOnly(transform).m42;
	}
	measureNatural() {
		const appBar = this.refs.appbar;
		if (!appBar) {
			return;
		}
		// Measure the bar's resting box with BOTH transform and transition
		// neutralised. Killing the transition is the load-bearing part: an
		// open-snap leaves `transition: transform …` on the host, so setting
		// `transform: none` alone would merely *start* a transition toward none.
		// `getBoundingClientRect` would then read the still-open position,
		// `maxOffset()` would collapse to ~0, and the next drag-to-close would
		// snap straight to the top instead of tracking the pointer.
		const previousTransform = appBar.style.transform;
		const previousTransition = appBar.style.transition;
		appBar.style.transition = 'none';
		appBar.style.transform = 'none';
		const rect = appBar.getBoundingClientRect();
		appBar.style.transform = previousTransform;
		appBar.style.transition = previousTransition;
		this.naturalTop = rect.top;
		this.naturalBottom = rect.bottom;
	}
	handlePulldownState(domEvent) {
		// Ignore our own `pulldown:state` emissions; react only when the
		// pulldown is opened or closed by some other route.
		if (domEvent.target === this) {
			return;
		}
		const targetOpen = domEvent.detail?.data?.open === true;
		if (targetOpen === this.open) {
			return;
		}
		this.snapTo(targetOpen);
	}
	handleDragStart() {
		// Capture where the bar actually is RIGHT NOW (mid-snap included), then
		// pin the transform there before killing the transition — so grabbing an
		// in-flight bar freezes it in place instead of snapping to its old
		// target. The drag then tracks the pointer from this offset.
		this.dragStartOffset = this.currentRenderedOffset();
		this.measureNatural();
		const appBar = this.refs.appbar;
		appBar.style.transition = 'none';
		appBar.style.transform = `translateY(${this.dragStartOffset}px)`;
		appBar.style.cursor = 'grabbing';
		appBar.style.zIndex = '100';
		this.emit('pulldown:dragstart', {
			open: this.open,
		});
	}
	handleDragMove(delta) {
		// Position from the captured start offset + the pointer's signed travel,
		// clamped to the travel span — never from the `open` boolean. Reading the
		// boolean here teleported the bar to the wrong end when state and render
		// were out of phase (the "hit the bottom and jump back up" bug).
		const appBar = this.refs.appbar;
		const max = this.maxOffset();
		const targetY = clampOffset(this.dragStartOffset, delta, max);
		appBar.style.transform = `translateY(${targetY}px)`;
		this.emit('pulldown:drag', {
			progress: max ? targetY / max : 0,
			barTop: this.naturalTop + targetY,
		});
	}
	snapTo(willOpen) {
		const appBar = this.refs.appbar;
		if (!appBar) {
			return;
		}
		// Refresh the natural geometry first. A snap can be triggered with no
		// preceding drag — the agent/pulldown toggle routes through
		// `handlePulldownState` → `snapTo` — so `naturalBottom` would otherwise
		// be stale (0), collapsing `maxOffset()` and stranding the bar.
		this.measureNatural();
		const max = this.maxOffset();
		const targetY = willOpen ? max : 0;
		appBar.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		appBar.style.transform = `translateY(${targetY}px)`;
		appBar.style.cursor = 'grab';
		const wasOpen = this.open;
		this.open = willOpen;
		appBar.style.zIndex = willOpen ? '100' : '';
		this.emit('pulldown:state', {
			open: willOpen,
		});
		this.emit('pulldown:dragend', {
			open: willOpen,
			snapped: true,
		});
		if (!willOpen) {
			this.setTimeout(() => {
				if (!this.open) {
					appBar.style.transform = '';
					appBar.style.transition = '';
					appBar.style.zIndex = '';
				}
			}, SNAP_MS);
		}
		if (willOpen !== wasOpen) {
			this.emit(willOpen ? 'pulldown:open' : 'pulldown:close', {});
		}
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-app-bar #appbar .state=${this.state.appBar}>
				<div slot="start" class="tb-logo">
					<a class="tb-logo-home" href="/" aria-label="Back to dashboard">
						<span class="tb-logo-mark">⩝</span>
						<span class="tb-logo-text">VIAT</span>
					</a>
					<ui-icon class="tb-logo-sep" .state=${this.state.sepIconState}></ui-icon>
					<span class="tb-subtitle">${this.state.subtitle}</span>
				</div>
				<ui-theme-select slot="end"></ui-theme-select>
			</ui-app-bar>
		`;
	}
}
customElements.define('global-top-bar', GlobalTopBar);
