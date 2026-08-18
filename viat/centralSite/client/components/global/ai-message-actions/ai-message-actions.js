/*
 * `<ui-ai-message-actions>` — per-message action strip (copy / regenerate /
 * edit / delete). Pure UI: emits `ai-message-actions:action`
 * { action, messageId } — parent owns behavior. Drive with `.messageId`,
 * `.actions` ([{ id, icon, label }]), `.disabled`.
 */
import '../icon/icon.js';
import { html, WebComponent } from 'webcomponent';
export class UIAiMessageActions extends WebComponent {
	static url = import.meta.url;
	static styles = {
		messageActions: './ai-message-actions.css',
	};
	static state = {
		messageId: '',
		actions: [
			{
				id: 'copy',
				icon: 'copy',
				label: 'Copy',
			},
			{
				id: 'regenerate',
				icon: 'refresh-cw',
				label: 'Regenerate',
			},
			{
				id: 'edit',
				icon: 'pencil',
				label: 'Edit',
			},
			{
				id: 'delete',
				icon: 'trash-2',
				label: 'Delete',
			},
		],
		disabled: false,
	};
	actionKey(action) {
		return action.id;
	}
	renderAction(action) {
		// Light list rows forbid tooltip= (behavior) and #refs — aria-label only.
		return html`
			<button type="button"
				class="aima-btn"
				data-action=${action.id}
				aria-label=${action.label}
				?disabled=${this.state.disabled}>
				<ui-icon .state.name=${action.icon} .state.size=${'xs'}></ui-icon>
			</button>
		`;
	}
	handleClick(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const action = domEvent.target?.dataset?.action;
		if (!action) {
			return;
		}
		this.emit('ai-message-actions:action', {
			action,
			messageId: this.state.messageId,
		});
	}
	render() {
		this.html`
			<div class="aima" role="toolbar" aria-label="Message actions" @click=${this.handleClick}>
				${this.list('actions', this.renderAction, this.actionKey)}
			</div>
		`;
	}
}
customElements.define('ui-ai-message-actions', UIAiMessageActions);
