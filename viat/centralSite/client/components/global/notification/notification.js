import '../notification-panel/notification-panel.js';
import { WebComponent } from '../../core/index.js';
import { normalizeNoticeType, stampStackDepth } from '../notice-stack.js';
import { NotificationItem } from '../notification-item/notification-item.js';
const DEFAULT_TIMEOUT = 3200;
const POSITIONS = new Set([
	'top-end', 'top-start', 'bottom-end', 'bottom-start',
]);
/**
 * `<ui-notification>` — toast stack + history pane.
 *
 * Center pane is a composed `<ui-notification-panel>`. Toasts hide while the
 * pane is open (`centerOpen`) so they do not double-show.
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
	};
	static state = {
		items: [],
		position: 'top-end',
		clickAction: 'hide',
		centerOpen: false,
		/*
		 * How many cards stay on screen. Beyond this the stack LAYERS rather than
		 * growing: deeper cards scale back and peek out behind the front one, so a
		 * burst of notifications reads as a pile instead of a column that runs off
		 * the viewport. Hover or focus fans the pile back out. Nothing is dropped
		 * — the overflow is still in `items` and still in the centre.
		 */
		stackLimit: 4,
	};
	nextId = 0;
	onConnect() {
		this.ensureManualPopover();
		this.observe('items', this.queueStampStack);
		this.delegate('notification-center:toggle', this.toggleCenter);
		this.delegate('notification-center:open', this.openCenter);
		this.delegate('notification-center:close', this.closeCenter);
		this.observe('centerOpen', this.syncCenterOpen);
		this.syncCenterOpen(this.state.centerOpen);
		this.observe('position', this.syncPositionAttr);
		this.syncPositionAttr(this.state.position);
	}
	/* Depth is stamped AFTER the list paints — list() owns the children, this
	   only writes a CSS var onto each one. */
	queueStampStack() {
		this.nextFrame().then(() => {
			if (!this.isDisconnected) {
				this.stampStackIndexes();
			}
		});
	}
	stampStackIndexes() {
		stampStackDepth(this, 'ui-notification-item');
		this.style.setProperty('--stack-limit', String(this.state.stackLimit));
	}
	onRender() {
		this.stampStackIndexes();
	}
	syncCenterOpen(isOpen) {
		this.toggleAttribute('data-center-open', Boolean(isOpen));
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
			/* Same six kinds ui-toast accepts — one vocabulary for the notice family,
			   so a "warning" cannot mean different things in the two surfaces. */
			itemType: normalizeNoticeType(spec.itemType ?? spec.type ?? 'default'),
			message,
			timeout: spec.timeout ?? DEFAULT_TIMEOUT,
			heading: spec.heading ?? 'Notification',
			autoRemove: Boolean(spec.autoRemove),
			muted: false,
			seen: false,
			createdAt: Date.now(),
		});
		this.repromoteManualPopover();
		this.emit('notification:show', {
			id: itemId,
		});
		return itemId;
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
	/*
	 * The panel emits BOTH `:open` and `:close`; handling only the latter meant a
	 * consumer calling `panel.open()` directly — a public method — left the host
	 * unaware, so `centerOpen` stayed false and the toast stack kept showing
	 * alongside the very panel that already lists everything. Both directions are
	 * handled now, and openCenter/closeCenter are idempotent, so the host-driven
	 * path does not bounce back through here.
	 */
	handlePanelOpen() {
		this.openCenter();
	}
	handlePanelClose() {
		this.closeCenter();
	}
	handlePanelClear() {
		this.markAllSeen();
	}
	handlePanelDelete() {
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
	render() {
		this.html`
			<div
				class="notification-stack"
				data-position=${this.state.position}
				?hidden=${this.state.centerOpen}
				@notification:activate=${this.handleActivate}
				@notification:hide=${this.handleHide}
				@notification:remove=${this.handleRemove}>
				${this.filter('items', NotificationItem, this.isToastVisible)}
			</div>
			<ui-notification-panel
				.state.items=${this.state.items}
				.state.open=${this.state.centerOpen}						@notification-panel:open=${this.handlePanelOpen}				@notification-panel:close=${this.handlePanelClose}
				@notification-panel:clear=${this.handlePanelClear}
				@notification-panel:delete=${this.handlePanelDelete}
				@notification:activate=${this.handleActivate}
				@notification:remove=${this.handleRemove}></ui-notification-panel>
		`;
	}
}
customElements.define('ui-notification', UINotification);
