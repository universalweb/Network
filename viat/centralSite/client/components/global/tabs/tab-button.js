import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
// One tab in a <ui-tabs> strip. Lives as its own custom element so the
// parent can locate the active button via `findComponent` instead of
// reaching through shadow DOM with a `.querySelector`. The parent enriches
// each item with `active` + `orientation` on every render (see
// UITabs.itemsForList) so per-button state stays in sync via the framework's
// list-binding `assignState` path — no imperative pushes from outside.
export class UITabButton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tabButton: './tab-button.css',
	};
	static state = {
		id: '',
		label: '',
		icon: '',
		active: false,
		orientation: 'horizontal',
	};
	handleClick() {
		this.emit('tab-select', {
			id: this.state.id,
		});
	}
	focus() {
		this.refs.button?.focus();
	}
	render() {
		/* No is-active/has-icon classes: active styling keys off aria-selected,
		   the icon-only treatment off `:has(.tab-btn-icon)` (see tab-button.css).
		   orientation is a data-* attribute. Bare compounds throughout. */
		this.html `
			<button #button
				class="tab-btn"
				data-orientation=${this.state.orientation}
				type="button"
				role="tab"
				aria-selected=${this.state.active ? 'true' : 'false'}
				tabindex=${this.state.active ? '0' : '-1'}
				data-tab-id=${this.state.id}
				tooltip=${this.state.label}
				@click=${this.handleClick}>
				${this.state.icon ? this.htmlElement `<ui-icon class="tab-btn-icon" .name=${this.state.icon} .size=${'sm'}></ui-icon>` : ''}
				<span class="tab-btn-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-tab-button', UITabButton);
