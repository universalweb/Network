import { html } from 'webcomponent';
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
		items: [],
	};
	onConnect() {
		this.delegateTo('click', '[data-copy]', this.handleRowCopy);
		this.observe('received', this.syncRows);
		this.observe('sent', this.syncRows);
		this.observe('activity', this.syncRows);
		this.syncRows();
	}
	syncRows() {
		this.state.items = [
			{
				id: 'rx',
				key: 'TXs Received',
				label: 'Transactions Received',
				value: this.state.received,
				className: 'good',
			},
			{
				id: 'tx',
				key: 'TXs Sent',
				label: 'Transactions Sent',
				value: this.state.sent,
			},
			{
				id: 'total',
				key: 'Total TXs',
				label: 'Total Transactions',
				value: this.state.activity,
			},
		];
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
	statRow(row) {
		const label = row.label ?? row.key;
		const copyText = `${label}: ${row.value}`;
		const className = row.className ? `s-val ${row.className}` : 's-val';
		return html`<div class="stat-row is-copyable" data-copy=${copyText} tabindex="0" role="button">
			<span class="s-key">${row.key}</span>
			<span class=${className}>${row.value}</span>
		</div>`;
	}
	statKey(row) {
		return row.id;
	}
	renderBody() {
		return this.htmlElement`
			<div class="stat-block">
				${this.list('items', this.statRow, this.statKey)}
			</div>
		`;
	}
}
customElements.define('wallet-stats-panel', WalletStatsPanel);
