import { hostSheet, resetSheet, scrollbarSheet } from '../componentLibrary/shared-styles.js';
import { WebComponent } from '../componentLibrary/base.js';
const host = hostSheet(`
	:host {
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
		overflow-y: auto;
		transform: translateX(0);
		transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease;
		will-change: transform, opacity;
	}
	:host(.sidebar-closed) {
		transform: translateX(100%);
		opacity: 0;
		pointer-events: none;
	}
`);
const TOGGLE_ID = 'sidebar-toggle';
const TOGGLE_ACTION = {
	icon: '&#xebf4;',
	id: TOGGLE_ID,
	title: 'sidebar',
};
export class DashboardSidebar extends WebComponent {
	constructor() {
		super([
			resetSheet, host, scrollbarSheet,
		]);
		this.classList.add('sidebar-closed');
		this.shadowRoot.innerHTML = `<slot></slot>`;
	}
	onConnect() {
		[...this.querySelectorAll('slot')].forEach((s) => {
			const handler = () => this.syncContent();
			s.addEventListener('slotchange', handler);
			this.effectUnsubs.add(() => s.removeEventListener('slotchange', handler));
		});
		const root = this.getRootNode();
		const topbarHandler = (e) => {
			if (e.detail?.id === TOGGLE_ID) {
				this.toggle();
			}
		};
		root.addEventListener('topbar-action', topbarHandler);
		this.effectUnsubs.add(() => root.removeEventListener('topbar-action', topbarHandler));
		this.setTimeout(() => this.syncContent(), 0);
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
		const base = (topBar.STATE?.actions ?? []).filter((a) => {
			return a.id !== TOGGLE_ID;
		});
		topBar.state.actions = hasContent ? [...base, TOGGLE_ACTION] : base;
	}
	toggle() {
		this.classList.toggle('sidebar-closed');
	}
}
customElements.define('dashboard-sidebar', DashboardSidebar);
