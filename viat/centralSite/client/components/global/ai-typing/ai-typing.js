/*
 * `<ui-ai-typing>` — "agent is thinking" indicator shown while waiting for the
 * first streamed token (distinct from live token text). Pure display. Drive
 * with `.label`, `.active` (when false the host hides), optional `.author`.
 * Emits nothing.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAiTyping extends WebComponent {
	static url = import.meta.url;
	static styles = {
		typing: './ai-typing.css',
	};
	static state = {
		label: 'Thinking…',
		author: 'AI',
		active: true,
	};
	render() {
		this.html`
			<div class="ai-typing" ?hidden=${!this.state.active} role="status" aria-live="polite">
				<span class="ai-typing-author">${this.state.author}</span>
				<span class="ai-typing-dots" aria-hidden="true">
					<span class="ai-typing-dot"></span>
					<span class="ai-typing-dot"></span>
					<span class="ai-typing-dot"></span>
				</span>
				<span class="ai-typing-label">${this.state.label}</span>
			</div>
		`;
	}
}
customElements.define('ui-ai-typing', UIAiTyping);
