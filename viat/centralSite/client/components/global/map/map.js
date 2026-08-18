/*
	DESCRIPTION: ui-map — general multi-provider item / event map board.
	Composes a map host (OpenStreetMap by default) with an item list and a
	detail panel. Items carry a `kind` (flight, fire, crime, accident, …);
	selection shows curated fields, a custom detail tag, or an auto key/value dump.
	Default: list + markers are limited to the current map viewport (listInView /
	mapInView) so large datasets do not overwhelm the page.
	Providers: openstreetmap | leaflet | openlayers | google
	  (tags: ui-map-openstreetmap | ui-map-leaflet | ui-map-openlayers | ui-map-google)
	`mapProvider: 'auto'` → google when apiKey, leaflet when tileUrl, else OSM.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-map
	    .state.center=${{ lat: 51.47, lng: -0.46 }}
	    .state.items=${items}
	    @map:select=${this.handleItem}></ui-map>
	  // Outside → map:  mapEl.goToItem('blast1')  ·  mapEl.goTo({ lat, lng })
	  // Template:       .method.goToItem(${id})   ·  .method.goTo(${point})
	  // listInView/mapInView default true (viewport only)
	  // Camera is mirrored on pan/zoom so mapProvider swaps keep the same location
	  // Force provider: .state.mapProvider=${'openstreetmap'|'leaflet'|…}
	─────────────────────────────────────────────────────────────────────
*/
import '../map-google/map-google.js';
import '../map-leaflet/map-leaflet.js';
import '../map-openlayers/map-openlayers.js';
import '../map-opensky/map-opensky.js';
import '../map-openstreetmap/map-openstreetmap.js';
import { html, plainEqual, WebComponent } from 'webcomponent';
import {
	isFiniteNumber,
	normalizeBounds,
	reuseBounds,
	reuseLatLng,
	sameBounds,
	sameLatLng,
	toLatLng,
} from './map-geo.js';
const DEFAULT_CENTER = {
	lat: 51.47,
	lng: -0.46,
};
/** Keys never auto-dumped into the generic detail grid (mapping / chrome). */
const RESERVED_DETAIL_KEYS = new Set([
	'id',
	'lat',
	'lng',
	'latitude',
	'longitude',
	'lon',
	'coords',
	'position',
	'marker',
	'kind',
	'active',
	'iconColor',
	'tone',
	'icon',
	'description',
	'label',
	'kindLabel',
	'meta',
	'mapItems',
]);
const MAP_PROVIDER_ALIASES = {
	auto: 'auto',
	openstreetmap: 'openstreetmap',
	osm: 'openstreetmap',
	leaflet: 'leaflet',
	openlayers: 'openlayers',
	ol: 'openlayers',
	google: 'google',
	gmaps: 'google',
	'google-map': 'google',
	'google-maps': 'google',
	opensky: 'opensky',
	'open-sky': 'opensky',
	'opensky-network': 'opensky',
	'map-google': 'google',
	'map-leaflet': 'leaflet',
	'map-openlayers': 'openlayers',
	'map-openstreetmap': 'openstreetmap',
	'map-opensky': 'opensky',
};
const DEFAULT_MAP_PROVIDER = 'openstreetmap';
const INCIDENT_FIELDS = [
	'details',
	'severity',
	'status',
	'when',
	'reportedAt',
	'address',
];
const DEFAULT_KINDS = {
	flight: {
		label: 'Flight',
		marker: 'plane',
		tone: 'success',
		fields: [
			'callsign',
			'icao24',
			'altitude',
			'speed',
			'heading',
			'originCountry',
			'squawk',
		],
	},
	accident: {
		label: 'Accident',
		marker: 'pin',
		tone: 'danger',
		fields: [
			'details',
			'severity',
			'vehicles',
			'injuries',
			'status',
			'when',
			'address',
		],
	},
	crime: {
		label: 'Crime',
		marker: 'pin',
		tone: 'danger',
		fields: [
			'details',
			'offense',
			'severity',
			'status',
			'when',
			'address',
		],
	},
	explosion: {
		label: 'Explosion',
		marker: 'pin',
		tone: 'danger',
		fields: [
			'size',
			'details',
			'severity',
			'when',
			'address',
		],
	},
	fire: {
		label: 'Fire',
		marker: 'pin',
		tone: 'danger',
		fields: [
			'details',
			'severity',
			'status',
			'units',
			'when',
			'address',
		],
	},
	flood: {
		label: 'Flood',
		marker: 'pin',
		tone: 'primary',
		fields: INCIDENT_FIELDS,
	},
	hazard: {
		label: 'Hazard',
		marker: 'pin',
		tone: 'warning',
		fields: INCIDENT_FIELDS,
	},
	traffic: {
		label: 'Traffic',
		marker: 'pin',
		tone: 'warning',
		fields: [
			'details',
			'severity',
			'delay',
			'status',
			'when',
			'address',
		],
	},
	medical: {
		label: 'Medical',
		marker: 'pin',
		tone: 'danger',
		fields: INCIDENT_FIELDS,
	},
	police: {
		label: 'Police',
		marker: 'pin',
		tone: 'primary',
		fields: INCIDENT_FIELDS,
	},
	weather: {
		label: 'Weather',
		marker: 'pin',
		tone: 'accent',
		fields: [
			'details',
			'severity',
			'conditions',
			'when',
		],
	},
	sos: {
		label: 'SOS',
		marker: 'pin',
		tone: 'danger',
		fields: INCIDENT_FIELDS,
	},
	event: {
		label: 'Event',
		marker: 'pin',
		tone: 'warning',
		fields: [
			'details',
			'capacity',
			'when',
			'address',
		],
	},
	place: {
		label: 'Place',
		marker: 'pin',
		tone: 'accent',
		fields: [
			'details',
			'address',
			'category',
		],
	},
	default: {
		label: 'Item',
		marker: 'pin',
		tone: 'neutral',
	},
};
const TONE_COLORS = {
	success: '#22c55e',
	warning: '#f59e0b',
	danger: '#ef4444',
	accent: '#6366f1',
	primary: '#3b82f6',
	neutral: '#94a3b8',
};
/**
 * Point-in-bounds (handles antimeridian when west > east).
 * pad is a fraction of span (0.05 = 5% each side).
 */
function pointInBounds(lat, lng, bounds, pad) {
	if (!bounds || !isFiniteNumber(lat) || !isFiniteNumber(lng)) {
		return false;
	}
	const padding = isFiniteNumber(pad) ? pad : 0;
	let north = bounds.north;
	let south = bounds.south;
	let east = bounds.east;
	let west = bounds.west;
	if (padding > 0) {
		const latSpan = Math.max(0.0001, north - south);
		let lngSpan = east - west;
		if (lngSpan < 0) {
			lngSpan += 360;
		}
		lngSpan = Math.max(0.0001, lngSpan);
		const latPad = latSpan * padding;
		const lngPad = lngSpan * padding;
		north += latPad;
		south -= latPad;
		east += lngPad;
		west -= lngPad;
	}
	if (lat > north || lat < south) {
		return false;
	}
	if (west <= east) {
		return lng >= west && lng <= east;
	}
	// Crosses antimeridian
	return lng >= west || lng <= east;
}
function itemId(raw, index) {
	if (raw?.id != null && raw.id !== '') {
		return String(raw.id);
	}
	if (raw?.icao24) {
		return String(raw.icao24);
	}
	if (raw?.callsign) {
		return String(raw.callsign).trim();
	}
	return String(index);
}
function itemLabel(raw) {
	const label = String(raw?.label || raw?.callsign || raw?.name || raw?.title || '').trim();
	if (label) {
		return label;
	}
	return String(raw?.icao24 || raw?.id || 'Item');
}
function humanizeKey(key) {
	const text = String(key || '')
		.replaceAll(/([a-z])([A-Z])/g, '$1 $2')
		.replaceAll(/[_-]+/g, ' ')
		.trim();
	if (!text) {
		return '';
	}
	return text.charAt(0).toUpperCase() + text.slice(1);
}
function formatDetailValue(value) {
	if (value == null || value === '') {
		return '—';
	}
	if (typeof value === 'boolean') {
		return value ? 'yes' : 'no';
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	return String(value);
}
function normalizeKindEntry(entry) {
	if (!entry || typeof entry !== 'object') {
		return {
			...DEFAULT_KINDS.default,
		};
	}
	return {
		label: entry.label || DEFAULT_KINDS.default.label,
		marker: entry.marker || DEFAULT_KINDS.default.marker,
		tone: entry.tone || DEFAULT_KINDS.default.tone,
		fields: Array.isArray(entry.fields) ? entry.fields : null,
		detailTag: entry.detailTag ? String(entry.detailTag) : '',
		metaKeys: Array.isArray(entry.metaKeys) ? entry.metaKeys : null,
	};
}
function mergeKinds(custom) {
	const out = {};
	const defaults = Object.keys(DEFAULT_KINDS);
	const defaultCount = defaults.length;
	for (let index = 0; index < defaultCount; index += 1) {
		const key = defaults[index];
		out[key] = normalizeKindEntry(DEFAULT_KINDS[key]);
	}
	if (!custom || typeof custom !== 'object') {
		return out;
	}
	const keys = Object.keys(custom);
	const count = keys.length;
	for (let index = 0; index < count; index += 1) {
		const key = keys[index];
		const base = out[key] || normalizeKindEntry(DEFAULT_KINDS.default);
		const next = normalizeKindEntry(custom[key]);
		out[key] = {
			...base,
			...next,
			fields: custom[key]?.fields === undefined ? base.fields : next.fields,
			metaKeys: custom[key]?.metaKeys === undefined ? base.metaKeys : next.metaKeys,
			detailTag: custom[key]?.detailTag === undefined ? base.detailTag : next.detailTag,
		};
	}
	return out;
}
function normalizeItem(raw, index, kinds) {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return null;
	}
	const position = toLatLng(raw) || toLatLng(raw.position) || toLatLng(raw.coords);
	if (!position) {
		return null;
	}
	const kindKey = String(raw.kind || 'default').toLowerCase() || 'default';
	const kindDef = kinds[kindKey] || kinds.default || normalizeKindEntry(DEFAULT_KINDS.default);
	const id = itemId(raw, index);
	const label = itemLabel(raw);
	return {
		...raw,
		id,
		lat: position.lat,
		lng: position.lng,
		kind: kindKey,
		label,
		kindLabel: kindDef.label || kindKey,
		marker: raw.marker || kindDef.marker || 'pin',
		tone: raw.tone || kindDef.tone || 'success',
	};
}
function normalizeList(list, kinds) {
	const out = [];
	if (!Array.isArray(list)) {
		return out;
	}
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const item = normalizeItem(list[index], index, kinds);
		if (item) {
			out.push(item);
		}
	}
	return out;
}
function ingestPayload(payload, kinds) {
	if (!payload) {
		return [];
	}
	if (Array.isArray(payload)) {
		return normalizeList(payload, kinds);
	}
	if (Array.isArray(payload.items)) {
		return normalizeList(payload.items, kinds);
	}
	if (Array.isArray(payload.states)) {
		return normalizeList(payload.states, kinds);
	}
	if (Array.isArray(payload.flights)) {
		return normalizeList(payload.flights, kinds);
	}
	if (Array.isArray(payload.events)) {
		return normalizeList(payload.events, kinds);
	}
	return [];
}
function buildMetaLine(item, kindDef) {
	if (item.meta) {
		return String(item.meta);
	}
	if (item.description) {
		return String(item.description);
	}
	const keys = kindDef.metaKeys || kindDef.fields;
	if (!Array.isArray(keys) || keys.length === 0) {
		return '';
	}
	const parts = [];
	const max = Math.min(keys.length, 3);
	for (let index = 0; index < max; index += 1) {
		const key = typeof keys[index] === 'string' ? keys[index] : keys[index]?.key;
		if (!key || RESERVED_DETAIL_KEYS.has(key) || key === 'label') {
			continue;
		}
		const value = item[key];
		if (value == null || value === '') {
			continue;
		}
		parts.push(formatDetailValue(value));
	}
	return parts.join(' · ');
}
function mapItemsFromBoard(items, activeId, kinds) {
	const out = [];
	const seen = new Set();
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		const id = String(item.id ?? index);
		if (seen.has(id)) {
			continue;
		}
		seen.add(id);
		const kindDef = kinds[item.kind] || kinds.default || {};
		const active = id === String(activeId || '');
		const tone = item.tone || kindDef.tone || 'success';
		const marker = item.marker || kindDef.marker || 'pin';
		// Keep kind + marker aligned so hosts do not double-detect plane glyphs.
		const kind = marker === 'plane' || item.kind === 'flight' ? 'aircraft' : (item.kind || 'default');
		out.push({
			id,
			lat: item.lat,
			lng: item.lng,
			label: item.label,
			description: item.meta || item.description || '',
			heading: isFiniteNumber(item.heading) ? item.heading : null,
			marker,
			kind,
			active,
			iconColor: active ? (TONE_COLORS.warning || '#f59e0b') : (TONE_COLORS[tone] || TONE_COLORS.success),
			tone: active ? 'warning' : tone,
		});
	}
	return out;
}
function normalizeMapProvider(value) {
	const key = String(value || 'auto').toLowerCase().trim();
	return MAP_PROVIDER_ALIASES[key] || 'auto';
}
function resolveMapProvider(state) {
	const requested = normalizeMapProvider(state?.mapProvider);
	if (requested !== 'auto') {
		return requested;
	}
	if (String(state?.apiKey || '').trim()) {
		return 'google';
	}
	if (String(state?.tileUrl || '').trim()) {
		return 'leaflet';
	}
	return DEFAULT_MAP_PROVIDER;
}
function fieldLabel(field) {
	if (field && typeof field === 'object') {
		return field.label || humanizeKey(field.key);
	}
	return humanizeKey(field);
}
function fieldKey(field) {
	if (field && typeof field === 'object') {
		return field.key;
	}
	return field;
}
export class UIMap extends WebComponent {
	static url = import.meta.url;
	static styles = {
		map: './map.css',
	};
	static state = {
		// 'auto' | 'openstreetmap' | 'leaflet' | 'openlayers' | 'google'
		mapProvider: 'auto',
		mapLayer: 'standard',
		tileUrl: '',
		tileAttribution: '',
		apiKey: '',
		mapId: '',
		center: {
			lat: DEFAULT_CENTER.lat,
			lng: DEFAULT_CENTER.lng,
		},
		zoom: 8,
		heading: '',
		listHeading: 'Items',
		showList: true,
		showDetail: true,
		// Side list only includes items inside the current map viewport (default).
		listInView: true,
		// Markers only for items inside the viewport (default — large datasets).
		mapInView: true,
		// Fraction of viewport span to pad when testing in-view (edge items).
		viewPad: 0.08,
		// Live map camera bounds { north, south, east, west } from host idle/view.
		viewBounds: null,
		// Count of all normalized items (for meta: "N in view · M total").
		itemTotal: 0,
		items: [],
		// Enriched rows for the side list (stable identity for list()).
		listItems: [],
		// Marker payload for the nested map host (includes traffic when present).
		mapItems: [],
		// User markers only — OpenSky host merges its own traffic stream.
		userMapItems: [],
		// Live traffic from hosts such as OpenSky (merged after user items).
		trafficItems: [],
		// OpenSky poll / auth (passed through when mapProvider is opensky)
		openskyPollMs: 12000,
		openskyShowTraffic: true,
		openskyApiUser: '',
		openskyApiPassword: '',
		// Kind registry: { [kind]: { label, marker, tone, fields?, detailTag?, metaKeys? } }
		kinds: {
			...DEFAULT_KINDS,
		},
		// Built pairs for the generic detail grid.
		detailPairs: [],
		activeIndex: '',
		// Pan/fly map when an item is selected from the list (default).
		flyOnSelect: true,
		loader: null,
		endpoint: '',
		pollMs: 0,
		loading: false,
		errorMessage: '',
		lastUpdated: 0,
		// Default false — viewport list/markers own framing; fit-all fights goTo on OL.
		fitItems: false,
	};
	pollTimer = null;
	loadGeneration = 0;
	abortController = null;
	/**
	 * Plain (non-reactive) last live camera. Host fragments seed from this so a
	 * parent re-bind of seed center/zoom on provider switch cannot yank the map.
	 * Shape: { center: { lat, lng }, zoom, bounds } | null
	 */
	lastCamera = null;
	onConnect() {
		// Do NOT observe center for polling — pan/zoom mirrors camera continuously
		// for provider-switch retention; a poll restart on every pan is wrong.
		this.observe([
			'loader',
			'endpoint',
			'pollMs',
		], this.restartPolling);
		this.observe([
			'items',
			'activeIndex',
			'kinds',
			'listInView',
			'mapInView',
			'viewPad',
			'viewBounds',
		], this.syncDerivedViews);
		this.observe(['mapProvider'], this.onMapProviderChange);
	}
	onMount() {
		this.syncDerivedViews();
		// Poll only while visible — same policy as ui-map-opensky.
		if (this.isVisible) {
			this.restartPolling();
		}
	}
	onIntersect(isIntersecting) {
		if (isIntersecting) {
			this.restartPolling();
			return;
		}
		this.stopPolling();
		this.abortController?.abort();
		this.abortController = null;
	}
	onDisconnect() {
		this.stopPolling();
		this.abortController?.abort();
		this.abortController = null;
	}
	onRender() {
		this.syncCustomDetail();
	}
	kindsTable() {
		return mergeKinds(this.state.kinds);
	}
	kindDef(kindKey) {
		const kinds = this.kindsTable();
		const key = String(kindKey || 'default').toLowerCase();
		return kinds[key] || kinds.default || normalizeKindEntry(DEFAULT_KINDS.default);
	}
	restartPolling() {
		this.stopPolling();
		const hasSource = typeof this.state.loader === 'function' || String(this.state.endpoint || '').trim();
		if (!hasSource) {
			return;
		}
		if (!this.isVisible) {
			return;
		}
		this.refreshItems();
		const pollMs = Number(this.state.pollMs) || 0;
		if (pollMs > 0) {
			this.pollTimer = this.addInterval(this.onPollTick, pollMs);
		}
	}
	stopPolling() {
		if (this.pollTimer != null) {
			this.stopInterval(this.pollTimer);
			this.pollTimer = null;
		}
	}
	onPollTick(component) {
		component.refreshItems();
	}
	async refreshItems() {
		if (!this.isVisible) {
			return;
		}
		const generation = (this.loadGeneration += 1);
		this.abortController?.abort();
		const controller = new AbortController();
		this.abortController = controller;
		this.state.loading = true;
		const result = await this.loadItemData(controller.signal);
		if (generation !== this.loadGeneration) {
			return;
		}
		if (!result.ok) {
			this.assignState({
				loading: false,
				errorMessage: result.message,
			});
			this.emit('map:error', {
				message: result.message,
				errKind: result.errKind,
			});
			return;
		}
		this.assignState({
			items: result.items,
			loading: false,
			errorMessage: '',
			lastUpdated: Date.now(),
		});
		this.syncDerivedViews();
		this.emit('map:change', {
			items: result.items,
			count: result.items.length,
		});
	}
	async loadItemData(signal) {
		const kinds = this.kindsTable();
		const loader = this.state.loader;
		if (typeof loader === 'function') {
			try {
				const payload = await loader({
					signal,
					center: toLatLng(this.state.center) || DEFAULT_CENTER,
				});
				return {
					ok: true,
					items: ingestPayload(payload, kinds),
				};
			} catch (cause) {
				if (cause?.name === 'AbortError') {
					return {
						ok: false,
						errKind: 'aborted',
						message: 'Map load aborted',
					};
				}
				return {
					ok: false,
					errKind: 'loader-error',
					message: cause?.message || String(cause),
				};
			}
		}
		const endpoint = String(this.state.endpoint || '').trim();
		if (!endpoint) {
			return {
				ok: true,
				items: normalizeList(this.state.items, kinds),
			};
		}
		try {
			const response = await globalThis.fetch(endpoint, {
				signal,
				headers: {
					Accept: 'application/json',
				},
			});
			if (!response.ok) {
				return {
					ok: false,
					errKind: 'http-error',
					message: `HTTP ${response.status}`,
				};
			}
			const payload = await response.json();
			return {
				ok: true,
				items: ingestPayload(payload, kinds),
			};
		} catch (cause) {
			if (cause?.name === 'AbortError') {
				return {
					ok: false,
					errKind: 'aborted',
					message: 'Map load aborted',
				};
			}
			return {
				ok: false,
				errKind: 'network-error',
				message: cause?.message || String(cause),
			};
		}
	}
	normalizedItems() {
		const kinds = this.kindsTable();
		const user = normalizeList(this.state.items, kinds);
		const traffic = normalizeList(this.state.trafficItems, kinds);
		if (traffic.length === 0) {
			return user;
		}
		// User items win on id collision; traffic fills the rest.
		const out = [];
		const seen = new Set();
		const userCount = user.length;
		for (let index = 0; index < userCount; index += 1) {
			const item = user[index];
			const id = String(item.id);
			seen.add(id);
			out.push(item);
		}
		const trafficCount = traffic.length;
		for (let index = 0; index < trafficCount; index += 1) {
			const item = traffic[index];
			const id = String(item.id);
			if (seen.has(id)) {
				continue;
			}
			seen.add(id);
			out.push(item);
		}
		return out;
	}
	/** Current camera bounds from host, or state.viewBounds. */
	liveBounds() {
		const host = this.getMapHost();
		const fromHost = normalizeBounds(host?.getMapView?.()?.bounds);
		if (fromHost) {
			return fromHost;
		}
		return normalizeBounds(this.state.viewBounds);
	}
	itemInView(item, bounds) {
		if (!item) {
			return false;
		}
		const pad = Number(this.state.viewPad);
		return pointInBounds(item.lat, item.lng, bounds, Number.isFinite(pad) ? pad : 0.08);
	}
	filterInView(items, forceIncludeId) {
		const bounds = this.liveBounds();
		if (!bounds) {
			// Camera not ready yet — keep full set so first paint / fitItems works.
			return items;
		}
		const out = [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			if (forceIncludeId && item.id === forceIncludeId) {
				out.push(item);
				continue;
			}
			if (this.itemInView(item, bounds)) {
				out.push(item);
			}
		}
		return out;
	}
	syncDerivedViews() {
		const kinds = this.kindsTable();
		const items = this.normalizedItems();
		const userItems = normalizeList(this.state.items, kinds);
		const activeId = String(this.state.activeIndex || '');
		const listSource = this.state.listInView === false ? items : this.filterInView(items, activeId);
		const mapSource = this.state.mapInView === false ? items : this.filterInView(items, activeId);
		const userMapSource = this.state.mapInView === false ? userItems : this.filterInView(userItems, activeId);
		const listItems = [];
		const listCount = listSource.length;
		for (let index = 0; index < listCount; index += 1) {
			const item = listSource[index];
			const kindDef = kinds[item.kind] || kinds.default || {};
			listItems.push({
				...item,
				active: item.id === activeId,
				kindLabel: kindDef.label || item.kind,
				meta: buildMetaLine(item, kindDef),
			});
		}
		const selected = this.selectedFrom(items, activeId);
		const nextMapItems = mapItemsFromBoard(mapSource, activeId, kinds);
		const nextUserMapItems = mapItemsFromBoard(userMapSource, activeId, kinds);
		const nextDetailPairs = this.buildDetailPairs(selected, kinds);
		const nextTotal = items.length;
		// assignState only does === — skip structural no-ops so nested hosts
		// do not get a wasted-set rebind on every pan/idle.
		const patch = {};
		if (!plainEqual(this.STATE.listItems, listItems)) {
			patch.listItems = listItems;
		}
		if (!plainEqual(this.STATE.mapItems, nextMapItems)) {
			patch.mapItems = nextMapItems;
		}
		if (!plainEqual(this.STATE.userMapItems, nextUserMapItems)) {
			patch.userMapItems = nextUserMapItems;
		}
		if (!plainEqual(this.STATE.detailPairs, nextDetailPairs)) {
			patch.detailPairs = nextDetailPairs;
		}
		if (this.STATE.itemTotal !== nextTotal) {
			patch.itemTotal = nextTotal;
		}
		if (Object.keys(patch).length > 0) {
			this.assignState(patch);
		}
		this.syncCustomDetail();
	}
	/**
	 * Center/zoom to seed the nested host. Prefer lastCamera (survives parent
	 * re-binding a seed center when only mapProvider changed). When the live
	 * host already holds an equal center, return THAT ref so `.state.center=`
	 * rebinds hit === and never trip wasted-set.
	 */
	hostCenter() {
		const seed = this.lastCamera?.center;
		const stateCenter = this.state.center;
		let preferred = null;
		if (seed && isFiniteNumber(seed.lat) && isFiniteNumber(seed.lng)) {
			preferred = seed;
		} else if (stateCenter && isFiniteNumber(stateCenter.lat) && isFiniteNumber(stateCenter.lng)) {
			preferred = stateCenter;
		}
		const liveHostCenter = this.getMapHost()?.state?.center;
		if (liveHostCenter && isFiniteNumber(liveHostCenter.lat) && isFiniteNumber(liveHostCenter.lng)) {
			if (!preferred || sameLatLng(liveHostCenter, preferred)) {
				return liveHostCenter;
			}
		}
		if (preferred) {
			return preferred;
		}
		return DEFAULT_CENTER;
	}
	hostZoom() {
		if (isFiniteNumber(this.lastCamera?.zoom)) {
			return this.lastCamera.zoom;
		}
		const zoom = Number(this.state.zoom);
		return isFiniteNumber(zoom) ? zoom : 8;
	}
	/**
	 * Pull live camera from the nested host into lastCamera + state.
	 */
	captureCameraFromHost() {
		const host = this.getMapHost();
		const view = host?.getMapView?.();
		if (!view) {
			return null;
		}
		this.applyCameraSnapshot(view);
		return view;
	}
	/** Write center / zoom / bounds from a view payload (host or event data). */
	applyCameraSnapshot(view) {
		if (!view || typeof view !== 'object') {
			return false;
		}
		const parsedCenter = toLatLng(view.center);
		const zoomRaw = view.zoom;
		const zoom = isFiniteNumber(zoomRaw) ? zoomRaw : null;
		const bounds = normalizeBounds(view.bounds);
		let changed = false;
		const prevCam = this.lastCamera;
		const hostCenter = this.getMapHost()?.state?.center;
		// Prefer host/state refs when values match — never allocate a twin.
		let center = null;
		if (parsedCenter) {
			center = reuseLatLng(this.state.center, parsedCenter);
			if (hostCenter && sameLatLng(hostCenter, center)) {
				center = hostCenter;
			}
		}
		const nextCenter = center || prevCam?.center || reuseLatLng(null, this.state.center);
		let nextZoom = Number(this.state.zoom);
		if (zoom != null) {
			nextZoom = zoom;
		} else if (isFiniteNumber(prevCam?.zoom)) {
			nextZoom = prevCam.zoom;
		}
		const nextBounds = reuseBounds(
			prevCam?.bounds || this.state.viewBounds,
			bounds || prevCam?.bounds || this.state.viewBounds
		);
		// Refresh plain lastCamera (source of truth for host remounts). Reuse
		// nested refs when lat/lng/zoom/bounds are unchanged — a new equal
		// center object re-bound to the nested host trips wasted-set.
		if (nextCenter && isFiniteNumber(nextZoom)) {
			const centerMoved = !sameLatLng(prevCam?.center, nextCenter);
			const zoomMoved = !isFiniteNumber(prevCam?.zoom) || Math.abs(prevCam.zoom - nextZoom) > 1e-6;
			const boundsMoved = Boolean(nextBounds) && !sameBounds(prevCam?.bounds, nextBounds);
			if (centerMoved || zoomMoved || boundsMoved || !prevCam) {
				const cameraCenter = centerMoved || !prevCam?.center ? reuseLatLng(prevCam?.center, nextCenter) : prevCam.center;
				const cameraBounds = boundsMoved || !prevCam?.bounds ? nextBounds : prevCam.bounds;
				this.lastCamera = {
					center: cameraCenter,
					zoom: nextZoom,
					bounds: cameraBounds,
				};
				changed = true;
			}
		}
		if (center) {
			const stable = reuseLatLng(this.state.center, center);
			if (stable !== this.state.center) {
				this.state.center = stable;
				changed = true;
			}
		}
		if (zoom != null && (!isFiniteNumber(this.state.zoom) || Math.abs(this.state.zoom - zoom) > 1e-6)) {
			this.state.zoom = zoom;
			changed = true;
		}
		if (bounds) {
			const stableBounds = reuseBounds(this.state.viewBounds, bounds);
			if (stableBounds !== this.state.viewBounds) {
				this.state.viewBounds = stableBounds;
				changed = true;
			}
		}
		return changed;
	}
	/**
	 * Map host camera changed — mirror center/zoom/bounds for provider switches
	 * and refresh viewport-filtered list/markers.
	 * Wired from *:view / *:idle / *:ready on every provider.
	 */
	handleMapView(domEvent) {
		const data = domEvent?.detail?.data;
		const host = this.getMapHost();
		const view = host?.getMapView?.() || data;
		if (!view && !data) {
			return;
		}
		// Prefer live host view; fill gaps from event payload.
		const snapshot = {
			center: view?.center || data?.center,
			zoom: view?.zoom ?? data?.zoom,
			bounds: view?.bounds || data?.bounds,
			width: view?.width || data?.width,
			height: view?.height || data?.height,
		};
		const changed = this.applyCameraSnapshot(snapshot);
		if (!changed) {
			return;
		}
		this.emit('map:view', {
			bounds: this.lastCamera?.bounds || normalizeBounds(this.state.viewBounds),
			center: this.hostCenter(),
			zoom: this.hostZoom(),
		});
	}
	handleMapReady(domEvent) {
		// New host mounted with hostCenter/hostZoom — still record its view.
		this.handleMapView(domEvent);
		this.captureCameraFromHost();
		this.syncDerivedViews();
	}
	/**
	 * Provider changed. Do NOT call getMapHost() for capture — that resolves the
	 * NEW provider tag (old host already unmatched). lastCamera is the seed.
	 */
	onMapProviderChange() {
		// Re-assert state from lastCamera so any parent seed write is overwritten
		// before the new host reads center/zoom on mount. Reuse refs when equal.
		if (this.lastCamera?.center) {
			const stable = reuseLatLng(this.state.center, this.lastCamera.center);
			if (stable !== this.state.center) {
				this.state.center = stable;
			}
		}
		if (isFiniteNumber(this.lastCamera?.zoom) && this.state.zoom !== this.lastCamera.zoom) {
			this.state.zoom = this.lastCamera.zoom;
		}
		if (this.lastCamera?.bounds) {
			const stableBounds = reuseBounds(this.state.viewBounds, this.lastCamera.bounds);
			if (stableBounds !== this.state.viewBounds) {
				this.state.viewBounds = stableBounds;
			}
		}
		// Drop host-fed traffic when leaving OpenSky so the list does not keep planes.
		if (this.resolvedMapProvider() !== 'opensky') {
			if (this.state.trafficItems?.length) {
				this.state.trafficItems = [];
			}
			// Drop OpenSky-only fetch errors when leaving that provider.
			if (this.state.errorMessage) {
				this.state.errorMessage = '';
			}
		}
	}
	/** Live traffic from ui-map-opensky — merge into list + markers. */
	handleOpenskyTraffic(domEvent) {
		const items = domEvent?.detail?.data?.items;
		this.state.trafficItems = Array.isArray(items) ? items : [];
		// Clear sticky OpenSky fetch errors once traffic succeeds again.
		if (this.state.errorMessage) {
			this.state.errorMessage = '';
		}
		this.syncDerivedViews();
	}
	/**
	 * Pan/fly the nested map to a lat/lng (or item-like object).
	 * Callable from outside: mapEl.goTo({ lat, lng }, 14)
	 * Template: .method.goTo(${point})
	 */
	goTo(target, zoom) {
		const point = toLatLng(target) || toLatLng(target?.position) || toLatLng(target?.coords);
		if (!point) {
			return false;
		}
		const nextZoom = isFiniteNumber(zoom) ? zoom : this.hostZoom();
		// Always remember intended camera for provider remounts.
		const prevCam = this.lastCamera;
		const cameraCenter = reuseLatLng(prevCam?.center, point);
		this.lastCamera = {
			center: cameraCenter,
			zoom: nextZoom,
			bounds: prevCam?.bounds || normalizeBounds(this.state.viewBounds),
		};
		const stableCenter = reuseLatLng(this.state.center, point);
		if (stableCenter !== this.state.center) {
			this.state.center = stableCenter;
		}
		if (isFiniteNumber(nextZoom) && this.state.zoom !== nextZoom) {
			this.state.zoom = nextZoom;
		}
		const host = this.getMapHost();
		if (!host) {
			return false;
		}
		if (typeof host.flyTo === 'function') {
			const ok = host.flyTo(point, nextZoom);
			if (ok) {
				return true;
			}
		}
		if (typeof host.panTo === 'function') {
			return host.panTo(point);
		}
		if (typeof host.setCenter === 'function') {
			host.setCenter(point);
			if (isFiniteNumber(nextZoom) && typeof host.setZoom === 'function') {
				host.setZoom(nextZoom);
			}
			return true;
		}
		return false;
	}
	/**
	 * Select an item by id and fly the map to it.
	 * Outside: mapEl.goToItem('crime-42') or mapEl.goToItem(itemObject)
	 */
	goToItem(idOrItem, zoom) {
		const items = this.normalizedItems();
		let item = null;
		let index = -1;
		if (idOrItem && typeof idOrItem === 'object' && !Array.isArray(idOrItem)) {
			const rawId = idOrItem.id;
			const id = rawId == null || rawId === '' ? '' : String(rawId);
			if (id === '') {
				item = normalizeItem(idOrItem, 0, this.kindsTable());
			} else {
				const found = this.findItemById(items, id);
				item = found.item || normalizeItem(idOrItem, 0, this.kindsTable());
				index = found.index;
			}
		} else {
			const found = this.findItemById(items, String(idOrItem || ''));
			item = found.item;
			index = found.index;
		}
		if (!item) {
			return false;
		}
		this.selectItem(String(item.id), item, index >= 0 ? index : 0, {
			fly: true,
			zoom,
		});
		return true;
	}
	findItemById(items, id) {
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (items[index].id === id) {
				return {
					item: items[index],
					index,
				};
			}
		}
		return {
			item: null,
			index: -1,
		};
	}
	selectedFrom(items, activeId) {
		if (!activeId) {
			return null;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (items[index].id === activeId) {
				return items[index];
			}
		}
		return null;
	}
	selectedItem() {
		return this.selectedFrom(this.normalizedItems(), String(this.state.activeIndex || ''));
	}
	buildDetailPairs(item, kinds) {
		if (!item) {
			return [];
		}
		const kindDef = (kinds || this.kindsTable())[item.kind] ||
			(kinds || this.kindsTable()).default ||
			{};
		const pairs = [];
		const fieldList = kindDef.fields;
		if (Array.isArray(fieldList) && fieldList.length > 0) {
			const count = fieldList.length;
			for (let index = 0; index < count; index += 1) {
				const field = fieldList[index];
				const key = fieldKey(field);
				if (!key) {
					continue;
				}
				pairs.push({
					label: fieldLabel(field),
					value: formatDetailValue(item[key]),
					key,
				});
			}
			return pairs;
		}
		const keys = Object.keys(item);
		const keyCount = keys.length;
		for (let index = 0; index < keyCount; index += 1) {
			const key = keys[index];
			if (RESERVED_DETAIL_KEYS.has(key)) {
				continue;
			}
			const value = item[key];
			if (typeof value === 'function') {
				continue;
			}
			pairs.push({
				label: humanizeKey(key),
				value: formatDetailValue(value),
				key,
			});
		}
		return pairs;
	}
	selectItem(id, item, index, options) {
		this.state.activeIndex = id;
		this.syncDerivedViews();
		const fly = options?.fly !== false && this.state.flyOnSelect !== false;
		if (fly && item) {
			const zoom = isFiniteNumber(options?.zoom) ? options.zoom : undefined;
			this.goTo(item, zoom);
		}
		this.emit('map:select', {
			id,
			item,
			index,
			kind: item?.kind || '',
		});
	}
	/* Feature-light list row — @click on host, no nested map-item-row shadow. */
	listItemRow(item) {
		const label = item?.label || item?.id || 'Item';
		const kind = item?.kindLabel || item?.kind || '';
		const meta = item?.meta || '';
		return this.partial`
			<button type="button" class="mi-row" ?data-active=${item?.active} @click=${this.handleListItemClick}>
				<span class="mi-row-label">${label}</span>
				<span class="mi-row-kind" ?hidden=${!kind}>${kind}</span>
				<span class="mi-row-meta" ?hidden=${!meta}>${meta}</span>
			</button>`;
	}
	handleListItemClick(_domEvent, item) {
		const id = String(item?.id || '');
		if (!id) {
			return;
		}
		const items = this.normalizedItems();
		const found = this.findItemById(items, id);
		const full = found.item || item;
		const index = found.index >= 0 ? found.index : undefined;
		this.selectItem(id, full, index, {
			fly: true,
		});
	}
	handleMapSelect(domEvent) {
		const data = domEvent?.detail?.data;
		if (!data?.id) {
			return;
		}
		const items = this.normalizedItems();
		const found = this.findItemById(items, String(data.id));
		const item = found.item || data.item;
		const index = found.index >= 0 ? found.index : data.index;
		// Already on the marker — skip fly (still select).
		this.selectItem(String(data.id), item, index, {
			fly: false,
		});
	}
	resolvedMapProvider() {
		return resolveMapProvider(this.state);
	}
	getMapHost() {
		const provider = this.resolvedMapProvider();
		if (provider === 'google') {
			return this.findComponent('ui-map-google');
		}
		if (provider === 'openlayers') {
			return this.findComponent('ui-map-openlayers');
		}
		if (provider === 'leaflet') {
			return this.findComponent('ui-map-leaflet');
		}
		if (provider === 'opensky') {
			return this.findComponent('ui-map-opensky');
		}
		return this.findComponent('ui-map-openstreetmap');
	}
	metaLine() {
		const total = Number(this.state.itemTotal) || this.normalizedItems().length;
		const shown = Array.isArray(this.state.listItems) ? this.state.listItems.length : 0;
		const parts = [];
		if (this.state.listInView !== false && total !== shown) {
			parts.push(`${shown} in view · ${total} total`);
		} else {
			parts.push(`${total} items`);
		}
		parts.push(this.resolvedMapProvider());
		if (this.state.loading) {
			parts.push('updating…');
		}
		if (this.state.lastUpdated) {
			parts.push(new Date(this.state.lastUpdated).toLocaleTimeString());
		}
		return parts.join(' · ');
	}
	hasItems() {
		return Array.isArray(this.state.listItems) && this.state.listItems.length > 0;
	}
	emptyListMessage() {
		if (this.state.listInView !== false) {
			return 'No items in this view. Pan or zoom the map.';
		}
		return 'No items. Pass items, a loader, or an endpoint.';
	}
	hasSelection() {
		return Boolean(this.selectedItem());
	}
	hasCustomDetail() {
		const item = this.selectedItem();
		if (!item) {
			return false;
		}
		return Boolean(this.kindDef(item.kind).detailTag);
	}
	/** Mount / update a kind-specific custom detail element inside #detail_custom. */
	syncCustomDetail() {
		const host = this.refs.detail_custom;
		if (!host) {
			return;
		}
		const item = this.selectedItem();
		const detailTag = item ? this.kindDef(item.kind).detailTag : '';
		if (!item || !detailTag) {
			host.replaceChildren();
			return;
		}
		let element = host.firstElementChild;
		if (!element || element.localName !== detailTag) {
			element = globalThis.document.createElement(detailTag);
			host.replaceChildren(element);
		}
		if (element && typeof element.assignState === 'function') {
			element.assignState({
				...item,
			});
		} else if (element && element.state && typeof element.state === 'object') {
			const keys = Object.keys(item);
			const count = keys.length;
			for (let index = 0; index < count; index += 1) {
				const key = keys[index];
				element.state[key] = item[key];
			}
		}
	}
	detailFragment() {
		if (!this.state.showDetail) {
			return '';
		}
		const item = this.selectedItem();
		if (!item) {
			return '';
		}
		const kindDef = this.kindDef(item.kind);
		const custom = Boolean(kindDef.detailTag);
		return this.htmlElement`
			<div class="mp-detail">
				<div class="mp-detail-kind">${kindDef.label || item.kind}</div>
				<div class="mp-detail-title">${item.label}</div>
				<div class="mp-detail-custom" #detail_custom ?hidden=${!custom}></div>
				<div class="mp-detail-grid" ?hidden=${custom}>
					${this.list('detailPairs', this.detailPairRow, this.detailPairKey)}
				</div>
			</div>
		`;
	}
	detailPairRow(pair) {
		return html`
			<div class="mp-detail-pair">
				<span class="mp-pair-k">${pair.label}</span>
				<span class="mp-pair-v">${pair.value}</span>
			</div>
		`;
	}
	detailPairKey(pair) {
		return pair.key || pair.label;
	}
	googleMapFragment() {
		const center = this.hostCenter();
		const zoom = this.hostZoom();
		return this.htmlElement`
			<div class="mp-pane mp-pane-map" data-map-provider="google">
				<div class="mp-map-host">
					<ui-map-google
						.state.apiKey=${this.state.apiKey}
						.state.mapId=${this.state.mapId}
						.state.center=${center}
						.state.zoom=${zoom}
						.state.items=${this.state.mapItems}
						.state.activeIndex=${this.state.activeIndex}
						.state.fitItems=${this.state.fitItems}
						.state.emptyLabel=${'Map · Google'}
						@map-google:select=${this.handleMapSelect}
						@map-google:ready=${this.handleMapReady}
						@map-google:idle=${this.handleMapView}
						@map-google:view=${this.handleMapView}></ui-map-google>
				</div>
			</div>
		`;
	}
	openstreetmapMapFragment() {
		const center = this.hostCenter();
		const zoom = this.hostZoom();
		return this.htmlElement`
			<div class="mp-pane mp-pane-map" data-map-provider="openstreetmap">
				<div class="mp-map-host">
					<ui-map-openstreetmap
						.state.center=${center}
						.state.zoom=${zoom}
						.state.layer=${this.state.mapLayer || 'standard'}
						.state.items=${this.state.mapItems}
						.state.activeIndex=${this.state.activeIndex}
						.state.fitItems=${this.state.fitItems}
						.state.panOnActive=${false}
						.state.emptyLabel=${'Map · OpenStreetMap'}
						@map-openstreetmap:select=${this.handleMapSelect}
						@map-openstreetmap:ready=${this.handleMapReady}
						@map-openstreetmap:idle=${this.handleMapView}
						@map-openstreetmap:view=${this.handleMapView}></ui-map-openstreetmap>
				</div>
			</div>
		`;
	}
	leafletMapFragment() {
		const tileUrl = String(this.state.tileUrl || '').trim();
		const center = this.hostCenter();
		const zoom = this.hostZoom();
		return this.htmlElement`
			<div class="mp-pane mp-pane-map" data-map-provider="leaflet">
				<div class="mp-map-host">
					<ui-map-leaflet
						.state.center=${center}
						.state.zoom=${zoom}
						.state.tileUrl=${tileUrl}
						.state.tileAttribution=${this.state.tileAttribution}
						.state.items=${this.state.mapItems}
						.state.activeIndex=${this.state.activeIndex}
						.state.fitItems=${this.state.fitItems}
						.state.panOnActive=${false}
						.state.emptyLabel=${'Map · Leaflet'}
						@map-leaflet:select=${this.handleMapSelect}
						@map-leaflet:ready=${this.handleMapReady}
						@map-leaflet:idle=${this.handleMapView}
						@map-leaflet:view=${this.handleMapView}></ui-map-leaflet>
				</div>
			</div>
		`;
	}
	openlayersMapFragment() {
		const tileUrl = String(this.state.tileUrl || '').trim();
		const center = this.hostCenter();
		const zoom = this.hostZoom();
		return this.htmlElement`
			<div class="mp-pane mp-pane-map" data-map-provider="openlayers">
				<div class="mp-map-host">
					<ui-map-openlayers
						.state.center=${center}
						.state.zoom=${zoom}
						.state.tileUrl=${tileUrl}
						.state.tileAttribution=${this.state.tileAttribution}
						.state.items=${this.state.mapItems}
						.state.activeIndex=${this.state.activeIndex}
						.state.fitItems=${this.state.fitItems}
						.state.panOnActive=${false}
						.state.emptyLabel=${'Map · OpenLayers'}
						@map-openlayers:select=${this.handleMapSelect}
						@map-openlayers:ready=${this.handleMapReady}
						@map-openlayers:idle=${this.handleMapView}
						@map-openlayers:view=${this.handleMapView}></ui-map-openlayers>
				</div>
			</div>
		`;
	}
	openskyMapFragment() {
		// User markers only (state.userMapItems) — host merges live traffic.
		// Traffic also streams to ui-map via map-opensky:traffic for the side list.
		const center = this.hostCenter();
		const zoom = this.hostZoom();
		return this.htmlElement`
			<div class="mp-pane mp-pane-map" data-map-provider="opensky">
				<div class="mp-map-host">
					<ui-map-opensky
						.state.center=${center}
						.state.zoom=${zoom}
						.state.items=${this.state.userMapItems}
						.state.activeIndex=${this.state.activeIndex}
						.state.fitItems=${this.state.fitItems}
						.state.panOnActive=${false}
						.state.showTraffic=${this.state.openskyShowTraffic !== false}
						.state.pollMs=${this.state.openskyPollMs}
						.state.apiUser=${this.state.openskyApiUser}
						.state.apiPassword=${this.state.openskyApiPassword}
						.state.emptyLabel=${'Map · OpenSky Network'}
						@map-opensky:select=${this.handleMapSelect}
						@map-opensky:ready=${this.handleMapReady}
						@map-opensky:idle=${this.handleMapView}
						@map-opensky:view=${this.handleMapView}
						@map-opensky:traffic=${this.handleOpenskyTraffic}
						@map-opensky:error=${this.handleOpenskyError}></ui-map-opensky>
				</div>
			</div>
		`;
	}
	handleOpenskyError(domEvent) {
		const message = domEvent?.detail?.data?.message || 'OpenSky error';
		// Transient network blips are common; keep the banner until the next
		// successful traffic event clears it in handleOpenskyTraffic.
		this.state.errorMessage = message;
	}
	mapFragment() {
		const provider = this.resolvedMapProvider();
		if (provider === 'google') {
			return this.googleMapFragment();
		}
		if (provider === 'openlayers') {
			return this.openlayersMapFragment();
		}
		if (provider === 'leaflet') {
			return this.leafletMapFragment();
		}
		if (provider === 'opensky') {
			return this.openskyMapFragment();
		}
		return this.openstreetmapMapFragment();
	}
	sideFragment() {
		if (!this.state.showList && !this.state.showDetail) {
			return '';
		}
		return this.htmlElement`
			<aside class="mp-pane mp-side">
				<h3 class="mp-side-heading">${this.state.listHeading || 'Items'}</h3>
				<div class="mp-list" ?hidden=${!this.state.showList}>
					<div class="mp-empty" ?hidden=${this.hasItems}>${this.emptyListMessage}</div>
					${this.list('listItems', this.listItemRow)}
				</div>
				${this.detailFragment}
			</aside>
		`;
	}
	layoutMode() {
		const showSide = Boolean(this.state.showList || this.state.showDetail);
		return showSide ? 'split' : 'single';
	}
	render() {
		const layout = this.layoutMode();
		const mapProvider = this.resolvedMapProvider();
		this.html`
			<div class="mp" data-layout=${layout} data-map-provider=${mapProvider}>
				<div class="mp-toolbar">
					<h2 class="mp-heading">${this.state.heading || 'Map'}</h2>
					<span class="mp-meta">${this.metaLine}</span>
					<span class="mp-meta" data-tone="danger" ?hidden=${!this.state.errorMessage}>${this.state.errorMessage}</span>
				</div>
				<div class="mp-body">
					${this.mapFragment}
					${this.sideFragment}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-map', UIMap);
