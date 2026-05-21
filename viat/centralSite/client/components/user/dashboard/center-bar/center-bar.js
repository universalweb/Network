import { WebComponent, list } from '../../../core/index.js';
import { CenterBarIconButton } from './center-bar-icon-button.js';
export class CenterBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		centerBar: './center-bar.css',
	};
	static state = {
		actions: [
			{
				className: 'green-hover',
				icon: 'droplets',
				id: 'faucet',
				onClick: 'faucet:request',
				tooltip: 'Faucet — mint test VIAT',
			},
			{
				icon: 'file-signature',
				id: 'sign-data',
				onClick: 'sign:open',
				tooltip: 'Sign arbitrary data',
			},
			{
				icon: 'refresh-cw',
				id: 'refresh-account',
				onClick: 'wallet:refresh',
				tooltip: 'Refresh balance, totals, and activity log',
			},
			{
				icon: 'info',
				id: 'wallet-info',
				onClick: 'info:open',
				tooltip: 'How wallets are built',
			},
		],
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="center-bar">
				${list('actions', CenterBarIconButton)}
			</div>
		`;
	}
}
customElements.define('center-bar', CenterBar);
