import { SidebarPanel } from '../sidebar-panel/sidebar-panel.js';
import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./network-stats.css', import.meta.url);
const statsStyles = await WebComponent.styleSheet('../../styles/stats.css', import.meta.url);
export class NetworkStats extends SidebarPanel {
	constructor() {
		super([statsStyles, styles]);
		this.state = {
			chainStatus: [],
			networkData: [],
		};
	}
	get networkData() {
		return this.state.networkData;
	}
	set networkData(data) {
		this.state.networkData = Array.isArray(data) ? data : [];
	}
	get chainStatus() {
		return this.state.chainStatus;
	}
	set chainStatus(data) {
		this.state.chainStatus = Array.isArray(data) ? data : [];
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
		this.html `
			<aside class="panel stats-panel">
				<div class="panel-header">
					<span><span class="ph-id">NET</span> // NODE STATUS</span>
					<div class="ph-dot"></div>
				</div>
				<div class="stat-block">
					<div class="stat-block-title">NETWORK DATA</div>
					${() => {
						return this.renderRows(this.state.networkData);
					}}
				</div>
				<div class="stat-block">
					<div class="stat-block-title">CHAIN STATUS</div>
					${() => {
						return this.renderRows(this.state.chainStatus);
					}}
				</div>
			</aside>
		`;
	}
}
customElements.define('network-stats', NetworkStats);
