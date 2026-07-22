import { WebComponent } from '../../core/index.js';
export class UIEmptyState extends WebComponent {
	static url = import.meta.url;
	static styles = {
		emptyState: './empty-state.css',
	};
	static state = {
		actionLabel: '',
		hint: '',
		icon: '',
		heading: 'Nothing here yet',
	};
	handleAction() {
		this.emit('empty-state:action', {
			label: this.state.actionLabel,
		});
	}
	render() {
		this.html`
			<div class="empty">
				${this.state.icon ? this.htmlElement`<div class="empty-icon" aria-hidden="true">${this.state.icon}</div>` : ''}
				<div class="empty-title">${this.state.heading}</div>
				${this.state.hint ? this.htmlElement`<div class="empty-hint">${this.state.hint}</div>` : ''}
				${this.state.actionLabel ? this.htmlElement`<button class="empty-action" type="button" @click=${this.handleAction}>${this.state.actionLabel}</button>` : ''}
			</div>
		`;
	}
}
customElements.define('ui-empty-state', UIEmptyState);
