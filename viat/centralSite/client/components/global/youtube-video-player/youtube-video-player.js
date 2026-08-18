/*
	DESCRIPTION: ui-youtube-video-player — a lite YouTube facade (zero-dep, no
	build). Shows the thumbnail + a play button and loads ZERO YouTube code until
	the user clicks; only then does the iframe mount (fast first paint, no tracker
	until intent). Accepts a bare video id or any youtube.com / youtu.be URL.
	Optional confirm gates:
	  ageConfirm — blur + “I am 18+” before play
	  graphicConfirm — blur + “content may be graphic” before play
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-youtube-video-player .state.videoId=${'aqz-KE-bpKQ'} .state.videoTitle=${'Big Buck Bunny'}></ui-youtube-video-player>
	  <ui-youtube-video-player .state.videoId=${'…'} .state.ageConfirm=${true} .state.minAge=${18}></ui-youtube-video-player>
	  <ui-youtube-video-player .state.videoId=${'…'} .state.graphicConfirm=${true}></ui-youtube-video-player>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
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
	};
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
		return this.state.ageConfirm === true && this.state.ageConfirmed !== true;
	}
	needsGraphicGate() {
		return this.state.graphicConfirm === true && this.state.graphicConfirmed !== true;
	}
	needsConfirmGate() {
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
		if (this.needsConfirmGate()) {
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
	}
	handleGraphicConfirm() {
		this.state.graphicConfirmed = true;
		this.emit('youtube-video-player:graphic-confirm', {});
	}
	handleGateCancel() {
		this.emit('youtube-video-player:confirm-cancel', {
			gate: this.activeGate(),
		});
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
	gateFragment() {
		const gate = this.activeGate();
		const isAge = gate === 'age';
		return this.htmlElement`
			<div class="yt-gate" data-gate=${gate} role="dialog" aria-modal="true" aria-labelledby="yt-gate-title">
				<img class="yt-thumb yt-thumb-blur" src=${this.thumbnailUrl()} alt="" loading="lazy" aria-hidden="true">
				<div class="yt-gate-scrim" aria-hidden="true"></div>
				<div class="yt-gate-card">
					<div class="yt-gate-badge" aria-hidden="true">${isAge ? '18+' : '!'}</div>
					<h3 class="yt-gate-title" id="yt-gate-title">${isAge ? this.ageHeading() : 'Graphic content warning'}</h3>
					<p class="yt-gate-body">${isAge ? this.ageBody() : 'This video may contain graphic or disturbing material. Continue only if you want to view it.'}</p>
					<div class="yt-gate-actions">
						<button type="button" class="yt-gate-btn yt-gate-cancel" @click=${this.handleGateCancel}>Cancel</button>
						<button type="button" class="yt-gate-btn yt-gate-confirm" @click=${isAge ? this.handleAgeConfirm : this.handleGraphicConfirm}>
							${isAge ? this.ageActionLabel() : 'I understand — continue'}
						</button>
					</div>
				</div>
			</div>
		`;
	}
	facadeFragment() {
		return this.htmlElement`
			<button class="yt-facade" type="button" aria-label=${this.state.videoTitle ? `Play video: ${this.state.videoTitle}` : 'Play video'} @click=${this.handlePlay}>
				<img class="yt-thumb" src=${this.thumbnailUrl()} alt="" loading="lazy">
				<span class="yt-scrim" aria-hidden="true"></span>
				<span class="yt-play" aria-hidden="true"><ui-icon .state.name=${'play'} .state.size=${'lg'}></ui-icon></span>
				<span class="yt-title" ?hidden=${!this.state.videoTitle}>${this.state.videoTitle}</span>
			</button>
		`;
	}
	playerFragment() {
		return this.htmlElement`
			<iframe
				class="yt-frame"
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
			<div class="yt" ?data-playing=${this.state.playing} ?data-gated=${this.needsConfirmGate}>
				${this.mainFragment}
			</div>
		`;
	}
}
customElements.define('ui-youtube-video-player', UIYoutubeVideoPlayer);
