import { Panel } from '../../global/panel/panel.js';
export class WalletStatsPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		stats: '../../../styles/stats.css',
	};
	static state = {
		activity: '0',
		id: 'ADDRESS',
		received: '0',
		sent: '0',
		showDot: true,
		title: 'STATS',
	};
	renderBody() {
		return `
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
		`;
	}
}
customElements.define('wallet-stats-panel', WalletStatsPanel);
