import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./sidebar-panel.css', import.meta.url);
export class SidebarPanel extends WebComponent {
	constructor(sheets = [], opts = {}) {
		super([styles, ...sheets], opts);
	}
	renderPanelHeader(label = '', title = '') {
		return this.html `
			<div class="panel-header">
				<span><span class="ph-id">${label}</span> // ${title}</span>
				<div class="ph-dot"></div>
			</div>
		`;
	}
}
