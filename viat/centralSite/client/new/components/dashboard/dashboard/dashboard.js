import '../dashboard-sidebar.js';
import { WebComponent } from '../../base/base.js';
const layoutStyles = await WebComponent.styleSheet('./dashboard.css', import.meta.url);
export class AppDashboard extends WebComponent {
	static get observedAttributes() {
		return ['center-max-width'];
	}
	constructor() {
		super([layoutStyles]);
		this.shadowRoot.innerHTML = `
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
	onConnect() {
		this.syncCenterWidth();
	}
	onAttributeChange(name) {
		if (name === 'center-max-width') {
			this.syncCenterWidth();
		}
	}
	syncCenterWidth() {
		const val = this.getAttribute('center-max-width');
		const el = this.shadowRoot.querySelector('.center-content');
		if (!el) {
			return;
		}
		if (val) {
			el.style.setProperty('--center-max-width', val);
		} else {
			el.style.removeProperty('--center-max-width');
		}
	}
}
customElements.define('app-dashboard', AppDashboard);
