import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
// One tab in a <ui-tabs> strip. Lives as its own custom element so the parent
// can locate the active button via `findComponent` instead of reaching through
// shadow DOM with a `.querySelector`. The parent passes the raw tab item as-is
// (`list('items', UITabButton)`) and writes the shared `active` flag onto the
// bound item at event-time (UITabs.syncActiveFlags) — the list binding routes
// the change in via `assignState`. Orientation styling is inherited from a CSS
// custom property the strip sets, not a per-item prop.
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
	};
	handleClick() {
		this.emit('tab-button:select', {
			id: this.state.id,
		});
	}
	focus() {
		this.refs.button?.focus();
	}
	render() {
		/* No is-active/has-icon classes: active styling keys off aria-selected,
		   the icon-only treatment off `:has(.tab-btn-icon)` (see tab-button.css).
		   Orientation styling rides inherited CSS custom props from the strip. */
		this.html`
			<button #button
				class="tab-btn"
				type="button"
				role="tab"
				aria-selected=${this.state.active ? 'true' : 'false'}
				tabindex=${this.state.active ? '0' : '-1'}
				data-tab-id=${this.state.id}
				tooltip=${this.state.label}
				@click=${this.handleClick}>
				${this.state.icon ? this.htmlElement`<ui-icon class="tab-btn-icon" .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>` : ''}
				<span class="tab-btn-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-tab-button', UITabButton);
