import {
	hostSheet,
	loadSheet,
	resetSheet,
} from '../componentLibrary/shared-styles.js';
import { WebComponent } from '../componentLibrary/base.js';
const notificationStyles = await loadSheet(new URL('../../styles/notification.css', import.meta.url));
const host = hostSheet(`:host { display: block; }`);
const DEFAULT_TIMEOUT = 3200;
const EXIT_DELAY = 260;
export class UINotification extends WebComponent {
	queue = [];
	nextId = 0;
	constructor() {
		super([
			resetSheet, host, notificationStyles,
		]);
		this.addEvent('handleDismissNotification', 'click', this.handleDismissNotification);
		this.addEvent('handleDismissNotificationKeydown', 'keydown', this.handleDismissNotificationKeydown);
		this.addEvent('handleDismissNotificationClose', 'click', this.handleDismissNotificationClose);
	}
	get items() {
		return this.queue;
	}
	get stack() {
		let el = this.shadowRoot.querySelector('.notification-stack');
		if (!el) {
			el = document.createElement('div');
			el.className = 'notification-stack';
			this.shadowRoot.appendChild(el);
		}
		return el;
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
		this.queue.unshift(item);
		const el = document.createElement('div');
		el.className = `notification notification-${itemType}`;
		el.dataset.id = String(id);
		el.dataset.onclick = 'handleDismissNotification';
		el.dataset.onkeydown = 'handleDismissNotificationKeydown';
		el.setAttribute('role', 'button');
		el.setAttribute('tabindex', '0');
		el.innerHTML = `
			<div class="notification-body">
				<div class="notification-title">${title}</div>
				<div class="notification-message">${message}</div>
			</div>
			<button class="notification-close" data-id="${id}" data-onclick="handleDismissNotificationClose" aria-label="Dismiss notification" data-tooltip="Dismiss notification">&#xf05ad;</button>
		`;
		this.stack.prepend(el);
		if (timeout > 0) {
			item.timer = this.setTimeout(() => {
				this.dismiss(id);
			}, timeout);
		}
		return id;
	}
	dismiss(id) {
		const item = this.queue.find((e) => {
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
		const el = this.shadowRoot.querySelector(`.notification[data-id="${id}"]`);
		if (el) {
			el.classList.add('is-exit');
			this.setTimeout(() => {
				el.remove();
				this.queue = this.queue.filter((e) => {
					return e.id !== id;
				});
			}, EXIT_DELAY);
		} else {
			this.queue = this.queue.filter((e) => {
				return e.id !== id;
			});
		}
	}
	clear() {
		this.queue.forEach((item) => {
			if (item.timer) {
				this.clearTimeout(item.timer);
			}
		});
		this.queue = [];
		this.shadowRoot.querySelector('.notification-stack')?.remove();
	}
	handleDismissNotification(domEvent, element) {
		if (domEvent.target.closest('.notification-close')) {
			return;
		}
		this.dismiss(Number(element.dataset.id));
	}
	handleDismissNotificationKeydown(domEvent, element) {
		if (domEvent.key !== 'Enter' && domEvent.key !== ' ') {
			return;
		}
		domEvent.preventDefault();
		this.dismiss(Number(element.dataset.id));
	}
	handleDismissNotificationClose(domEvent, button) {
		domEvent.stopPropagation();
		this.dismiss(Number(button.dataset.id));
	}
}
customElements.define('ui-notification', UINotification);
