import '../close-button/close-button.js';
import { WebComponent } from '../../core/index.js';
/*
 * Toast row. Click body → hide or remove (host `clickAction`). Close always
 * removes via <ui-close-button> (same × as modal / panel-header).
 * Timeout auto-hides by default; pass `autoRemove: true` on show() to delete.
 */
export class NotificationItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		notification: './notification-item.css',
	};
	static state = {
		exiting: false,
		itemId: null,
		itemType: 'default',
		message: '',
		timeout: 0,
		heading: 'Notification',
		autoRemove: false,
		muted: false,
		seen: false,
	};
	onConnect() {
		const { timeout } = this.STATE;
		if (timeout > 0) {
			this.setTimeout(this.beginTimeoutExit, timeout);
		}
	}
	/* Timer API invokes as callback(component, handle) — no `this` bind. */
	beginTimeoutExit(component) {
		if (component.state.exiting) {
			return;
		}
		if (component.state.autoRemove) {
			component.beginRemove();
			return;
		}
		component.beginHide();
	}
	beginHide() {
		if (this.state.exiting) {
			return;
		}
		this.state.exiting = true;
		this._exitKind = 'hide';
	}
	beginRemove() {
		if (this.state.exiting) {
			return;
		}
		this.state.exiting = true;
		this._exitKind = 'remove';
	}
	handleAnimationEnd(domEvent) {
		if (domEvent.animationName !== 'notification-out') {
			return;
		}
		const itemId = this.STATE.itemId;
		if (this._exitKind === 'remove') {
			this.emit('notification:remove', {
				id: itemId,
			});
			return;
		}
		this.emit('notification:hide', {
			id: itemId,
		});
	}
	handleBodyActivate(domEvent) {
		if (domEvent.type === 'keydown' && domEvent.key !== 'Enter' && domEvent.key !== ' ') {
			return;
		}
		if (domEvent.type === 'keydown') {
			domEvent.preventDefault();
		}
		this.emit('notification:activate', {
			id: this.STATE.itemId,
		});
	}
	/* Stop the native click from also activating the toast body. */
	stopBubble(domEvent) {
		domEvent.stopPropagation();
	}
	handleCloseClick() {
		this.beginRemove();
	}
	render() {
		this.html`
			<div
				class="notification"
				data-type=${this.state.itemType}
				?data-exit=${this.state.exiting}
				role="button"
				tabindex="0"
				aria-label="Notification"
				@click=${this.handleBodyActivate}
				@keydown=${this.handleBodyActivate}
				@animationend=${this.handleAnimationEnd}>
				<div class="notification-body">
					<div class="notification-title">${this.state.heading}</div>
					<div class="notification-message">${this.state.message}</div>
				</div>
				<ui-close-button
					class="notification-close"
					.state.label=${'Remove notification'}
					@click=${this.stopBubble}
					@close-button:click=${this.handleCloseClick}></ui-close-button>
			</div>
		`;
	}
}
customElements.define('ui-notification-item', NotificationItem);
