import { Panel } from '../../../global/panel/panel.js';
export class NetworkStats extends Panel {
	static url = import.meta.url;
	static styles = {
		statPanel: '../../shared/stat-panel.css',
		networkStats: './network-stats.css',
	};
	static state = {
		chainStatus: [
			{
				key: 'Block',
				value: '0',
			},
			{
				className: 'good',
				key: 'Status',
				value: 'In Sync',
			},
		],
		classes: new Set(['stats-panel']),
		id: 'NET',
		networkData: [
			{
				className: 'good',
				key: 'Peers',
				value: '1 Active',
			},
			{
				key: 'Network',
				value: 'Viat Mainnet v1',
			},
			{
				className: 'good',
				key: 'Latency',
				value: '—ms',
			},
			{
				rowType: 'latency-bar',
			},
			{
				key: 'Connection',
				value: 'HTTPS',
			},
		],
		title: 'NODE STATUS',
	};
	onConnect() {
		this.observeGlobal('api', (api) => {
			return this.syncLatency(api);
		});
		this.syncLatency(this.globalState.api);
	}
	syncLatency(api) {
		const rows = this.state.networkData;
		if (!rows?.length) {
			return;
		}
		const latency = typeof api?.latencyMs === 'number' ? `${api.latencyMs}ms` : '—ms';
		let tone = 'warn';
		if (api?.ok) {
			tone = api.status === 'warning' ? 'warn' : 'good';
		} else if (api && api.ok === false) {
			tone = 'bad';
		}
		const next = rows.map((row) => {
			if (row.key !== 'Latency') {
				return row;
			}
			return {
				...row,
				value: latency,
				className: tone,
			};
		});
		this.assignState({
			networkData: next,
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
