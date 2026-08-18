/**
 * DESCRIPTION: ui-map-opensky — OpenSky Network live-traffic map host.
 * Leaflet + OSM basemap with aircraft polled from the OpenSky REST API
 * (https://opensky-network.org / https://map.opensky-network.org/).
 * The public map SPA is not iframe-embeddable; this host mirrors it by
 * plotting ADS-B state vectors in the current viewport.
 *
 * API: GET https://opensky-network.org/api/states/all?lamin&lomin&lamax&lomax
 * Anonymous use is rate-limited — default pollMs 12000. Research/education only;
 * operational products need an OpenSky license.
 *
 * Events: map-opensky:ready|select|idle|view|error|traffic
 * ── STANDARD USAGE ───────────────────────────────────────────────────
 * <ui-map-opensky
 * .state.center=${{ lat: 51.47, lng: -0.46 }}
 * .state.zoom=${8}
 * .state.pollMs=${12000}
 * @map-opensky:select=${this.handlePick}
 * @map-opensky:traffic=${this.handleTraffic}></ui-map-opensky>
 * // el.openInOpensky() → https://map.opensky-network.org/
	* ─────────────────────────────────────────────────────────────────────
 */
import { UIMapLeaflet } from '../map-leaflet/map-leaflet.js';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const OPENSKY_ATTRIBUTION = 'Aircraft data &copy; <a href="https://opensky-network.org" target="_blank" rel="noopener">The OpenSky Network</a>';
const OPENSKY_API = 'https://opensky-network.org/api/states/all';
const OPENSKY_MAP = 'https://map.opensky-network.org/';
const DEFAULT_POLL_MS = 12000;
const DEFAULT_MAX_TRAFFIC = 400;
function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}
/** OpenSky `states` row → map item (plane marker). */
function stateRowToItem(row) {
	if (!Array.isArray(row) || row.length < 11) {
		return null;
	}
	const lat = row[6];
	const lng = row[5];
	if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
		return null;
	}
	const icao24 = String(row[0] || '').trim();
	const callsign = String(row[1] || '').trim();
	const id = icao24 || callsign;
	if (!id) {
		return null;
	}
	const heading = isFiniteNumber(row[10]) ? row[10] : null;
	const speed = isFiniteNumber(row[9]) ? row[9] : null;
	let altitude = null;
	if (isFiniteNumber(row[7])) {
		altitude = row[7];
	} else if (isFiniteNumber(row[13])) {
		altitude = row[13];
	}
	return {
		id,
		icao24,
		callsign,
		label: callsign || icao24,
		kind: 'flight',
		marker: 'plane',
		tone: 'success',
		lat,
		lng,
		heading,
		speed,
		altitude,
		onGround: Boolean(row[8]),
		originCountry: row[2] || '',
		verticalRate: isFiniteNumber(row[11]) ? row[11] : null,
		squawk: row[14] || '',
		source: 'opensky',
		iconColor: '#22c55e',
	};
}
function parseStatesPayload(payload) {
	const rows = Array.isArray(payload?.states) ? payload.states : [];
	const out = [];
	const count = rows.length;
	for (let index = 0; index < count; index += 1) {
		const item = stateRowToItem(rows[index]);
		if (item) {
			out.push(item);
		}
	}
	return out;
}
function boundsFromMap(map) {
	if (!map?.getBounds) {
		return null;
	}
	const bounds = map.getBounds();
	if (!bounds?.getSouth) {
		return null;
	}
	return {
		south: bounds.getSouth(),
		west: bounds.getWest(),
		north: bounds.getNorth(),
		east: bounds.getEast(),
	};
}
function mergeById(userItems, trafficItems) {
	const out = [];
	const seen = new Set();
	const user = Array.isArray(userItems) ? userItems : [];
	const traffic = Array.isArray(trafficItems) ? trafficItems : [];
	const userCount = user.length;
	for (let index = 0; index < userCount; index += 1) {
		const item = user[index];
		if (!item) {
			continue;
		}
		const id = item.id != null && item.id !== '' ? String(item.id) : `user-${index}`;
		if (seen.has(id)) {
			continue;
		}
		seen.add(id);
		out.push(item);
	}
	const trafficCount = traffic.length;
	for (let index = 0; index < trafficCount; index += 1) {
		const item = traffic[index];
		if (!item) {
			continue;
		}
		const id = item.id != null && item.id !== '' ? String(item.id) : `osky-${index}`;
		if (seen.has(id)) {
			continue;
		}
		seen.add(id);
		out.push(item);
	}
	return out;
}
export class UIMapOpensky extends UIMapLeaflet {
	static url = import.meta.url;
	static styles = {
		leaflet: '../map-leaflet/leaflet.css',
		opensky: './map-opensky.css',
	};
	static state = {
		emptyLabel: 'OpenSky Network',
		tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		tileAttribution: `${OSM_ATTRIBUTION} · ${OPENSKY_ATTRIBUTION}`,
		showTraffic: true,
		pollMs: DEFAULT_POLL_MS,
		maxTraffic: DEFAULT_MAX_TRAFFIC,
		trafficItems: [],
		trafficLoading: false,
		trafficError: '',
		trafficUpdated: 0,
		apiUser: '',
		apiPassword: '',
	};
	pollTimer = null;
	loadGeneration = 0;
	abortController = null;
	trafficDebounce = null;
	// Traffic only while on-screen — preview keeps every map mounted; polling
	// off-screen (or under a hidden category) hammered OpenSky / CORS noise.
	onConnect() {
		super.onConnect();
		this.observe([
			'showTraffic',
			'pollMs',
		], this.restartTrafficPoll);
	}
	onMount() {
		super.onMount();
		// Do not start here — wait for onIntersect(true) so hidden demos stay quiet.
		if (this.isVisible) {
			this.restartTrafficPoll();
		}
	}
	onIntersect(isIntersecting) {
		if (isIntersecting) {
			this.restartTrafficPoll();
			return;
		}
		this.pauseTraffic();
	}
	onDisconnect() {
		this.pauseTraffic();
		super.onDisconnect();
	}
	/* Stop timer + abort in-flight fetch (not merely clear the interval). */
	pauseTraffic() {
		this.stopTrafficPoll();
		this.abortController?.abort();
		this.abortController = null;
		this.state.trafficLoading = false;
	}
	mapEvent(action) {
		return `map-opensky:${action}`;
	}
	loadingLabel() {
		return 'Loading OpenSky map…';
	}
	/** User markers + live traffic (user ids win on conflict). */
	markerItems() {
		const user = Array.isArray(this.state.items) ? this.state.items : [];
		if (this.state.showTraffic === false) {
			return user;
		}
		return mergeById(user, this.state.trafficItems);
	}
	onMapMove() {
		super.onMapMove();
		if (!this.isVisible) {
			return;
		}
		this.scheduleTrafficRefresh();
	}
	restartTrafficPoll() {
		this.stopTrafficPoll();
		if (this.state.showTraffic === false) {
			this.state.trafficItems = [];
			this.scheduleOverlaySync();
			return;
		}
		// Off-screen / display:none (e.g. preview category filter) — no network.
		if (!this.isVisible) {
			return;
		}
		this.refreshTraffic();
		const pollMs = Number(this.state.pollMs) || DEFAULT_POLL_MS;
		if (pollMs > 0) {
			this.pollTimer = this.addInterval(this.onTrafficPollTick, Math.max(pollMs, 5000));
		}
	}
	stopTrafficPoll() {
		if (this.pollTimer != null) {
			this.stopInterval(this.pollTimer);
			this.pollTimer = null;
		}
		if (this.trafficDebounce != null) {
			this.trafficDebounce.clear();
			this.trafficDebounce = null;
		}
	}
	onTrafficPollTick(component) {
		component.refreshTraffic();
	}
	scheduleTrafficRefresh() {
		if (this.state.showTraffic === false || !this.isVisible) {
			return;
		}
		if (!this.trafficDebounce) {
			this.trafficDebounce = this.createTimeout(this.onTrafficDebounceFire, 600);
		}
		this.trafficDebounce.run();
	}
	onTrafficDebounceFire(component) {
		component.refreshTraffic();
	}
	async refreshTraffic() {
		if (this.state.showTraffic === false || !this.mapInstance || !this.isVisible) {
			return;
		}
		const bounds = boundsFromMap(this.mapInstance);
		if (!bounds) {
			return;
		}
		const generation = (this.loadGeneration += 1);
		this.abortController?.abort();
		const controller = new AbortController();
		this.abortController = controller;
		this.state.trafficLoading = true;
		const result = await this.fetchOpenSkyStates(bounds, controller.signal);
		if (generation !== this.loadGeneration) {
			return;
		}
		if (!result.ok) {
			this.assignState({
				trafficLoading: false,
				trafficError: result.message,
			});
			if (result.errKind !== 'aborted') {
				this.emit(this.mapEvent('error'), {
					message: result.message,
					errKind: result.errKind,
				});
			}
			return;
		}
		this.assignState({
			trafficItems: result.items,
			trafficLoading: false,
			trafficError: '',
			trafficUpdated: Date.now(),
			// Host-level map error (if any) should not stick after recovery either.
			errorMessage: '',
		});
		this.scheduleOverlaySync();
		this.emit(this.mapEvent('traffic'), {
			items: result.items,
			count: result.items.length,
			bounds,
			recovered: true,
		});
	}
	async fetchOpenSkyStates(bounds, signal) {
		const params = new URLSearchParams();
		params.set('lamin', String(bounds.south));
		params.set('lomin', String(bounds.west));
		params.set('lamax', String(bounds.north));
		params.set('lomax', String(bounds.east));
		const headers = {
			Accept: 'application/json',
		};
		const user = String(this.state.apiUser || '').trim();
		const password = String(this.state.apiPassword || '');
		if (user) {
			headers.Authorization = `Basic ${globalThis.btoa(`${user}:${password}`)}`;
		}
		try {
			const response = await globalThis.fetch(`${OPENSKY_API}?${params.toString()}`, {
				signal,
				headers,
			});
			if (!response.ok) {
				return {
					ok: false,
					errKind: 'http-error',
					message: `OpenSky HTTP ${response.status}`,
				};
			}
			const payload = await response.json();
			let items = parseStatesPayload(payload);
			const max = Number(this.state.maxTraffic) || DEFAULT_MAX_TRAFFIC;
			if (items.length > max) {
				items = items.slice(0, max);
			}
			return {
				ok: true,
				items,
			};
		} catch (cause) {
			if (cause?.name === 'AbortError') {
				return {
					ok: false,
					errKind: 'aborted',
					message: 'OpenSky request aborted',
				};
			}
			return {
				ok: false,
				errKind: 'network-error',
				message: cause?.message || String(cause),
			};
		}
	}
	openskyMapUrl() {
		return OPENSKY_MAP;
	}
	openInOpensky() {
		const url = this.openskyMapUrl();
		globalThis.open(url, '_blank', 'noopener,noreferrer');
		return url;
	}
	trafficStatusLabel() {
		if (this.state.trafficError) {
			return 'OpenSky error';
		}
		if (this.state.trafficLoading) {
			return 'OpenSky…';
		}
		const count = Array.isArray(this.state.trafficItems) ? this.state.trafficItems.length : 0;
		if (this.state.showTraffic === false) {
			return 'OpenSky off';
		}
		return `OpenSky · ${count}`;
	}
	trafficBadgeTone() {
		return this.state.trafficError ? 'danger' : 'neutral';
	}
	render() {
		const phase = this.hostPhase();
		this.html`
			<div class="lf-root" data-phase=${phase}>
				<div #map class="lf-canvas" role="application" aria-label=${this.state.emptyLabel || 'OpenSky map'}></div>
				<div class="osky-badge" data-tone=${this.trafficBadgeTone} ?data-loading=${this.state.trafficLoading}>${this.trafficStatusLabel}</div>
				<div class="lf-overlay" ?hidden=${phase === 'ready'} ?data-interactive=${phase === 'error'}>
					<div class="lf-status" data-tone=${phase === 'error' ? 'danger' : 'neutral'}>
						<span class="lf-status-label">${() => {
							if (phase === 'loading') {
								return this.loadingLabel();
							}
							if (phase === 'error') {
								return 'Map unavailable';
							}
							return this.state.emptyLabel || 'OpenSky Network';
						}}</span>
						<span class="lf-status-msg" ?hidden=${!this.state.errorMessage}>${this.state.errorMessage}</span>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-map-opensky', UIMapOpensky);
