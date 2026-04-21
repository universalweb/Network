import { WebComponent } from '../../base/base.js';
const navStyles = await WebComponent.styleSheet('./global-dock.css', import.meta.url);
export class GlobalDock extends WebComponent {
	constructor() {
		super([navStyles], {
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
		this.state.activeLabel = (value ?? this.state.activeLabel ?? '').toLowerCase();
	}
	get sections() {
		return this.state.sections;
	}
	set sections(value) {
		this.state.sections = Array.isArray(value) ? value : [];
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
		this.state.activeLabel = label;
		this.emit('nav-select', {
			label,
		});
	}
	render() {
		return this.html `
			<div class="nav-rail">
				${() => {
					const railItems = this.state.sections.flatMap((s) => {
						return (s.items ?? []).filter((i) => {
							return i.kind === 'item';
						});
					});
					return railItems.map((item) => {
						const isActive = (item.label ?? '').toLowerCase() === (this.state.activeLabel ?? '').toLowerCase();
						return `<button class="rail-icon-btn icon-font${isActive ? ' active' : ''}" data-label="${item.label}" data-onclick="handleRailClick" title="${item.tooltip ?? item.label}" data-tooltip="${item.tooltip ?? item.label}">${item.icon ?? item.label.charAt(0).toUpperCase()}</button>`;
					}).join('');
				}}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
