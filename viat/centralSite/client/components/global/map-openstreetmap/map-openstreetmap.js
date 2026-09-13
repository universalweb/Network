/*
	DESCRIPTION: ui-map-openstreetmap — OpenStreetMap-first map host (https://www.openstreetmap.org/).
	Extends ui-map-leaflet (CDN Leaflet engine) with OSM tile layer presets, correct
	attribution, Nominatim geocode, and a one-click open on openstreetmap.org.
	No API key required for standard public tiles. Events use the map-openstreetmap:
	feature prefix (not map-leaflet:).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-map-openstreetmap
	    .state.center=${{ lat: 51.505, lng: -0.09 }}
	    .state.zoom=${13}
	    .state.layer=${'standard'}
	    .state.items=${[{ id: 'a', lat: 51.5, lng: -0.09, label: 'Spot' }]}
	    @map-openstreetmap:select=${this.handlePick}></ui-map-openstreetmap>
	  // el.openInOsm()  →  open current view on openstreetmap.org
	  // await el.geocode('Berlin')  →  { ok, results }
	─────────────────────────────────────────────────────────────────────
*/
import { UIMapLeaflet } from '../map-leaflet/map-leaflet.js';

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/** Named OSM / OSM-community tile presets (public, no key). */
const OSM_LAYERS = {
	standard: {
		tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		tileAttribution: OSM_ATTRIBUTION,
		maxZoom: 19,
	},
	humanitarian: {
		tileUrl: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
		tileAttribution: `${OSM_ATTRIBUTION}, Tiles style by Humanitarian OpenStreetMap Team`,
		maxZoom: 19,
	},
	cyclosm: {
		tileUrl: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
		tileAttribution: `${OSM_ATTRIBUTION}, CyclOSM`,
		maxZoom: 20,
	},
	topo: {
		tileUrl: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
		tileAttribution: `${OSM_ATTRIBUTION}, <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a>`,
		maxZoom: 17,
	},
};

function layerConfig(layerName) {
	return OSM_LAYERS[layerName] || OSM_LAYERS.standard;
}

export class UIMapOpenStreetMap extends UIMapLeaflet {
	static url = import.meta.url;
	static styles = {
		// Reuse leaflet chrome; path is relative to this module (static.url).
		leaflet: '../map-leaflet/leaflet.css',
		openstreetmap: './map-openstreetmap.css',
	};
	static state = {
		// OSM community layer preset — drives tileUrl / attribution when set.
		layer: 'standard',
		emptyLabel: 'OpenStreetMap',
		tileUrl: OSM_LAYERS.standard.tileUrl,
		tileAttribution: OSM_LAYERS.standard.tileAttribution,
		// Optional Nominatim countrycodes filter (e.g. 'us,gb')
		geocodeCountrycodes: '',
	};

	onConnect() {
		super.onConnect();
		this.observe([
			'layer',
		], this.applyOsmLayer);
		// Seed tiles from the default layer before first paint of the basemap.
		this.applyOsmLayer();
	}

	mapEvent(action) {
		return `map-openstreetmap:${action}`;
	}

	loadingLabel() {
		return 'Loading OpenStreetMap…';
	}

	applyOsmLayer() {
		const config = layerConfig(this.state.layer);
		// Only override tileUrl when the caller is still on a known preset URL
		// (or empty) — custom tileUrl from the consumer is preserved.
		const currentUrl = String(this.state.tileUrl || '');
		const isPresetUrl = !currentUrl || this.isKnownPresetUrl(currentUrl);
		if (isPresetUrl) {
			this.state.tileUrl = config.tileUrl;
			this.state.tileAttribution = config.tileAttribution;
		}
		if (config.maxZoom && (!this.state.maxZoom || this.state.maxZoom > config.maxZoom)) {
			// Cap maxZoom to what the tile server supports when still on defaults.
			if (this.state.maxZoom === 22 || this.state.maxZoom === 0) {
				this.state.maxZoom = config.maxZoom;
			}
		}
		if (this.mapInstance) {
			this.syncTileLayer();
		}
	}

	isKnownPresetUrl(url) {
		const keys = Object.keys(OSM_LAYERS);
		const count = keys.length;
		for (let index = 0; index < count; index += 1) {
			if (OSM_LAYERS[keys[index]].tileUrl === url) {
				return true;
			}
		}
		return false;
	}

	/** Absolute URL of the current view on openstreetmap.org. */
	osmViewUrl() {
		const center = this.state.center || {};
		const lat = Number(center.lat);
		const lng = Number(center.lng);
		const zoom = Number(this.state.zoom) || 2;
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			return 'https://www.openstreetmap.org/';
		}
		return `https://www.openstreetmap.org/#map=${Math.round(zoom)}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
	}

	/** Open the current map center/zoom on openstreetmap.org in a new tab. */
	openInOsm() {
		const url = this.osmViewUrl();
		globalThis.open(url, '_blank', 'noopener,noreferrer');
		return url;
	}

	/**
	 * Forward geocode via Nominatim (public OSM search).
	 * Respect https://operations.osmfoundation.org/policies/nominatim/ —
	 * use sparingly; prefer a self-hosted Nominatim for production volume.
	 * @param {string} query
	 * @returns {Promise<{ok:true, results:object[]}|{ok:false, errKind:string, message:string}>}
	 */
	async geocode(query) {
		const text = String(query || '').trim();
		if (!text) {
			return {
				ok: false,
				errKind: 'empty-query',
				message: 'Geocode query is empty',
			};
		}
		const params = new URLSearchParams();
		params.set('format', 'json');
		params.set('q', text);
		params.set('limit', '8');
		const countrycodes = String(this.state.geocodeCountrycodes || '').trim();
		if (countrycodes) {
			params.set('countrycodes', countrycodes);
		}
		try {
			const response = await globalThis.fetch(
				`https://nominatim.openstreetmap.org/search?${params.toString()}`,
				{
					headers: {
						Accept: 'application/json',
					},
				},
			);
			if (!response.ok) {
				return {
					ok: false,
					errKind: 'http-error',
					message: `Nominatim HTTP ${response.status}`,
				};
			}
			const payload = await response.json();
			const rows = Array.isArray(payload) ? payload : [];
			const results = [];
			const count = rows.length;
			for (let index = 0; index < count; index += 1) {
				const row = rows[index];
				const lat = Number(row.lat);
				const lng = Number(row.lon);
				if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
					continue;
				}
				results.push({
					id: String(row.place_id ?? index),
					label: row.display_name || text,
					lat,
					lng,
					kind: row.type || row.class || '',
					importance: row.importance,
					raw: row,
				});
			}
			return {
				ok: true,
				results,
			};
		} catch (cause) {
			return {
				ok: false,
				errKind: 'network-error',
				message: cause?.message || String(cause),
			};
		}
	}

	/**
	 * Fly to the first Nominatim hit for `query` (convenience).
	 * @param {string} query
	 */
	async searchAndFly(query) {
		const result = await this.geocode(query);
		if (!result.ok || result.results.length === 0) {
			this.emit(this.mapEvent('error'), {
				message: result.ok ? 'No results' : result.message,
				errKind: result.ok ? 'empty-results' : result.errKind,
			});
			return result;
		}
		const hit = result.results[0];
		this.flyTo({
			lat: hit.lat,
			lng: hit.lng,
		}, Math.max(Number(this.state.zoom) || 2, 14));
		this.emit(this.mapEvent('select'), {
			id: hit.id,
			item: hit,
			index: 0,
		});
		return result;
	}
}

customElements.define('ui-map-openstreetmap', UIMapOpenStreetMap);
