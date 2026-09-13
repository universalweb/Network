/*
	DESCRIPTION: ui-youtube-video-player — a lite YouTube facade (zero-dep, no
	build). Shows the thumbnail + a play button and loads ZERO YouTube code until
	the user clicks; only then does the iframe mount (fast first paint, no tracker
	until intent). Accepts a bare video id or any youtube.com / youtu.be URL.
	Optional confirm gates:
	  ageConfirm — blur + “I am 18+” before play
	  graphicConfirm — blur + “content may be graphic” before play
	Decision: Cancel collapses the gate to the idle facade. The component
	owns dismissal — a role="dialog" whose Cancel changes nothing is a
	lying control, and a blank-slate primitive must still be
	self-consistent (the Tier Rule is about CONTENT, not behaviour).
	Still emits youtube-video-player:confirm-cancel so a host can react.
	Play after Cancel re-opens the gate; it does not bypass confirmation.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-youtube-video-player .state.videoId=${'aqz-KE-bpKQ'} .state.videoTitle=${'Big Buck Bunny'}></ui-youtube-video-player>
	  <ui-youtube-video-player .state.videoId=${'…'} .state.ageConfirm=${true} .state.minAge=${18}></ui-youtube-video-player>
	  <ui-youtube-video-player .state.videoId=${'…'} .state.graphicConfirm=${true}></ui-youtube-video-player>
	─────────────────────────────────────────────────────────────────────
*/
import {
	armLazy, isTrue, onLazyVisible, syncLazy, WebComponent,
} from 'webcomponent';
// Pull the 11-ish-char id out of a full URL, or pass through a bare id.
function extractId(raw) {
	const value = String(raw ?? '').trim();
	if (!value) {
		return '';
	}
	if (!value.includes('/') && !value.includes('?')) {
		return value;
	}
	const shortMatch = value.match(/youtu\.be\/([\w-]{6,})/);
	if (shortMatch) {
		return shortMatch[1];
	}
	const queryMatch = value.match(/[?&]v=([\w-]{6,})/);
	if (queryMatch) {
		return queryMatch[1];
	}
	const embedMatch = value.match(/embed\/([\w-]{6,})/);
	if (embedMatch) {
		return embedMatch[1];
	}
	return value;
}
export class UIYoutubeVideoPlayer extends WebComponent {
	static url = import.meta.url;
	static styles = {
		youtubeVideoPlayer: './youtube-video-player.css',
	};
	static state = {
		videoId: '',
		// NOT `title`: that is a native HTMLElement property, so a `.title=` binding
		// sets the host attribute and never reaches state. `videoTitle` is safe.
		videoTitle: '',
		thumbnail: '',
		playing: false,
		// Age gate — blur facade until confirmed.
		ageConfirm: false,
		minAge: 18,
		ageConfirmed: false,
		// Graphic-content gate — blur until acknowledged.
		graphicConfirm: false,
		graphicConfirmed: false,
		// Cancel hid the overlay; confirmation is still pending.
		gateDismissed: false,
		lazy: true,
		loaded: false,
	};
	pendingGateFocus = false;
	gateFocusTries = 0;
	onConnect() {
		this.observe('lazy', this.onLazyFlag);
		armLazy(this);
	}
	onVisible() {
		onLazyVisible(this);
	}
	onLazyFlag() {
		syncLazy(this);
	}
	onRendered() {
		this.flushGateFocus(this);
	}
	thumbnailUrl() {
		if (this.state.thumbnail) {
			return this.state.thumbnail;
		}
		return `https://i.ytimg.com/vi/${extractId(this.state.videoId)}/hqdefault.jpg`;
	}
	embedUrl() {
		const id = extractId(this.state.videoId);
		return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
	}
	needsAgeGate() {
		return isTrue(this.state.ageConfirm) && !isTrue(this.state.ageConfirmed);
	}
	needsGraphicGate() {
		return isTrue(this.state.graphicConfirm) && !isTrue(this.state.graphicConfirmed);
	}
	needsConfirmGate() {
		if (isTrue(this.state.gateDismissed)) {
			return false;
		}
		return this.needsAgeGate() || this.needsGraphicGate();
	}
	// Prefer showing one gate at a time — age first, then graphic.
	activeGate() {
		if (this.needsAgeGate()) {
			return 'age';
		}
		if (this.needsGraphicGate()) {
			return 'graphic';
		}
		return '';
	}
	handlePlay() {
		if (this.needsAgeGate() || this.needsGraphicGate()) {
			if (isTrue(this.state.gateDismissed)) {
				this.state.gateDismissed = false;
			}
			return;
		}
		this.state.playing = true;
		this.emit('youtube-video-player:play', {
			videoId: extractId(this.state.videoId),
		});
	}
	handleAgeConfirm() {
		this.state.ageConfirmed = true;
		this.emit('youtube-video-player:age-confirm', {
			minAge: Number(this.state.minAge) || 18,
		});
		this.armGateFocus();
	}
	handleGraphicConfirm() {
		this.state.graphicConfirmed = true;
		this.emit('youtube-video-player:graphic-confirm', {});
		this.armGateFocus();
	}
	handleGateCancel() {
		const gate = this.activeGate();
		this.state.gateDismissed = true;
		this.emit('youtube-video-player:confirm-cancel', {
			gate,
		});
		this.armGateFocus();
	}
	/*
	 * Confirm/Cancel removes the control that had focus. The replacement
	 * (facade, or a remaining gate) is painted on the following frame.
	 */
	armGateFocus() {
		this.pendingGateFocus = true;
		this.gateFocusTries = 0;
		this.queueGateFocusFrame();
	}
	async queueGateFocusFrame() {
		await this.nextFrame();
		this.flushGateFocus(this);
	}
	flushGateFocus(component) {
		const host = component || this;
		if (!host.pendingGateFocus) {
			return;
		}
		if (host.isDisconnected) {
			host.pendingGateFocus = false;
			return;
		}
		const target = host.needsConfirmGate() ? host.refs.gate_confirm : host.refs.facade;
		if (!target) {
			if (host.gateFocusTries < 2) {
				host.gateFocusTries += 1;
				host.queueGateFocusFrame();
				return;
			}
			host.pendingGateFocus = false;
			return;
		}
		host.pendingGateFocus = false;
		target.focus();
	}
	ageHeading() {
		const minAge = Number(this.state.minAge) || 18;
		return `Age confirmation required`;
	}
	ageBody() {
		const minAge = Number(this.state.minAge) || 18;
		return `You must be ${minAge} or older to watch this video. Confirm your age to continue.`;
	}
	ageActionLabel() {
		const minAge = Number(this.state.minAge) || 18;
		return `I am ${minAge}+`;
	}
	thumbNode() {
		if (!isTrue(this.state.loaded)) {
			return '';
		}
		return this.htmlElement`<img class="youtube-video-player-thumb" src=${this.thumbnailUrl()} alt="" loading="lazy">`;
	}
	gateThumbNode() {
		if (!isTrue(this.state.loaded)) {
			return '';
		}
		return this.htmlElement`<img class="youtube-video-player-thumb youtube-video-player-thumb-blur" src=${this.thumbnailUrl()} alt="" loading="lazy" aria-hidden="true">`;
	}
	gateFragment() {
		const gate = this.activeGate();
		const isAge = gate === 'age';
		/* Player-scoped consent overlay, not a page blocker — deliberately
		non-modal so the rest of the document stays usable. aria-modal asserts
		modality rather than creating it. */
		return this.htmlElement`
			<div class="youtube-video-player-gate" data-gate=${gate} role="dialog" aria-labelledby="youtube-video-player-gate-title">
				${this.gateThumbNode}
				<div class="youtube-video-player-gate-scrim" aria-hidden="true"></div>
				<div class="youtube-video-player-gate-card">
					<div class="youtube-video-player-gate-badge" aria-hidden="true">${isAge ? '18+' : '!'}</div>
					<h3 class="youtube-video-player-gate-title" id="youtube-video-player-gate-title">${isAge ? this.ageHeading() : 'Graphic content warning'}</h3>
					<p class="youtube-video-player-gate-body">${isAge ? this.ageBody() : 'This video may contain graphic or disturbing material. Continue only if you want to view it.'}</p>
					<div class="youtube-video-player-gate-actions">
						<button type="button" class="youtube-video-player-gate-btn youtube-video-player-gate-cancel" @click=${this.handleGateCancel}>Cancel</button>
						<button type="button" class="youtube-video-player-gate-btn youtube-video-player-gate-confirm" #gate_confirm @click=${isAge ? this.handleAgeConfirm : this.handleGraphicConfirm}>
							${isAge ? this.ageActionLabel() : 'I understand — continue'}
						</button>
					</div>
				</div>
			</div>
		`;
	}
	facadeFragment() {
		return this.htmlElement`
			<button class="youtube-video-player-facade" type="button" #facade aria-label=${this.state.videoTitle ? `Play video: ${this.state.videoTitle}` : 'Play video'} @click=${this.handlePlay}>
				${this.thumbNode}
				<span class="youtube-video-player-scrim" aria-hidden="true"></span>
				<span class="youtube-video-player-play" aria-hidden="true"><ui-icon .state.name=${'play'} .state.size=${'lg'}></ui-icon></span>
				<span class="youtube-video-player-title" ?hidden=${!this.state.videoTitle}>${this.state.videoTitle}</span>
			</button>
		`;
	}
	playerFragment() {
		return this.htmlElement`
			<iframe
				class="youtube-video-player-frame"
				src=${this.embedUrl()}
				aria-label=${this.state.videoTitle || 'YouTube video'}
				allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
				allowfullscreen></iframe>
		`;
	}
	mainFragment() {
		if (this.state.playing) {
			return this.playerFragment();
		}
		if (this.needsConfirmGate()) {
			return this.gateFragment();
		}
		return this.facadeFragment();
	}
	render() {
		this.html`
			<div class="youtube-video-player" ?data-playing=${this.state.playing} ?data-gated=${this.needsConfirmGate}>
				${this.mainFragment}
			</div>
		`;
	}
}
customElements.define('ui-youtube-video-player', UIYoutubeVideoPlayer);
