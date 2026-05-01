import { CenterBarIconButton } from './center-bar-icon-button.js';
import { WebComponent } from '../../base/base.js';
import { list } from '../../base/template.js';
export class CenterBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		centerBar: './center-bar.css',
	};
	static state = {
		actions: [],
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
			<div class="center-bar">
				${list('actions', CenterBarIconButton)}
			</div>
		`;
	}
}
customElements.define('center-bar', CenterBar);
