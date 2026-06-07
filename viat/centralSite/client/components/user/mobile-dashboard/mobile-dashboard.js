import '../dashboard/center-bar/center-bar.js';
import '../dashboard/wallet-panel/wallet-panel.js';
import '../dashboard/wallet-stats-panel/wallet-stats-panel.js';
import '../dashboard/wallet-amount/wallet-amount.js';
import '../dashboard/transmit-panel/transmit-panel.js';
import '../dashboard/activity-log/activity-log.js';
import '../dashboard/wallet-params/wallet-params.js';
import { WebComponent } from 'webcomponent';
// Mobile-only wallet view. Lives next to <app-dashboard> in the page slot;
// app.css picks which one is mounted via the viewport bucket on
// <app-view>. The render order intentionally diverges from desktop — the
// hero balance comes first and "bare" (no card chrome) so it reads as
// part of the page background, then the action-first stack (transmit
// → address → activity → stats → params) follows.
export class MobileDashboard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		mobileDashboard: './mobile-dashboard.css',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="md-shell" scroll-report>
				<wallet-amount class="bare"></wallet-amount>
				<transmit-panel></transmit-panel>
				<wallet-panel></wallet-panel>
				<center-bar></center-bar>
				<activity-log></activity-log>
				<wallet-stats-panel></wallet-stats-panel>
				<wallet-params></wallet-params>
			</div>
		`;
	}
}
customElements.define('mobile-dashboard', MobileDashboard);
