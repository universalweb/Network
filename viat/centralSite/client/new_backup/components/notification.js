import {
	hostSheet,
	loadSheet,
	resetSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const notificationStyles = await loadSheet(new URL('../styles/notification.css', import.meta.url));
const host = hostSheet(`
:host {
	display: block;
}
`);
const DEFAULT_TIMEOUT = 3200;
const EXIT_DELAY = 260;
export class ViatNotification extends WebComponent {
	nextId = 0;
	constructor() {
		super([
			resetSheet,
			host,
			notificationStyles,
		]);
		this.state = {
			items: [],
		};
		this.addEvent('handleDismissNotification', 'click', this.handleDismissNotification);
		this.addEvent('handleDismissNotificationKeydown', 'keydown', this.handleDismissNotificationKeydown);
		this.addEvent('handleDismissNotificationClose', 'click', this.handleDismissNotificationClose);
	}
	get items() {
		return this.state.items;
	}
	set items(value) {
		this.updateState({
			items: Array.isArray(value) ? value : [],
		});
	}
	show({
		message,
		title = 'Notification',
		timeout = DEFAULT_TIMEOUT,
		itemType = 'default',
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
		this.items = [item, ...this.items];
		if (timeout > 0) {
			item.timer = this.setTimeout(() => {
				this.dismiss(id);
			}, timeout);
		}
		return id;
	}
	dismiss(id) {
		const item = this.items.find((entry) => {
			return entry.id === id;
		});
		if (!item || item.exiting) {
			return;
		}
		item.exiting = true;
		if (item.timer) {
			this.clearTimeout(item.timer);
			item.timer = null;
		}
		this.items = this.items.map((entry) => {
			return entry.id === id ? {
				...entry,
				exiting: true,
			} : entry;
		});
		this.setTimeout(() => {
			this.items = this.items.filter((entry) => {
				return entry.id !== id;
			});
		}, EXIT_DELAY);
	}
	clear() {
		this.items.forEach((item) => {
			if (item.timer) {
				this.clearTimeout(item.timer);
			}
		});
		this.items = [];
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
	render() {
		if (!this.items.length) {
			this.shadowRoot.innerHTML = '';
			return;
		}
		this.shadowRoot.innerHTML = `
			<div class="notification-stack">
				${this.items.map((item) => {
					return `
						<div class="notification notification-${item.itemType}${item.exiting ? ' is-exit' : ''}" data-id="${item.id}" data-onclick="handleDismissNotification" data-onkeydown="handleDismissNotificationKeydown" role="button" tabindex="0">
							<div class="notification-body">
								<div class="notification-title">${item.title}</div>
								<div class="notification-message">${item.message}</div>
							</div>
							<button class="notification-close" data-id="${item.id}" data-onclick="handleDismissNotificationClose" aria-label="Dismiss notification" data-tooltip="Dismiss notification">×</button>
						</div>
					`;
				}).join('')}
			</div>
		`;
	}
}
customElements.define('viat-notification', ViatNotification);
