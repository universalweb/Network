import { WebComponent } from '../../core/index.js';
const SNAP_MS = 320;
const SNAP_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
export class UIPullDown extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pulldown: './pulldown.css',
	};
	static state = {
		open: false,
		// Drag-to-close is core. The grab handle defaults to the BOTTOM edge — you
		// grab low and pull the whole sheet up off-screen, which gives a full
		// viewport-height of travel (a top handle has almost none before it clears
		// the edge, so it can only close on a fast flick). 'top' | 'bottom' | 'none'
		// (hidden); skin it with the --pulldown-handle-* custom properties.
		handlePosition: 'bottom',
		// With this on you can also drag ANY empty area of the sheet — its own
		// surface, never the slotted content — not just the handle. Set false to
		// disable the close gesture entirely.
		dragToClose: true,
	};
	settleTimer = null;
	onConnect() {
		this.delegate('pulldown:dragstart', this.handleDragStart);
		this.delegate('pulldown:drag', this.handleDrag);
		this.delegate('pulldown:state', this.handleState);
		this.delegate('pulldown:dragend', this.handleDragEnd);
	}
	onMount() {
		this.dataset.handle = this.state.handlePosition;
		this.installDragClose();
	}
	// Drag-up-to-close, built into the base component (bottom-sheet style). The
	// gesture binds to the whole DRAWER, not just the handle, so any empty area of
	// the sheet drags it — the `enabled` guard whitelists the sheet's own surface
	// so slotted content is never hijacked. The shared engine tracks the upward
	// travel, and onSettle hands the verdict back through `pulldown:state` so the
	// SAME path animates the drawer AND lets any external bar (global-top-bar)
	// retract with it. Re-mount safe: a stale controller is dropped before rebinding.
	installDragClose() {
		const drawer = this.refs.drawer;
		if (!drawer) {
			return;
		}
		if (this.dragController) {
			this.dragController.destroy();
			this.gestureUnsubs?.delete(this.dragController);
		}
		this.dragController = this.dragSnap(drawer, {
			axis: 'y',
			opensToward: 'down',
			enabled: (domEvent) => {
				return this.state.open === true && this.state.dragToClose !== false && this.isDragSurface(domEvent);
			},
			isOpen: () => {
				return this.state.open === true;
			},
			extent: () => {
				return globalThis.innerHeight;
			},
			onStart: () => {
				this.handleDragStart();
			},
			onMove: (progress, delta) => {
				this.handleSelfDragMove(delta);
			},
			onSettle: (shouldOpen) => {
				this.handleSelfDragSettle(shouldOpen);
			},
		});
	}
	// The drag starts only on the sheet's OWN surface — the drawer, the content
	// wrapper (incl. its handle-clearing padding), or the grab handle — never on
	// slotted content. Event retargeting reports the real slotted node here (its
	// root is the document, not our shadow root), so a whitelist of our own
	// elements cleanly excludes "anything inside it".
	isDragSurface(domEvent) {
		const { target } = domEvent;
		const handle = this.refs.handle;
		return target === this.refs.drawer ||
			target === this.refs.content ||
			target === handle ||
			handle?.contains(target) === true;
	}
	handleSelfDragMove(delta) {
		const drawer = this.refs.drawer;
		if (!drawer) {
			return;
		}
		// `delta` is the upward (negative) travel from the resting open position —
		// translate the drawer to follow the finger 1:1.
		drawer.style.transform = `translateY(${delta}px)`;
	}
	handleSelfDragSettle(shouldOpen) {
		// handleState owns the settle animation (single source of truth); it does
		// NOT re-emit, so this can't loop. The emit also lets a host bar retract.
		this.emit('pulldown:state', {
			open: shouldOpen,
		});
	}
	handleDragEnd(domEvent) {
		const data = domEvent.detail.data;
		if (data.snapped) {
			return;
		}
		const drawer = this.refs.drawer;
		if (!drawer) {
			return;
		}
		if (this.state.open) {
			return;
		}
		drawer.classList.remove('is-active', 'is-fully-open', 'is-open');
		drawer.style.transform = '';
		drawer.style.transition = '';
	}
	handleDragStart() {
		const drawer = this.refs.drawer;
		drawer.style.transition = 'none';
		drawer.classList.add('is-active');
		drawer.classList.remove('is-fully-open');
	}
	handleDrag(domEvent) {
		const { barTop } = domEvent.detail.data;
		const drawer = this.refs.drawer;
		drawer.style.transform = `translateY(${barTop - globalThis.innerHeight}px)`;
	}
	handleState(domEvent) {
		const isOpen = domEvent.detail.data.open;
		const drawer = this.refs.drawer;
		const wasHidden = !drawer.classList.contains('is-active') && !drawer.classList.contains('is-open');
		if (isOpen && wasHidden) {
			drawer.classList.add('is-active');
			drawer.style.transition = 'none';
			drawer.style.transform = 'translateY(-100%)';
			drawer.getBoundingClientRect();
		}
		drawer.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		drawer.style.transform = isOpen ? 'translateY(0)' : 'translateY(-100%)';
		drawer.classList.toggle('is-open', isOpen);
		this.state.open = isOpen;
		// One settle timer at a time. A rapid open→close→open lands three
		// transitions inside SNAP_MS; a stale close-settle firing on the drawer
		// that has since reopened would strip `is-active`/transform off it,
		// leaving the panel invisible while the open flag stays true. Supersede
		// the prior timer, and resolve against the LIVE `this.state.open` at fire
		// time — never the value captured when the timer was scheduled.
		if (this.settleTimer) {
			this.removeTimeout(this.settleTimer);
		}
		this.settleTimer = this.setTimeout(() => {
			this.settleTimer = null;
			if (this.state.open) {
				drawer.classList.add('is-fully-open');
			} else {
				drawer.classList.remove('is-active', 'is-fully-open');
				drawer.style.transform = '';
				drawer.style.transition = '';
			}
		}, SNAP_MS);
	}
	render() {
		this.html `
			<div #drawer class="pulldown-drawer">
				<div #content class="pulldown-content">
					<slot></slot>
				</div>
				<div #handle class="pulldown-handle" aria-hidden="true"></div>
			</div>
		`;
	}
}
customElements.define('ui-pulldown', UIPullDown);
