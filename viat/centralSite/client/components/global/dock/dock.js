import '../bar/bar.js';
import { movingIndicator, WebComponent } from 'webcomponent';
import { DockIconButton } from './dockIconButton.js';
/*
 * Width buckets (from environment/breakpoints.js) below the sm / 768px edge. A
 * dock sitting in one of these collapses from a vertical side rail to a
 * horizontal bottom bar — the SAME edge `global-dock` flips its outer container
 * on via `data-vw`, so the inner rail and outer chrome switch axis in lockstep
 * (and both track the px breakpoint, not an em media query that would drift
 * under user font-scaling).
 */
const mobileWidthBuckets = new Set(['xs', 'sm']);
// `<ui-dock>` — a navigation rail. Composes a `<ui-bar>`, renders its `items`
// as `<ui-icon-button>`s, and tracks the selected item with a sliding
// active-bar driven by the shared movingIndicator engine. A click OPTIMISTICALLY
// self-highlights — the dock listens on its OWN host for each item's activation
// channel (`emitName`, default `dock:select`) and sets `activeIndex` itself, so the
// bar moves out of the box with no consumer wiring. `activeIndex` stays a prop: a controlling consumer
// (e.g. global-dock from the router) can still drive/reconcile it — its wholesale
// `.state=` re-apply just overwrites the optimistic value with the real one.
// The dock never reads the router itself. Per-item `hidden` drops an item.
export class UIDock extends WebComponent {
	static url = import.meta.url;
	static styles = {
		dock: './dock.css',
	};
	/*
	 * Per-theme RULE overrides (active-bar geometry, rail hairlines) in
	 * `./themes/{id}.css` — adopted by theme, absent files are graceful.
	 */
	static themes = [
		'gnosis', 'codex', 'dark',
	];
	static state = {
		items: [],
		orientation: 'vertical',
		showActiveBar: true,
		activeIndex: '',
	};
	indicator = null;
	barSettleTimer = null;
	onConnect() {
		/*
		 * Host decoration as a data-* attribute (CSS targets :host([data-orientation]))
		 * rather than imperative class toggles. Orientation is RESPONSIVE, not fixed:
		 * `state.orientation` is the large-viewport preference, but a mobile-width
		 * viewport collapses the rail to a horizontal bottom bar. resolveOrientation
		 * reads the current width bucket now — before first paint, off the viewport
		 * snapshot the service populates synchronously at import — so the first frame
		 * paints the correct axis; the viewport delegates below re-resolve on change.
		 */
		this.resolveOrientation();
		this.observeAsync('activeIndex', () => {
			this.syncActiveBar();
		});
		this.observeAsync('items', () => {
			requestAnimationFrame(() => {
				this.syncActiveBar();
			});
		});
		/*
		 * A consumer re-driving the configured orientation (the large-viewport
		 * preference) must re-resolve the effective axis and re-snap the bar — the
		 * viewport delegates alone would not catch a same-viewport config change.
		 */
		this.observeAsync('orientation', () => {
			this.resolveOrientation();
			this.syncActiveBar(true);
		});
		this.on('dock:select', this.handleItemSelect);
		/*
		 * Reconcile AFTER subscribing. On a RECONNECT the observers re-register
		 * here while activeIndex may have changed since the disconnect — the
		 * mount-time snap only runs once, so catch up now. On first connect the
		 * indicator isn't built yet and this no-ops.
		 */
		this.syncActiveBar(true);
	}
	handleItemSelect(domEvent) {
		// The icon-button row reports its `id` — the section to highlight.
		const id = domEvent.detail?.data?.id;
		this.logInfo('handleItemSelect', id, domEvent);
		if (!id) {
			return;
		}
		this.state.activeIndex = id;
	}
	onMount() {
		this.indicator = movingIndicator(this.refs.active_bar, {
			prefix: 'bar',
		});
		this.delegate('viewport:resize', this.handleViewportChange);
		this.delegate('viewport:change', this.handleViewportChange);
		requestAnimationFrame(() => {
			this.syncActiveBar(true);
		});
	}
	onDisconnect() {
		this.indicator?.destroy();
		this.indicator = null;
	}
	handleViewportChange() {
		/*
		 * A bucket transition may flip the effective axis (side rail ↔ bottom bar).
		 * Re-resolve the host attribute FIRST so the CSS swaps to the new axis, then
		 * re-snap with no transition so the active-bar re-measures against it.
		 */
		this.resolveOrientation();
		this.syncActiveBar(true);
	}
	/*
	 * Effective orientation = the configured `state.orientation` (the large-viewport
	 * preference) UNLESS the viewport is mobile-width (xs/sm bucket, below the
	 * sm/768px edge), which collapses any rail to a horizontal bottom bar. The width
	 * bucket is read straight off the shared viewport snapshot — the same source
	 * `reflectViewport` uses for `data-vw` — so the inner rail flips on the exact
	 * same px edge as `global-dock`'s outer container, with no em/px zoom desync.
	 * Writes the host data-* attribute only on a real change; the CSS owns every
	 * axis-specific rule (no imperative geometry here).
	 */
	resolveOrientation() {
		const bucket = this.global?.environment?.viewport?.w ?? 'lg';
		const configured = this.state.orientation === 'horizontal' ? 'horizontal' : 'vertical';
		const effective = mobileWidthBuckets.has(bucket) ? 'horizontal' : configured;
		if (this.dataset.orientation !== effective) {
			this.dataset.orientation = effective;
		}
	}
	syncActiveBar(snap = false) {
		if (!this.indicator) {
			return;
		}
		if (!this.state.showActiveBar) {
			this.indicator.hide();
			return;
		}
		const activeIndex = this.state.activeIndex || '';
		const activeButton = activeIndex ? this.findChild('dock-icon-button', (button) => {
			return button.state.id === activeIndex;
		}) : null;
		this.indicator.moveTo(activeButton, snap);
		this.squeezeOnTransit(snap, activeButton);
	}
	/* Squash-and-stretch flourish: a real slide between icons (not a snap/first-show)
	   compresses the bar along its travel axis mid-flight, then lets it spring back
	   to full as it settles — the class drops one slide-duration later so the
	   `--bar-squeeze` reset rides the same spring. CSS owns the geometry; this only
	   marks "in transit". */
	squeezeOnTransit(snap, activeButton) {
		const bar = this.refs.active_bar;
		if (!bar || snap || !activeButton) {
			return;
		}
		bar.classList.add('is-moving');
		(this.barSettleTimer ??= this.createTimeout(this.onBarSettle, 450)).run();
	}
	/*
	 * The reusable settle timer's callback — drop the in-transit class one slide
	 * later. Re-resolves the bar from refs (a static ref, so the same node captured
	 * at arm time); the handle passes the component as arg 1.
	 */
	onBarSettle(component) {
		component.refs.active_bar?.classList.remove('is-moving');
	}
	render() {
		this.html`
			<ui-bar class="dock">
				<div slot="center" class="dock-rail">
					<div class="active-bar" #active_bar></div>
					${this.list('items', DockIconButton)}
				</div>
			</ui-bar>
		`;
	}
}
customElements.define('ui-dock', UIDock);
