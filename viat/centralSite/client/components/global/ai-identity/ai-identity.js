/*
 * `<ui-ai-identity>` — author chip for a chat message: avatar + display label.
 * Composes `<ui-avatar>`. Pure display. Drive with `.author` (user | assistant
 * | system | custom), optional `.label`, `.src`, `.size`. When `.label` is
 * empty, derives YOU / AI / SYSTEM from `.author`.
 */
import '../avatar/avatar.js';
import { WebComponent } from 'webcomponent';
function labelFor(author) {
	if (author === 'user') {
		return 'YOU';
	}
	if (author === 'assistant') {
		return 'AI';
	}
	if (author === 'system') {
		return 'SYSTEM';
	}
	return String(author || '').toUpperCase();
}
export class UIAiIdentity extends WebComponent {
	static url = import.meta.url;
	static styles = {
		identity: './ai-identity.css',
	};
	static state = {
		author: 'assistant',
		label: '',
		src: '',
		size: 'sm',
	};
	get displayLabel() {
		return this.state.label || labelFor(this.state.author);
	}
	get avatarName() {
		return this.state.label || this.state.author || 'AI';
	}
	render() {
		this.html`
			<div class="aiid" data-author=${this.state.author}>
				<ui-avatar
					.state.src=${this.state.src}
					.state.name=${this.avatarName}
					.state.size=${this.state.size}></ui-avatar>
				<span class="aiid-label">${this.displayLabel}</span>
			</div>
		`;
	}
}
customElements.define('ui-ai-identity', UIAiIdentity);
