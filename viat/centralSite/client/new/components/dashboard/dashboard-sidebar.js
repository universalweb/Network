import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./dashboard-sidebar.css', import.meta.url);
export class DashboardSidebar extends WebComponent {
	constructor() {
		super({
			styles: [styles],
		});
		this.classList.add('sidebar-closed');
		this.state = {
			open: false,
		};
	}
	onConnect() {
		this.addEffect('open', (_component, isOpen) => {
			this.classList.toggle('sidebar-closed', !isOpen);
		});
		const root = this.getRootNode();
		const sidebarHandler = () => {
			this.toggle();
		};
		root.addEventListener('open-dashboard-sidebar', sidebarHandler);
		this.effectUnsubs.add(() => {
			return root.removeEventListener('open-dashboard-sidebar', sidebarHandler);
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
