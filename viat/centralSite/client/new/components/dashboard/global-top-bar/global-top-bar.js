import '../../theme-select/theme-select.js';
import { TopBarIconButton } from './top-bar-icon-button.js';
import { WebComponent } from '../../base/base.js';
import { listBind } from '../../base/template.js';
const topBarStyles = await WebComponent.styleSheet('./global-top-bar.css', import.meta.url);
export class GlobalTopBar extends WebComponent {
	constructor() {
		super({
			styles: [topBarStyles],
			tooltips: true,
		});
		this.state = {
			items: [],
			subtitle: '',
		};
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
					${listBind('items', TopBarIconButton)}
				</div>
			</header>
		`;
	}
}
customElements.define('global-top-bar', GlobalTopBar);
