import { WebComponent } from '../../base/base.js';
import { listBind } from '../../base/template.js';
const notificationStyles = await WebComponent.styleSheet('./notification.css', import.meta.url);
const DEFAULT_TIMEOUT = 3200;
const EXIT_DELAY = 260;
class NotificationItem extends WebComponent {
	constructor() {
		super({
			styles: [notificationStyles],
		});
		this.state = {
			exiting: false,
			id: null,
			itemType: 'default',
			message: '',
			title: '',
		};
	}
	get activationEventName() {
		return 'notification-dismiss';
	}
	buildActivationDetail() {
		return {
			id: this.state.id,
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="notification notification-${this.state.itemType}${this.state.exiting ? ' is-exit' : ''}" role="button" tabindex="0" @click=${this.handleActivate} @keydown=${this.handleKeydown}>
				<div class="notification-body">
					<div class="notification-title">${this.state.title}</div>
					<div class="notification-message">${this.state.message}</div>
				</div>
				<button class="notification-close" aria-label="Dismiss notification" title="Dismiss notification" @click=${(e) => {
					e.stopPropagation();
					this.handleActivate();
				}}>&#xf05ad;</button>
			</div>
		`;
	}
	handleKeydown(domEvent) {
		if (domEvent.key === 'Enter' || domEvent.key === ' ') {
			domEvent.preventDefault();
			this.handleActivate();
		}
	}
}
customElements.define('ui-notification-item', NotificationItem);
export class UINotification extends WebComponent {
	nextId = 0;
	constructor() {
		super({
			styles: [notificationStyles],
			tooltips: true,
		});
		this.state = {
			items: [],
		};
	}
	show({
		message, title = 'Notification', timeout = DEFAULT_TIMEOUT, itemType = 'default',
	} = {}) {
		if (!message) {
			return null;
		}
		const id = ++this.nextId;
		const item = {
			exiting: false,
			id,
			itemType,
			message,
			title,
			timer: null,
		};
		this.state.items.unshift(item);
		if (timeout > 0) {
			item.timer = this.setTimeout(() => {
				this.dismiss(id);
			}, timeout);
		}
		return id;
	}
	dismiss(id) {
		const item = this.state.items.find((e) => {
			return e.id === id;
		});
		if (!item || item.exiting) {
			return;
		}
		item.exiting = true;
		if (item.timer) {
			this.clearTimeout(item.timer);
			item.timer = null;
		}
		this.setTimeout(() => {
			this.state.items = this.state.items.filter((entry) => {
				return entry.id !== id;
			});
		}, EXIT_DELAY);
	}
	clear() {
		this.state.items.forEach((item) => {
			if (item.timer) {
				this.clearTimeout(item.timer);
			}
		});
		this.state.items = [];
	}
	handleDismiss(domEvent) {
		const id = domEvent.detail?.id;
		if (id !== undefined) {
			this.dismiss(id);
		}
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="notification-stack" @notification-dismiss=${this.handleDismiss}>
				${listBind('items', NotificationItem, (item) => {
					return item.id;
				})}
			</div>
		`;
	}
}
customElements.define('ui-notification', UINotification);
