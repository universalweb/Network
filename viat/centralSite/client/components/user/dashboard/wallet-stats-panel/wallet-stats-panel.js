import { Panel } from '../../../global/panel/panel.js';
export class WalletStatsPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		statPanel: '../../shared/stat-panel.css',
		walletStatsPanel: './wallet-stats-panel.css',
	};
	static state = {
		activity: '0',
		classes: new Set(['wallet-stats-panel']),
		panelId: 'ADDRESS',
		received: '0',
		sent: '0',
		showDot: true,
		heading: 'STATS',
	};
	onConnect() {
		this.delegateTo('click', '[data-copy]', this.handleRowCopy);
	}
	async handleRowCopy(domEvent, row) {
		const value = row.getAttribute('data-copy');
		if (!value) {
			return;
		}
		const copied = await this.copyText(value);
		this.emit('notify', copied ? {
			itemType: 'copy',
			message: value,
			heading: 'Stat Copied',
		} : {
			itemType: 'error',
			message: 'Could not write to clipboard.',
			heading: 'Copy Failed',
		});
	}
	statsRows() {
		return [
			{
				key: 'TXs Received',
				label: 'Transactions Received',
				value: this.state.received,
				className: 'good',
			},
			{
				key: 'TXs Sent',
				label: 'Transactions Sent',
				value: this.state.sent,
			},
			{
				key: 'Total TXs',
				label: 'Total Transactions',
				value: this.state.activity,
			},
		];
	}
	renderBody() {
		const rows = this.statsRows();
		return `
			<div class="stat-block">
				${rows.map((row) => {
					const label = row.label ?? row.key;
					const copyText = `${label}: ${row.value}`;
					const escaped = copyText.replace(/"/g, '&quot;');
					return `
						<div class="stat-row is-copyable" data-copy="${escaped}" tabindex="0" role="button">
							<span class="s-key">${row.key}</span>
							<span class="s-val ${row.className ?? ''}">${row.value}</span>
						</div>
					`;
				}).join('')}
			</div>
		`;
	}
}
customElements.define('wallet-stats-panel', WalletStatsPanel);
