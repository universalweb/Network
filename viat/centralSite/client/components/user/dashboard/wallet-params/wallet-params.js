import { Panel } from '../../../global/panel/panel.js';
export class WalletParams extends Panel {
	static url = import.meta.url;
	static styles = {
		statPanel: '../../shared/stat-panel.css',
		walletParams: './wallet-params.css',
	};
	static state = {
		classes: new Set(['wallet-params-panel']),
		id: 'WALLET',
		title: 'PARAMETERS',
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
			title: 'Parameter Copied',
		} : {
			itemType: 'error',
			message: 'Could not write to clipboard.',
			title: 'Copy Failed',
		});
	}
	renderBody() {
		const params = this.global.walletParams ?? [];
		if (!params.length) {
			return '<div class="stat-block stat-empty">no wallet loaded</div>';
		}
		return `
			<div class="stat-block">
				${params.map((p) => {
					const label = p.label ?? p.key;
					const copyText = `${label}: ${p.copyValue ?? p.value}`;
					const escaped = copyText.replace(/"/g, '&quot;');
					return `
						<div class="stat-row is-copyable" data-copy="${escaped}" tabindex="0" role="button">
							<span class="s-key">${p.key}</span>
							<span class="s-val ${p.className ?? ''}">${p.value}</span>
						</div>
					`;
				}).join('')}
			</div>
		`;
	}
}
customElements.define('wallet-params', WalletParams);
