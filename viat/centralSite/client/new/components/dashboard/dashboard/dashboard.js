import '../sidebar/dashboard-sidebar.js';
import { WebComponent } from '../../base/base.js';
export class AppDashboard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		dashboard: './dashboard.css',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="dashboard">
				<slot name="global-top-bar"></slot>
				<div class="body-row">
					<div class="dashboard-dock">
						<slot name="global-dock"></slot>
					</div>
					<div class="dashboard-center">
						<div class="center-content">
							<slot name="center-bar"></slot>
							<div class="center-columns">
								<div class="center-col">
									<slot name="wallet-panel"></slot>
								</div>
								<div class="center-col">
									<slot name="wallet-amount"></slot>
									<slot name="transmit-panel"></slot>
									<slot name="activity-log"></slot>
								</div>
								<div class="center-col">
									<slot name="wallet-params"></slot>
								</div>
							</div>
						</div>
					</div>
					<dashboard-sidebar>
						<slot name="network-stats"></slot>
					</dashboard-sidebar>
				</div>
				<slot name="global-bottom-bar"></slot>
			</div>
		`;
	}
}
customElements.define('app-dashboard', AppDashboard);
