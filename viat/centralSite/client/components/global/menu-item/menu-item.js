import { WebComponent } from 'webcomponent';
/*
	ui-menu-item — one row of a <ui-menu> / <ui-context-menu> / <ui-menubar> /
	ui-split-button dropdown. Own CE so list() routes assignState; emits
	menu-item:select by name for ONE container listener on the parent.
	When `href` is set the control is a real <a> (⌘-click / middle-click / open
	in new tab work natively); otherwise a <button role="menuitem">.
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
		href: '',
		target: '',
	};
	focus() {
		this.refs.control?.focus();
	}
	handleClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		// Real link: still emit so parent can close the popover / log select;
		// let the browser handle navigation (no location.assign).
		this.emit('menu-item:select', {
			value: this.state.value,
			href: this.state.href || undefined,
		});
		if (this.state.href && this.state.href !== '#') {
			// Parent still closes the menu via selectIndex → hidePopover.
			return;
		}
		if (this.state.href === '#') {
			domEvent.preventDefault();
		}
	}
	render() {
		if (this.state.separator) {
			this.html`<div class="menu-sep" role="separator"></div>`;
			return;
		}
		const hasHref = Boolean(this.state.href);
		const role = this.state.checked === true ? 'menuitemcheckbox' : 'menuitem';
		if (hasHref) {
			this.html`
				<a #control
					class="menu-item"
					role=${role}
					href=${this.state.href}
					target=${this.state.target || undefined}
					rel=${this.state.target === '_blank' ? 'noopener noreferrer' : undefined}
					tabindex="-1"
					?data-danger=${this.state.danger}
					?data-checked=${this.state.checked}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					aria-checked=${this.state.checked ? 'true' : 'false'}
					@click=${this.handleClick}>
					<span class="menu-check" aria-hidden="true">${this.state.checked ? '✓' : ''}</span>
					<span class="menu-label">${this.state.label || this.state.value}</span>
					${() => {
						return this.state.kbd ? this.htmlElement`<span class="menu-kbd">${this.state.kbd}</span>` : '';
					}}
				</a>
			`;
			return;
		}
		this.html`
			<button #control
				type="button"
				class="menu-item"
				role=${role}
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
