import '../wallet-address/wallet-address.js';
import { SidebarPanel } from '../sidebar-panel/sidebar-panel.js';
import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./wallet-panel.css', import.meta.url);
const statsStyles = await WebComponent.styleSheet('../../styles/stats.css', import.meta.url);
export class WalletPanel extends SidebarPanel {
	constructor() {
		super([statsStyles, styles], {
			tooltips: true,
		});
		this.state = {
			activity: '0',
			received: '0',
			sent: '0',
			walletAddress: '',
		};
	}
	get walletAddress() {
		return this.state.walletAddress;
	}
	set walletAddress(v) {
		this.state.walletAddress = v ?? '';
	}
	get received() {
		return this.state.received;
	}
	set received(v) {
		this.state.received = v ?? '0';
	}
	get sent() {
		return this.state.sent;
	}
	set sent(v) {
		this.state.sent = v ?? '0';
	}
	get activity() {
		return this.state.activity;
	}
	set activity(v) {
		this.state.activity = v ?? '0';
	}
	render() {
		this.html `
			<div class="panel">
				<div class="panel-header">
					<span><span class="ph-id">WALLET</span> // ADDRESS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="addr-wrap">
					<wallet-address wallet-address="${this.state.walletAddress}"></wallet-address>
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
