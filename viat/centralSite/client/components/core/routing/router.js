// Generic URL router for the WebComponent framework — the app-agnostic engine
// that replaces the hand-rolled per-app router. Built on the History API: routes
// match against the pathname AFTER the configured `root` is stripped, so an app
// mounted under a subdirectory (`/new/`) still resolves `/swap/` correctly.
//
// Routes support `:name` parameters — `{ id: 'transaction', path: '/tx/:id/' }`
// matches `/tx/abc123/` → `params = { id: 'abc123' }`. Values are URI-decoded on
// extract and URI-encoded when building a URL.
//
// TWO advances over a plain router, both driven by real needs:
//
//  1. OWN REACTIVE STORE. Every navigation publishes the resolved route into a
//     dedicated `Store` (`routerStore`) instead of polluting the app-wide
//     `globalState` with `route*` keys. Components consume it through the named-
//     store channel: `static stores = { router: routerStore }` + `this.stores.
//     router.activeView`, `bind('stores.router.path')`, or `this.observeStore`.
//
//  2. LAYERED ROUTES. One engine holds a priority-ordered stack of `RouteLayer`s
//     behind a SINGLE popstate listener and a SINGLE capture-phase link
//     interceptor. Resolution walks layers by priority (a login flow lazily
//     `addLayer`s its user routes at a higher priority; the same URL resolves to
//     the user route while present and falls through to the default layer once
//     `removeLayer` drops it at logout). Adding/removing a layer re-resolves the
//     current URL immediately. This keeps the initial public bundle small while
//     richer logged-in routes load on demand.
//
// A lazily-loaded module reaches the live engine through `Router.primary` (set on
// `start()`), so it never needs a handle to the app that created the router.
import { defaultLogger } from '../debug/logger.js';
import { Store } from '../state/globalState.js';
import { isObject, isString } from '../utilities.js';
export const ROUTER_CONFIG = {
	root: '/',
	interceptLinks: true,
	store: null,
	routes: [],
	fallback: null,
};
// The store components bind — one shared reactive slice for the whole app's
// route state. A bespoke router may pass its own `store` in config instead.
export const routerStore = Store.create();
const DEFAULT_LAYER = 'default';
const REGEX_ESCAPE = /[.+*?^${}()|[\]\\]/g;
const PARAM_TOKEN = /:([A-Za-z_][A-Za-z0-9_]*)/g;
// Keys the store publish owns — a route entry may NOT use them as custom fields
// (the core publish pass overwrites them) and they never spread as custom keys.
// `id`/`path` ARE legitimate route fields (handled by the core pass); the rest
// are engine-internal or published-output names.
const RESERVED_ROUTE_KEYS = new Set([
	'id',
	'path',
	'params',
	'query',
	'layer',
	'activeView',
	'layerName',
	'paramNames',
	'regex',
]);
// The published-output names an app route entry must not shadow — a subset of the
// reserved set minus the legitimate `id`/`path`/internal-compile fields. A hit is
// a silent-overwrite footgun, so it warns at compile time.
const OUTPUT_RESERVED_KEYS = new Set([
	'params',
	'query',
	'layer',
	'activeView',
]);
function trimSlashes(value) {
	let next = value;
	if (!next.startsWith('/')) {
		next = `/${next}`;
	}
	if (!next.endsWith('/')) {
		next = `${next}/`;
	}
	return next;
}
function normalizePath(value) {
	if (!value || value === '/') {
		return '/';
	}
	return trimSlashes(value);
}
function findAnchor(path) {
	const pathLength = path.length;
	for (let index = 0; index < pathLength; index += 1) {
		const node = path[index];
		if (node?.tagName === 'A') {
			return node;
		}
	}
	return null;
}
function buildQueryString(query) {
	if (!query || !isObject(query)) {
		return '';
	}
	const params = new URLSearchParams();
	const keys = Object.keys(query).sort();
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index += 1) {
		const key = keys[index];
		const value = query[key];
		if (value == null || value === '') {
			continue;
		}
		params.set(key, String(value));
	}
	return params.toString();
}
// Dev-only guard: a route entry using a published-output name as a custom field
// would be silently clobbered by the core publish pass. Warn at compile so it is
// caught at authoring, not by a mystery-missing field at runtime.
function warnReservedRouteKeys(route) {
	const keys = Object.keys(route);
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index += 1) {
		const key = keys[index];
		if (OUTPUT_RESERVED_KEYS.has(key)) {
			defaultLogger.warn(`Router route "${route.id ?? route.path}" declares reserved field "${key}" — it is overwritten by the published route state; rename it.`);
		}
	}
}
function compileRoute(route, layerName) {
	warnReservedRouteKeys(route);
	const path = normalizePath(route.path);
	const paramNames = [];
	const tokenMatches = path.matchAll(PARAM_TOKEN);
	for (const tokenMatch of tokenMatches) {
		paramNames.push(tokenMatch[1]);
	}
	const escaped = path.replace(REGEX_ESCAPE, '\\$&');
	const pattern = escaped.replace(PARAM_TOKEN, '([^/]+)');
	return {
		...route,
		path,
		layerName,
		paramNames,
		regex: new RegExp(`^${pattern}$`),
	};
}
function compileRoutes(routes, layerName) {
	const source = routes || [];
	const sourceLength = source.length;
	const compiled = new Array(sourceLength);
	for (let index = 0; index < sourceLength; index += 1) {
		compiled[index] = compileRoute(source[index], layerName);
	}
	return compiled;
}
function extractParams(route, match) {
	const params = {};
	const paramNames = route.paramNames;
	const paramNamesLength = paramNames.length;
	for (let index = 0; index < paramNamesLength; index += 1) {
		const paramName = paramNames[index];
		const raw = match[index + 1];
		// decodeURIComponent throws on a malformed %-sequence in an external URL;
		// fall back to the raw capture rather than reject the whole match.
		try {
			params[paramName] = decodeURIComponent(raw);
		} catch {
			params[paramName] = raw;
		}
	}
	return params;
}
// Priority DESC, then insertion sequence DESC — a later-added layer of equal
// priority wins, so a freshly registered login layer shadows the default.
function compareLayers(left, right) {
	if (left.priority !== right.priority) {
		return right.priority - left.priority;
	}
	return right.sequence - left.sequence;
}
function historyState(route, params, query) {
	return {
		routeId: route.id,
		params,
		query,
	};
}
// One priority band of routes. A layer owns its compiled routes (declaration
// order preserved — literal segments before `:param` captures) and an optional
// fallback used when nothing in ANY layer matches.
export class RouteLayer {
	constructor(layerName, config = {}, sequence = 0) {
		this.name = layerName;
		this.priority = config.priority ?? 0;
		this.sequence = sequence;
		this.routes = compileRoutes(config.routes, layerName);
		this.fallback = config.fallback ? compileRoute(config.fallback, layerName) : null;
	}
}
// Handle returned by `router.on()` — an object with an `unsubscribe()` so the
// callback channel matches the store `Subscription` shape.
class RouterSubscription {
	constructor(router, handler) {
		this.router = router;
		this.handler = handler;
	}
	unsubscribe() {
		this.router.handlers.delete(this.handler);
	}
}
export class Router {
	// The live engine a lazily-loaded module reaches to `addLayer` without a
	// handle to the app. Set by the first `start()`, cleared by its `stop()`.
	static primary = null;
	static create(config) {
		return new Router(config);
	}
	static is(value) {
		return value instanceof Router;
	}
	constructor(config = {}) {
		const merged = {
			...ROUTER_CONFIG,
			...config,
		};
		this.root = trimSlashes(merged.root || '/');
		this.interceptLinks = merged.interceptLinks !== false;
		this.store = merged.store || routerStore;
		this.layerMap = new Map();
		this.layerList = [];
		this.layerSequence = 0;
		this.handlers = new Set();
		this.current = null;
		this.started = false;
		this.linkTarget = null;
		this.publishedCustomKeys = [];
		// The declarative default layer. Only THIS layer auto-falls-back to its
		// first route (ported from the app router); `addLayer` layers stay
		// fallback-null so they fall THROUGH instead of capturing unmatched URLs.
		if (merged.routes?.length || merged.fallback) {
			const routes = merged.routes || [];
			this.addLayer(DEFAULT_LAYER, {
				routes,
				fallback: merged.fallback || routes[0] || null,
				priority: 0,
			});
		}
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'popstate') {
			this.dispatch(this.currentPath());
			return;
		}
		if (domEvent.type === 'click') {
			this.handleLinkClick(domEvent);
		}
	}
	handleLinkClick(domEvent) {
		if (domEvent.defaultPrevented || domEvent.button !== 0) {
			return;
		}
		if (domEvent.metaKey || domEvent.ctrlKey || domEvent.shiftKey || domEvent.altKey) {
			return;
		}
		const anchor = findAnchor(domEvent.composedPath ? domEvent.composedPath() : [domEvent.target]);
		if (!anchor) {
			return;
		}
		if (anchor.target && anchor.target !== '_self') {
			return;
		}
		if (anchor.hasAttribute('download')) {
			return;
		}
		const rel = (anchor.getAttribute('rel') || '').toLowerCase();
		if (rel.split(/\s+/).includes('external')) {
			return;
		}
		const href = anchor.getAttribute('href');
		if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
			return;
		}
		// Explicit escape hatch — the author wants a real navigation (full reload,
		// leave the SPA). Honoured before route resolution so the browser does its
		// default thing.
		if (anchor.hasAttribute('data-route-passthrough')) {
			return;
		}
		const url = new URL(href, globalThis.location.href);
		if (url.origin !== globalThis.location.origin) {
			return;
		}
		const matched = this.matchPath(this.toAppPath(url.pathname));
		if (!matched) {
			return;
		}
		const query = Object.fromEntries(url.searchParams);
		domEvent.preventDefault();
		this.navigate(matched.route.id, matched.params, query);
	}
	addLayer(layerName, layerConfig = {}) {
		this.layerSequence += 1;
		const layer = new RouteLayer(layerName, layerConfig, this.layerSequence);
		this.layerMap.set(layerName, layer);
		this.sortLayers();
		this.refresh();
		return layer;
	}
	removeLayer(layerName) {
		if (!this.layerMap.delete(layerName)) {
			return false;
		}
		this.sortLayers();
		this.refresh();
		return true;
	}
	getLayer(layerName) {
		return this.layerMap.get(layerName) || null;
	}
	hasLayer(layerName) {
		return this.layerMap.has(layerName);
	}
	sortLayers() {
		const layers = [...this.layerMap.values()];
		layers.sort(compareLayers);
		this.layerList = layers;
	}
	// After a layer mutation, re-resolve the current URL: a started engine
	// dispatches (may redirect to a fallback — the logout-off-a-user-URL case);
	// an unstarted one just republishes the store with no history side effects.
	refresh() {
		if (this.started) {
			this.dispatch(this.currentPath());
			return;
		}
		this.prime();
	}
	resolveFallback() {
		const layers = this.layerList;
		const layersLength = layers.length;
		for (let index = 0; index < layersLength; index += 1) {
			if (layers[index].fallback) {
				return layers[index].fallback;
			}
		}
		return null;
	}
	toAppPath(pathname) {
		if (!pathname) {
			return '/';
		}
		if (this.root === '/') {
			return normalizePath(pathname);
		}
		if (pathname === this.root || `${pathname}/` === this.root) {
			return '/';
		}
		if (pathname.startsWith(this.root)) {
			return normalizePath(pathname.slice(this.root.length - 1));
		}
		return normalizePath(pathname);
	}
	currentPath() {
		return this.toAppPath(globalThis.location?.pathname || '/');
	}
	currentQuery() {
		const search = globalThis.location?.search || '';
		if (!search) {
			return {};
		}
		return Object.fromEntries(new URLSearchParams(search));
	}
	matchPath(path) {
		const target = normalizePath(path);
		const layers = this.layerList;
		const layersLength = layers.length;
		for (let layerIndex = 0; layerIndex < layersLength; layerIndex += 1) {
			const routes = layers[layerIndex].routes;
			const routesLength = routes.length;
			for (let routeIndex = 0; routeIndex < routesLength; routeIndex += 1) {
				const route = routes[routeIndex];
				const match = route.regex.exec(target);
				if (match) {
					return {
						route,
						params: extractParams(route, match),
					};
				}
			}
		}
		return null;
	}
	findById(id) {
		if (!id) {
			return null;
		}
		const layers = this.layerList;
		const layersLength = layers.length;
		for (let layerIndex = 0; layerIndex < layersLength; layerIndex += 1) {
			const routes = layers[layerIndex].routes;
			const routesLength = routes.length;
			for (let routeIndex = 0; routeIndex < routesLength; routeIndex += 1) {
				if (routes[routeIndex].id === id) {
					return routes[routeIndex];
				}
			}
		}
		return null;
	}
	findByPath(path) {
		return this.matchPath(path)?.route ?? null;
	}
	resolve(target) {
		if (target == null || target === '') {
			return this.resolveFallback();
		}
		if (isObject(target)) {
			if (target.regex && target.path) {
				return target;
			}
			if (target.id) {
				return this.findById(target.id);
			}
			return this.resolveFallback();
		}
		if (isString(target)) {
			if (target.startsWith('/')) {
				return this.findByPath(target) || this.resolveFallback();
			}
			return this.findById(target) || this.resolveFallback();
		}
		return this.resolveFallback();
	}
	urlFor(target, params = {}, query = {}) {
		const route = this.resolve(target);
		if (!route) {
			return this.root;
		}
		let path = route.path;
		if (route.paramNames?.length) {
			const paramNamesLength = route.paramNames.length;
			for (let index = 0; index < paramNamesLength; index += 1) {
				const paramName = route.paramNames[index];
				const value = params?.[paramName];
				if (value == null) {
					return this.root;
				}
				path = path.replace(`:${paramName}`, encodeURIComponent(value));
			}
		}
		const basePath = path === '/' ? this.root : this.root + path.slice(1);
		const queryString = buildQueryString(query);
		return queryString ? `${basePath}?${queryString}` : basePath;
	}
	// Resolve + publish the current URL WITHOUT touching history or attaching
	// listeners — safe to call before render (so a deep link paints its target
	// page on first paint) and on every layer mutation of an unstarted engine.
	prime() {
		const matched = this.matchPath(this.currentPath());
		const route = matched?.route || this.resolveFallback();
		if (!route) {
			return null;
		}
		this.notify(route, matched?.params || {}, this.currentQuery());
		return route;
	}
	start() {
		if (this.started) {
			return this.current;
		}
		this.started = true;
		Router.primary ??= this;
		globalThis.addEventListener('popstate', this);
		if (this.interceptLinks) {
			this.attachLinkListener(globalThis.document);
		}
		return this.dispatch(this.currentPath());
	}
	stop() {
		if (!this.started) {
			return;
		}
		this.started = false;
		globalThis.removeEventListener('popstate', this);
		this.detachLinkListener();
		if (Router.primary === this) {
			Router.primary = null;
		}
	}
	attachLinkListener(target = globalThis.document) {
		if (!target || this.linkTarget) {
			return;
		}
		this.linkTarget = target;
		target.addEventListener('click', this, true);
	}
	detachLinkListener() {
		if (!this.linkTarget) {
			return;
		}
		this.linkTarget.removeEventListener('click', this, true);
		this.linkTarget = null;
	}
	navigate(target, params = {}, query = {}) {
		const route = this.resolve(target);
		if (!route) {
			return null;
		}
		const url = this.urlFor(route, params, query);
		const currentUrl = `${globalThis.location?.pathname || ''}${globalThis.location?.search || ''}`;
		if (currentUrl !== url) {
			globalThis.history.pushState(historyState(route, params, query), '', url);
		}
		this.notify(route, params, query);
		return route;
	}
	replace(target, params = {}, query = {}) {
		const route = this.resolve(target);
		if (!route) {
			return null;
		}
		const url = this.urlFor(route, params, query);
		globalThis.history.replaceState(historyState(route, params, query), '', url);
		this.notify(route, params, query);
		return route;
	}
	dispatch(path) {
		const matched = this.matchPath(path);
		if (matched) {
			this.notify(matched.route, matched.params, this.currentQuery());
			return matched.route;
		}
		const fallback = this.resolveFallback();
		if (!fallback) {
			return null;
		}
		const fallbackUrl = this.urlFor(fallback);
		if (globalThis.location?.pathname !== fallbackUrl) {
			globalThis.history.replaceState({
				routeId: fallback.id,
				redirectedFrom: path,
			}, '', fallbackUrl);
		}
		this.notify(fallback, {}, {});
		return fallback;
	}
	notify(route, params = {}, query = {}) {
		this.current = {
			...route,
			params,
			query,
		};
		this.publishState();
		this.fireHandlers();
	}
	// Publish the resolved route into the store in three passes: (1) null out
	// custom keys the previous route published that this one lacks (so a stale
	// `filter` never lingers), (2) spread this route's own custom fields, (3)
	// write the core keys last so they always win. The store's equality guard
	// suppresses no-op notifications.
	publishState() {
		const route = this.current ?? {};
		const update = {};
		const previousKeys = this.publishedCustomKeys;
		const previousKeysLength = previousKeys.length;
		for (let index = 0; index < previousKeysLength; index += 1) {
			const key = previousKeys[index];
			if (!Object.hasOwn(route, key)) {
				update[key] = null;
			}
		}
		const customKeys = [];
		const routeKeys = Object.keys(route);
		const routeKeysLength = routeKeys.length;
		for (let index = 0; index < routeKeysLength; index += 1) {
			const key = routeKeys[index];
			if (RESERVED_ROUTE_KEYS.has(key)) {
				continue;
			}
			update[key] = route[key];
			customKeys.push(key);
		}
		update.id = route.id ?? '';
		update.path = this.currentPath();
		update.params = route.params ?? {};
		update.query = route.query ?? {};
		update.layer = route.layerName ?? '';
		update.activeView = route.view || route.section || route.id || '';
		this.store.set(update);
		this.publishedCustomKeys = customKeys;
	}
	fireHandlers() {
		const current = this.current;
		for (const handler of this.handlers) {
			handler(current);
		}
	}
	on(handler) {
		this.handlers.add(handler);
		return new RouterSubscription(this, handler);
	}
	off(handler) {
		this.handlers.delete(handler);
	}
}
