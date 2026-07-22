import '../bar/bar.js';
import { WebComponent } from 'webcomponent';
import { IconButtonBase } from '../icon-button/icon-button.js';
// `<ui-toolbar>` — an in-place action bar, dropped inside page content. Composes
// `<ui-bar>` and renders its `actions` config as `<ui-icon-button>`s in the
// centre region. Maps to ARIA role="toolbar". Pure chrome — no app content
// baked in. Per-action `hidden` drops an action reactively.
export class UIToolbar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toolbar: './toolbar.css',
	};
	static state = {
		items: [],
	};
	render() {
		this.html`
			<ui-bar class="toolbar" role="toolbar">
				<div slot="center" class="toolbar-actions">
					${this.filter('items', IconButtonBase, 'hidden')}
				</div>
				<slot></slot>
			</ui-bar>
		`;
	}
}
customElements.define('ui-toolbar', UIToolbar);
