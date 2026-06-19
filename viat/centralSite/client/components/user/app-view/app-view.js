import { UINotification } from '../../global/notification/notification.js';
import VIATClientSDK from 'viat';
import { WebComponent } from 'webcomponent';
/*
 * `<app-shell>` — the standard primary component shell. Every page mounts one
 * (the wallet app's <app-view> extends it; preview slots its gallery into a
 * bare instance) so page-global services live in ONE place:
 *
 *   - SDK singleton: class-owned (`AppView.ensureSDK()` / `AppView.freshSDK()`).
 *     The SDK carries private keys and walletSeeds — it stays off globalState;
 *     consumers call the statics (or `this.sdk` / `this.ensureSDK()` from a
 *     subclass) instead of importing a registry module.
 *   - Notification stack: one top-layer <ui-notification>, fed by the `notify`
 *     delegate event from anywhere in the tree.
 *   - Viewport reflection into globalState.
 *
 * The base render is a bare <slot> — blank-slate per the defaults-tier rule;
 * subclasses replace render() with their own chrome.
 */
export class AppView extends WebComponent {
	static url = import.meta.url;
	static styles = {
		appView: './app-view.css',
	};
	/*
	 * SDK singleton — page-global, class-owned. Statics reference `AppView`
	 * explicitly so subclasses share the ONE instance instead of shadowing it.
	 */
	static sdk = null;
	static async ensureSDK() {
		if (AppView.sdk) {
			return AppView.sdk;
		}
		AppView.sdk = await VIATClientSDK.create();
		return AppView.sdk;
	}
	/*
	 * The SDK's `set(key, value)` shadows prototype methods with the same name
	 * (setting `primaryKeypair` / `trapdoorKeypair` replaces the method refs on
	 * the instance), so a second `setKeypairs()` on one instance would invoke an
	 * object as a function. Any operation that runs `setKeypairs` from scratch
	 * (create / load) swaps the whole instance through here instead.
	 */
	static async freshSDK() {
		AppView.sdk = await VIATClientSDK.create();
		return AppView.sdk;
	}
	// Instance conveniences so subclass handlers read naturally.
	get sdk() {
		return AppView.sdk;
	}
	ensureSDK() {
		return AppView.ensureSDK();
	}
	freshSDK() {
		return AppView.freshSDK();
	}
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
		this.html `<slot></slot>`;
	}
}
customElements.define('app-shell', AppView);
