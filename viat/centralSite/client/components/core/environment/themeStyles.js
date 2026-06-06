/*
 * Per-component theme sub-modules — lazy-loaded, hot-swapped.
 *
 * A component opts in with `static themes = ['midnight', 'noir', …]` (the theme
 * ids it ships a `./themes/{id}.css` file for) and calls `this.applyThemeStyles()`
 * once in `onConnect`. The ACTIVE theme's sheet is adopted into the shadow root
 * (keyed, AFTER the base styles so it wins the cascade) and re-swapped on every
 * `theme:change`.
 *
 * Only the active theme's file is ever fetched — an app pays for what it uses.
 * styleApi's sheet cache keys by resolved URL, so a theme file loads once per
 * session and every later instance / swap reuses it synchronously; `addStyle`
 * replaces the keyed sheet in one atomic adoptedStyleSheets assignment, so a
 * swap never drops to the unstyled base for a frame (flash-free).
 *
 * Chain-aware: walks the class chain so a base component's `themes/` (e.g.
 * `panel/themes/`) reaches every subclass, while a subclass may layer its own
 * `themes/` on top — mirroring how `static styles` chain-merge. Layers adopt
 * base → self, so a subclass override wins.
 *
 * Tokens stay GLOBAL: the document `:root` theme <link> still drives the colour
 * custom properties, which inherit through the shadow boundary. These sub-modules
 * carry ONLY the per-component RULE overrides a theme wants — the rules that
 * cannot reach a shadow root from the document level.
 */
import { hasOwn, isArray } from '../utilities.js';
import { collectClassChain } from '../attrs/staticConfig.js';
const THEME_KEY_PREFIX = 'theme:';
/*
 * Layer list is static per class — the chain never changes — so compute it once
 * and cache. Keeps the auto-invoke in the connect lifecycle near-free for the
 * common (non-themed) component: a single WeakMap hit returning an empty array.
 */
const layerCache = new WeakMap();
function activeThemeId() {
	return document.documentElement.dataset.theme || '';
}
/*
 * Each chain class that declares its OWN `static themes` list is a theme layer.
 * Returns them base → self (adoption order = subclass wins). `hasOwn` excludes
 * inherited lists, so a subclass without its own `themes/` adds no layer — it
 * still inherits the base layer's sheet via the chain walk.
 */
function themedLayers(ComponentClass) {
	const cached = layerCache.get(ComponentClass);
	if (cached) {
		return cached;
	}
	const chain = collectClassChain(ComponentClass);
	const layers = [];
	for (let chainIndex = 0; chainIndex < chain.length; chainIndex++) {
		const layerClass = chain[chainIndex];
		if (hasOwn(layerClass, 'themes') && isArray(layerClass.themes) && hasOwn(layerClass, 'url')) {
			layers.push({
				layerClass,
				key: `${THEME_KEY_PREFIX}${layerClass.name}`,
			});
		}
	}
	layerCache.set(ComponentClass, layers);
	return layers;
}
/**
 * Adopt (or clear) every themed layer's sub-module for a theme id, in chain
 * order so a subclass layer wins. A layer that ships no file for `themeId` has
 * its keyed sheet removed, so switching to a theme a component doesn't restyle
 * drops cleanly back to base styles + the global tokens. Awaited per layer so
 * adoptedStyleSheets ends in base → self order.
 * @param {string} themeId - The theme to sync to.
 * @returns {Promise<void>} Resolves once every layer is adopted/cleared.
 */
export async function syncThemeStyles(themeId) {
	const layers = themedLayers(this.constructor);
	for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
		const {
			layerClass, key,
		} = layers[layerIndex];
		if (themeId && layerClass.themes.includes(themeId)) {
			await this.addStyle(key, `./themes/${themeId}.css`, layerClass.url);
		} else if (this.hasStyle(key)) {
			await this.removeStyle(key);
		}
	}
}
/*
 * `theme:change` handler — re-sync to the new id. The bus invokes with
 * `this` = the component (delegate routes `handler.call(owner, …)`); the new id
 * rides the event payload, falling back to the document attribute.
 */
export function handleThemeChange(domEvent) {
	const nextId = domEvent?.detail?.data?.id ?? activeThemeId();
	return this.syncThemeStyles(nextId);
}
/**
 * Opt a component into per-theme sub-modules. Call once in `onConnect` and await
 * it — `onConnect` runs before first paint, so the active theme's rules land
 * pre-render with no FOUC. Adopts the active theme now and re-swaps on every
 * `theme:change`; the delegate subscription auto-tears-down on disconnect (and
 * re-subscribes if the element reconnects). No-op for a component with no themed
 * layer in its chain.
 * @returns {Promise<void>|null} The initial adoption, awaitable to gate first paint.
 */
export function applyThemeStyles() {
	if (!themedLayers(this.constructor).length) {
		return null;
	}
	this.delegate('theme:change', this.handleThemeChange);
	return this.syncThemeStyles(activeThemeId());
}
