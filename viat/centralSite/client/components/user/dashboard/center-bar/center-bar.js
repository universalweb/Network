import { WebComponent } from 'webcomponent';
import '../../../global/toolbar/toolbar.js';
// `<center-bar>` — the Viat dashboard action bar. A thin composition over the
// built-in `<ui-toolbar>`: it supplies the four wallet actions through config.
// The rounded-panel chrome (surface, hover lift) is this host's own CSS.
export class CenterBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		centerBar: './center-bar.css',
	};
	static state = {
		toolbar: {
			actions: [
				{
					id: 'faucet',
					icon: 'droplets',
					size: 'sm',
					onClick: 'faucet:request',
					tooltip: 'Faucet — mint test VIAT',
				},
				{
					id: 'sign-data',
					icon: 'file-signature',
					size: 'sm',
					onClick: 'sign:open',
					tooltip: 'Sign arbitrary data',
				},
				{
					id: 'refresh-account',
					icon: 'refresh-cw',
					size: 'sm',
					onClick: 'wallet:refresh',
					tooltip: 'Refresh balance, totals, and activity log',
				},
				{
					id: 'wallet-info',
					icon: 'info',
					size: 'sm',
					onClick: 'info:open',
					tooltip: 'How wallets are built',
				},
			],
		},
	};
	render() {
		
		this.html`
			<ui-toolbar .state=${this.state.toolbar}></ui-toolbar>
		`;
	}
}
customElements.define('center-bar', CenterBar);
