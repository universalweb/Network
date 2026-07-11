import { html } from 'webcomponent';
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
				id: 'block',
				key: 'Block',
				value: '0',
			},
			{
				id: 'status',
				className: 'good',
				key: 'Status',
				value: 'In Sync',
			},
		],
		classes: new Set(['stats-panel']),
		panelId: 'NET',
		networkData: [
			{
				id: 'peers',
				className: 'good',
				key: 'Peers',
				value: '1 Active',
			},
			{
				id: 'network',
				key: 'Network',
				value: 'Viat Mainnet v1',
			},
			{
				id: 'latency',
				className: 'good',
				key: 'Latency',
				value: '—ms',
			},
			{
				id: 'latency-bar',
				rowType: 'latency-bar',
			},
			{
				id: 'connection',
				key: 'Connection',
				value: 'HTTPS',
			},
		],
		heading: 'NODE STATUS',
	};
	onConnect() {
		this.observeGlobal('api', this.syncLatency);
		this.syncLatency(this.global.api);
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
		const count = rows.length;
		for (let index = 0; index < count; index += 1) {
			if (rows[index].key === 'Latency') {
				rows[index].value = latency;
				rows[index].className = tone;
				return;
			}
		}
	}
	statRow(row) {
		if (row.rowType === 'latency-bar') {
			return html`<div class="stat-latency-bar"><div class="stat-latency-fill" style=${row.style || ''}></div></div>`;
		}
		const className = row.className ? `s-val ${row.className}` : 's-val';
		return html`<div class="stat-row">
			<span class="s-key">${row.key}</span>
			<span class=${className} style=${row.style || false}>${row.value}</span>
		</div>`;
	}
	statKey(row, index) {
		return row.id ?? row.key ?? index;
	}
	renderBody() {
		// htmlElement requires exactly one root — wrap the two blocks.
		return this.htmlElement`
			<div class="stat-body">
				<div class="stat-block">
					<div class="stat-block-title">NETWORK DATA</div>
					${this.list('networkData', this.statRow, this.statKey)}
				</div>
				<div class="stat-block">
					<div class="stat-block-title">CHAIN STATUS</div>
					${this.list('chainStatus', this.statRow, this.statKey)}
				</div>
			</div>
		`;
	}
}
customElements.define('network-stats', NetworkStats);
