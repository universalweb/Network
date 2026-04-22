import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./sidebar-panel.css', import.meta.url);
export class SidebarPanel extends WebComponent {
	constructor(config = {}) {
		WebComponent.assertConfig(config);
		if (config.styles !== undefined && !Array.isArray(config.styles)) {
			throw new TypeError('SidebarPanel config.styles must be an array of CSSStyleSheet instances.');
		}
		super({
			...config,
			styles: config.styles === undefined ? [styles] : [styles, ...config.styles],
		});
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
