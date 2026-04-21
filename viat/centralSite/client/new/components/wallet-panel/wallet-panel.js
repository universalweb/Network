import './wallet-address.js';
import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const statsStyles = await loadSheet(new URL('../styles/stats.css', import.meta.url));
const host = hostSheet(`
:host {
	display: flex;
	flex-direction: column;
	gap: 14px;
	width: 100%;
	flex-shrink: 0;
}
.addr-wrap { padding: 14px 16px 10px; }
.copy-hint {
	font-size: 0.4375rem;
	text-transform: uppercase;
	letter-spacing: 0.22em;
	color: var(--text-muted);
	margin-top: 8px;
	text-align: center;
}
`);
export class WalletPanel extends WebComponent {
	constructor() {
		super([resetSheet, host, panelSheet, statsStyles], { tooltips: true });
		this.state = {
			activity: '0',
			received: '0',
			sent: '0',
			walletAddress: '',
		};
	}
	get walletAddress() { return this.state.walletAddress; }
	set walletAddress(v) { this.state.walletAddress = v ?? ''; }
	get received() { return this.state.received; }
	set received(v) { this.state.received = v ?? '0'; }
	get sent() { return this.state.sent; }
	set sent(v) { this.state.sent = v ?? '0'; }
	get activity() { return this.state.activity; }
	set activity(v) { this.state.activity = v ?? '0'; }
	render() {
		this.html`
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
						<span class="s-key">Total Received</span>
						<span class="s-val good">${this.state.received}</span>
					</div>
					<div class="stat-row">
						<span class="s-key">Total Sent</span>
						<span class="s-val">${this.state.sent}</span>
					</div>
					<div class="stat-row">
						<span class="s-key">Total Activity</span>
						<span class="s-val">${this.state.activity}</span>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('wallet-panel', WalletPanel);
