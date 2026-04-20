import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const statsStyles = await loadSheet(new URL('../styles/stats.css', import.meta.url));
const host = hostSheet(`
:host {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}
`);
export class ViatNetworkStats extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			scrollbarSheet,
			statsStyles,
		]);
		this.state = {
			chainStatus: [],
			networkData: [],
		};
	}
	get networkData() {
		return this.state.networkData;
	}
	set networkData(data) {
		this.updateState({
			networkData: Array.isArray(data) ? data : [],
		});
	}
	get chainStatus() {
		return this.state.chainStatus;
	}
	set chainStatus(data) {
		this.updateState({
			chainStatus: Array.isArray(data) ? data : [],
		});
	}
	renderRows(rows) {
		return rows.map((r) => {
			if (r.rowType === 'latency-bar') {
				return `<div class="stat-latency-bar"><div class="stat-latency-fill" style="${r.style ?? ''}"></div></div>`;
			}
			return `
				<div class="stat-row">
					<span class="s-key">${r.key}</span>
					<span class="s-val ${r.className ?? ''}" ${r.style ? `style="${r.style}"` : ''}>${r.value}</span>
				</div>
			`;
		}).join('');
	}
	render() {
		const networkRows = this.renderRows(this.networkData);
		const chainRows = this.renderRows(this.chainStatus);
		this.shadowRoot.innerHTML = `
			<aside class="panel stats-panel">
				<div class="panel-header">
					<span><span class="ph-id">NET</span> // NODE STATUS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="stat-block">
					<div class="stat-block-title">NETWORK DATA</div>
					${networkRows}
				</div>
				<div class="stat-block">
					<div class="stat-block-title">CHAIN STATUS</div>
					${chainRows}
				</div>
			</aside>
		`;
	}
}
customElements.define('viat-network-stats', ViatNetworkStats);
