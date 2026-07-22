/*
 * `<ui-ai-reasoning>` — a collapsible "thinking" disclosure for an agent's
 * chain-of-thought, built on native <details>/<summary> (platform disclosure +
 * a11y + keyboard for free, the accordion idiom). Collapsed by default; the
 * body is the model's reasoning as escaped, whitespace-preserving plain text
 * (no markup ever reaches the DOM as html — reasoning is prose, not a render
 * target). While `streaming` the brain glyph pulses and the label reads
 * "Thinking…". Drive it with `.text`, optional `.label`, `.expanded`,
 * `.streaming`. Emits `ai-reasoning:toggle` { open }.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAiReasoning extends WebComponent {
	static url = import.meta.url;
	static styles = {
		reasoning: './ai-reasoning.css',
	};
	static state = {
		text: '',
		label: 'Reasoning',
		// `expanded` (not `open`) avoids shadowing the native <details> property.
		expanded: false,
		streaming: false,
	};
	get summaryText() {
		if (this.state.streaming) {
			return 'Thinking…';
		}
		return this.state.label || 'Reasoning';
	}
	handleToggle(domEvent) {
		// Mirror the native open state back, echo-guarded so the reflected
		// ?open write doesn't re-enter.
		const next = Boolean(domEvent.target.open);
		if (next === this.state.expanded) {
			return;
		}
		this.state.expanded = next;
		this.emit('ai-reasoning:toggle', {
			open: next,
		});
	}
	render() {
		this.html`
			<details class="air" ?open=${this.state.expanded} ?data-streaming=${this.state.streaming} @toggle=${this.handleToggle}>
				<summary class="air-summary">
					<ui-icon class="air-brain" .state.name=${'brain'} .state.size=${'sm'}></ui-icon>
					<span class="air-label">${this.summaryText}</span>
					<ui-icon class="air-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</summary>
				<div class="air-body">${this.state.text}</div>
			</details>
		`;
	}
}
customElements.define('ui-ai-reasoning', UIAiReasoning);
