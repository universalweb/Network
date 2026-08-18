/*
 * `<ui-ai-model-select>` — model picker for an AI chat header. Thin shell over
 * `<ui-select>`: caller supplies `.items` ([{ value, label, disabled? }]) and
 * `.value`. Emits `ai-model-select:change` { value }. No network — parent
 * fills items from /models (or a static list). Blank-slate global primitive.
 */
import '../select/select.js';
import { WebComponent } from 'webcomponent';
export class UIAiModelSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		modelSelect: './ai-model-select.css',
	};
	static state = {
		label: 'Model',
		value: '',
		items: [],
		disabled: false,
	};
	handleChange(domEvent) {
		const next = domEvent.detail?.data?.value ?? '';
		this.state.value = next;
		this.emit('ai-model-select:change', {
			value: next,
		});
	}
	render() {
		this.html`
			<label class="aims">
				<span class="aims-label" ?hidden=${!this.state.label}>${this.state.label}</span>
				<ui-select
					.state.value=${this.state.value}
					.state.items=${this.state.items}
					.state.disabled=${this.state.disabled}
					@select:change=${this.handleChange}></ui-select>
			</label>
		`;
	}
}
customElements.define('ui-ai-model-select', UIAiModelSelect);
