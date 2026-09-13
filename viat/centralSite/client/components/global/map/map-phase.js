/*
	Shared map-host overlay phase. Leaflet, Google, and OpenLayers
	extend this; OpenStreetMap / OpenSky inherit via Leaflet.
	Not a custom element — each host registers its own tag.
	Template spots bind METHOD REFERENCES (hostPhase / isReady /
	isError / phaseTone / phaseLabel). A render-local `const phase =
	this.hostPhase()` bakes a string and never updates.
*/
import { WebComponent } from 'webcomponent';
export class MapPhase extends WebComponent {
	loadingLabel() {
		return 'Loading map…';
	}
	emptyFallback() {
		return 'Map';
	}
	canvasLabel() {
		return this.state.emptyLabel || this.emptyFallback();
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
	isReady() {
		return this.hostPhase() === 'ready';
	}
	isError() {
		return this.hostPhase() === 'error';
	}
	isLoading() {
		return this.hostPhase() === 'loading';
	}
	phaseTone() {
		return this.isError() ? 'danger' : 'neutral';
	}
	phaseLabel() {
		const phase = this.hostPhase();
		if (phase === 'loading') {
			return this.loadingLabel();
		}
		if (phase === 'error') {
			return 'Map unavailable';
		}
		return this.state.emptyLabel || this.emptyFallback();
	}
	mapChrome() {
		return '';
	}
	render() {
		this.html`
			<div class="map-root" data-phase=${this.hostPhase}>
				<div #map class="map-canvas" role="application" aria-label=${this.canvasLabel}></div>
				${this.mapChrome}
				<div class="map-overlay" ?hidden=${this.isReady} ?data-interactive=${this.isError}>
					<div class="map-status" data-tone=${this.phaseTone}>
						<span class="map-status-label">${this.phaseLabel}</span>
						<span class="map-status-msg" ?hidden=${!this.state.errorMessage}>${this.state.errorMessage}</span>
					</div>
				</div>
			</div>
		`;
	}
}
