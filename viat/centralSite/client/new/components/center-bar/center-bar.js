import { CenterBarIconButton } from './center-bar-icon-button.js';
import { WebComponent } from '../base/base.js';
import { listBind } from '../base/template.js';
const styles = await WebComponent.styleSheet('./center-bar.css', import.meta.url);
export class CenterBar extends WebComponent {
	constructor() {
		super({
			styles: [styles],
			tooltips: true,
		});
		this.state = {
			actions: [],
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="center-bar">
				${listBind('actions', CenterBarIconButton)}
			</div>
		`;
	}
}
customElements.define('center-bar', CenterBar);
