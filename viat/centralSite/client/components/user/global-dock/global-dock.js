import '../../global/dock/dock.js';
import { routerStore, WebComponent } from 'webcomponent';
// `<global-dock>` — the Viat navigation rail. A thin composition over the
// built-in `<ui-dock>`: it supplies the six section items and owns the router
// coupling — the `dockSelect` event and the router store's `section` (observed
// via observeStore) both drive `<ui-dock>`'s `activeIndex`. The built-in never
// reads the router.]
export class GlobalDock extends WebComponent {
	static url = import.meta.url;
	static stores = {
		router: routerStore,
	};
	static styles = {
		globalDock: './global-dock.css',
	};
	static state = {
		dock: {
			// A complete config — `global-dock` mutates `activeIndex`, which
			// re-applies `.state=` on a patch pass; a re-applied `.state=`
			// wholesale-replaces, so every key the built-in needs must be here.
			activeIndex: '',
			orientation: 'vertical',
			showActiveBar: true,
			items: [
				{
					id: 'wallet',
					icon: 'wallet',
					tooltip: 'Wallet',
					animated: 'bob',
				},
				{
					id: 'explorer',
					icon: 'compass',
					tooltip: 'Explorer',
					animated: 'compass',
				},
				{
					id: 'accounts',
					icon: 'users',
					tooltip: 'Accounts',
					animated: 'hop',
				},
				{
					id: 'swap',
					icon: 'repeat-2',
					tooltip: 'Swap',
					animated: 'flip',
				},
				{
					id: 'exchange',
					icon: 'arrow-right-left',
					tooltip: 'Exchange (Coming Soon)',
				},
				{
					id: 'analytics',
					icon: 'chart-line',
					tooltip: 'Analytics (Coming Soon)',
				},
			],
		},
	};
	onConnect() {
		// `data-vw` on the host drives the desktop-rail ↔ mobile-bottom-bar
		// placement switch in global-dock.css.
		this.reflectViewport();
		// Router coupling lives here, never in the built-in. INTENT flows UP as an
		// event: <ui-dock> emits `dock:select` on EVERY item click (re-taps included)
		// and self-highlights optimistically; we translate that into the app's
		// `dockSelect` command. We deliberately do NOT trigger navigation off the
		// `dock.activeIndex` STATE — that back-edge (state → command → state) is what made
		// the dock/router cycle, and it swallowed re-taps (a same-value write never fires).
		this.on('dock:select', this.handleDockClick);
		// DISPLAY flows DOWN, one-way: the router store's `section` is the source of
		// truth, the rail is its projection. `immediate` seeds the initial highlight
		// from the already-primed store; it reconciles the highlight and never
		// navigates, so no cycle can form regardless of the current-section guard.
		this.observeStore('router', 'section', this.syncActiveFromRoute, {
			immediate: true,
		});
	}
	syncActiveFromRoute(sectionId) {
		this.state.dock.activeIndex = sectionId || '';
	}
	handleDockClick(domEvent) {
		// The clicked icon-button row reports its `id` — same payload shape <ui-dock>
		// reads in handleItemSelect. Emitting on every click (not on an activeIndex change)
		// is what makes re-tap-to-refresh reachable in AppView.handleDockSelect.
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		this.emit('dockSelect', {
			id,
		});
	}
	render() {
		this.html`<ui-dock #dock .state=${this.state.dock}></ui-dock>`;
	}
}
customElements.define('global-dock', GlobalDock);
