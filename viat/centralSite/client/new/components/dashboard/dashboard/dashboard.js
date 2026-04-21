import './dashboard-sidebar.js';
import {
	hostSheet, loadSheet, resetSheet, scrollbarSheet,
} from '../componentLibrary/shared-styles.js';
import { WebComponent } from '../componentLibrary/base.js';
const layoutStyles = await loadSheet(new URL('../../styles/layout.css', import.meta.url));
const host = hostSheet(`
	:host {
		display: block;
		position: relative;
		width: 100%;
		height: 100%;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--text-main);
		user-select: none;
		-webkit-font-smoothing: antialiased;
	}

	::slotted([slot='global-top-bar']) {
		display: block;
		height: 40px;
		margin: 8px 10px 0;
		width: calc(100% - 20px);
	}

	::slotted([slot='global-dock']) {
		display: block;
		flex: 0 0 auto;
		width: 100%;
	}
`);
export class AppDashboard extends WebComponent {
	static get observedAttributes() {
		return ['center-max-width'];
	}
	constructor() {
		super([
			resetSheet,
			host,
			scrollbarSheet,
			layoutStyles,
		]);
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
