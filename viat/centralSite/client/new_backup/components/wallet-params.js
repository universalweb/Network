import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const statsStyles = await loadSheet(new URL('../styles/stats.css', import.meta.url));
const host = hostSheet(`:host { display: block; }`);
export class ViatWalletParams extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			scrollbarSheet,
			statsStyles,
		]);
		this.state = {
			params: [],
		};
	}
	get params() {
		return this.state.params;
	}
	set params(data) {
		this.updateState({
			params: Array.isArray(data) ? data : [],
		});
	}
	render() {
		const { params } = this.state;
		this.shadowRoot.innerHTML = `
			<aside class="panel wallet-params-panel">
				<div class="panel-header">
					<span><span class="ph-id">WALLET</span> // PARAMETERS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="stat-block">
					${params.map((p) => {
						return `
							<div class="stat-row">
								<span class="s-key">${p.key}</span>
								<span class="s-val ${p.className ?? ''}">${p.value}</span>
							</div>
						`;
					}).join('')}
				</div>
			</aside>
		`;
	}
}
customElements.define('viat-wallet-params', ViatWalletParams);
