/*
	ui-command-item — one row of a <ui-command> palette. Same field shape as
	ui-menu-item (label/value/kbd/disabled/separator) plus group/icon/active.
	Own CE so UICollection's list() routes assignState. role="option" (a palette
	is a listbox, not a menu). Emits command-item:select { value }.
*/
import '../icon/icon.js';
import '../kbd/kbd.js';
import { WebComponent } from '../../core/index.js';
/**
 * Stable option id for aria-activedescendant. Host id, not a state key —
 * HTMLElement.id already exists.
 * @param {{id?: *, value?: *, label?: *}} item - Command item or row state.
 * @returns {string} Token-safe element id.
 */
export function optionIdFor(item) {
	const raw = item?.value ?? item?.label ?? '';
	return `cmd-opt-${String(raw).replace(/[^\w-]+/g, '-')}`;
}
/**
 * Normalize a menu-style `kbd` string (or token array) into ui-kbd `values`.
 * @param {string|string[]} kbd - Shortcut hint.
 * @returns {string[]} Key tokens.
 */
export function kbdValues(kbd) {
	if (Array.isArray(kbd)) {
		return kbd;
	}
	if (typeof kbd !== 'string' || kbd === '') {
		return [];
	}
	if (kbd.includes('+') || (/\s/).test(kbd)) {
		const parts = kbd.split(/[+\s]+/);
		const tokens = [];
		const partCount = parts.length;
		for (let index = 0; index < partCount; index += 1) {
			if (parts[index]) {
				tokens.push(parts[index]);
			}
		}
		return tokens;
	}
	return [kbd];
}
export class UICommandItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		commandItem: './command-item.css',
	};
	static state = {
		label: '',
		value: '',
		kbd: '',
		kbdTokens: [],
		group: '',
		icon: '',
		disabled: false,
		separator: false,
		active: false,
		groupStart: false,
	};
	onConnect() {
		this.observe('kbd', this.syncKbdTokens);
		this.observe([
			'group',
			'groupStart',
			'active',
			'disabled',
			'separator',
			'value',
			'label',
		], this.reflectHost);
		this.syncKbdTokens();
		this.reflectHost();
	}
	syncKbdTokens() {
		this.state.kbdTokens = kbdValues(this.state.kbd);
	}
	/* Host carries the option id / role / selected so the listbox and the
	   option share one tree (the collection shadow) for aria-activedescendant. */
	reflectHost() {
		if (this.state.separator) {
			this.removeAttribute('id');
			this.setAttribute('role', 'separator');
			this.removeAttribute('aria-selected');
			this.removeAttribute('aria-disabled');
			this.removeAttribute('data-group');
			this.removeAttribute('data-group-start');
			return;
		}
		this.id = optionIdFor(this.state);
		this.setAttribute('role', 'option');
		this.setAttribute('aria-selected', this.state.active ? 'true' : 'false');
		this.setAttribute('aria-disabled', this.state.disabled ? 'true' : 'false');
		const group = this.state.group || '';
		if (group) {
			this.dataset.group = group;
		} else {
			this.removeAttribute('data-group');
		}
		if (this.state.groupStart) {
			this.dataset.groupStart = '';
		} else {
			this.removeAttribute('data-group-start');
		}
	}
	iconHidden() {
		return !this.state.icon;
	}
	kbdHidden() {
		return !this.state.kbd || (Array.isArray(this.state.kbd) && this.state.kbd.length === 0);
	}
	handleClick(domEvent) {
		if (this.state.disabled || this.state.separator) {
			domEvent.preventDefault();
			return;
		}
		this.emit('command-item:select', {
			value: this.state.value,
		});
	}
	render() {
		if (this.state.separator) {
			this.html`<div class="cmd-sep" role="separator"></div>`;
			return;
		}
		this.html`
			<div
				class="cmd-option"
				tabindex="-1"
				?data-active=${this.state.active}
				?data-disabled=${this.state.disabled}
				@click=${this.handleClick}>
				<ui-icon class="cmd-icon" ?hidden=${this.iconHidden} .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
				<span class="cmd-label">${this.state.label || this.state.value}</span>
				<ui-kbd class="cmd-kbd" ?hidden=${this.kbdHidden} .state.values=${this.state.kbdTokens}></ui-kbd>
			</div>
		`;
	}
}
customElements.define('ui-command-item', UICommandItem);
