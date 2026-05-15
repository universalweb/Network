import { Panel } from '../../../global/panel/panel.js';
export class WalletParams extends Panel {
	static url = import.meta.url;
	static styles = {
		walletParams: './wallet-params.css',
	};
	static state = {
		className: ['wallet-params-panel'],
		id: 'WALLET',
		params: [],
		title: 'PARAMETERS',
	};
	renderBody() {
		return `
			<div class="stat-block">
				${this.state.params.map((p) => {
					return `
						<div class="stat-row">
							<span class="s-key">${p.key}</span>
							<span class="s-val ${p.className ?? ''}">${p.value}</span>
						</div>
					`;
				}).join('')}
			</div>
		`;
	}
}
customElements.define('wallet-params', WalletParams);
