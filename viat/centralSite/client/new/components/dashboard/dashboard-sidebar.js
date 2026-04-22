import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./dashboard-sidebar.css', import.meta.url);
const TOGGLE_ID = 'sidebar-toggle';
const TOGGLE_ACTION = {
	icon: '&#xebf4;',
	id: TOGGLE_ID,
	title: 'sidebar',
};
export class DashboardSidebar extends WebComponent {
	constructor() {
		super([styles]);
		this.classList.add('sidebar-closed');
		this.shadowRoot.innerHTML = `<slot></slot>`;
	}
	onConnect() {
		[...this.querySelectorAll('slot')].forEach((s) => {
			const handler = () => {
				return this.syncContent();
			};
			s.addEventListener('slotchange', handler);
			this.effectUnsubs.add(() => {
				return s.removeEventListener('slotchange', handler);
			});
		});
		const root = this.getRootNode();
		const topbarHandler = (e) => {
			if (e.detail?.id === TOGGLE_ID) {
				this.toggle();
			}
		};
		root.addEventListener('topbar-action', topbarHandler);
		this.effectUnsubs.add(() => {
			return root.removeEventListener('topbar-action', topbarHandler);
		});
		this.setTimeout(() => {
			return this.syncContent();
		}, 0);
	}
	getTopBar() {
		const slot = this.getRootNode().querySelector('slot[name="global-top-bar"]');
		return slot?.assignedElements()[0] ?? null;
	}
	syncContent() {
		const hasContent = [...this.querySelectorAll('slot')].some((s) => {
			return s.assignedElements().length > 0;
		});
		const topBar = this.getTopBar();
		if (!topBar) {
			return;
		}
		const base = (topBar.STATE.actions ?? []).filter((a) => {
			return a.id !== TOGGLE_ID;
		});
		topBar.state.actions = hasContent ? [...base, TOGGLE_ACTION] : base;
	}
	toggle() {
		this.classList.toggle('sidebar-closed');
	}
}
customElements.define('dashboard-sidebar', DashboardSidebar);
