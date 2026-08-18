/*
	DESCRIPTION: Shared Google Maps JS API loader for ui-map-google.
	Classic callback bootstrap (key + libraries + callback) — the most reliable
	dynamic load path. Avoids the bare `loading=async` script tag without Google's
	inline bootstrap, which leaves `importLibrary` missing and the map blank.
	Returns a typed result envelope (errors-handling ladder).
*/

const DEFAULT_VERSION = 'weekly';
const DEFAULT_LIBRARIES = [
	'maps',
	'marker',
	'geometry',
];
const CALLBACK_NAME = '__uwcGmapsInit';

/** @type {Promise<{ok:true, maps:object}|{ok:false, errKind:string, message:string}>|null} */
let loadPromise = null;
/** @type {object|null} */
let mapsApi = null;
/** @type {string} */
let installedKey = '';

function normalizeLibraries(libraries) {
	if (Array.isArray(libraries) && libraries.length > 0) {
		return libraries;
	}
	if (typeof libraries === 'string' && libraries.trim()) {
		return libraries.split(',').map(trimLibrary).filter(Boolean);
	}
	return DEFAULT_LIBRARIES.slice();
}

function trimLibrary(value) {
	return String(value).trim();
}

function failResult(errKind, message) {
	return {
		ok: false,
		errKind,
		message,
	};
}

function successResult(maps) {
	return {
		ok: true,
		maps,
	};
}

function resolveLiveMaps() {
	const maps = globalThis.google?.maps;
	if (!maps) {
		return null;
	}
	// Live when Map exists (classic) or importLibrary can return libraries.
	if (maps.Map || typeof maps.importLibrary === 'function') {
		return maps;
	}
	return null;
}

function injectScript(apiKey, version, language, region, libraries) {
	return new Promise(function scriptLoadExecutor(accept) {
		const existing = resolveLiveMaps();
		if (existing) {
			mapsApi = existing;
			accept(successResult(existing));
			return;
		}

		const previousCallback = globalThis[CALLBACK_NAME];
		let settled = false;

		function settle(result) {
			if (settled) {
				return;
			}
			settled = true;
			if (previousCallback === undefined) {
				try {
					globalThis[CALLBACK_NAME] = undefined;
				} catch {
					// best-effort global cleanup
				}
			} else {
				globalThis[CALLBACK_NAME] = previousCallback;
			}
			accept(result);
		}

		globalThis[CALLBACK_NAME] = function onGoogleMapsReady() {
			const maps = resolveLiveMaps();
			if (!maps) {
				settle(failResult(
					'load-incomplete',
					'Google Maps script called back but google.maps.Map is unavailable',
				));
				return;
			}
			mapsApi = maps;
			installedKey = apiKey;
			settle(successResult(maps));
		};

		const params = new URLSearchParams();
		params.set('key', apiKey);
		params.set('v', version || DEFAULT_VERSION);
		params.set('callback', CALLBACK_NAME);
		const libraryList = normalizeLibraries(libraries);
		// Classic URL libraries (comma list). Prefer names the legacy loader
		// understands; "maps" is always present in the modern core.
		const urlLibraries = [];
		const libraryCount = libraryList.length;
		for (let index = 0; index < libraryCount; index += 1) {
			const name = libraryList[index];
			// "maps" is the core bundle — not always a URL library param.
			if (name && name !== 'maps') {
				// Legacy URL uses places/geometry/drawing; "marker" is modern-only
				// and is pulled via importLibrary after load when available.
				if (name === 'geometry' || name === 'places' || name === 'drawing' || name === 'visualization') {
					urlLibraries.push(name);
				}
			}
		}
		if (urlLibraries.length > 0) {
			params.set('libraries', urlLibraries.join(','));
		}
		if (language) {
			params.set('language', language);
		}
		if (region) {
			params.set('region', region);
		}

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
		script.async = true;
		script.dataset.uwcGmaps = '1';
		script.addEventListener('error', function onScriptError() {
			settle(failResult('script-error', 'Failed to load the Google Maps JavaScript API script (network or blocked)'));
		}, {
			once: true,
		});
		document.head.appendChild(script);
	});
}

async function ensureLibraries(maps, libraries) {
	const list = normalizeLibraries(libraries);
	if (typeof maps.importLibrary !== 'function') {
		// Classic full load — Map is already on the namespace.
		if (maps.Map) {
			return successResult(maps);
		}
		return failResult('load-incomplete', 'Google Maps loaded without Map or importLibrary');
	}
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const libraryName = list[index];
		try {
			await maps.importLibrary(libraryName);
		} catch (cause) {
			if (libraryName === 'maps') {
				// Core may already be present from classic load.
				if (!maps.Map) {
					return failResult(
						'library-error',
						`Failed to import Google Maps library "maps": ${cause?.message || cause}`,
					);
				}
			}
			// marker/geometry optional when the classic constructors already work
		}
	}
	return successResult(maps);
}

/**
 * Load the Google Maps JS API once and ensure requested libraries.
 * @param {{ apiKey: string, version?: string, language?: string, region?: string, libraries?: string[]|string }} options
 * @returns {Promise<{ok:true, maps:object}|{ok:false, errKind:string, message:string}>}
 */
export async function loadGoogleMapsApi(options) {
	const apiKey = String(options?.apiKey || '').trim();
	if (!apiKey) {
		return failResult('missing-key', 'A Google Maps API key is required (state.apiKey)');
	}

	const live = resolveLiveMaps();
	if (live) {
		return ensureLibraries(live, options?.libraries);
	}

	if (loadPromise) {
		const shared = await loadPromise;
		if (!shared.ok) {
			return shared;
		}
		return ensureLibraries(shared.maps, options?.libraries);
	}

	loadPromise = injectScript(
		apiKey,
		options?.version || DEFAULT_VERSION,
		options?.language || '',
		options?.region || '',
		options?.libraries,
	).then(async function afterScript(result) {
		if (!result.ok) {
			loadPromise = null;
			return result;
		}
		return ensureLibraries(result.maps, options?.libraries);
	});

	const outcome = await loadPromise;
	if (!outcome.ok) {
		loadPromise = null;
	}
	return outcome;
}

/** Reset the singleton (tests / hot-reload). Does not unload Google's script. */
export function resetGoogleMapsLoader() {
	loadPromise = null;
	mapsApi = null;
	installedKey = '';
}

export function getGoogleMapsApi() {
	return mapsApi || resolveLiveMaps();
}

export function getInstalledMapsKey() {
	return installedKey;
}
