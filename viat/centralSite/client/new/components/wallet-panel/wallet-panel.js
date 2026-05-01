import '../wallet-address/wallet-address.js';
import { WebComponent } from '../base/base.js';
export class WalletPanel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		stats: '../../styles/stats.css',
		walletPanel: './wallet-panel.css',
	};
	static state = {
		activity: '0',
		received: '0',
		sent: '0',
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
			<div class="panel">
				<div class="panel-header">
					<span><span class="ph-id">WALLET</span> // ADDRESS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="addr-wrap">
					<wallet-address></wallet-address>
					<div class="copy-hint">CLICK TO COPY</div>
				</div>
			</div>
			<div class="panel">
				<div class="panel-header">
					<span><span class="ph-id">ADDRESS</span> // STATS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="stat-block">
					<div class="stat-row">
						<span class="s-key">TXs Received</span>
						<span class="s-val good">${this.state.received}</span>
					</div>
					<div class="stat-row">
						<span class="s-key">TXs Sent</span>
						<span class="s-val">${this.state.sent}</span>
					</div>
					<div class="stat-row">
						<span class="s-key">Total TXs</span>
						<span class="s-val">${this.state.activity}</span>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('wallet-panel', WalletPanel);
