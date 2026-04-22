import './dock-icon-button.js';
import { WebComponent } from '../../base/base.js';
import { each } from '../../base/template.js';
const navStyles = await WebComponent.styleSheet('./global-dock.css', import.meta.url);
function createRailButton(item) {
	const button = document.createElement('dock-icon-button');
	button.state = item;
	return button;
}
export class GlobalDock extends WebComponent {
	constructor() {
		super([navStyles], {
			tooltips: true,
		});
		this.handleNavSelect = this.handleNavSelect.bind(this);
		this.state = {
			activeLabel: '',
			sections: [],
		};
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
		this.addEventListener('nav-select', this.handleNavSelect);
		this.syncDefaultActiveLabel();
	}
	onDisconnect() {
		this.removeEventListener('nav-select', this.handleNavSelect);
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
	buildRailItem(item, index) {
		const label = item?.label ?? '';
		return {
			active: label.toLowerCase() === (this.state.activeLabel ?? '').toLowerCase(),
			icon: item?.icon ?? label.charAt(0).toUpperCase(),
			key: item?.id ?? label ?? index,
			label,
			title: item?.tooltip ?? label,
		};
	}
	buildRailList() {
		const railItems = this.state.sections.flatMap((section) => {
			return (section.items ?? []).filter((item) => {
				return item.kind === 'item';
			});
		});
		const renderedItems = railItems.map((item, index) => {
			return this.buildRailItem(item, index);
		});
		return each(renderedItems, createRailButton, (item, index) => {
			return item.key ?? index;
		});
	}
	handleNavSelect(domEvent) {
		const label = (domEvent.detail?.label ?? '').toLowerCase();
		if (!label) {
			return;
		}
		this.state.activeLabel = label;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="nav-rail">
				${() => {
					return this.buildRailList();
				}}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
