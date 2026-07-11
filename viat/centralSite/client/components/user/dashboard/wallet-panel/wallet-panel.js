import '../wallet-address/wallet-address.js';
import '../wallet-qr/wallet-qr.js';
import { Panel } from '../../../global/panel/panel.js';
export class WalletPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		walletPanel: './wallet-panel.css',
	};
	static state = {
		panelId: 'WALLET',
		showDot: true,
		heading: 'ADDRESS',
	};
	renderBody() {
		return this.htmlElement`
			<div class="addr-wrap">
				<wallet-address></wallet-address>
				<div class="copy-hint">CLICK TO COPY</div>
				<wallet-qr></wallet-qr>
			</div>
		`;
	}
}
customElements.define('wallet-panel', WalletPanel);
