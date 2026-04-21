import { SidebarPanel } from '../sidebar-panel/sidebar-panel.js';
import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./wallet-params.css', import.meta.url);
const statsStyles = await WebComponent.styleSheet('../../styles/stats.css', import.meta.url);
export class WalletParams extends SidebarPanel {
	constructor() {
		super([statsStyles, styles]);
		this.state = {
			params: [],
		};
	}
	get params() {
		return this.state.params;
	}
	set params(data) {
		this.state.params = Array.isArray(data) ? data : [];
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<aside class="panel wallet-params-panel">
				<div class="panel-header">
					<span><span class="ph-id">WALLET</span> // PARAMETERS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="stat-block">
					${() => {
						return this.state.params.map((p) => {
							return `
						<div class="stat-row">
							<span class="s-key">${p.key}</span>
							<span class="s-val ${p.className ?? ''}">${p.value}</span>
						</div>
					`;
						}).join('');
					}}
				</div>
			</aside>
		`;
	}
}
customElements.define('wallet-params', WalletParams);
