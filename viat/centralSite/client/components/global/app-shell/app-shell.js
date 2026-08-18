import { Router, routerStore, WebComponent } from 'webcomponent';
import { UINotification } from '../notification/notification.js';
/*
 * `<app-shell>` — the standard primary component shell. Every page mounts one
 * (the wallet app's <app-view> extends it; preview slots its gallery into a
 * bare instance) so page-global services live in ONE place:
 *
 *   - Notification stack: one top-layer <ui-notification>, fed by the `notify`
 *     delegate event from anywhere in the tree.
 *   - Viewport reflection into globalState.
 *   - URL routing (OPT-IN): a subclass that declares `static routes` (or a
 *     `static routerConfig`) turns the shell into the app's routing host — it
 *     creates the engine, primes the route store before first paint, starts it
 *     on mount, stops it on disconnect, and reflects the active view onto the
 *     host as `data-route-view` (subclass CSS keys off
 *     `:host([data-route-view='x'])`). A bare AppShell declares neither and
 *     stays fully routeless — the preview harness relies on this.
 *
 * The base render is a bare <slot> — blank-slate per the defaults-tier rule;
 * subclasses replace render() with their own chrome.
 */
export class AppShell extends WebComponent {
	static url = import.meta.url;
	static styles = {
		appShell: './app-shell.css',
	};
	static routes = null;
	static routerConfig = null;
	static stores = {
		router: routerStore,
	};
	notificationPanel = null;
	router = null;
	/*
	 * Lazily build the router from the subclass's declarative config the first
	 * time the shell connects. `static routes` is the canonical route source;
	 * `static routerConfig` carries the rest (root, interceptLinks, fallback).
	 * Neither declared → null, and the shell runs routeless.
	 */
	ensureRouter() {
		if (this.router) {
			return this.router;
		}
		const routes = this.constructor.routes;
		const routerConfig = this.constructor.routerConfig;
		if (!routes && !routerConfig) {
			return null;
		}
		const config = {
			...routerConfig,
		};
		if (routes) {
			config.routes = routes;
		}
		this.router = Router.create(config);
		return this.router;
	}
	onConnect() {
		this.reflectViewport();
		const router = this.ensureRouter();
		if (router) {
			// Prime BEFORE first render so a deep link paints its target page on
			// the first paint (not after a late start). `immediate` seeds the
			// reflection from the already-published route, so start-order is moot.
			router.prime();
			this.observeStore('router', 'activeView', this.reflectRouteView, {
				immediate: true,
			});
		}
	}
	/*
	 * Reflect the active view onto the host as a `data-route-view` attribute —
	 * the enumerated-dimension decoration doctrine (a `data-*` attr, not a class
	 * token that would collide with util classes). Subclass CSS shows/hides pages
	 * via `:host([data-route-view='x'])`.
	 */
	reflectRouteView(view) {
		if (view) {
			this.dataset.routeView = view;
			return;
		}
		this.removeAttribute('data-route-view');
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
		// Start routing once self + all descendants have mounted (onMount gates on
		// whenMounted), so the route publishes into a tree that already exists —
		// this replaces the old hand-rolled "await both dashboards, then start".
		this.router?.start();
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
	// Generic navigation passthrough for subclasses / composition roots.
	navigate(target, params, query) {
		return this.router ? this.router.navigate(target, params, query) : null;
	}
	onDisconnect() {
		this.notificationPanel?.remove();
		this.notificationPanel = null;
		this.router?.stop();
	}
	render() {
		this.html`<slot></slot>`;
	}
}
customElements.define('app-shell', AppShell);
