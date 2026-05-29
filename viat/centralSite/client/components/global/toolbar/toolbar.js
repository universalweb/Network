import { WebComponent, each } from 'webcomponent';
import '../bar/bar.js';
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
		actions: [],
	};
	actionItems() {
		// Genuine computation feeding each(): drop the hidden actions.
		const actions = this.state.actions || [];
		const out = [];
		for (let index = 0; index < actions.length; index += 1) {
			if (actions[index].hidden) {
				continue;
			}
			out.push(actions[index]);
		}
		return out;
	}
	actionKey(item) {
		return item.id;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<ui-bar class="toolbar" role="toolbar">
				<div slot="center" class="toolbar-actions">
					${each(this.actionItems(), IconButtonBase, this.actionKey)}
				</div>
				<slot></slot>
			</ui-bar>
		`;
	}
}
customElements.define('ui-toolbar', UIToolbar);
