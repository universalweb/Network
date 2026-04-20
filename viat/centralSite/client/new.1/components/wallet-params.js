import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const statsStyles = await loadSheet(new URL('../styles/stats.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; width: 100%; }`);
export class WalletParams extends WebComponent {
	constructor() {
		super([resetSheet, host, panelSheet, scrollbarSheet, statsStyles]);
		this.state = { params: [] };
	}
	get params() {
		return this.state.params;
	}
	set params(data) {
		this.updateState({ params: Array.isArray(data) ? data : [] });
	}
	render() {
		this.html`
			<aside class="panel wallet-params-panel">
				<div class="panel-header">
					<span><span class="ph-id">WALLET</span> // PARAMETERS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="stat-block">
					${() => this.state.params.map((p) => `
						<div class="stat-row">
							<span class="s-key">${p.key}</span>
							<span class="s-val ${p.className ?? ''}">${p.value}</span>
						</div>
					`).join('')}
				</div>
			</aside>
		`;
	}
}
customElements.define('wallet-params', WalletParams);
