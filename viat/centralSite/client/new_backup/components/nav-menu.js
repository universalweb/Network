import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const navStyles = await loadSheet(new URL('../styles/nav.css', import.meta.url));
const host = hostSheet(`
:host {
	display: flex;
	flex-direction: column;
	flex: 1 0 220px;
	height: 100%;
	min-height: 220px;
}
`);
export class ViatNavMenu extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			scrollbarSheet,
			navStyles,
		]);
		this.state = {
			activeLabel: '',
			sections: [],
		};
		this.addEvent('handleNavClick', 'click', this.handleClick);
	}
	get activeLabel() {
		return this.state.activeLabel;
	}
	set activeLabel(value) {
		this.updateState({
			activeLabel: value ?? this.state.activeLabel,
		});
	}
	get sections() {
		return this.state.sections;
	}
	set sections(value) {
		this.updateState({
			sections: Array.isArray(value) ? value : [],
		});
	}
	onConnect() {
		this.syncDefaultActiveLabel();
	}
	syncDefaultActiveLabel() {
		const activeItem = this.sections.flatMap((section) => {
			return section.items ?? [];
		}).find((item) => {
			return item.kind === 'item' && item.active;
		});
		if (activeItem?.label) {
			this.activeLabel = activeItem.label;
		}
	}
	handleClick(e) {
		const item = e.target.closest('.nav-item, .nav-sub-item');
		if (!item) {
			return;
		}
		if (item.classList.contains('nav-item')) {
			this.activeLabel = item.dataset.label || item.textContent.trim();
		}
		this.emit('nav-select', {
			label: item.dataset.label || item.textContent.trim(),
		});
	}
	// Removed from nav-section <div class="nav-section-label">${section.label}</div>
	renderSection(section) {
		return `
			<div class="nav-section">
				${(section.items ?? []).map((item) => {
					const kind = item.kind === 'sub-item' ? 'nav-sub-item' : 'nav-item';
					const isActive = kind === 'nav-item' && item.label === this.activeLabel;
					const bullet = kind === 'nav-item' ? '\u25A0 ' : '';
					return `<div class="${kind}${isActive ? ' active' : ''}" data-label="${item.label}" data-onclick="handleNavClick">${bullet}${item.label}</div>`;
				}).join('')}
			</div>
		`;
	}
	render() {
		this.shadowRoot.innerHTML = `
			<nav class="panel nav-menu-panel">
				<div class="panel-header">
					<span><span class="ph-id">NAV</span> // MENU</span>
					<div class="ph-dot"></div>
				</div>
				${this.sections.map((section) => {
					return this.renderSection(section);
				}).join('')}
				<div class="nav-bottom"></div>
			</nav>
		`;
	}
}
customElements.define('viat-nav-menu', ViatNavMenu);
