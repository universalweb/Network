import { WebComponent } from '../../core/index.js';
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
		heading: 'Notification',
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
		this.emit('notification:dismiss', {
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
		this.html `
			<div
				class="notification"
				data-type=${this.state.itemType}
				?data-exit=${this.state.exiting}
				role="button" tabindex="0" aria-label="Dismiss notification"
				@click=${this.beginExit}
				@keydown=${this.handleKey}
				@animationend=${this.handleAnimationEnd}>
				<div class="notification-body">
					<div class="notification-title">${this.state.heading}</div>
					<div class="notification-message">${this.state.message}</div>
				</div>
				<ui-icon class="notification-close" .state.name=${'x'} .state.size=${'sm'}></ui-icon>
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
	onConnect() {
		/*
		 * The host owns its top-layer requirement: manual popover so the stack
		 * lands above any open <dialog>. Mounters must not need an external
		 * setAttribute('popover') dance (the preview page mounted bare and
		 * show() threw NotSupportedError). Explicit popover= markup still wins;
		 * engines without popover support fall back to z-index stacking.
		 */
		if (typeof this.showPopover !== 'function') {
			return;
		}
		if (!this.hasAttribute('popover')) {
			this.setAttribute('popover', 'manual');
		}
		if (!this.matches(':popover-open')) {
			this.showPopover();
		}
	}
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
			heading: spec.heading ?? 'Notification',
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
	itemKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<div class="notification-stack" @notification:dismiss=${this.handleDismiss}>
				${this.list('items', NotificationItem, this.itemKey)}
			</div>
		`;
	}
}
customElements.define('ui-notification', UINotification);
