import { WebComponent } from 'webcomponent';
import './network-stats/network-stats.js';
import '../../global/sidebar/sidebar.js';
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
