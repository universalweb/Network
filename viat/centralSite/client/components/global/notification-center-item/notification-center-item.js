import '../close-button/close-button.js';
import { WebComponent } from '../../core/index.js';
/*
 * Center-pane row — self-painted chrome (same fill+border+type accent pattern as
 * ui-notification-item) + <ui-close-button>. Body click activates; close removes.
 * Do not wrap in <ui-surface>: host accents paint behind surface fill.
 */
export class NotificationCenterItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		notificationCenterItem: './notification-center-item.css',
	};
	static state = {
		itemId: null,
		itemType: 'default',
		message: '',
		heading: 'Notification',
		muted: false,
		seen: false,
		createdAt: 0,
	};
	handleActivate(domEvent) {
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
	/* Stop the native click from also activating the row. */
	stopBubble(domEvent) {
		domEvent.stopPropagation();
	}
	handleCloseClick() {
		this.emit('notification:remove', {
			id: this.STATE.itemId,
		});
	}
	isUnseen() {
		return !this.state.seen;
	}
	render() {
		this.html`
			<div
				class="nc-item"
				data-type=${this.state.itemType}
				?data-muted=${this.state.muted}
				?data-unseen=${this.isUnseen}
				role="button"
				tabindex="0"
				@click=${this.handleActivate}
				@keydown=${this.handleActivate}>
				<div class="nc-item-body">
					<div class="nc-item-title">${this.state.heading}</div>
					<div class="nc-item-message">${this.state.message}</div>
				</div>
				<ui-close-button
					class="nc-item-close"
					.state.label=${'Remove notification'}
					@click=${this.stopBubble}
					@close-button:click=${this.handleCloseClick}></ui-close-button>
			</div>
		`;
	}
}
customElements.define('ui-notification-center-item', NotificationCenterItem);
