// URL router built on the History API. Routes are matched against the
// pathname AFTER the configured `root` is stripped, so an app mounted under
// a subdirectory (e.g. `/new/`) still resolves `/swap/` correctly.
//
// Routes support `:name` parameters: `{ id: 'transaction', path: '/tx/:id/' }`
// matches `/tx/abc123/` and produces `params = { id: 'abc123' }`. Values are
// URI-decoded on extract and URI-encoded on `navigate()`.
//
// When `interceptLinks` is enabled (default), the router captures click
// events on any same-origin <a> whose href falls under `root` and routes
// it via pushState. External links, target=_blank, modifier-clicks, hash
// fragments, and unknown paths are left to the browser.
//
// SINGLE SOURCE OF TRUTH: every navigation publishes the resolved route
// to `globalState` under top-level keys (`routeId`, `routeView`,
// `routeSection`, `routeFilter`, `routeParams`, `routeQuery`, `routePath`).
// Downstream components observe whichever key they care about — neither the
// app shell nor the dock needs to be wired up to a router callback.
import { globalState } from 'webcomponent';
export const URL_ROUTER_CONFIG = {
	root: '/',
	interceptLinks: true,
};
const REGEX_ESCAPE = /[.+*?^${}()|[\]\\]/g;
const PARAM_TOKEN = /:([A-Za-z_][A-Za-z0-9_]*)/g;
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
	for (let index = 0; index < path.length; index += 1) {
		const node = path[index];
		if (node?.tagName === 'A') {
			return node;
		}
	}
	return null;
}
function buildQueryString(query) {
	if (!query || typeof query !== 'object') {
		return '';
	}
	const params = new URLSearchParams();
	const keys = Object.keys(query).sort();
	for (let index = 0; index < keys.length; index += 1) {
		const key = keys[index];
		const value = query[key];
		if (value == null || value === '') {
			continue;
		}
		params.set(key, String(value));
	}
	return params.toString();
}
function compileRoute(route) {
	const path = normalizePath(route.path);
	const paramNames = [];
	const escaped = path.replace(REGEX_ESCAPE, '\\$&');
	const pattern = escaped.replace(PARAM_TOKEN, (_, paramName) => {
		paramNames.push(paramName);
		return '([^/]+)';
	});
	return {
		...route,
		path,
		paramNames,
		regex: new RegExp(`^${pattern}$`),
	};
}
export class URLRouter {
	constructor(config = {}) {
		const merged = {
			...URL_ROUTER_CONFIG,
			...config,
		};
		this.root = trimSlashes(merged.root || '/');
		this.routes = (merged.routes || []).map(compileRoute);
		this.fallback = merged.fallback ? compileRoute(merged.fallback) : (this.routes[0] ?? null);
		this.interceptLinks = merged.interceptLinks !== false;
		this.handlers = new Set();
		this.current = null;
		this.started = false;
		this.linkTarget = null;
	}
	handlePop = () => {
		this.dispatch(this.currentPath());
	};
	handleLinkClick = (domEvent) => {
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
		// Explicit escape hatch — author wants a real navigation (full
		// reload, leave the SPA, hard-clear state, etc.). Honoured before
		// any route resolution so the browser does its default thing.
		if (anchor.hasAttribute('data-route-passthrough')) {
			return;
		}
		const url = new URL(href, globalThis.location.href);
		if (url.origin !== globalThis.location.origin) {
			return;
		}
		const appPath = this.toAppPath(url.pathname);
		const matched = this.matchPath(appPath);
		if (!matched) {
			return;
		}
		const query = Object.fromEntries(url.searchParams);
		domEvent.preventDefault();
		this.navigate(matched.route.id, matched.params, query);
	};
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
	findById(id) {
		if (!id) {
			return null;
		}
		return this.routes.find((route) => {
			return route.id === id;
		}) || null;
	}
	matchPath(path) {
		const target = normalizePath(path);
		for (let index = 0; index < this.routes.length; index += 1) {
			const route = this.routes[index];
			const match = route.regex.exec(target);
			if (!match) {
				continue;
			}
			const params = {};
			for (let pi = 0; pi < route.paramNames.length; pi += 1) {
				const paramName = route.paramNames[pi];
				const raw = match[pi + 1];
				try {
					params[paramName] = decodeURIComponent(raw);
				} catch {
					params[paramName] = raw;
				}
			}
			return {
				route,
				params,
			};
		}
		return null;
	}
	findByPath(path) {
		return this.matchPath(path)?.route ?? null;
	}
	resolve(target) {
		if (target == null || target === '') {
			return this.fallback;
		}
		if (typeof target === 'object') {
			if (target.regex && target.path) {
				return target;
			}
			if (target.id) {
				return this.findById(target.id);
			}
			return this.fallback;
		}
		if (typeof target === 'string') {
			if (target.startsWith('/')) {
				return this.findByPath(target) || this.fallback;
			}
			return this.findById(target) || this.fallback;
		}
		return this.fallback;
	}
	urlFor(target, params = {}, query = {}) {
		const route = this.resolve(target);
		if (!route) {
			return this.root;
		}
		let path = route.path;
		if (route.paramNames?.length) {
			for (let index = 0; index < route.paramNames.length; index += 1) {
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
	currentQuery() {
		const search = globalThis.location?.search || '';
		if (!search) {
			return {};
		}
		return Object.fromEntries(new URLSearchParams(search));
	}
	start() {
		if (this.started) {
			return this.current;
		}
		this.started = true;
		globalThis.addEventListener('popstate', this.handlePop);
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
		globalThis.removeEventListener('popstate', this.handlePop);
		this.detachLinkListener();
	}
	attachLinkListener(target = globalThis.document) {
		if (!target || this.linkTarget) {
			return;
		}
		this.linkTarget = target;
		target.addEventListener('click', this.handleLinkClick, true);
	}
	detachLinkListener() {
		if (!this.linkTarget) {
			return;
		}
		this.linkTarget.removeEventListener('click', this.handleLinkClick, true);
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
			globalThis.history.pushState({
				routeId: route.id,
				params,
				query,
			}, '', url);
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
		globalThis.history.replaceState({
			routeId: route.id,
			params,
			query,
		}, '', url);
		this.notify(route, params, query);
		return route;
	}
	dispatch(path) {
		const matched = this.matchPath(path);
		const query = this.currentQuery();
		if (!matched && this.fallback) {
			const fallbackUrl = this.urlFor(this.fallback);
			if (globalThis.location?.pathname !== fallbackUrl) {
				globalThis.history.replaceState({
					routeId: this.fallback.id,
					redirectedFrom: path,
				}, '', fallbackUrl);
			}
			this.notify(this.fallback, {}, {});
			return this.fallback;
		}
		const route = matched?.route || this.fallback;
		const params = matched?.params || {};
		if (!route) {
			return null;
		}
		this.notify(route, params, query);
		return route;
	}
	notify(route, params = {}, query = {}) {
		this.current = {
			...route,
			params,
			query,
		};
		this.publishGlobal();
		this.handlers.forEach((handler) => {
			handler(this.current);
		});
	}
	publishGlobal() {
		// Single broadcast point. Components observe whichever top-level
		// key they care about (routeView for AppView's page swap,
		// routeSection for the dock, routeFilter for the explorer, etc.).
		// `setGlobal` already short-circuits structurally-equal writes so
		// repeated same-page navigations don't trigger downstream renders.
		const route = this.current ?? {};
		globalState.set({
			routeId: route.id ?? '',
			routePath: this.currentPath(),
			routeView: route.view ?? '',
			routeSection: route.section ?? '',
			routeFilter: route.filter ?? '',
			routeParams: route.params ?? {},
			routeQuery: route.query ?? {},
		});
	}
	on(handler) {
		this.handlers.add(handler);
		return () => {
			this.handlers.delete(handler);
		};
	}
}
