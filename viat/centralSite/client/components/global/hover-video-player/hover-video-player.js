/*
	DESCRIPTION: ui-hover-video-player — a muted video that plays on hover and
	resets on leave (zero-dep, no build). On hover the whole player springs up +
	lifts (scale + shadow, raised above neighbours) as it starts playing; a
	poster/overlay covers it until play and a play affordance hints it's
	interactive. Muted by default so the browser permits hover-autoplay; loops by
	default. Reduced-motion drops the fades and the expand.
	The hover pop size is configurable: set `hoverScale` (e.g. 1.2 for a bigger
	cult-ui-style lift). 0 keeps the CSS default (--hv-hover-scale fallback), so a
	theme can also retune it globally via that custom property.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-hover-video-player .state.src=${'/clip.mp4'} .state.poster=${'/clip.jpg'} .state.hoverScale=${1.2}></ui-hover-video-player>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
export class UIHoverVideoPlayer extends WebComponent {
	static url = import.meta.url;
	static styles = {
		hoverVideoPlayer: './hover-video-player.css',
	};
	static state = {
		src: '',
		poster: '',
		muted: true,
		loop: true,
		preload: 'metadata',
		delay: 0,
		playing: false,
		hoverScale: 0,
	};
	hoverVars() {
		// 0 ⇒ defer to the CSS fallback (the single source of truth for the resting
		// hover size); any set value overrides the pop per-instance.
		return this.state.hoverScale ? `--hv-hover-scale: ${this.state.hoverScale};` : '';
	}
	onMount() {
		// The muted attribute alone is unreliable for autoplay; pin the property.
		const video = this.refs.video;
		if (video) {
			video.muted = Boolean(this.state.muted);
		}
	}
	playVideo() {
		const video = this.refs.video;
		if (!video) {
			return;
		}
		video.muted = Boolean(this.state.muted);
		const played = video.play();
		// Autoplay policies / a pause mid-load reject play() — that's expected.
		if (played?.catch) {
			played.catch(() => {});
		}
		this.state.playing = true;
	}
	handleEnter() {
		if (this.state.delay > 0) {
			this.playTimer = this.setTimeout(this.playOnTimer, this.state.delay);
			return;
		}
		this.playVideo();
	}
	/*
	 * Delayed-play timer's callback (hover-intent debounce). Created + armed per
	 * enter with the live `state.delay`; handleLeave clears it. The handle passes
	 * the component as arg 1.
	 */
	playOnTimer(component) {
		component.playVideo();
	}
	handleLeave() {
		this.playTimer?.clear();
		const video = this.refs.video;
		if (video) {
			video.pause();
			video.currentTime = 0;
		}
		this.state.playing = false;
	}
	render() {
		this.html`
			<div class="hv" style=${this.hoverVars} ?data-playing=${this.state.playing} @pointerenter=${this.handleEnter} @pointerleave=${this.handleLeave}>
				<video
					#video class="hv-video"
					src=${this.state.src}
					?loop=${this.state.loop}
					preload=${this.state.preload}
					playsinline muted></video>
				<img class="hv-poster" ?hidden=${!this.state.poster} src=${this.state.poster || ''} alt="" aria-hidden="true">
				<span class="hv-overlay" aria-hidden="true">
					<span class="hv-play"><ui-icon .state.name=${'play'} .state.size=${'md'}></ui-icon></span>
				</span>
			</div>
		`;
	}
}
customElements.define('ui-hover-video-player', UIHoverVideoPlayer);
