/*
 * `<ui-ai-new-messages>` — sticky "N new messages" chip when the user has
 * scrolled up and newer turns arrived. Pure UI: shows when `.count` > 0.
 * Click emits `ai-new-messages:click` { count } (parent typically scrolls
 * to bottom and clears count). Drive with `.count`, `.label` template
 * (use `{n}` placeholder), `.active`.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAiNewMessages extends WebComponent {
	static url = import.meta.url;
	static styles = {
		newMessages: './ai-new-messages.css',
	};
	static state = {
		count: 0,
		label: '{n} new',
		active: true,
	};
	/* Never name this isVisible — base WebComponent owns isVisible as a lifecycle boolean. */
	get showChip() {
		return this.state.active && Number(this.state.count) > 0;
	}
	get displayLabel() {
		const count = Number(this.state.count) || 0;
		const template = this.state.label || '{n} new';
		return template.replace('{n}', String(count));
	}
	handleClick() {
		if (!this.showChip) {
			return;
		}
		this.emit('ai-new-messages:click', {
			count: Number(this.state.count) || 0,
		});
	}
	render() {
		this.html`
			<button type="button"
				class="ainm"
				?hidden=${!this.showChip}
				@click=${this.handleClick}>
				<ui-icon .state.name=${'arrow-down'} .state.size=${'xs'}></ui-icon>
				<span class="ainm-label">${this.displayLabel}</span>
			</button>
		`;
	}
}
customElements.define('ui-ai-new-messages', UIAiNewMessages);
