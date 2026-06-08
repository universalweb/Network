import './center-bar/center-bar.js';
import './wallet-panel/wallet-panel.js';
import './wallet-stats-panel/wallet-stats-panel.js';
import './wallet-amount/wallet-amount.js';
import './transmit-panel/transmit-panel.js';
import './activity-log/activity-log.js';
import './wallet-params/wallet-params.js';
import { WebComponent } from 'webcomponent';
const DASHBOARD_HOTKEYS = [
	{
		id: 'toggle',
		keys: ['~', '`'],
		joiner: '/',
		desc: 'Toggle Local Agent',
	},
	{
		id: 'sidebar',
		keys: ['\\', '|'],
		joiner: '/',
		desc: 'Toggle Sidebar',
	},
];
export class AppDashboard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		dashboard: './dashboard.css',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="dashboard-center">
				<div class="center-content">
					<center-bar></center-bar>
					<div class="center-columns">
						<div class="center-stack">
							<wallet-panel></wallet-panel>
							<wallet-stats-panel></wallet-stats-panel>
							<help-panel .shortcuts=${DASHBOARD_HOTKEYS}></help-panel>
						</div>
						<div class="center-stack">
							<wallet-amount></wallet-amount>
							<transmit-panel></transmit-panel>
							<activity-log></activity-log>
						</div>
						<wallet-params></wallet-params>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('app-dashboard', AppDashboard);
