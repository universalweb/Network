import { html } from 'webcomponent';
import { Panel } from '../../../global/panel/panel.js';
export class WalletStatsPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		statPanel: '../../shared/stat-panel.css',
		walletStatsPanel: './wallet-stats-panel.css',
	};
	static state = {
		classes: new Set(['wallet-stats-panel']),
		panelId: 'ADDRESS',
		showDot: true,
		heading: 'STATS',
		items: [],
	};
	/*
	 * Subscribes to the whole `account` object rather than to individual stat
	 * keys: one fetch writes them together, so one observer re-derives every row
	 * in a single pass instead of three observers firing three times for the same
	 * update. Nothing is pushed in from outside — every mounted instance derives
	 * its own rows, including instances that mount after the fetch.
	 */
	onConnect() {
		this.delegateTo('click', '[data-copy]', this.handleRowCopy);
		this.observeGlobal('account', this.syncRows);
		this.syncRows();
	}
	syncRows() {
		const account = this.global.account;
		this.state.items = [
			{
				id: 'rx',
				key: 'TXs Received',
				label: 'Transactions Received',
				value: account?.received ?? '0',
				className: 'good',
			},
			{
				id: 'tx',
				key: 'TXs Sent',
				label: 'Transactions Sent',
				value: account?.sent ?? '0',
			},
			{
				id: 'total',
				key: 'Total TXs',
				label: 'Total Transactions',
				value: account?.activity ?? '0',
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
