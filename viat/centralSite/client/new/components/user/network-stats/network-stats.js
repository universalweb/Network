import { Panel } from '../../global/panel/panel.js';
export class NetworkStats extends Panel {
	static url = import.meta.url;
	static styles = {
		stats: '../../../styles/stats.css',
		networkStats: './network-stats.css',
	};
	static state = {
		chainStatus: [],
		className: ['stats-panel'],
		id: 'NET',
		networkData: [],
		title: 'NODE STATUS',
	};
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
	renderBody() {
		return `
			<div class="stat-block">
				<div class="stat-block-title">NETWORK DATA</div>
				${this.renderRows(this.state.networkData)}
			</div>
			<div class="stat-block">
				<div class="stat-block-title">CHAIN STATUS</div>
				${this.renderRows(this.state.chainStatus)}
			</div>
		`;
	}
}
customElements.define('network-stats', NetworkStats);
