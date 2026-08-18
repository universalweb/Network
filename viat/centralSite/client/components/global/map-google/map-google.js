/**
 * DESCRIPTION: ui-map-google — blank-slate Google Maps JS API host (first
 * external-dep global). Lazy-loads the Maps script once (shared loader), mounts
 * into a #map ref (works in shadow DOM), and keeps markers / polylines /
 * polygons / circles / rectangles / routes / traffic|transit|bike layers in
 * sync with reactive state. Two-way selection: write `activeIndex` (item id) to
 * pan/highlight; click a marker → emit `map-google:select`. Full escape hatch
 * via `getMap()` / `getGoogle()` for anything the state surface doesn't cover.
 * ── STANDARD USAGE ───────────────────────────────────────────────────
 * <ui-map-google
 * .state.apiKey=${key}
 * .state.center=${{ lat: 37.77, lng: -122.42 }}
 * .state.zoom=${11}
 * .state.items=${[{ id: 'a', lat: 37.78, lng: -122.41, label: 'HQ' }]}
	    * @map-google:select=${this.handlePick}
	    @map-google:ready=${this.handleReady}></ui-map-google>
	  // Fly from outside: el.state.activeIndex = 'a'  (or .panTo / .flyTo)
	─────────────────────────────────────────────────────────────────────
 */
import { WebComponent } from 'webcomponent';
import { isFiniteNumber, reuseLatLng, toLatLng } from '../map/map-geo.js';
import { loadGoogleMapsApi } from './loader.js';
const MAP_TYPE_IDS = new Set([
	'roadmap',
	'satellite',
	'hybrid',
	'terrain',
]);
const DEFAULT_CENTER = {
	lat: 20,
	lng: 0,
};
const CLUSTER_CELL = 48;
function toLatLngLiteral(input) {
	return toLatLng(input);
}
function itemId(item, index) {
	if (item == null) {
		return String(index);
	}
	if (item.id != null && item.id !== '') {
		return String(item.id);
	}
	if (item.value != null && item.value !== '') {
		return String(item.value);
	}
	return String(index);
}
function itemPosition(item) {
	return toLatLngLiteral(item) || toLatLngLiteral(item?.position) || toLatLngLiteral(item?.coords);
}
function boundsLiteral(bounds) {
	if (!bounds || typeof bounds.toJSON !== 'function') {
		return null;
	}
	return bounds.toJSON();
}
function pathFromItem(path) {
	if (!Array.isArray(path)) {
		return [];
	}
	const out = [];
	const count = path.length;
	for (let index = 0; index < count; index += 1) {
		const point = toLatLngLiteral(path[index]);
		if (point) {
			out.push(point);
		}
	}
	return out;
}
export class UIMapGoogle extends WebComponent {
	static url = import.meta.url;
	static styles = {
		googleMap: './map-google.css',
	};
	static state = {
		apiKey: '',
		mapId: '',
		version: 'weekly',
		language: '',
		region: '',
		libraries: [
			'maps',
			'marker',
			'geometry',
		],
		center: {
			lat: DEFAULT_CENTER.lat,
			lng: DEFAULT_CENTER.lng,
		},
		zoom: 2,
		minZoom: 0,
		maxZoom: 22,
		heading: 0,
		tilt: 0,
		mapTypeId: 'roadmap',
		gestureHandling: 'auto',
		disableDefaultUi: false,
		zoomControl: true,
		mapTypeControl: true,
		streetViewControl: true,
		fullscreenControl: true,
		scaleControl: false,
		rotateControl: false,
		clickableIcons: true,
		draggable: true,
		keyboardShortcuts: true,
		scrollwheel: true,
		styles: null,
		colorScheme: '',
		// markers — primary collection (component standard: `items`)
		items: [],
		polylines: [],
		polygons: [],
		circles: [],
		rectangles: [],
		routes: [],
		layers: {
			traffic: false,
			transit: false,
			bicycling: false,
		},
		fitItems: false,
		cluster: false,
		clusterMaxZoom: 14,
		activeIndex: '',
		showInfo: true,
		loading: false,
		errorMessage: '',
		ready: false,
		emptyLabel: 'Map',
	};
	// Imperative Google objects — plain fields (identity), not reactive state.
	mapInstance = null;
	mapsApi = null;
	loadedApiKey = '';
	infoWindow = null;
	resizeKick = null;
	markerById = new Map();
	clusterMarkers = [];
	polylineById = new Map();
	polygonById = new Map();
	circleById = new Map();
	rectangleById = new Map();
	routeRenderers = new Map();
	trafficLayer = null;
	transitLayer = null;
	bicyclingLayer = null;
	mapListeners = [];
	resizeObserver = null;
	bootGeneration = 0;
	syncFrameTick = null;
	syncScheduled = false;
	// Cached forwarders — Maps / ResizeObserver call handlers with a foreign `this`.
	mapClickForwarder = null;
	mapIdleForwarder = null;
	mapBoundsForwarder = null;
	mapZoomForwarder = null;
	mapCenterForwarder = null;
	mapViewForwarder = null;
	resizeForwarder = null;
	viewEmitScheduled = false;
	/** Dummy OverlayView used only for fromLatLngToContainerPixel. */
	projectionHelper = null;
	/** After user pan/zoom, ignore parent center/zoom re-binds until setCenter/panTo. */
	cameraUserOwned = false;
	onConnect() {
		this.mapClickForwarder = (domEvent) => {
			this.onMapClick(domEvent);
		};
		this.mapIdleForwarder = () => {
			this.onMapIdle();
		};
		this.mapBoundsForwarder = () => {
			this.onBoundsChanged();
		};
		this.mapZoomForwarder = () => {
			this.onZoomChanged();
		};
		this.mapCenterForwarder = () => {
			this.onCenterChanged();
		};
		this.mapViewForwarder = () => {
			this.scheduleViewEmit();
		};
		this.resizeForwarder = () => {
			this.onHostResize();
		};
		this.syncFrameTick = () => {
			this.flushOverlaySync();
		};
		this.observe([
			'apiKey',
			'mapId',
			'version',
			'language',
			'region',
			'libraries',
		], this.bootMap);
		this.observe([
			'center',
			'zoom',
			'heading',
			'tilt',
			'mapTypeId',
			'gestureHandling',
			'disableDefaultUi',
			'zoomControl',
			'mapTypeControl',
			'streetViewControl',
			'fullscreenControl',
			'scaleControl',
			'rotateControl',
			'clickableIcons',
			'draggable',
			'keyboardShortcuts',
			'scrollwheel',
			'styles',
			'colorScheme',
			'minZoom',
			'maxZoom',
		], this.applyMapOptions);
		this.observe([
			'items',
			'cluster',
			'clusterMaxZoom',
			'activeIndex',
			'fitItems',
		], this.scheduleOverlaySync);
		this.observe([
			'polylines',
			'polygons',
			'circles',
			'rectangles',
			'routes',
			'layers',
		], this.scheduleOverlaySync);
	}
	onMount() {
		this.bootMap();
		this.attachResizeObserver();
	}
	onDisconnect() {
		this.teardownMap();
	}
	/* ── Public imperative surface (also usable as .method= commands) ── */
	getMap() {
		return this.mapInstance;
	}
	/** Live camera + container size for geo overlays. */
	getMapView() {
		const map = this.mapInstance;
		if (!map?.getDiv) {
			return null;
		}
		const center = map.getCenter?.();
		const div = map.getDiv();
		if (!center || !div) {
			return null;
		}
		const live = {
			lat: center.lat(),
			lng: center.lng(),
		};
		return {
			center: reuseLatLng(this.state.center, live),
			zoom: map.getZoom(),
			width: div.clientWidth,
			height: div.clientHeight,
			bounds: boundsLiteral(map.getBounds?.()),
		};
	}
	/** Project WGS84 → map container CSS pixels (OverlayView projection). */
	projectToContainer(lat, lng) {
		const maps = this.getGoogle();
		const helper = this.ensureProjectionHelper();
		if (!maps || !helper || !isFiniteNumber(lat) || !isFiniteNumber(lng)) {
			return null;
		}
		const projection = helper.getProjection?.();
		if (!projection?.fromLatLngToContainerPixel) {
			return null;
		}
		const latLng = new maps.LatLng(lat, lng);
		const pixel = projection.fromLatLngToContainerPixel(latLng);
		if (!pixel) {
			return null;
		}
		return {
			x: pixel.x,
			y: pixel.y,
		};
	}
	ensureProjectionHelper() {
		const map = this.mapInstance;
		const maps = this.getGoogle();
		if (!map || !maps?.OverlayView) {
			return null;
		}
		if (this.projectionHelper) {
			return this.projectionHelper;
		}
		const helper = new maps.OverlayView();
		helper.onAdd = function onAdd() {};
		helper.draw = function draw() {};
		helper.onRemove = function onRemove() {};
		helper.setMap(map);
		this.projectionHelper = helper;
		return helper;
	}
	scheduleViewEmit() {
		if (this.viewEmitScheduled) {
			return;
		}
		this.viewEmitScheduled = true;
		requestAnimationFrame(() => {
			this.viewEmitScheduled = false;
			const view = this.getMapView();
			if (view) {
				this.emit('map-google:view', view);
			}
		});
	}
	getGoogle() {
		return this.mapsApi || globalThis.google?.maps || null;
	}
	panTo(target) {
		const map = this.mapInstance;
		const point = toLatLngLiteral(target);
		if (!map || !point) {
			return false;
		}
		map.panTo(point);
		return true;
	}
	flyTo(target, zoom) {
		const map = this.mapInstance;
		const point = toLatLngLiteral(target);
		if (!map || !point) {
			return false;
		}
		map.panTo(point);
		if (isFiniteNumber(zoom)) {
			map.setZoom(zoom);
		}
		return true;
	}
	setCenter(target) {
		const point = toLatLngLiteral(target);
		if (!point) {
			return false;
		}
		const stable = reuseLatLng(this.state.center, point);
		if (stable !== this.state.center) {
			this.state.center = stable;
		}
		if (this.mapInstance) {
			this.mapInstance.setCenter(stable);
		}
		return true;
	}
	setZoom(zoom) {
		if (!isFiniteNumber(zoom)) {
			return false;
		}
		this.state.zoom = zoom;
		if (this.mapInstance) {
			this.mapInstance.setZoom(zoom);
		}
		return true;
	}
	fitToItems(padding) {
		return this.fitItemBounds(padding);
	}
	fitBounds(boundsLike, padding) {
		const map = this.mapInstance;
		const maps = this.getGoogle();
		if (!map || !maps) {
			return false;
		}
		const bounds = this.toLatLngBounds(boundsLike, maps);
		if (!bounds) {
			return false;
		}
		const pad = isFiniteNumber(padding) ? padding : 48;
		map.fitBounds(bounds, pad);
		return true;
	}
	async geocode(address) {
		const maps = this.getGoogle();
		if (!maps || !address) {
			return {
				ok: false,
				errKind: 'unavailable',
				message: 'Geocoder unavailable',
			};
		}
		try {
			const { Geocoder } = await maps.importLibrary('geocoding');
			const geocoder = new Geocoder();
			const response = await geocoder.geocode({
				address: String(address),
			});
			return {
				ok: true,
				results: response.results || [],
			};
		} catch (cause) {
			return {
				ok: false,
				errKind: 'geocode-error',
				message: cause?.message || String(cause),
			};
		}
	}
	async reverseGeocode(target) {
		const maps = this.getGoogle();
		const point = toLatLngLiteral(target);
		if (!maps || !point) {
			return {
				ok: false,
				errKind: 'unavailable',
				message: 'Reverse geocoder unavailable',
			};
		}
		try {
			const { Geocoder } = await maps.importLibrary('geocoding');
			const geocoder = new Geocoder();
			const response = await geocoder.geocode({
				location: point,
			});
			return {
				ok: true,
				results: response.results || [],
			};
		} catch (cause) {
			return {
				ok: false,
				errKind: 'geocode-error',
				message: cause?.message || String(cause),
			};
		}
	}
	/* ── Boot / teardown ─────────────────────────────────────────────── */
	async bootMap() {
		const generation = (this.bootGeneration += 1);
		const apiKey = String(this.state.apiKey || '').trim();
		if (!apiKey) {
			this.assignState({
				loading: false,
				ready: false,
				errorMessage: 'Set state.apiKey to a Google Maps JavaScript API key.',
			});
			return;
		}
		// Already live with this key — skip rebuild. Empty→key and key change always boot.
		if (this.mapInstance && this.loadedApiKey === apiKey && this.state.ready) {
			return;
		}
		// Tear a prior map only when the key itself changes (not first boot).
		if (this.mapInstance && this.loadedApiKey && this.loadedApiKey !== apiKey) {
			this.clearMapListeners();
			this.clearOverlays();
			this.mapInstance = null;
			this.infoWindow = null;
		}
		this.loadedApiKey = apiKey;
		this.assignState({
			loading: true,
			errorMessage: '',
		});
		const result = await loadGoogleMapsApi({
			apiKey,
			version: this.state.version,
			language: this.state.language,
			region: this.state.region,
			libraries: this.state.libraries,
		});
		if (generation !== this.bootGeneration) {
			return;
		}
		if (!result.ok) {
			this.loadedApiKey = '';
			this.assignState({
				loading: false,
				ready: false,
				errorMessage: result.message,
			});
			this.emit('map-google:error', {
				message: result.message,
				errKind: result.errKind,
			});
			return;
		}
		this.mapsApi = result.maps;
		await this.mountMapInstance(result.maps, generation);
	}
	async mountMapInstance(maps, generation) {
		const canvas = this.refs.map;
		if (!canvas) {
			this.assignState({
				loading: false,
				errorMessage: 'Map canvas ref is missing.',
			});
			return;
		}
		try {
			const mapLibrary = typeof maps.importLibrary === 'function' ? await maps.importLibrary('maps') : maps;
			if (generation !== this.bootGeneration) {
				return;
			}
			const MapCtor = mapLibrary?.Map || maps.Map;
			if (!MapCtor) {
				this.assignState({
					loading: false,
					ready: false,
					errorMessage: 'Google Maps Map constructor is unavailable after load.',
				});
				this.emit('map-google:error', {
					message: 'Map constructor unavailable',
					errKind: 'mount-error',
				});
				return;
			}
			this.clearMapListeners();
			this.clearOverlays();
			const options = this.buildMapOptions(maps);
			this.mapInstance = new MapCtor(canvas, options);
			this.bindMapEvents(maps);
			const InfoWindowCtor = maps.InfoWindow || mapLibrary?.InfoWindow;
			this.infoWindow = InfoWindowCtor ? new InfoWindowCtor() : null;
			this.assignState({
				loading: false,
				ready: true,
				errorMessage: '',
			});
			// Shadow-DOM / deferred layout: force a resize after paint so tiles fill the box.
			if (!this.resizeKick) {
				this.resizeKick = () => {
					this.onHostResize();
				};
			}
			requestAnimationFrame(this.resizeKick);
			this.syncAllOverlays();
			this.emit('map-google:ready', {
				center: toLatLngLiteral(this.mapInstance.getCenter()?.toJSON?.() || this.state.center),
				zoom: this.mapInstance.getZoom(),
			});
			this.ensureProjectionHelper();
			this.scheduleViewEmit();
		} catch (cause) {
			const message = cause?.message || String(cause);
			this.assignState({
				loading: false,
				ready: false,
				errorMessage: message,
			});
			this.emit('map-google:error', {
				message,
				errKind: 'mount-error',
			});
		}
	}
	buildMapOptions(maps) {
		const center = toLatLngLiteral(this.state.center) || DEFAULT_CENTER;
		const mapTypeId = MAP_TYPE_IDS.has(this.state.mapTypeId) ? this.state.mapTypeId : 'roadmap';
		const options = {
			center,
			zoom: Number(this.state.zoom) || 2,
			minZoom: this.state.minZoom,
			maxZoom: this.state.maxZoom,
			heading: Number(this.state.heading) || 0,
			tilt: Number(this.state.tilt) || 0,
			mapTypeId,
			gestureHandling: this.state.gestureHandling || 'auto',
			disableDefaultUI: Boolean(this.state.disableDefaultUi),
			zoomControl: Boolean(this.state.zoomControl),
			mapTypeControl: Boolean(this.state.mapTypeControl),
			streetViewControl: Boolean(this.state.streetViewControl),
			fullscreenControl: Boolean(this.state.fullscreenControl),
			scaleControl: Boolean(this.state.scaleControl),
			rotateControl: Boolean(this.state.rotateControl),
			clickableIcons: Boolean(this.state.clickableIcons),
			draggable: Boolean(this.state.draggable),
			keyboardShortcuts: Boolean(this.state.keyboardShortcuts),
			scrollwheel: Boolean(this.state.scrollwheel),
		};
		if (this.state.mapId) {
			options.mapId = String(this.state.mapId);
		}
		if (Array.isArray(this.state.styles)) {
			options.styles = this.state.styles;
		}
		if (this.state.colorScheme && maps.ColorScheme) {
			const scheme = String(this.state.colorScheme).toUpperCase();
			if (maps.ColorScheme[scheme]) {
				options.colorScheme = maps.ColorScheme[scheme];
			}
		}
		return options;
	}
	applyMapOptions() {
		const map = this.mapInstance;
		const maps = this.getGoogle();
		if (!map || !maps) {
			return;
		}
		const options = this.buildMapOptions(maps);
		// Avoid fighting user gestures — drop camera keys after the user has panned.
		if (this.cameraUserOwned) {
			delete options.center;
			delete options.zoom;
			delete options.heading;
			delete options.tilt;
		}
		map.setOptions(options);
	}
	bindMapEvents(maps) {
		const map = this.mapInstance;
		if (!map || !maps?.event) {
			return;
		}
		this.mapListeners.push(
			maps.event.addListener(map, 'click', this.mapClickForwarder),
			maps.event.addListener(map, 'idle', this.mapIdleForwarder),
			maps.event.addListener(map, 'bounds_changed', this.mapBoundsForwarder),
			maps.event.addListener(map, 'zoom_changed', this.mapZoomForwarder),
			maps.event.addListener(map, 'center_changed', this.mapCenterForwarder),
			maps.event.addListener(map, 'bounds_changed', this.mapViewForwarder)
		);
	}
	onMapClick(domEvent) {
		const latLng = domEvent?.latLng;
		if (!latLng) {
			return;
		}
		const point = {
			lat: latLng.lat(),
			lng: latLng.lng(),
		};
		this.emit('map-google:click', point);
	}
	onMapIdle() {
		const map = this.mapInstance;
		if (!map) {
			return;
		}
		this.cameraUserOwned = true;
		const center = map.getCenter();
		const view = this.getMapView();
		this.emit('map-google:idle', {
			center: center ? {
				lat: center.lat(),
				lng: center.lng(),
			} : null,
			zoom: map.getZoom(),
			bounds: boundsLiteral(map.getBounds()),
			width: view?.width,
			height: view?.height,
		});
		this.scheduleViewEmit();
	}
	onBoundsChanged() {
		const map = this.mapInstance;
		if (!map) {
			return;
		}
		this.emit('map-google:bounds-change', {
			bounds: boundsLiteral(map.getBounds()),
		});
	}
	onZoomChanged() {
		const map = this.mapInstance;
		if (!map) {
			return;
		}
		const zoom = map.getZoom();
		if (isFiniteNumber(zoom) && zoom !== this.state.zoom) {
			// Write through STATE raw? No — use state so consumers can observe, but
			// suppress feedback loops: applyMapOptions is fine with same values.
			this.state.zoom = zoom;
		}
	}
	onCenterChanged() {
		const map = this.mapInstance;
		if (!map) {
			return;
		}
		const center = map.getCenter();
		if (!center) {
			return;
		}
		const live = {
			lat: center.lat(),
			lng: center.lng(),
		};
		const next = reuseLatLng(this.state.center, live);
		if (next !== this.state.center) {
			this.state.center = next;
		}
	}
	attachResizeObserver() {
		if (typeof ResizeObserver === 'undefined') {
			return;
		}
		this.resizeObserver?.disconnect();
		this.resizeObserver = new ResizeObserver(this.resizeForwarder);
		this.resizeObserver.observe(this);
	}
	onHostResize() {
		const map = this.mapInstance;
		const maps = this.getGoogle();
		if (!map || !maps?.event) {
			return;
		}
		maps.event.trigger(map, 'resize');
	}
	clearMapListeners() {
		const maps = this.getGoogle();
		const listeners = this.mapListeners;
		const count = listeners.length;
		for (let index = 0; index < count; index += 1) {
			if (maps?.event?.removeListener) {
				maps.event.removeListener(listeners[index]);
			} else if (listeners[index]?.remove) {
				listeners[index].remove();
			}
		}
		this.mapListeners = [];
	}
	clearOverlays() {
		this.clearMarkers();
		this.clearCollection(this.polylineById);
		this.clearCollection(this.polygonById);
		this.clearCollection(this.circleById);
		this.clearCollection(this.rectangleById);
		this.clearRoutes();
		this.setLayer('traffic', false);
		this.setLayer('transit', false);
		this.setLayer('bicycling', false);
	}
	clearCollection(bucket) {
		for (const entry of bucket.values()) {
			entry.setMap?.(null);
		}
		bucket.clear();
	}
	clearMarkers() {
		for (const entry of this.markerById.values()) {
			this.destroyMarkerEntry(entry);
		}
		this.markerById.clear();
		const clusters = this.clusterMarkers;
		const count = clusters.length;
		for (let index = 0; index < count; index += 1) {
			this.destroyMarkerEntry(clusters[index]);
		}
		this.clusterMarkers = [];
		this.infoWindow?.close();
	}
	destroyMarkerEntry(entry) {
		if (!entry) {
			return;
		}
		this.removeMapsListener(entry.listener);
		this.removeMapsListener(entry.clickListener);
		this.removeMapsListener(entry.dragListener);
		if (entry.marker?.setMap) {
			entry.marker.setMap(null);
		} else if (entry.marker) {
			entry.marker.map = null;
		}
	}
	removeMapsListener(listener) {
		if (!listener) {
			return;
		}
		if (listener.remove) {
			listener.remove();
			return;
		}
		const maps = this.getGoogle();
		if (maps?.event?.removeListener) {
			maps.event.removeListener(listener);
		}
	}
	clearRoutes() {
		for (const renderer of this.routeRenderers.values()) {
			renderer.setMap(null);
		}
		this.routeRenderers.clear();
	}
	teardownMap() {
		this.bootGeneration += 1;
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.clearMapListeners();
		this.clearOverlays();
		if (this.projectionHelper) {
			this.projectionHelper.setMap(null);
			this.projectionHelper = null;
		}
		this.infoWindow = null;
		this.mapInstance = null;
		this.syncScheduled = false;
	}
	/* ── Overlay sync ────────────────────────────────────────────────── */
	scheduleOverlaySync() {
		if (this.syncScheduled || !this.mapInstance) {
			return;
		}
		this.syncScheduled = true;
		requestAnimationFrame(this.syncFrameTick);
	}
	flushOverlaySync() {
		this.syncScheduled = false;
		this.syncAllOverlays();
	}
	syncAllOverlays() {
		if (!this.mapInstance || !this.getGoogle()) {
			return;
		}
		this.syncMarkers();
		this.syncPolylines();
		this.syncPolygons();
		this.syncCircles();
		this.syncRectangles();
		this.syncRoutes();
		this.syncLayers();
		if (this.state.fitItems) {
			this.fitItemBounds();
		}
		this.syncActiveSelection();
	}
	syncMarkers() {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		const useCluster = Boolean(this.state.cluster) &&
			items.length > 1 &&
			(map.getZoom() ?? 0) <= (Number(this.state.clusterMaxZoom) || 14);
		this.clearMarkers();
		if (useCluster) {
			this.renderClusters(items, maps, map);
			return;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const position = itemPosition(item);
			if (!position) {
				continue;
			}
			const id = itemId(item, index);
			const entry = this.createMarkerEntry(item, id, index, position, maps, map);
			if (entry) {
				this.markerById.set(id, entry);
			}
		}
	}
	createMarkerEntry(item, id, index, position, maps, map) {
		const active = String(this.state.activeIndex) === id || Boolean(item.active);
		const useAdvanced = Boolean(this.state.mapId) && maps.marker?.AdvancedMarkerElement;
		const entry = {
			id,
			item,
			index,
			marker: null,
			listener: null,
			dragListener: null,
			clickForwarder: null,
			dragForwarder: null,
		};
		entry.clickForwarder = () => {
			this.handleMarkerSelect(entry.id, entry.item, entry.index);
		};
		entry.dragForwarder = (domEvent) => {
			const latLng = domEvent?.latLng || entry.marker?.position;
			this.handleMarkerDrag(entry.id, entry.item, latLng);
		};
		if (useAdvanced) {
			const content = this.buildAdvancedContent(item, active);
			entry.marker = new maps.marker.AdvancedMarkerElement({
				map,
				position,
				title: item.label || item.description || id,
				content,
				gmpDraggable: Boolean(item.draggable),
				zIndex: item.zIndex,
			});
			// AdvancedMarker prefers gmp-click; keep click as a compatibility fallback.
			entry.listener = entry.marker.addListener('gmp-click', entry.clickForwarder);
			entry.clickListener = entry.marker.addListener('click', entry.clickForwarder);
			if (item.draggable) {
				entry.dragListener = entry.marker.addListener('dragend', entry.dragForwarder);
			}
		} else {
			const icon = this.buildClassicIcon(item, maps);
			entry.marker = new maps.Marker({
				map,
				position,
				title: item.label || item.description || id,
				label: item.markerLabel || undefined,
				icon,
				draggable: Boolean(item.draggable),
				opacity: isFiniteNumber(item.opacity) ? item.opacity : 1,
				zIndex: item.zIndex,
				animation: active && maps.Animation ? maps.Animation.DROP : undefined,
			});
			entry.listener = entry.marker.addListener('click', entry.clickForwarder);
			if (item.draggable) {
				entry.dragListener = entry.marker.addListener('dragend', entry.dragForwarder);
			}
		}
		return entry;
	}
	buildAdvancedContent(item, active) {
		const root = document.createElement('div');
		root.className = 'gm-marker-pin';
		if (active) {
			root.dataset.active = '';
		}
		if (item.tone) {
			root.dataset.tone = String(item.tone);
		}
		const label = document.createElement('span');
		label.textContent = item.pinText || (item.label ? String(item.label).slice(0, 2) : '•');
		root.appendChild(label);
		return root;
	}
	buildClassicIcon(item, maps) {
		if (item.icon) {
			return item.icon;
		}
		if (isFiniteNumber(item.heading) && maps.SymbolPath) {
			return {
				path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
				scale: item.iconScale || 4,
				rotation: item.heading,
				fillColor: item.iconColor || '#3b82f6',
				fillOpacity: 0.95,
				strokeColor: item.iconStroke || '#ffffff',
				strokeWeight: 1,
			};
		}
		return undefined;
	}
	renderClusters(items, maps, map) {
		const projection = this.projectItems(items, map);
		const cells = new Map();
		const count = projection.length;
		for (let index = 0; index < count; index += 1) {
			const entry = projection[index];
			const key = `${Math.floor(entry.x / CLUSTER_CELL)}:${Math.floor(entry.y / CLUSTER_CELL)}`;
			let bucket = cells.get(key);
			if (!bucket) {
				bucket = [];
				cells.set(key, bucket);
			}
			bucket.push(entry);
		}
		for (const bucket of cells.values()) {
			if (bucket.length === 1) {
				const only = bucket[0];
				const markerEntry = this.createMarkerEntry(
					only.item,
					only.id,
					only.index,
					only.position,
					maps,
					map
				);
				if (markerEntry) {
					this.markerById.set(only.id, markerEntry);
				}
				continue;
			}
			const clusterPos = this.averagePosition(bucket);
			const clusterMarker = new maps.Marker({
				map,
				position: clusterPos,
				label: {
					text: String(bucket.length),
					color: '#fff',
					fontWeight: '700',
				},
				icon: {
					path: maps.SymbolPath?.CIRCLE || 0,
					scale: 14,
					fillColor: '#2563eb',
					fillOpacity: 0.92,
					strokeColor: '#ffffff',
					strokeWeight: 2,
				},
				zIndex: 1000 + bucket.length,
			});
			const bounds = this.bucketBounds(bucket);
			const clusterEntry = {
				marker: clusterMarker,
				listener: null,
				clickForwarder: null,
			};
			clusterEntry.clickForwarder = () => {
				this.fitBounds(bounds, 64);
			};
			clusterEntry.listener = clusterMarker.addListener('click', clusterEntry.clickForwarder);
			this.clusterMarkers.push(clusterEntry);
		}
	}
	bucketBounds(bucket) {
		let north = -Infinity;
		let south = Infinity;
		let east = -Infinity;
		let west = Infinity;
		const count = bucket.length;
		for (let index = 0; index < count; index += 1) {
			const position = bucket[index].position;
			if (position.lat > north) {
				north = position.lat;
			}
			if (position.lat < south) {
				south = position.lat;
			}
			if (position.lng > east) {
				east = position.lng;
			}
			if (position.lng < west) {
				west = position.lng;
			}
		}
		return {
			north,
			south,
			east,
			west,
		};
	}
	projectItems(items, map) {
		const scale = 2 ** (map.getZoom() || 0);
		const out = [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const position = itemPosition(item);
			if (!position) {
				continue;
			}
			const siny = Math.sin((position.lat * Math.PI) / 180);
			const y = 0.5 - (Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
			const x = ((position.lng + 180) / 360) * scale;
			out.push({
				id: itemId(item, index),
				item,
				index,
				position,
				x: x * 256,
				y: y * scale * 256,
			});
		}
		return out;
	}
	averagePosition(bucket) {
		let lat = 0;
		let lng = 0;
		const count = bucket.length;
		for (let index = 0; index < count; index += 1) {
			lat += bucket[index].position.lat;
			lng += bucket[index].position.lng;
		}
		return {
			lat: lat / count,
			lng: lng / count,
		};
	}
	handleMarkerSelect(id, item, index) {
		this.state.activeIndex = id;
		this.emit('map-google:select', {
			id,
			item,
			index,
		});
		if (this.state.showInfo && (item.info || item.description || item.label)) {
			this.openInfo(id, item);
		}
	}
	handleMarkerDrag(id, item, latLngLike) {
		let point = null;
		if (latLngLike && typeof latLngLike.lat === 'function') {
			point = {
				lat: latLngLike.lat(),
				lng: latLngLike.lng(),
			};
		} else {
			point = toLatLngLiteral(latLngLike);
		}
		if (!point) {
			return;
		}
		this.emit('map-google:marker-drag', {
			id,
			item,
			lat: point.lat,
			lng: point.lng,
		});
	}
	openInfo(id, item) {
		const entry = this.markerById.get(String(id));
		const maps = this.getGoogle();
		if (!entry || !this.infoWindow || !maps) {
			return;
		}
		const html = item.info ||
			`<strong>${escapeHtml(item.label || id)}</strong>${
				item.description ? `<div>${escapeHtml(item.description)}</div>` : ''}`;
		this.infoWindow.setContent(html);
		const position = itemPosition(item);
		if (entry.marker.position) {
			this.infoWindow.open({
				map: this.mapInstance,
				anchor: entry.marker,
			});
		} else if (position) {
			this.infoWindow.setPosition(position);
			this.infoWindow.open(this.mapInstance);
		}
	}
	syncActiveSelection() {
		const id = String(this.state.activeIndex || '');
		if (!id) {
			return;
		}
		const entry = this.markerById.get(id);
		if (!entry) {
			const items = Array.isArray(this.state.items) ? this.state.items : [];
			const count = items.length;
			for (let index = 0; index < count; index += 1) {
				if (itemId(items[index], index) === id) {
					const position = itemPosition(items[index]);
					if (position) {
						this.panTo(position);
					}
					return;
				}
			}
			return;
		}
		const position = itemPosition(entry.item);
		if (position) {
			this.panTo(position);
		}
		if (this.state.showInfo && (entry.item.info || entry.item.description || entry.item.label)) {
			this.openInfo(id, entry.item);
		}
	}
	syncPolylines() {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		const items = Array.isArray(this.state.polylines) ? this.state.polylines : [];
		const seen = new Set();
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const id = itemId(item, index);
			seen.add(id);
			const path = pathFromItem(item.path || item.points);
			let shape = this.polylineById.get(id);
			if (!shape) {
				shape = new maps.Polyline({
					map,
					path,
					strokeColor: item.strokeColor || '#3b82f6',
					strokeOpacity: item.strokeOpacity ?? 0.9,
					strokeWeight: item.strokeWeight ?? 3,
					geodesic: item.geodesic !== false,
					icons: item.icons,
					clickable: item.clickable !== false,
					zIndex: item.zIndex,
				});
				this.polylineById.set(id, shape);
			} else {
				shape.setOptions({
					path,
					strokeColor: item.strokeColor || '#3b82f6',
					strokeOpacity: item.strokeOpacity ?? 0.9,
					strokeWeight: item.strokeWeight ?? 3,
					geodesic: item.geodesic !== false,
					icons: item.icons,
					zIndex: item.zIndex,
				});
				shape.setMap(map);
			}
		}
		this.pruneBucket(this.polylineById, seen);
	}
	syncPolygons() {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		const items = Array.isArray(this.state.polygons) ? this.state.polygons : [];
		const seen = new Set();
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const id = itemId(item, index);
			seen.add(id);
			const paths = Array.isArray(item.paths) ? item.paths.map(pathFromItem) : pathFromItem(item.path || item.points);
			let shape = this.polygonById.get(id);
			const options = {
				paths,
				strokeColor: item.strokeColor || '#6366f1',
				strokeOpacity: item.strokeOpacity ?? 0.85,
				strokeWeight: item.strokeWeight ?? 2,
				fillColor: item.fillColor || '#6366f1',
				fillOpacity: item.fillOpacity ?? 0.25,
				geodesic: item.geodesic !== false,
				clickable: item.clickable !== false,
				zIndex: item.zIndex,
			};
			if (!shape) {
				shape = new maps.Polygon({
					map,
					...options,
				});
				this.polygonById.set(id, shape);
			} else {
				shape.setOptions(options);
				shape.setMap(map);
			}
		}
		this.pruneBucket(this.polygonById, seen);
	}
	syncCircles() {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		const items = Array.isArray(this.state.circles) ? this.state.circles : [];
		const seen = new Set();
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const id = itemId(item, index);
			const center = toLatLngLiteral(item) || toLatLngLiteral(item.center);
			if (!center) {
				continue;
			}
			seen.add(id);
			const options = {
				center,
				radius: Number(item.radius) || 1000,
				strokeColor: item.strokeColor || '#0ea5e9',
				strokeOpacity: item.strokeOpacity ?? 0.85,
				strokeWeight: item.strokeWeight ?? 2,
				fillColor: item.fillColor || '#0ea5e9',
				fillOpacity: item.fillOpacity ?? 0.18,
				clickable: item.clickable !== false,
				zIndex: item.zIndex,
			};
			let shape = this.circleById.get(id);
			if (!shape) {
				shape = new maps.Circle({
					map,
					...options,
				});
				this.circleById.set(id, shape);
			} else {
				shape.setOptions(options);
				shape.setMap(map);
			}
		}
		this.pruneBucket(this.circleById, seen);
	}
	syncRectangles() {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		const items = Array.isArray(this.state.rectangles) ? this.state.rectangles : [];
		const seen = new Set();
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const id = itemId(item, index);
			const bounds = item.bounds || item;
			if (!isFiniteNumber(bounds.north) || !isFiniteNumber(bounds.south) ||
				!isFiniteNumber(bounds.east) || !isFiniteNumber(bounds.west)) {
				continue;
			}
			seen.add(id);
			const options = {
				bounds: {
					north: bounds.north,
					south: bounds.south,
					east: bounds.east,
					west: bounds.west,
				},
				strokeColor: item.strokeColor || '#f59e0b',
				strokeOpacity: item.strokeOpacity ?? 0.85,
				strokeWeight: item.strokeWeight ?? 2,
				fillColor: item.fillColor || '#f59e0b',
				fillOpacity: item.fillOpacity ?? 0.16,
				clickable: item.clickable !== false,
				zIndex: item.zIndex,
			};
			let shape = this.rectangleById.get(id);
			if (!shape) {
				shape = new maps.Rectangle({
					map,
					...options,
				});
				this.rectangleById.set(id, shape);
			} else {
				shape.setOptions(options);
				shape.setMap(map);
			}
		}
		this.pruneBucket(this.rectangleById, seen);
	}
	async syncRoutes() {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		if (!maps || !map) {
			return;
		}
		const items = Array.isArray(this.state.routes) ? this.state.routes : [];
		const seen = new Set();
		if (items.length === 0) {
			this.clearRoutes();
			return;
		}
		let DirectionsService;
		let DirectionsRenderer;
		try {
			const lib = await maps.importLibrary('routes');
			DirectionsService = lib.DirectionsService;
			DirectionsRenderer = lib.DirectionsRenderer;
		} catch {
			// Older bootstraps expose constructors on maps root.
			DirectionsService = maps.DirectionsService;
			DirectionsRenderer = maps.DirectionsRenderer;
		}
		if (!DirectionsService || !DirectionsRenderer) {
			return;
		}
		const service = new DirectionsService();
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const id = itemId(item, index);
			seen.add(id);
			let renderer = this.routeRenderers.get(id);
			if (!renderer) {
				renderer = new DirectionsRenderer({
					map,
					suppressMarkers: Boolean(item.suppressMarkers),
					polylineOptions: item.polylineOptions,
					preserveViewport: Boolean(item.preserveViewport),
				});
				this.routeRenderers.set(id, renderer);
			} else {
				renderer.setMap(map);
			}
			const request = {
				origin: item.origin,
				destination: item.destination,
				travelMode: item.travelMode || maps.TravelMode?.DRIVING || 'DRIVING',
				waypoints: item.waypoints,
				optimizeWaypoints: item.optimizeWaypoints,
				provideRouteAlternatives: item.provideRouteAlternatives,
				avoidFerries: item.avoidFerries,
				avoidHighways: item.avoidHighways,
				avoidTolls: item.avoidTolls,
			};
			try {
				const response = await service.route(request);
				renderer.setDirections(response);
			} catch (cause) {
				this.emit('map-google:error', {
					message: cause?.message || String(cause),
					errKind: 'route-error',
					id,
				});
			}
		}
		for (const [
			id,
			renderer,
		] of this.routeRenderers) {
			if (!seen.has(id)) {
				renderer.setMap(null);
				this.routeRenderers.delete(id);
			}
		}
	}
	syncLayers() {
		const layers = this.state.layers || {};
		this.setLayer('traffic', Boolean(layers.traffic));
		this.setLayer('transit', Boolean(layers.transit));
		this.setLayer('bicycling', Boolean(layers.bicycling));
	}
	setLayer(kind, enabled) {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		if (!maps || !map) {
			return;
		}
		let prop = 'bicyclingLayer';
		let Ctor = maps.BicyclingLayer;
		if (kind === 'traffic') {
			prop = 'trafficLayer';
			Ctor = maps.TrafficLayer;
		} else if (kind === 'transit') {
			prop = 'transitLayer';
			Ctor = maps.TransitLayer;
		}
		if (!enabled) {
			this[prop]?.setMap(null);
			return;
		}
		if (!Ctor) {
			return;
		}
		if (!this[prop]) {
			this[prop] = new Ctor();
		}
		this[prop].setMap(map);
	}
	pruneBucket(bucket, seen) {
		for (const [
			id,
			shape,
		] of bucket) {
			if (!seen.has(id)) {
				shape.setMap(null);
				bucket.delete(id);
			}
		}
	}
	fitItemBounds(padding) {
		const maps = this.getGoogle();
		const map = this.mapInstance;
		if (!maps || !map) {
			return false;
		}
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		const bounds = new maps.LatLngBounds();
		let count = 0;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const position = itemPosition(items[index]);
			if (position) {
				bounds.extend(position);
				count += 1;
			}
		}
		if (count === 0) {
			return false;
		}
		if (count === 1) {
			map.setCenter(bounds.getCenter());
			if ((map.getZoom() || 0) < 12) {
				map.setZoom(12);
			}
			return true;
		}
		map.fitBounds(bounds, isFiniteNumber(padding) ? padding : 48);
		return true;
	}
	toLatLngBounds(boundsLike, maps) {
		if (!boundsLike) {
			return null;
		}
		if (boundsLike instanceof maps.LatLngBounds) {
			return boundsLike;
		}
		if (isFiniteNumber(boundsLike.north) && isFiniteNumber(boundsLike.south) &&
			isFiniteNumber(boundsLike.east) && isFiniteNumber(boundsLike.west)) {
			return new maps.LatLngBounds(
				{
					lat: boundsLike.south,
					lng: boundsLike.west,
				},
				{
					lat: boundsLike.north,
					lng: boundsLike.east,
				}
			);
		}
		if (Array.isArray(boundsLike)) {
			const bounds = new maps.LatLngBounds();
			const count = boundsLike.length;
			for (let index = 0; index < count; index += 1) {
				const point = toLatLngLiteral(boundsLike[index]) || itemPosition(boundsLike[index]);
				if (point) {
					bounds.extend(point);
				}
			}
			return bounds;
		}
		return null;
	}
	hostPhase() {
		if (this.state.loading) {
			return 'loading';
		}
		if (this.state.errorMessage) {
			return 'error';
		}
		if (this.state.ready) {
			return 'ready';
		}
		return 'idle';
	}
	render() {
		const phase = this.hostPhase();
		this.html`
			<div class="gm-root" data-phase=${phase}>
				<div #map class="gm-canvas" role="application" aria-label=${this.state.emptyLabel || 'Map'}></div>
				<div class="gm-overlay" ?hidden=${phase === 'ready'} ?data-interactive=${phase === 'error'}>
					<div class="gm-status" data-tone=${phase === 'error' ? 'danger' : 'neutral'}>
						<span class="gm-status-label">${() => {
							if (phase === 'loading') {
								return 'Loading map…';
							}
							if (phase === 'error') {
								return 'Map unavailable';
							}
							return this.state.emptyLabel || 'Map';
						}}</span>
						<span class="gm-status-msg" ?hidden=${!this.state.errorMessage}>${this.state.errorMessage}</span>
					</div>
				</div>
			</div>
		`;
	}
}
function escapeHtml(value) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
customElements.define('ui-map-google', UIMapGoogle);
