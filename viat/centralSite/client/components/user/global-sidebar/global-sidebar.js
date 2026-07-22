import './network-stats/network-stats.js';
import '../../global/sidebar/sidebar.js';
import { WebComponent } from 'webcomponent';
// `<global-sidebar>` — the Viat right-hand drawer. A thin composition over the
// built-in `<ui-sidebar>`: it sets `side: 'right'` and slots the network-stats
// panel. The drawer machinery — responsive modes, backdrop, close button and
// the swipe gesture — all live in `<ui-sidebar>`.
export class GlobalSidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalSidebar: './global-sidebar.css',
	};
	static state = {
		sidebar: {
			side: 'right',
			// The Viat shell drives the drawer via the global-top-bar button + the
			// \ / | hotkeys (app.js) calling open()/close()/toggle() — so the built-in
			// hotkey is opted out here to avoid a double-bound key.
			hotkey: '',
		},
	};
	render() {
		this.html`
			<ui-sidebar .state=${this.state.sidebar}>
				<network-stats></network-stats>
			</ui-sidebar>
		`;
	}
}
customElements.define('global-sidebar', GlobalSidebar);
