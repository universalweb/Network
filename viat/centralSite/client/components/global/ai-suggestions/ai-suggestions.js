/*
 * `<ui-ai-suggestions>` — empty-state prompt starter chips for an AI chat.
 * Pure UI: chips render from `items` and emit `ai-suggestions:select`
 * { value, label, item } on activation. No transport. Drive with
 * `.items` ([{ id?, label, value?, icon? }] or bare strings) and optional
 * `.heading`. Disabled while `.disabled`.
 */
import '../icon/icon.js';
import { html, isString, WebComponent } from 'webcomponent';
function itemValue(item) {
	if (isString(item)) {
		return item;
	}
	return item.value ?? item.label ?? item.id ?? '';
}
function itemLabel(item) {
	if (isString(item)) {
		return item;
	}
	return item.label ?? item.value ?? item.id ?? '';
}
function itemIcon(item) {
	if (isString(item)) {
		return '';
	}
	return item.icon || '';
}
export class UIAiSuggestions extends WebComponent {
	static url = import.meta.url;
	static styles = {
		suggestions: './ai-suggestions.css',
	};
	static state = {
		heading: 'Try asking',
		items: [],
		disabled: false,
	};
	itemKey(item) {
		return itemValue(item);
	}
	renderItem(item) {
		const icon = itemIcon(item);
		return html`
			<button type="button" class="aisug-chip" data-value=${String(itemValue(item))} ?disabled=${this.state.disabled}>
				<ui-icon class="aisug-icon" ?hidden=${!icon} .state.name=${icon} .state.size=${'xs'}></ui-icon>
				<span class="aisug-label">${itemLabel(item)}</span>
			</button>
		`;
	}
	handleClick(domEvent) {
		if (this.state.disabled) {
			return;
		}
		// Light-row chips paint icons/labels with pointer-events:none so the
		// event target IS the button (same pattern as ui-ai-inquire).
		const value = domEvent.target?.dataset?.value;
		if (value === undefined) {
			return;
		}
		const list = this.state.items;
		let match = null;
		const count = list.length;
		for (let index = 0; index < count; index += 1) {
			if (String(itemValue(list[index])) === value) {
				match = list[index];
				break;
			}
		}
		this.emit('ai-suggestions:select', {
			value,
			label: match ? itemLabel(match) : value,
			item: match,
		});
	}
	render() {
		this.html`
			<section class="aisug" ?hidden=${this.state.items.length === 0}>
				<header class="aisug-head" ?hidden=${!this.state.heading}>
					<span class="aisug-title">${this.state.heading}</span>
				</header>
				<div class="aisug-list" @click=${this.handleClick}>
					${this.list('items', this.renderItem, this.itemKey)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-ai-suggestions', UIAiSuggestions);
