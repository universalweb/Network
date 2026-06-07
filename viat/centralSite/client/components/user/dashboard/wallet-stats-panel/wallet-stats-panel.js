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
		id: 'ADDRESS',
		received: '0',
		sent: '0',
		showDot: true,
		title: 'STATS',
	};
	onMount() {
		this.addEventListener('click', this.handleRowClick);
	}
	findCopyRow(domEvent) {
		const path = domEvent.composedPath();
		for (let index = 0; index < path.length; index += 1) {
			const node = path[index];
			if (node === this) {
				return null;
			}
			if (node.nodeType === 1 && node.hasAttribute?.('data-copy')) {
				return node;
			}
		}
		return null;
	}
	async handleRowClick(domEvent) {
		const row = this.findCopyRow(domEvent);
		if (!row) {
			return;
		}
		const value = row.getAttribute('data-copy');
		if (!value) {
			return;
		}
		try {
			await navigator.clipboard.writeText(value);
			this.emit('notify', {
				itemType: 'copy',
				message: value,
				title: 'Stat Copied',
			});
		} catch (clipboardError) {
			this.emit('notify', {
				itemType: 'error',
				message: 'Could not write to clipboard.',
				title: 'Copy Failed',
			});
		}
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
