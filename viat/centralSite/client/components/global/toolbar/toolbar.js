import '../bar/bar.js';
import { WebComponent } from 'webcomponent';
import { isCustomElementConstructor } from '../../core/template/list.js';
import { IconButtonBase } from '../icon-button/icon-button.js';
// `<ui-toolbar>` — an in-place action bar, dropped inside page content. Composes
// `<ui-bar>` and renders its `items` config as `renderItem` rows (default
// `<ui-icon-button>`) in the centre region. Maps to ARIA role="toolbar". Pure
// chrome — no app content baked in. Per-action `hidden` drops an action
// reactively.
export class UIToolbar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toolbar: './toolbar.css',
	};
	static state = {
		items: [],
		/*
		 * Component class each `items` row renders as. Same duality as
		 * ui-table's renderCell and ui-collection's renderRow — pass a custom
		 * element constructor.
		 *
		 * A toolbar is a bar of ACTIONS, not inherently an iconographic one.
		 * While ui-icon-button was hard-coded here, an app whose page chrome
		 * uses TEXT actions could not use the config path at all and rejected
		 * this component outright; the slot was the only escape, which gives up
		 * config entirely. Default stays ui-icon-button, so every existing
		 * caller is untouched.
		 */
		renderItem: null,
	};
	/**
	 * Row component for `items`, falling back to the icon-button default.
	 * @returns {Function} A custom element constructor.
	 */
	itemComponent() {
		if (isCustomElementConstructor(this.state.renderItem)) {
			return this.state.renderItem;
		}
		return IconButtonBase;
	}
	render() {
		this.html`
			<ui-bar class="toolbar" role="toolbar">
				<div slot="center" class="toolbar-actions">
					${this.filter('items', this.itemComponent(), 'hidden')}
				</div>
				<slot></slot>
			</ui-bar>
		`;
	}
}
customElements.define('ui-toolbar', UIToolbar);
