import { WebComponent } from '../../base/base.js';
import { each } from '../../base/template.js';
const notificationStyles = await WebComponent.styleSheet('./notification.css', import.meta.url);
const DEFAULT_TIMEOUT = 3200;
const EXIT_DELAY = 260;
export class UINotification extends WebComponent {
	nextId = 0;
	constructor() {
		super([notificationStyles], {
			tooltips: true,
		});
		this.notificationSnapshotCache = new Map();
		this.state = {
			items: [],
		};
	}
	get items() {
		return this.state.items;
	}
	get queue() {
		return this.state.items;
	}
	set queue(value) {
		this.state.items = Array.isArray(value) ? value : [];
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
			timeout,
			timer: null,
			title,
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
	createNotificationSnapshot(item, index) {
		const itemId = item?.id ?? index;
		const snapshot = {
			exiting: item?.exiting === true,
			id: itemId,
			itemType: item?.itemType ?? 'default',
			message: item?.message ?? '',
			title: item?.title ?? 'Notification',
		};
		const signature = `${snapshot.id}|${snapshot.itemType}|${snapshot.title}|${snapshot.message}|${snapshot.exiting}`;
		const cachedEntry = this.notificationSnapshotCache.get(itemId);
		if (cachedEntry?.signature === signature) {
			return cachedEntry.snapshot;
		}
		this.notificationSnapshotCache.set(itemId, {
			signature,
			snapshot,
		});
		return snapshot;
	}
	createNotificationElement(item) {
		const element = document.createElement('div');
		element.className = `notification notification-${item.itemType}${item.exiting ? ' is-exit' : ''}`;
		element.setAttribute('role', 'button');
		element.setAttribute('tabindex', '0');
		element.addEventListener('click', this.createEventHandler(this.handleDismissNotification, item.id));
		element.addEventListener('keydown', this.createEventHandler(this.handleDismissNotificationKeydown, item.id));
		const body = document.createElement('div');
		body.className = 'notification-body';
		const title = document.createElement('div');
		title.className = 'notification-title';
		title.textContent = item.title;
		const message = document.createElement('div');
		message.className = 'notification-message';
		message.textContent = item.message;
		body.append(title, message);
		const closeButton = document.createElement('button');
		closeButton.className = 'notification-close';
		closeButton.setAttribute('aria-label', 'Dismiss notification');
		closeButton.setAttribute('title', 'Dismiss notification');
		closeButton.innerHTML = '&#xf05ad;';
		closeButton.addEventListener('click', this.createEventHandler(this.handleDismissNotificationClose, item.id));
		element.append(body, closeButton);
		return element;
	}
	buildNotificationList() {
		const itemSnapshots = this.state.items.map((item, index) => {
			return this.createNotificationSnapshot(item, index);
		});
		return each(itemSnapshots, this.createNotificationElement.bind(this), (item, index) => {
			return item.id ?? index;
		});
	}
	handleDismissNotification(domEvent, element, notificationId) {
		if (domEvent.target.closest('.notification-close')) {
			return;
		}
		this.dismiss(Number(notificationId));
	}
	handleDismissNotificationKeydown(domEvent, element, notificationId) {
		if (domEvent.key !== 'Enter' && domEvent.key !== ' ') {
			return;
		}
		domEvent.preventDefault();
		this.dismiss(Number(notificationId));
	}
	handleDismissNotificationClose(domEvent, button, notificationId) {
		domEvent.stopPropagation();
		this.dismiss(Number(notificationId));
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="notification-stack">
				${() => {
					if (!this.state.items.length) {
						return '';
					}
					return this.buildNotificationList();
				}}
			</div>
		`;
	}
}
customElements.define('ui-notification', UINotification);
