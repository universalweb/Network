import { WebComponent, list } from '../../core/index.js';
const DEFAULT_TIMEOUT = 3200;
class NotificationItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		notification: './notification.css',
	};
	static state = {
		exiting: false,
		id: null,
		itemType: 'default',
		message: '',
		timeout: 0,
		title: 'Notification',
	};
	onConnect() {
		const { timeout } = this.STATE;
		if (timeout > 0) {
			this.setTimeout(() => {
				this.beginExit();
			}, timeout);
		}
	}
	beginExit() {
		if (this.state.exiting) {
			return;
		}
		this.state.exiting = true;
	}
	handleAnimationEnd(domEvent) {
		if (domEvent.animationName !== 'notification-out') {
			return;
		}
		this.emit('notification-dismiss', {
			id: this.STATE.id,
		});
	}
	handleKey(domEvent) {
		if (domEvent.key !== 'Enter' && domEvent.key !== ' ') {
			return;
		}
		domEvent.preventDefault();
		this.beginExit();
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="notification notification-${this.state.itemType}${this.state.exiting ? ' is-exit' : ''}"
				role="button" tabindex="0" aria-label="Dismiss notification"
				@click=${this.beginExit}
				@keydown=${this.handleKey}
				@animationend=${this.handleAnimationEnd}>
				<div class="notification-body">
					<div class="notification-title">${this.state.title}</div>
					<div class="notification-message">${this.state.message}</div>
				</div>
				<ui-icon class="notification-close" name="x" size="sm"></ui-icon>
			</div>
		`;
	}
}
customElements.define('ui-notification-item', NotificationItem);
export class UINotification extends WebComponent {
	static url = import.meta.url;
	static styles = {
		notificationStack: './notification-stack.css',
	};
	static state = {
		items: [],
	};
	nextId = 0;
	show(spec = {}) {
		const message = spec.message;
		if (!message) {
			return null;
		}
		const id = ++this.nextId;
		this.state.items.unshift({
			id,
			itemType: spec.itemType ?? 'default',
			message,
			timeout: spec.timeout ?? DEFAULT_TIMEOUT,
			title: spec.title ?? 'Notification',
		});
		// Re-promote the popover into the top layer so the stack lands above
		// any modal that opened after the notification host was first shown.
		// Top-layer order is insertion-order; hiding and immediately re-
		// showing pushes us back to the very top in the same tick (no flash).
		if (typeof this.hidePopover === 'function' && typeof this.showPopover === 'function') {
			try {
				if (this.matches?.(':popover-open')) {
					this.hidePopover();
				}
				this.showPopover();
			} catch (error) {
				console.warn('[notify] re-promote failed', error);
			}
		}
		return id;
	}
	dismiss(id) {
		this.state.items = this.state.items.filter((item) => {
			return item.id !== id;
		});
	}
	clear() {
		this.state.items = [];
	}
	handleDismiss(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (id !== undefined) {
			this.dismiss(id);
		}
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="notification-stack" @notification-dismiss="${this.handleDismiss}">
				${list('items', NotificationItem, (item) => {
					return item.id;
				})}
			</div>
		`;
	}
}
customElements.define('ui-notification', UINotification);
