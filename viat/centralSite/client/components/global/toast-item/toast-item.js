/*
	DESCRIPTION: ui-toast-item — single transient toast card (Toast row).
	Emits toast-item:dismiss | toast-item:action. Host stack owns the list.
*/
import '../close-button/close-button.js';
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
const TYPE_ICONS = {
	success: 'circle-check',
	info: 'info',
	warning: 'triangle-alert',
	error: 'circle-x',
	loading: 'loader-circle',
};
export class UIToastItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toastItem: './toast-item.css',
	};
	static state = {
		toastId: null,
		title: '',
		description: '',
		// default | success | info | warning | error | loading
		itemType: 'default',
		timeout: 4000,
		actionLabel: '',
		exiting: false,
	};
	onConnect() {
		const timeout = Number(this.state.timeout) || 0;
		if (timeout > 0 && this.state.itemType !== 'loading') {
			this.setTimeout(this.beginExit, timeout);
		}
	}
	/* Timer API: callback(component, handle). */
	beginExit(component) {
		if (component.state.exiting) {
			return;
		}
		component.state.exiting = true;
	}
	handleAnimationEnd(domEvent) {
		if (domEvent.animationName !== 'toast-out') {
			return;
		}
		this.emit('toast-item:dismiss', {
			id: this.state.toastId,
		});
	}
	handleClose() {
		this.beginExit(this);
	}
	stopBubble(domEvent) {
		domEvent.stopPropagation();
	}
	handleAction(domEvent) {
		domEvent.stopPropagation();
		this.emit('toast-item:action', {
			id: this.state.toastId,
		});
		this.beginExit(this);
	}
	hasAction() {
		return Boolean(this.state.actionLabel);
	}
	iconName() {
		return TYPE_ICONS[this.state.itemType] || '';
	}
	hideIcon() {
		return !this.iconName();
	}
	iconSpin() {
		return this.state.itemType === 'loading';
	}
	hideTitle() {
		return !this.state.title;
	}
	hideDescription() {
		return !this.state.description;
	}
	hideAction() {
		return !this.hasAction();
	}
	render() {
		this.html`
			<div
				class="toast"
				data-type=${this.state.itemType}
				?data-exit=${this.state.exiting}
				role="status"
				aria-live="polite"
				@animationend=${this.handleAnimationEnd}>
				<div class="toast-icon" ?hidden=${this.hideIcon}>
					<ui-icon
						.state.name=${this.iconName}
						.state.size=${'sm'}
						.state.spin=${this.iconSpin}></ui-icon>
				</div>
				<div class="toast-body">
					<div class="toast-title" ?hidden=${this.hideTitle}>${this.state.title}</div>
					<div class="toast-desc" ?hidden=${this.hideDescription}>${this.state.description}</div>
					<button
						type="button"
						class="toast-action"
						?hidden=${this.hideAction}
						@click=${this.handleAction}>${this.state.actionLabel}</button>
				</div>
				<ui-close-button
					class="toast-close"
					.state.label=${'Dismiss toast'}
					.state.size=${'sm'}
					@click=${this.stopBubble}
					@close-button:click=${this.handleClose}></ui-close-button>
			</div>
		`;
	}
}
customElements.define('ui-toast-item', UIToastItem);
