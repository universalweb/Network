/*
	DESCRIPTION: ui-youtube-video-player — a lite YouTube facade (zero-dep, no
	build). Shows the thumbnail + a play button and loads ZERO YouTube code until
	the user clicks; only then does the iframe mount (fast first paint, no tracker
	until intent). Accepts a bare video id or any youtube.com / youtu.be URL.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-youtube-video-player .state.videoId=${'aqz-KE-bpKQ'} .state.videoTitle=${'Big Buck Bunny'}></ui-youtube-video-player>
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
	handlePlay() {
		this.state.playing = true;
		this.emit('youtube-video-player:play', {
			videoId: extractId(this.state.videoId),
		});
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
	render() {
		this.html`
			<div class="yt" ?data-playing=${this.state.playing}>
				${() => {
					return this.state.playing ? this.playerFragment() : this.facadeFragment();
				}}
			</div>
		`;
	}
}
customElements.define('ui-youtube-video-player', UIYoutubeVideoPlayer);
