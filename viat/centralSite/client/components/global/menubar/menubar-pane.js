/*
	DESCRIPTION: ui-menubar-pane — one sliding menu pane inside ui-menubar.
	Owns that menu's items via list(ui-menu-item). Slide/active are CSS-driven
	from flags the parent stamps (same PaneTrack mechanic as ui-nav-pane).
	REJECTED reusing ui-nav-pane — that pane's policy is nav-links + a default
	slot for rich views. Menu rows are ui-menu-item. Same slide mechanic,
	different contents; sharing the pane CE would fork its render.
	REJECTED rendering all menus through UIMenu.state.items — that swaps one
	list in place and cannot slide. Each menu stays mounted as a pane.
*/
import { WebComponent } from 'webcomponent';
import { applySlideFlags } from '../../core/dom/paneTrack.js';
import { UIMenuItem } from '../menu-item/menu-item.js';
export class UIMenubarPane extends WebComponent {
	static url = import.meta.url;
	static styles = {
		menubarPane: './menubar-pane.css',
	};
	static state = {
		label: '',
		items: [],
		menuIndex: 0,
		panelIndex: 0,
		active: false,
		slideOffset: 0,
	};
	onConnect() {
		this.classList.add('slide-pane');
	}
	onMount() {
		this.observe('active', this.reflectActive, {
			immediate: true,
		});
		this.observe('slideOffset', this.reflectOffset, {
			immediate: true,
		});
	}
	reflectActive(next) {
		applySlideFlags(this, next, this.state.slideOffset);
	}
	reflectOffset(next) {
		applySlideFlags(this, this.state.active, next);
	}
	render() {
		this.html`
			<div class="menubar-pane-inner" role="group" aria-label=${this.state.label || 'Menu'}>
				${this.list('items', UIMenuItem)}
			</div>
		`;
	}
}
customElements.define('ui-menubar-pane', UIMenubarPane);
