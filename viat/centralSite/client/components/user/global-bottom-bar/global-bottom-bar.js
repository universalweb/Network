import '../../global/status-bar/status-bar.js';
import { WebComponent } from 'webcomponent';
// `<global-bottom-bar>` — the Viat status strip. A thin composition over the
// built-in `<ui-status-bar>`: it supplies the three info cells through config
// and slots its API-health badge into the bar's `end` region. The badge view
// (tone / text / tooltip) is derived from `globalState.api` into reactive
// state keys by `syncBadge` — no per-render method fabricates it.
export class GlobalBottomBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalBottomBar: './global-bottom-bar.css',
	};
	static state = {
		statusBar: {
			cells: [
				{
					label: 'Client',
					value: 'Web',
				},
				{
					label: 'Network',
					value: 'MAINNET',
				},
				{
					label: 'Version',
					value: 'v1.0.0',
				},
			],
			dividers: true,
		},
		badgeTone: 'idle',
		badgeText: 'API Connecting…',
		badgeTooltip: 'Checking API health',
	};
	onConnect() {
		this.syncBadge();
		this.observeGlobal('api', () => {
			this.syncBadge();
		});
	}
	syncBadge() {
		const api = this.global.api ?? null;
		if (!api) {
			this.assignState({
				badgeTone: 'idle',
				badgeText: 'API Connecting…',
				badgeTooltip: 'Checking API health',
			});
			return;
		}
		if (api.ok) {
			const latency = typeof api.latencyMs === 'number' ? ` ${api.latencyMs}ms` : '';
			const version = api.version ? `v${api.version}` : 'online';
			this.assignState({
				badgeTone: api.status === 'warning' ? 'warn' : 'ok',
				badgeText: `API ${version}${latency}`,
				badgeTooltip: 'Web API Connected',
			});
			return;
		}
		this.assignState({
			badgeTone: 'bad',
			badgeText: 'API Offline',
			badgeTooltip: api.error || 'API unreachable',
		});
	}
	render() {
		this.html `
			<ui-status-bar .state=${this.state.statusBar}>
				<div slot="end" class="bb-badge" data-tone=${this.state.badgeTone} tooltip=${this.state.badgeTooltip}>
					<span class="bb-badge-dot"></span>
					<span class="bb-badge-text">${this.state.badgeText}</span>
				</div>
			</ui-status-bar>
		`;
	}
}
customElements.define('global-bottom-bar', GlobalBottomBar);
