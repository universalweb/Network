import '../button/button.js';
import '../icon-button/icon-button.js';
import '../slideout/slideout.js';
import { WebComponent } from '../../core/index.js';
import { NotificationCenterItem } from '../notification-center-item/notification-center-item.js';
import { NotificationItem } from '../notification-item/notification-item.js';
const DEFAULT_TIMEOUT = 3200;
const POSITIONS = new Set([
	'top-end', 'top-start', 'bottom-end', 'bottom-start',
]);
/**
 * `<ui-notification>` — toast stack + Tahoe-style notification center.
 *
 * Center pane is a composed `<ui-slideout>` (header via `<ui-panel-header>`).
 *
 * Config (static state / `.state=`):
 * - `position` — toast corner: `top-end` | `top-start` | `bottom-end` | `bottom-start`
 * - `clickAction` — body click: `hide` (default, Mac-like) | `remove`
 * - `centerOpen` — notification center pane open
 *
 * `show({ message, heading?, itemType?, timeout?, autoRemove? })` pushes a toast.
 * Hidden items stay in the center until removed via X or `remove(id)`.
 */
export class UINotification extends WebComponent {
	static url = import.meta.url;
	static styles = {
		notificationStack: './notification-stack.css',
		notificationCenter: './notification-center.css',
	};
	static state = {
		items: [],
		position: 'top-end',
		clickAction: 'hide',
		centerOpen: false,
		/* Child slideout knobs — reactive bag bound bare. */
		slideoutState: {
			open: false,
			side: 'end',
			heading: 'Notifications',
			showClose: true,
			closeLabel: 'Close notifications',
			dragClose: true,
			backdrop: true,
		},
	};
	nextId = 0;
	onConnect() {
		/*
		 * The host owns its top-layer requirement: manual popover so the toast
		 * stack lands above any open <dialog>. Mounters must not need an external
		 * setAttribute('popover') dance. Explicit popover= markup still wins;
		 * engines without popover support fall back to z-index stacking.
		 */
		if (typeof this.showPopover === 'function' && !this.hasAttribute('popover')) {
			this.setAttribute('popover', 'manual');
		}
		if (typeof this.showPopover === 'function' && !this.matches(':popover-open')) {
			this.showPopover();
		}
		this.delegate('notification-center:toggle', this.toggleCenter);
		this.delegate('notification-center:open', this.openCenter);
		this.delegate('notification-center:close', this.closeCenter);
		this.observe('centerOpen', this.syncCenterOpen);
		this.syncCenterOpen(this.state.centerOpen);
		this.observe('position', this.syncPositionAttr);
		this.syncPositionAttr(this.state.position);
	}
	syncCenterOpen(isOpen) {
		const centerOpen = Boolean(isOpen);
		this.toggleAttribute('data-center-open', centerOpen);
		this.state.slideoutState.open = centerOpen;
	}
	syncPositionAttr(position) {
		const next = POSITIONS.has(position) ? position : 'top-end';
		this.dataset.position = next;
		if (next !== this.state.position) {
			this.state.position = next;
		}
	}
	show(spec = {}) {
		const message = spec.message;
		if (!message) {
			return null;
		}
		const itemId = ++this.nextId;
		const position = spec.position;
		if (position && POSITIONS.has(position)) {
			this.state.position = position;
		}
		this.state.items.unshift({
			id: itemId,
			itemId,
			itemType: spec.itemType ?? 'default',
			message,
			timeout: spec.timeout ?? DEFAULT_TIMEOUT,
			heading: spec.heading ?? 'Notification',
			autoRemove: Boolean(spec.autoRemove),
			muted: false,
			seen: false,
			createdAt: Date.now(),
		});
		this.repromotePopover();
		this.emit('notification:show', {
			id: itemId,
		});
		return itemId;
	}
	repromotePopover() {
		if (typeof this.hidePopover !== 'function' || typeof this.showPopover !== 'function') {
			return;
		}
		try {
			if (this.matches?.(':popover-open')) {
				this.hidePopover();
			}
			this.showPopover();
		} catch (error) {
			console.warn('[notify] re-promote failed', error);
		}
	}
	hide(itemId) {
		const items = this.state.items;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index++) {
			const item = items[index];
			if (item.itemId === itemId || item.id === itemId) {
				item.muted = true;
				item.timeout = 0;
				break;
			}
		}
	}
	remove(itemId) {
		this.state.items = this.state.items.filter((item) => {
			return item.itemId !== itemId && item.id !== itemId;
		});
	}
	clear() {
		this.state.items = [];
	}
	openCenter() {
		this.state.centerOpen = true;
		this.markAllSeen();
	}
	closeCenter() {
		this.state.centerOpen = false;
	}
	toggleCenter() {
		if (this.state.centerOpen) {
			this.closeCenter();
			return;
		}
		this.openCenter();
	}
	markAllSeen() {
		const items = this.state.items;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index++) {
			items[index].seen = true;
		}
	}
	handleActivate(domEvent) {
		const itemId = domEvent.detail?.data?.id;
		if (itemId === undefined) {
			return;
		}
		if (this.state.clickAction === 'remove') {
			this.remove(itemId);
			return;
		}
		this.hide(itemId);
	}
	handleHide(domEvent) {
		const itemId = domEvent.detail?.data?.id;
		if (itemId !== undefined) {
			this.hide(itemId);
		}
	}
	handleRemove(domEvent) {
		const itemId = domEvent.detail?.data?.id;
		if (itemId !== undefined) {
			this.remove(itemId);
		}
	}
	handleSlideoutClose() {
		this.closeCenter();
	}
	handleClearAll() {
		this.clear();
	}
	isToastVisible(item) {
		return !item.muted;
	}
	unreadCount() {
		const items = this.state.items;
		const itemCount = items.length;
		let count = 0;
		for (let index = 0; index < itemCount; index++) {
			if (!items[index].seen) {
				count += 1;
			}
		}
		return count;
	}
	hasItems() {
		return this.state.items.length > 0;
	}
	render() {
		this.html`
			<div
				class="notification-stack"
				data-position=${this.state.position}
				@notification:activate=${this.handleActivate}
				@notification:hide=${this.handleHide}
				@notification:remove=${this.handleRemove}>
				${this.filter('items', NotificationItem, this.isToastVisible)}
			</div>
			<portal to="body">
				<ui-slideout
					.state=${this.state.slideoutState}
					@slideout:close=${this.handleSlideoutClose}
					@notification:activate=${this.handleActivate}
					@notification:remove=${this.handleRemove}>
					<ui-icon-button
						slot="header-end"
						class="nc-clear"
						?hidden=${() => {
							return !this.hasItems();
						}}
						.state.icon=${'trash-2'}
						.state.tooltip=${'Clear all'}
						.state.variant=${'ghost'}
						.state.tone=${'primary'}
						.state.size=${'sm'}
						@icon-button:click=${this.handleClearAll}></ui-icon-button>
					<div class="nc-list">
						${this.list('items', NotificationCenterItem)}
						<div class="nc-empty" ?hidden=${() => {
							return this.hasItems();
						}}>
							No notifications
						</div>
					</div>
				</ui-slideout>
			</portal>
		`;
	}
}
customElements.define('ui-notification', UINotification);
