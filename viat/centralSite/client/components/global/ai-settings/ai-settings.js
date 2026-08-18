/*
 * `<ui-ai-settings>` — generation knobs panel (temperature, max tokens,
 * system prompt). Pure UI form: edits local state and emits
 * `ai-settings:change` { temperature, maxTokens, systemPrompt } on each
 * committed change. No persistence or transport. Drive with those three
 * keys + optional `.heading`, `.open` (disclosure).
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAiSettings extends WebComponent {
	static url = import.meta.url;
	static styles = {
		settings: './ai-settings.css',
	};
	static state = {
		heading: 'Settings',
		// `expanded` avoids shadowing native <details>.open
		expanded: false,
		temperature: 0.7,
		maxTokens: 2048,
		systemPrompt: '',
		disabled: false,
	};
	handleToggle(domEvent) {
		const next = Boolean(domEvent.target.open);
		if (next === this.state.expanded) {
			return;
		}
		this.state.expanded = next;
	}
	handleTemperature(domEvent) {
		this.state.temperature = Number(domEvent.target.value);
		this.emitChange();
	}
	handleMaxTokens(domEvent) {
		this.state.maxTokens = Number(domEvent.target.value);
		this.emitChange();
	}
	handleSystemPrompt() {
		// $value already wrote systemPrompt; emit the bag.
		this.emitChange();
	}
	emitChange() {
		this.emit('ai-settings:change', {
			temperature: this.state.temperature,
			maxTokens: this.state.maxTokens,
			systemPrompt: this.state.systemPrompt,
		});
	}
	render() {
		this.html`
			<details class="aist" ?open=${this.state.expanded} @toggle=${this.handleToggle}>
				<summary class="aist-summary">
					<ui-icon .state.name=${'settings-2'} .state.size=${'sm'}></ui-icon>
					<span class="aist-title">${this.state.heading}</span>
					<ui-icon class="aist-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</summary>
				<div class="aist-body">
					<label class="aist-field">
						<span class="aist-field-label">Temperature <em>${this.state.temperature}</em></span>
						<input type="range"
							min="0"
							max="2"
							step="0.1"
							.value=${this.state.temperature}
							?disabled=${this.state.disabled}
							@input=${this.handleTemperature}>
					</label>
					<label class="aist-field">
						<span class="aist-field-label">Max tokens</span>
						<input type="number"
							min="1"
							max="128000"
							step="1"
							.value=${this.state.maxTokens}
							?disabled=${this.state.disabled}
							@change=${this.handleMaxTokens}>
					</label>
					<label class="aist-field">
						<span class="aist-field-label">System prompt</span>
						<textarea class="aist-prompt"
							rows="3"
							$value="systemPrompt"
							?disabled=${this.state.disabled}
							@change=${this.handleSystemPrompt}
							placeholder="Optional system instructions…"></textarea>
					</label>
				</div>
			</details>
		`;
	}
}
customElements.define('ui-ai-settings', UIAiSettings);
