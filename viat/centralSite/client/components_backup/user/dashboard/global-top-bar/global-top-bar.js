import '../../../global/theme-select/theme-select.js';
import { TopBarIconButton } from './top-bar-icon-button.js';
import { WebComponent } from '../../../core/base.js';
import { list } from '../../../core/template.js';
export class GlobalTopBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalTopBar: './global-top-bar.css',
	};
	static state = {
		items: [],
		subtitle: '',
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<header class="global-top-bar">
				<div class="tb-logo">
					<span class="tb-logo-mark">⩝</span> VIAT <span class="tb-logo-sep icon-font hidden">&#xe795</span>
					<span class="tb-subtitle">${this.state.subtitle}</span>
				</div>
				<div class="tb-status">
					<ui-theme-select></ui-theme-select>
					${list('items', TopBarIconButton)}
				</div>
			</header>
		`;
	}
}
customElements.define('global-top-bar', GlobalTopBar);
