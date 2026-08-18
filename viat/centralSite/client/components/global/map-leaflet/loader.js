/*
	DESCRIPTION: Shared Leaflet CDN loader (script + stylesheet). Singleton —
	one network fetch, concurrent callers share the promise. Result envelope.
*/
const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
/** @type {Promise<{ok:true, L:object}|{ok:false, errKind:string, message:string}>|null} */
let loadPromise = null;
/** @type {object|null} */
let leafletApi = null;
/** @type {HTMLLinkElement|null} */
let styleElement = null;
/** @type {HTMLScriptElement|null} */
let scriptElement = null;
function failResult(errKind, message) {
	return {
		ok: false,
		errKind,
		message,
	};
}
function successResult(leaflet) {
	return {
		ok: true,
		L: leaflet,
	};
}
function resolveExisting() {
	const leaflet = globalThis.L;
	if (leaflet?.map && leaflet?.tileLayer) {
		leafletApi = leaflet;
		return successResult(leaflet);
	}
	return null;
}
function appendLeafletLink(host) {
	if (!host || typeof host.appendChild !== 'function') {
		return null;
	}
	if (typeof host.querySelector === 'function' && host.querySelector('link[data-uwc-leaflet="1"]')) {
		return null;
	}
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = LEAFLET_CSS;
	link.dataset.uwcLeaflet = '1';
	host.appendChild(link);
	return link;
}
/**
 * Leaflet CSS must reach the map host. document.head alone does not style
 * shadow-DOM canvases — pass the component shadowRoot when mounting.
 * @param {ShadowRoot|ParentNode|null} [styleRoot]
 * @param {(() => void)|null} [onReady] - called when the stylesheet is usable
 */
export function ensureLeafletStyles(styleRoot, onReady) {
	const notify = typeof onReady === 'function' ? onReady : null;
	if (styleRoot) {
		const existing = typeof styleRoot.querySelector === 'function' ? styleRoot.querySelector('link[data-uwc-leaflet="1"]') : null;
		if (existing) {
			if (notify) {
				if (existing.sheet) {
					notify();
				} else {
					existing.addEventListener('load', notify, {
						once: true,
					});
				}
			}
			return;
		}
		const link = appendLeafletLink(styleRoot);
		if (link && notify) {
			link.addEventListener('load', notify, {
				once: true,
			});
		}
		return;
	}
	if (styleElement?.isConnected) {
		if (notify) {
			if (styleElement.sheet) {
				notify();
			} else {
				styleElement.addEventListener('load', notify, {
					once: true,
				});
			}
		}
		return;
	}
	styleElement = appendLeafletLink(document.head) || styleElement;
	if (styleElement && notify) {
		styleElement.addEventListener('load', notify, {
			once: true,
		});
	}
}
function ensureStylesheet() {
	ensureLeafletStyles(null);
}
function injectScript() {
	return new Promise((accept) => {
		const existing = resolveExisting();
		if (existing) {
			accept(existing);
			return;
		}
		if (scriptElement) {
			scriptElement.addEventListener('load', () => {
				const ready = resolveExisting();
				accept(ready || failResult('load-incomplete', 'Leaflet script loaded but L is unavailable'));
			}, {
				once: true,
			});
			scriptElement.addEventListener('error', () => {
				accept(failResult('script-error', 'Failed to load Leaflet from CDN'));
			}, {
				once: true,
			});
			return;
		}
		ensureStylesheet();
		const script = document.createElement('script');
		script.src = LEAFLET_JS;
		script.async = true;
		script.dataset.uwcLeaflet = '1';
		script.addEventListener('load', () => {
			const ready = resolveExisting();
			accept(ready || failResult('load-incomplete', 'Leaflet script loaded but L is unavailable'));
		}, {
			once: true,
		});
		script.addEventListener('error', () => {
			scriptElement = null;
			accept(failResult('script-error', 'Failed to load Leaflet from CDN'));
		}, {
			once: true,
		});
		scriptElement = script;
		document.head.appendChild(script);
	});
}
/**
 * @returns {Promise<{ok:true, L:object}|{ok:false, errKind:string, message:string}>}
 */
export async function loadLeaflet() {
	const existing = resolveExisting();
	if (existing) {
		return existing;
	}
	if (loadPromise) {
		return loadPromise;
	}
	loadPromise = injectScript().then((result) => {
		if (!result.ok) {
			loadPromise = null;
		}
		return result;
	});
	return loadPromise;
}
export function getLeaflet() {
	return leafletApi || globalThis.L || null;
}
export function resetLeafletLoader() {
	loadPromise = null;
	leafletApi = null;
	scriptElement = null;
	styleElement = null;
}
