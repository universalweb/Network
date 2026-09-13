import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
/*
	ui-menu-item — one row of a <ui-menu> / <ui-context-menu> / <ui-menubar> /
	ui-split-button dropdown. Own CE so list() routes assignState; emits
	menu-item:select by name for ONE container listener on the parent.
	When `href` is set the control is a real <a> (⌘-click / middle-click / open
	in new tab work natively); otherwise a <button role="menuitem">.
	Trailing chrome (`kbd` shortcut or `endIcon`) sits on the right of the label.
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
		icon: '',
		activeIcon: '',
		endIcon: '',
		danger: false,
		checked: false,
		checkable: false,
		active: false,
		disabled: false,
		separator: false,
		href: '',
		target: '',
	};
	isSelected() {
		return this.state.checked === true || this.state.active === true;
	}
	leadIconName() {
		if (this.isSelected()) {
			if (this.state.activeIcon) {
				return this.state.activeIcon;
			}
			if (this.state.checkable === true || this.state.checked === true) {
				return 'check';
			}
		}
		return this.state.icon || '';
	}
	hideLeadIcon() {
		return !this.leadIconName();
	}
	hideKbd() {
		return !this.state.kbd;
	}
	hideEndIcon() {
		return !this.state.endIcon;
	}
	focus() {
		this.refs.control?.focus();
	}
	itemRole() {
		if (this.state.checkable === true || this.state.checked === true) {
			return 'menuitemcheckbox';
		}
		return 'menuitem';
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
			// Parent still closes via selectIndex → closeAfterSelect.
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
		if (this.state.href) {
			this.html`
				<a #control
					class="menu-item"
					role=${this.itemRole}
					href=${this.state.href}
					target=${this.state.target || undefined}
					rel=${this.state.target === '_blank' ? 'noopener noreferrer' : undefined}
					tabindex="-1"
					?data-danger=${this.state.danger}
					?data-checked=${this.state.checked}
					?data-active=${this.state.active}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					aria-checked=${this.state.checked ? 'true' : 'false'}
					@click=${this.handleClick}>
					<ui-icon class="menu-lead-icon" ?hidden=${this.hideLeadIcon} .state.name=${this.leadIconName} .state.size=${'sm'}></ui-icon>
					<span class="menu-label">${this.state.label || this.state.value}</span>
					<span class="menu-kbd" ?hidden=${this.hideKbd}>${this.state.kbd}</span>
					<ui-icon class="menu-end-icon" ?hidden=${this.hideEndIcon} .state.name=${this.state.endIcon} .state.size=${'sm'}></ui-icon>
				</a>
			`;
			return;
		}
		this.html`
			<button #control
				type="button"
				class="menu-item"
				role=${this.itemRole}
				tabindex="-1"
				?data-danger=${this.state.danger}
				?data-checked=${this.state.checked}
				?data-active=${this.state.active}
				?disabled=${this.state.disabled}
				aria-disabled=${this.state.disabled ? 'true' : 'false'}
				aria-checked=${this.state.checked ? 'true' : 'false'}
				@click=${this.handleClick}>
				<ui-icon class="menu-lead-icon" ?hidden=${this.hideLeadIcon} .state.name=${this.leadIconName} .state.size=${'sm'}></ui-icon>
				<span class="menu-label">${this.state.label || this.state.value}</span>
				<span class="menu-kbd" ?hidden=${this.hideKbd}>${this.state.kbd}</span>
				<ui-icon class="menu-end-icon" ?hidden=${this.hideEndIcon} .state.name=${this.state.endIcon} .state.size=${'sm'}></ui-icon>
			</button>
		`;
	}
}
customElements.define('ui-menu-item', UIMenuItem);
