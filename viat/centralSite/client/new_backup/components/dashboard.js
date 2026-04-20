import {
	hostSheet, loadSheet, resetSheet, scrollbarSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const layoutStyles = await loadSheet(new URL('../styles/layout.css', import.meta.url));
const host = hostSheet(`
:host {
	display: block;
	position: relative;
	min-width: 1360px;
	width: min(calc(100vw - 48px), calc(100vh * 1.618));
	height: calc(100vh - 48px);
	font-family: var(--font-mono);
	font-size: 0.75rem;
	line-height: 1.5;
	color: var(--text-main);
	user-select: none;
	-webkit-font-smoothing: antialiased;
}

::slotted([slot='account-panel']) {
	display: block;
	flex: 0 0 auto;
	min-height: 220px;
	width: 100%;
}

::slotted([slot='nav-menu']) {
	display: block;
	flex: 1 1 220px;
	min-height: 220px;
	height: 100%;
	width: 100%;
}
`);
export class ViatDashboard extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			scrollbarSheet,
			layoutStyles,
		]);
		this.shadowRoot.innerHTML = `
			<div class="dashboard">
				<slot name="top-bar"></slot>
				<div class="body-row">
					<div class="nav-col">
						<slot name="account-panel"></slot>
						<slot name="nav-menu"></slot>
					</div>
					<div class="center-col">
						<slot name="wallet-amount"></slot>
						<slot name="transmit-panel"></slot>
						<slot name="activity-log"></slot>
					</div>
					<div class="stats-col">
						<slot name="wallet-params"></slot>
						<slot name="network-stats"></slot>
					</div>
				</div>
				<slot name="bottom-bar"></slot>
			</div>
		`;
	}
}
customElements.define('viat-dashboard', ViatDashboard);
