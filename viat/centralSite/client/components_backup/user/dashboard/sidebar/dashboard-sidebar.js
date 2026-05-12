import { WebComponent } from '../../../core/base.js';
export class DashboardSidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		dashboardSidebar: './dashboard-sidebar.css',
	};
	static attrs = {
		open: false,
		inert: true,
	};
	toggle() {
		const next = !this.attrs.open;
		this.attrs.open = next;
		this.attrs.inert = !next;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="sidebar-shell">
				<network-stats></network-stats>
			</div>
		`;
	}
}
customElements.define('dashboard-sidebar', DashboardSidebar);
