/*
	DESCRIPTION: Shared OpenLayers CDN loader (script + stylesheet). Singleton —
	one network fetch, concurrent callers share the promise. Result envelope.
*/

const OL_VERSION = 'v10.4.0';
const OL_CSS = `https://cdn.jsdelivr.net/npm/ol@${OL_VERSION}/ol.css`;
const OL_JS = `https://cdn.jsdelivr.net/npm/ol@${OL_VERSION}/dist/ol.js`;

/** @type {Promise<{ok:true, ol:object}|{ok:false, errKind:string, message:string}>|null} */
let loadPromise = null;
/** @type {object|null} */
let olApi = null;
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

function successResult(olNs) {
	return {
		ok: true,
		ol: olNs,
	};
}

function resolveExisting() {
	const olNs = globalThis.ol;
	if (olNs?.Map && olNs?.layer && olNs?.source) {
		olApi = olNs;
		return successResult(olNs);
	}
	return null;
}

function appendOpenLayersLink(host) {
	if (!host || typeof host.appendChild !== 'function') {
		return null;
	}
	if (typeof host.querySelector === 'function' && host.querySelector('link[data-uwc-openlayers="1"]')) {
		return null;
	}
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = OL_CSS;
	link.dataset.uwcOpenlayers = '1';
	host.appendChild(link);
	return link;
}

/**
 * OpenLayers CSS must reach the map host. document.head alone does not style
 * shadow-DOM canvases — pass the component shadowRoot when mounting.
 * @param {ShadowRoot|ParentNode|null} [styleRoot]
 * @param {(() => void)|null} [onReady] called when the stylesheet is usable
 */
export function ensureOpenLayersStyles(styleRoot, onReady) {
	const notify = typeof onReady === 'function' ? onReady : null;
	if (styleRoot) {
		const existing = typeof styleRoot.querySelector === 'function'
			? styleRoot.querySelector('link[data-uwc-openlayers="1"]')
			: null;
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
		const link = appendOpenLayersLink(styleRoot);
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
	styleElement = appendOpenLayersLink(document.head) || styleElement;
	if (styleElement && notify) {
		styleElement.addEventListener('load', notify, {
			once: true,
		});
	}
}

function ensureStylesheet() {
	ensureOpenLayersStyles(null);
}

function injectScript() {
	return new Promise(function scriptLoadExecutor(accept) {
		const existing = resolveExisting();
		if (existing) {
			accept(existing);
			return;
		}
		if (scriptElement) {
			scriptElement.addEventListener('load', function onExistingLoad() {
				const ready = resolveExisting();
				accept(ready || failResult('load-incomplete', 'OpenLayers script loaded but ol is unavailable'));
			}, {
				once: true,
			});
			scriptElement.addEventListener('error', function onExistingError() {
				accept(failResult('script-error', 'Failed to load OpenLayers from CDN'));
			}, {
				once: true,
			});
			return;
		}
		ensureStylesheet();
		const script = document.createElement('script');
		script.src = OL_JS;
		script.async = true;
		script.dataset.uwcOpenlayers = '1';
		script.addEventListener('load', function onInjectLoad() {
			const ready = resolveExisting();
			accept(ready || failResult('load-incomplete', 'OpenLayers script loaded but ol is unavailable'));
		}, {
			once: true,
		});
		script.addEventListener('error', function onInjectError() {
			scriptElement = null;
			accept(failResult('script-error', 'Failed to load OpenLayers from CDN'));
		}, {
			once: true,
		});
		scriptElement = script;
		document.head.appendChild(script);
	});
}

/**
 * @returns {Promise<{ok:true, ol:object}|{ok:false, errKind:string, message:string}>}
 */
export async function loadOpenLayers() {
	const existing = resolveExisting();
	if (existing) {
		return existing;
	}
	if (loadPromise) {
		return loadPromise;
	}
	loadPromise = injectScript().then(function afterScript(result) {
		if (!result.ok) {
			loadPromise = null;
		}
		return result;
	});
	return loadPromise;
}

export function getOpenLayers() {
	return olApi || globalThis.ol || null;
}

export function resetOpenLayersLoader() {
	loadPromise = null;
	olApi = null;
	scriptElement = null;
	styleElement = null;
}
