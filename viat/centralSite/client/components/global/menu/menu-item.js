import { WebComponent } from 'webcomponent';
/*
	ui-menu-item — one row of a <ui-menu> / <ui-context-menu> / <ui-menubar> dropdown.
	Its own custom element (per the tabs/list() pattern) so the list keyed-diff routes
	each item straight into a child via assignState — no `^html` string, so the label /
	kbd are auto-escaped textContent (the old manual escapeHtml is gone). The row emits
	`menu-item:select` BY NAME; the parent catches it with ONE container listener and
	owns hidePopover + the public `menu:select`. Roving focus is driven by the parent
	calling this row's `focus()` (button stays tabindex=-1 — roved, never tab-stopped).
*/
export class UIMenuItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		menuItem: './menu-item.css',
	};
	static state = {
		label: '',
		value: '',
		kbd: '',
		danger: false,
		checked: false,
		disabled: false,
		separator: false,
	};
	focus() {
		this.refs.button?.focus();
	}
	handleClick() {
		if (this.state.disabled) {
			return;
		}
		// Emit only the value — the parent resolves item + index from its own state.items
		// (never ship the whole child state as the payload).
		this.emit('menu-item:select', {
			value: this.state.value,
		});
	}
	render() {
		if (this.state.separator) {
			this.html`<div class="menu-sep" role="separator"></div>`;
			return;
		}
		this.html`
			<button #button
				type="button"
				class="menu-item"
				role=${this.state.checked === true ? 'menuitemcheckbox' : 'menuitem'}
				tabindex="-1"
				?data-danger=${this.state.danger}
				?data-checked=${this.state.checked}
				?disabled=${this.state.disabled}
				aria-disabled=${this.state.disabled ? 'true' : 'false'}
				aria-checked=${this.state.checked ? 'true' : 'false'}
				@click=${this.handleClick}>
				<span class="menu-check" aria-hidden="true">${this.state.checked ? '✓' : ''}</span>
				<span class="menu-label">${this.state.label || this.state.value}</span>
				${() => {
					return this.state.kbd ? this.htmlElement`<span class="menu-kbd">${this.state.kbd}</span>` : '';
				}}
			</button>
		`;
	}
}
customElements.define('ui-menu-item', UIMenuItem);
