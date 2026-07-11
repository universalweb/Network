import { html } from 'webcomponent';
import { Panel } from '../../../global/panel/panel.js';
export class WalletParams extends Panel {
	static url = import.meta.url;
	static styles = {
		statPanel: '../../shared/stat-panel.css',
		walletParams: './wallet-params.css',
	};
	static state = {
		classes: new Set(['wallet-params-panel']),
		panelId: 'WALLET',
		heading: 'PARAMETERS',
		items: [],
	};
	onConnect() {
		this.delegateTo('click', '[data-copy]', this.handleRowCopy);
		this.observeGlobal('walletParams', this.syncParams);
		this.syncParams();
	}
	syncParams() {
		const params = this.global.walletParams ?? [];
		const next = [];
		const count = params.length;
		for (let index = 0; index < count; index += 1) {
			const entry = params[index];
			next.push({
				id: entry.key ?? index,
				key: entry.key,
				label: entry.label ?? entry.key,
				value: entry.value,
				copyValue: entry.copyValue ?? entry.value,
				className: entry.className,
			});
		}
		this.state.items = next;
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
			heading: 'Parameter Copied',
		} : {
			itemType: 'error',
			message: 'Could not write to clipboard.',
			heading: 'Copy Failed',
		});
	}
	statRow(row) {
		const copyText = `${row.label}: ${row.copyValue}`;
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
		if (!this.state.items.length) {
			return this.htmlElement`<div class="stat-block stat-empty">no wallet loaded</div>`;
		}
		return this.htmlElement`
			<div class="stat-block">
				${this.list('items', this.statRow, this.statKey)}
			</div>
		`;
	}
}
customElements.define('wallet-params', WalletParams);
