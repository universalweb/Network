import {
	hostSheet,
	loadSheet,
	resetSheet,
	scrollbarSheet,
} from '../componentLibrary/shared-styles.js';
import { WebComponent } from '../componentLibrary/base.js';
const navStyles = await loadSheet(new URL('../../styles/global-dock.css', import.meta.url));
const host = hostSheet(`
:host {
	display: flex;
	flex-direction: column;
	flex: 0 0 auto;
	width: 100%;
	position: relative;
	overflow: visible;
	background: var(--topbar-bg);
	border-radius: 10px;
}
::slotted([slot='account']) {
	display: block;
	flex: 0 0 auto;
	width: 100%;
}
`);
export class GlobalDock extends WebComponent {
	constructor() {
		super([
			resetSheet, host, navStyles, scrollbarSheet,
		], {
			tooltips: true,
		});
		this.state = {
			activeLabel: '',
			sections: [],
		};
		this.addEvent('handleRailClick', 'click', this.handleRailClick);
	}
	get activeLabel() {
		return this.state.activeLabel;
	}
	set activeLabel(value) {
		this.updateState({
			activeLabel: (value ?? this.state.activeLabel ?? '').toLowerCase(),
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
		const sections = this.STATE?.sections ?? [];
		const active = sections
			.flatMap((s) => {
				return s.items ?? [];
			})
			.find((i) => {
				return i.kind === 'item' && i.active;
			});
		if (active?.label) {
			this.activeLabel = active.label;
		}
	}
	handleRailClick(e) {
		const btn = e.target.closest('.rail-icon-btn');
		if (!btn) {
			return;
		}
		const label = (btn.dataset.label ?? '').toLowerCase();
		this.updateState({
			activeLabel: label,
		});
		this.emit('nav-select', {
			label,
		});
	}
	render() {
		this.html `
			<slot name="account"></slot>
			<div class="nav-rail">
				${() => {
					const railItems = this.state.sections.flatMap((s) => {
						return (s.items ?? []).filter((i) => {
							return i.kind === 'item';
						});
					});
					return railItems.map((item) => {
						const isActive = (item.label ?? '').toLowerCase() === (this.state.activeLabel ?? '').toLowerCase();
						return `<button class="rail-icon-btn${isActive ? ' active' : ''}" data-label="${item.label}" data-onclick="handleRailClick" title="${item.tooltip ?? item.label}" data-tooltip="${item.tooltip ?? item.label}">${item.icon ?? item.label.charAt(0).toUpperCase()}</button>`;
					}).join('');
				}}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
