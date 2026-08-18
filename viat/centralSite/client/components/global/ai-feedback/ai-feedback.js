/*
 * `<ui-ai-feedback>` — thumbs-up / thumbs-down rating for one assistant turn.
 * First pick wins (locks); re-pick of the same value is a no-op. Emits
 * `ai-feedback:rate` { value: 'up' | 'down', messageId }. Drive with
 * `.messageId`, optional `.value` ('' | 'up' | 'down'), `.disabled`.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAiFeedback extends WebComponent {
	static url = import.meta.url;
	static styles = {
		feedback: './ai-feedback.css',
	};
	static state = {
		messageId: '',
		// '' | 'up' | 'down'
		value: '',
		disabled: false,
	};
	handleUp() {
		this.rate('up');
	}
	handleDown() {
		this.rate('down');
	}
	rate(next) {
		if (this.state.disabled || this.state.value) {
			return;
		}
		this.state.value = next;
		this.emit('ai-feedback:rate', {
			value: next,
			messageId: this.state.messageId,
		});
	}
	render() {
		this.html`
			<div class="aifb" data-value=${this.state.value || 'none'} role="group" aria-label="Rate response">
				<button type="button"
					class="aifb-btn"
					data-action="up"
					?data-active=${this.state.value === 'up'}
					?disabled=${this.state.disabled || Boolean(this.state.value)}
					tooltip="Helpful"
					@click=${this.handleUp}>
					<ui-icon .state.name=${'thumbs-up'} .state.size=${'xs'}></ui-icon>
				</button>
				<button type="button"
					class="aifb-btn"
					data-action="down"
					?data-active=${this.state.value === 'down'}
					?disabled=${this.state.disabled || Boolean(this.state.value)}
					tooltip="Not helpful"
					@click=${this.handleDown}>
					<ui-icon .state.name=${'thumbs-down'} .state.size=${'xs'}></ui-icon>
				</button>
			</div>
		`;
	}
}
customElements.define('ui-ai-feedback', UIAiFeedback);
