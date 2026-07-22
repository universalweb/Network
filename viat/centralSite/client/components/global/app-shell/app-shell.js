import { WebComponent } from 'webcomponent';
import { UINotification } from '../notification/notification.js';
/*
 * `<app-shell>` — the standard primary component shell. Every page mounts one
 * (the wallet app's <app-view> extends it; preview slots its gallery into a
 * bare instance) so page-global services live in ONE place:
 *
 *   - Notification stack: one top-layer <ui-notification>, fed by the `notify`
 *     delegate event from anywhere in the tree.
 *   - Viewport reflection into globalState.
 *
 * The base render is a bare <slot> — blank-slate per the defaults-tier rule;
 * subclasses replace render() with their own chrome.
 */
export class AppShell extends WebComponent {
	static url = import.meta.url;
	static styles = {
		appShell: './app-shell.css',
	};
	notificationPanel = null;
	onConnect() {
		this.reflectViewport();
	}
	onMount() {
		this.delegate('notify', this.handleNotify);
		/*
		 * Pre-warm the singleton notification host so it connects and adopts its
		 * styles well ahead of any user-driven notify. The host owns its OWN popover
		 * lifecycle (see UINotification.onConnect): it sets `popover="manual"` and
		 * shows itself AFTER its styles adopt, because handleConnect awaits
		 * applyStyles before onConnect. Showing the popover here synchronously
		 * (the old code did) opened it before adoption — that one-frame UA-default
		 * centered white box was the FOUC. Mounting only, ahead of time, removes it.
		 */
		this.ensureNotificationPanel();
	}
	ensureNotificationPanel() {
		if (this.notificationPanel?.isConnected) {
			return this.notificationPanel;
		}
		this.notificationPanel = new UINotification();
		document.body.appendChild(this.notificationPanel);
		return this.notificationPanel;
	}
	handleNotify(domEvent) {
		this.ensureNotificationPanel().show(domEvent.detail?.data ?? {});
	}
	onDisconnect() {
		this.notificationPanel?.remove();
		this.notificationPanel = null;
	}
	render() {
		this.html`<slot></slot>`;
	}
}
customElements.define('app-shell', AppShell);
