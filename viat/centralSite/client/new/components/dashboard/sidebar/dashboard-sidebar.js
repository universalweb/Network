import { WebComponent } from '../../base/base.js';
export class DashboardSidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		dashboardSidebar: './dashboard-sidebar.css',
	};
	static state = {
		open: false,
	};
	constructor(state = {}, config = {}) {
		super(state, config);
	}
	onConnect() {
		this.observe('open', (isOpen) => {
			this.classList.toggle('sidebar-closed', !isOpen);
			this.setInert(!isOpen);
		});
	}
	toggle() {
		this.state.open = !this.state.open;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="sidebar-shell">
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('dashboard-sidebar', DashboardSidebar);
