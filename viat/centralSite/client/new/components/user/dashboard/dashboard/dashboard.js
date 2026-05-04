import '../sidebar/dashboard-sidebar.js';
import { WebComponent } from '../../../core/base.js';
export class AppDashboard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		dashboard: './dashboard.css',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="dashboard">
				<global-top-bar></global-top-bar>
				<div class="body-row">
					<div class="dashboard-dock">
						<global-dock></global-dock>
					</div>
					<div class="dashboard-center">
						<div class="center-content">
							<center-bar></center-bar>
							<div class="center-columns">
								<wallet-panel></wallet-panel>
								<div class="center-stack">
									<wallet-amount></wallet-amount>
									<transmit-panel></transmit-panel>
									<activity-log></activity-log>
								</div>
								<wallet-params></wallet-params>
							</div>
						</div>
					</div>
					<dashboard-sidebar></dashboard-sidebar>
				</div>
				<global-bottom-bar></global-bottom-bar>
			</div>
		`;
	}
}
customElements.define('app-dashboard', AppDashboard);
