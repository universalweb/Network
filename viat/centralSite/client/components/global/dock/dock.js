import '../bar/bar.js';
import { list, movingIndicator, WebComponent } from 'webcomponent';
import { DockIconButton } from './dockIconButton.js';
// `<ui-dock>` — a navigation rail. Composes a `<ui-bar>`, renders its `items`
// as `<ui-icon-button>`s, and tracks the selected item with a sliding
// active-bar driven by the shared movingIndicator engine. A click OPTIMISTICALLY
// self-highlights — the dock listens on its OWN host for each item's activation
// channel (`onClick`, default `dock:select`) and sets `activeId` itself, so the
// bar moves out of the box with no consumer wiring. `activeId` stays a prop: a controlling consumer
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
		activeId: '',
	};
	indicator = null;
	barSettleTimer = 0;
	onConnect() {
		// Host decoration as a data-* attribute (CSS targets :host([data-orientation]))
		// rather than imperative class toggles — orientation is a one-time enumerated dim.
		this.dataset.orientation = this.state.orientation === 'horizontal' ? 'horizontal' : 'vertical';
		this.observeAsync('activeId', () => {
			this.syncActiveBar();
		});
		this.observeAsync('items', () => {
			requestAnimationFrame(() => {
				this.syncActiveBar();
			});
		});
		this.on('dock:select', this.handleItemSelect);
		/*
		 * Reconcile AFTER subscribing. On a RECONNECT the observers re-register
		 * here while activeId may have changed since the disconnect — the
		 * mount-time snap only runs once, so catch up now. On first connect the
		 * indicator isn't built yet and this no-ops.
		 */
		this.syncActiveBar(true);
	}
	handleItemSelect(domEvent) {
		// The icon-button is the event source; its `id` is the section to highlight.
		const id = domEvent.detail?.source?.state?.id;
		this.logInfo('handleItemSelect', id, domEvent);
		if (!id) {
			return;
		}
		this.state.activeId = id;
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
		// Re-snap with no transition — the rail may have changed axis.
		this.syncActiveBar(true);
	}
	syncActiveBar(snap = false) {
		if (!this.indicator) {
			return;
		}
		if (!this.state.showActiveBar) {
			this.indicator.hide();
			return;
		}
		const activeId = this.state.activeId || '';
		const activeButton = activeId ? this.findComponent('dock-icon-button', (button) => {
			return button.state.id === activeId;
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
		this.removeTimeout(this.barSettleTimer);
		this.barSettleTimer = this.setTimeout(() => {
			bar.classList.remove('is-moving');
		}, 450);
	}
	render() {
		this.html `
			<ui-bar class="dock">
				<div slot="center" class="dock-rail">
					<div class="active-bar" #active_bar></div>
					${list('items', DockIconButton)}
				</div>
			</ui-bar>
		`;
	}
}
customElements.define('ui-dock', UIDock);
