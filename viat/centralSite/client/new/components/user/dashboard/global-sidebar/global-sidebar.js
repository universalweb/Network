import { WebComponent } from '../../../core/index.js';
export class GlobalSidebar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalSidebar: './global-sidebar.css',
	};
	static attrs = {
		open: false,
		inert: true,
	};
	get mode() {
		const v = this.globalState.environment?.viewport;
		if (!v) {
			return 'docked';
		}
		if (v.w === 'xs' || v.w === 'sm' || v.h === 'short') {
			return 'overlay';
		}
		if (v.w === 'md') {
			return 'floating';
		}
		return 'docked';
	}
	get hostClasses() {
		return `sidebar mode-${this.mode}`;
	}
	toggle() {
		const next = !this.attrs.open;
		this.attrs.open = next;
		this.attrs.inert = !next;
	}
	close() {
		this.attrs.open = false;
		this.attrs.inert = true;
	}
	onMount() {
		this.classList.value = this.hostClasses;
		this.delegate('viewport:change', this.handleViewportChange);
		this.delegate('toggle-sidebar', this.handleToggleEvent);
	}
	handleToggleEvent = () => {
		this.toggle();
	};
	handleViewportChange = () => {
		this.classList.value = this.hostClasses;
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="sidebar-backdrop" @click=${this.close}></div>
			<aside class="sidebar-shell">
				<network-stats></network-stats>
			</aside>
		`;
	}
}
customElements.define('global-sidebar', GlobalSidebar);
