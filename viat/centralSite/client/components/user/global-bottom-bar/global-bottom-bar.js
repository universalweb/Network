import { WebComponent } from '../../core/index.js';
export class GlobalBottomBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalBottomBar: './global-bottom-bar.css',
	};
	static state = {
		columns: [],
	};
	apiStatus() {
		const api = this.globalState.api ?? null;
		if (!api) {
			return {
				label: 'Connecting…',
				tone: 'idle',
				title: 'Checking API health',
			};
		}
		if (api.ok) {
			const latency = typeof api.latencyMs === 'number' ? ` ${api.latencyMs}ms` : '';
			const version = api.version ? `v${api.version}` : 'online';
			return {
				label: `${version}${latency}`,
				tone: api.status === 'warning' ? 'warn' : 'ok',
				title: 'Web API Connected',
			};
		}
		return {
			label: 'Offline',
			tone: 'bad',
			title: api.error || 'API unreachable',
		};
	}
	badgeClass() {
		return `bb-badge tone-${this.apiStatus().tone}`;
	}
	badgeTooltip() {
		return this.apiStatus().title;
	}
	badgeText() {
		return `API ${this.apiStatus().label}`;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<footer class="global-bottom-bar">
				<div class="bb-columns">
					${() => {
						return this.state.columns.map((item) => {
							return `
								<div class="bb-item">
									<span class="bb-key">${item.label}</span>
									<span class="bb-val${item.className ? ` ${item.className}` : ''}">${item.value}</span>
								</div>
							`;
						}).join('');
					}}
				</div>
				<div class="bb-spacer"></div>
				<div class=${this.badgeClass} tooltip=${this.badgeTooltip}>
					<span class="bb-badge-dot"></span>
					<span class="bb-badge-text">${this.badgeText}</span>
				</div>
			</footer>
		`;
	}
}
customElements.define('global-bottom-bar', GlobalBottomBar);
