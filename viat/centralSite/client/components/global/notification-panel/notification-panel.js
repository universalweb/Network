/*
	DESCRIPTION: ui-notification-panel — history pane for notifications.
	Composes ui-slideout (dragToClose, floor skin). Overlay is popover="manual"
	so it escapes ancestor clip without fighting the toast host's popover.
	Author: Universal Web
	Date: 2026-08-27
	── EVENTS ───────────────────────────────────────────────────────────
	  notification-panel:open { open }
	  notification-panel:close { open }
	  notification-panel:clear
	  notification-panel:delete
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-notification-panel .state.items=${items} .state.open=${true}></ui-notification-panel>
*/
import '../empty-state/empty-state.js';
import '../icon-button/icon-button.js';
import '../scroll-area/scroll-area.js';
import '../search-input/search-input.js';
import '../slideout/slideout.js';
import { isArray, SNAP_MS, WebComponent } from 'webcomponent';
import { NotificationCenterItem } from '../notification-center-item/notification-center-item.js';
export class UINotificationPanel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		notificationPanel: './notification-panel.css',
	};
	static state = {
		items: [],
		open: false,
		heading: 'Notifications',
		query: '',
		dragToClose: true,
		skin: 'floor',
		showSearch: true,
		showClear: false,
		showDelete: true,
		searchState: {
			value: '',
			placeholder: 'Search notifications',
			size: 'sm',
		},
		clearButton: {
			icon: 'check-check',
			tooltip: 'Mark all as read',
			variant: 'ghost',
			size: 'sm',
			tone: 'neutral',
			circle: true,
		},
		deleteButton: {
			icon: 'list-x',
			tooltip: 'Clear all',
			variant: 'ghost',
			size: 'sm',
			tone: 'neutral',
			circle: true,
		},
		closeButton: {
			label: 'Close notifications',
			size: 'sm',
		},
		emptyInbox: {
			heading: 'No notifications',
			hint: 'New activity will land here.',
		},
		emptyFilter: {
			heading: 'No matches',
			hint: 'Try a different search.',
		},
		scrollArea: {
			maxHeight: 'calc(100dvh - 10rem)',
			orientation: 'vertical',
		},
	};
	hideOverlayTimer = null;
	onConnect() {
		this.observe('open', this.syncOpen);
		this.observe('query', this.refilterList);
		this.applyOpenChrome(this.state.open);
	}
	/*
	 * ESC: register with the LIFO escapable stack (tk:157) once it ships.
	 * popover="manual" does not UA-dismiss. Do not add a document Escape
	 * listener here — it would race the stack.
	 */
	applyOpenChrome(isOpen) {
		this.toggleAttribute('data-open', Boolean(isOpen));
		if (isOpen) {
			this.hideOverlayTimer?.clear();
		}
		this.syncOverlay();
	}
	syncOpen(isOpen) {
		this.applyOpenChrome(isOpen);
		if (isOpen) {
			this.emit('notification-panel:open', {
				open: true,
			});
			return;
		}
		this.emit('notification-panel:close', {
			open: false,
		});
	}
	syncOverlay() {
		const overlay = this.refs.root;
		if (!overlay) {
			return;
		}
		if (this.state.open) {
			this.showSurfacePopover(overlay);
			return;
		}
		(this.hideOverlayTimer ??= this.createTimeout(this.hideOverlay, SNAP_MS)).run();
	}
	hideOverlay(component) {
		const host = component || this;
		if (host.state.open) {
			return;
		}
		host.hideSurfacePopover(host.refs.root);
	}
	onRendered() {
		this.syncOverlay();
	}
	open() {
		if (this.state.open) {
			return;
		}
		this.state.open = true;
	}
	close() {
		if (!this.state.open) {
			return;
		}
		this.state.open = false;
	}
	toggle() {
		if (this.state.open) {
			this.close();
			return;
		}
		this.open();
	}
	/*
	 * A BOUND FIELD, not a method. `resolveListFilter` hands the predicate back
	 * VERBATIM and the keyed diff calls it as `test(item, index)` — no `this`, no
	 * component argument — so passing a bare `this.keepItem` reference threw on
	 * `this.state.query`, took the whole render down, and left an empty shadow
	 * root. An instance arrow is created once per component (so the list spot
	 * still keeps one stable predicate, not a fresh closure per render) and it
	 * carries `this`.
	 */
	keepItem = (item) => {
		const query = String(this.state.query || '').trim().toLowerCase();
		if (!query) {
			return true;
		}
		const heading = String(item?.heading ?? '').toLowerCase();
		const message = String(item?.message ?? '').toLowerCase();
		return heading.includes(query) || message.includes(query);
	};
	hasKeptItem() {
		const items = this.state.items;
		if (!isArray(items)) {
			return false;
		}
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			if (this.keepItem(items[index])) {
				return true;
			}
		}
		return false;
	}
	hideInboxEmpty() {
		return isArray(this.state.items) && this.state.items.length > 0;
	}
	hideFilterEmpty() {
		if (!isArray(this.state.items) || this.state.items.length === 0) {
			return true;
		}
		return this.hasKeptItem();
	}
	hideSearch() {
		return this.state.showSearch !== true;
	}
	hideClear() {
		return this.state.showClear !== true;
	}
	hideDelete() {
		return this.state.showDelete !== true;
	}
	refilterList() {
		this.list('items')?.spot?.refresh?.(null);
	}
	handleSearch(domEvent) {
		const value = domEvent.detail?.data?.value ?? '';
		this.state.query = value;
		this.state.searchState.value = value;
	}
	handleClear() {
		this.emit('notification-panel:clear', {});
	}
	handleDelete() {
		this.emit('notification-panel:delete', {});
	}
	handleSlideoutClose() {
		this.close();
	}
	handleSlideoutOpen() {
		this.open();
	}
	render() {
		this.html`
			<div class="notification-panel-root" #root popover="manual">
				<ui-slideout
					.state.open=${this.state.open}
					.state.side=${'end'}
					.state.heading=${this.state.heading}
					.state.showClose=${true}
					.state.closeLabel=${this.state.closeButton.label}
					.state.dragToClose=${this.state.dragToClose}
					.state.backdrop=${true}
					.state.skin=${this.state.skin}
					@slideout:close=${this.handleSlideoutClose}
					@slideout:open=${this.handleSlideoutOpen}>
					<div class="notification-panel-head-actions" slot="header-end">
						<ui-icon-button ?hidden=${this.hideClear} .state=${this.state.clearButton} @icon-button:click=${this.handleClear}></ui-icon-button>
						<ui-icon-button ?hidden=${this.hideDelete} .state=${this.state.deleteButton} @icon-button:click=${this.handleDelete}></ui-icon-button>
					</div>
					<ui-search-input
						class="notification-panel-search glass"
						?hidden=${this.hideSearch}
						.state=${this.state.searchState}
						@search-input:input=${this.handleSearch}></ui-search-input>
					<ui-scroll-area class="notification-panel-scroll" .state=${this.state.scrollArea}>
						<div class="notification-panel-list">
							${this.filter('items', NotificationCenterItem, this.keepItem)}
						</div>
						<ui-empty-state class="notification-panel-empty glass" ?hidden=${this.hideInboxEmpty} .state=${this.state.emptyInbox}></ui-empty-state>
						<ui-empty-state class="notification-panel-empty glass" ?hidden=${this.hideFilterEmpty} .state=${this.state.emptyFilter}></ui-empty-state>
					</ui-scroll-area>
				</ui-slideout>
			</div>
		`;
	}
}
customElements.define('ui-notification-panel', UINotificationPanel);
