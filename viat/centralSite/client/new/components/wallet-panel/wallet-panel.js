import '../wallet-address/wallet-address.js';
import { SidebarPanel } from '../sidebar-panel/sidebar-panel.js';
import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet([
	'../../styles/stats.css',
	'./wallet-panel.css',
], import.meta.url);
export class WalletPanel extends SidebarPanel {
	constructor() {
		super({
			styles,
			tooltips: true,
		});
		this.state = {
			activity: '0',
			received: '0',
			sent: '0',
		};
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
