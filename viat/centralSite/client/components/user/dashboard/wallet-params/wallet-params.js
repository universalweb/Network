import { Panel } from '../../../global/panel/panel.js';
export class WalletParams extends Panel {
	static url = import.meta.url;
	static styles = {
		walletParams: './wallet-params.css',
	};
	static state = {
		classes: new Set(['wallet-params-panel']),
		id: 'WALLET',
		title: 'PARAMETERS',
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
				title: 'Parameter Copied',
			});
		} catch (clipboardError) {
			this.emit('notify', {
				itemType: 'error',
				message: 'Could not write to clipboard.',
				title: 'Copy Failed',
			});
		}
	}
	renderBody() {
		const params = this.globalState.walletParams ?? [];
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
