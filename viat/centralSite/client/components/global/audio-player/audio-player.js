/*
	DESCRIPTION: ui-audio-player — music/recordings with artwork + transport.
	Artwork modes: cover | disc | banner | hidden. Seek bar is imperative
	(timeupdate does not write reactive state — avoids a render per tick).
	── EVENTS ───────────────────────────────────────────────────────────
	  audio-player:play { src }
	  audio-player:pause { src }
	  audio-player:change { src, currentTime }
	  audio-player:complete { src }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-audio-player .state.src=${url} .state.heading=${'Track'}
	    .state.artist=${'Artist'} .state.artwork=${'cover'}></ui-audio-player>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { isFunction, isString } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
const ARTWORK = new Set([
	'cover', 'disc', 'banner', 'hidden',
]);
function padTime(value) {
	return String(value).padStart(2, '0');
}
function formatClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return '0:00';
	}
	const whole = Math.floor(seconds);
	const mins = Math.floor(whole / 60);
	const secs = whole % 60;
	if (mins >= 60) {
		const hours = Math.floor(mins / 60);
		return `${hours}:${padTime(mins % 60)}:${padTime(secs)}`;
	}
	return `${mins}:${padTime(secs)}`;
}
export class UIAudioPlayer extends WebComponent {
	static url = import.meta.url;
	static styles = {
		audioPlayer: './audio-player.css',
	};
	static state = {
		src: '',
		heading: '',
		artist: '',
		artworkSrc: '',
		artwork: 'cover',
		playing: false,
		muted: false,
		volume: 1,
	};
	seeking = false;
	onConnect() {
		this.observe([
			'volume',
			'muted',
			'src',
		], this.applyMediaFlags);
	}
	onRender() {
		this.applyMediaFlags();
	}
	/*
	 * Push src / volume / muted onto the media element. `src` is applied
	 * imperatively and only when it actually changes — re-setting the same
	 * URL on a patch pass (e.g. play → playing=true) calls HTMLMediaElement
	 * load() and kills playback (NaN duration, play/pause loop).
	 */
	applyMediaFlags() {
		const node = this.refs.audio;
		if (!node) {
			return;
		}
		this.applySrc(node);
		const volume = Number(this.state.volume);
		if (Number.isFinite(volume)) {
			node.volume = Math.min(1, Math.max(0, volume));
		}
		node.muted = this.state.muted === true;
	}
	applySrc(node) {
		const src = isString(this.state.src) ? this.state.src : '';
		const current = node.getAttribute('src') || '';
		if (current === src) {
			return;
		}
		if (src === '') {
			node.removeAttribute('src');
			node.load();
			this.paintClock(0, 0);
			return;
		}
		node.setAttribute('src', src);
		node.load();
		this.paintClock(0, 0);
	}
	static onPlayRejected() {
		// Autoplay policy / missing src — leave playing=false.
	}
	artworkToken() {
		const token = String(this.state.artwork || 'cover');
		return ARTWORK.has(token) ? token : 'cover';
	}
	artHidden() {
		return this.artworkToken() === 'hidden' || !this.state.artworkSrc;
	}
	artistHidden() {
		return !this.state.artist;
	}
	playIcon() {
		return this.state.playing ? 'pause' : 'play';
	}
	volumeIcon() {
		return this.state.muted ? 'volume-x' : 'volume-2';
	}
	playLabel() {
		return this.state.playing ? 'Pause' : 'Play';
	}
	handlePlayToggle() {
		const node = this.refs.audio;
		if (!node) {
			return;
		}
		if (node.paused) {
			const playResult = node.play();
			if (isFunction(playResult?.catch)) {
				playResult.catch(UIAudioPlayer.onPlayRejected);
			}
			return;
		}
		node.pause();
	}
	handleNativePlay(domEvent) {
		domEvent.stopPropagation();
		this.state.playing = true;
		this.emit('audio-player:play', {
			src: this.state.src,
		});
	}
	handleNativePause(domEvent) {
		domEvent.stopPropagation();
		this.state.playing = false;
		this.emit('audio-player:pause', {
			src: this.state.src,
		});
	}
	handleEnded(domEvent) {
		domEvent.stopPropagation();
		this.state.playing = false;
		this.paintClock(0, this.refs.audio?.duration || 0);
		this.emit('audio-player:complete', {
			src: this.state.src,
		});
	}
	handleMeta() {
		const node = this.refs.audio;
		if (!node) {
			return;
		}
		this.paintClock(node.currentTime, node.duration);
	}
	handleTimeUpdate(domEvent) {
		domEvent.stopPropagation();
		if (this.seeking) {
			return;
		}
		const node = this.refs.audio;
		if (!node) {
			return;
		}
		this.paintClock(node.currentTime, node.duration);
	}
	paintClock(currentTime, duration) {
		const elapsed = this.refs.elapsed;
		const total = this.refs.total;
		const seek = this.refs.seek;
		if (elapsed) {
			elapsed.textContent = formatClock(currentTime);
		}
		if (total) {
			total.textContent = formatClock(duration);
		}
		if (seek && Number.isFinite(duration) && duration > 0) {
			seek.value = String((currentTime / duration) * 100);
		}
	}
	handleSeekInput(domEvent) {
		domEvent.stopPropagation();
		this.seeking = true;
		const node = this.refs.audio;
		const duration = node?.duration || 0;
		const ratio = Number(domEvent.target.value) / 100;
		if (this.refs.elapsed) {
			this.refs.elapsed.textContent = formatClock(ratio * duration);
		}
	}
	handleSeekChange(domEvent) {
		domEvent.stopPropagation();
		const node = this.refs.audio;
		if (!node || !Number.isFinite(node.duration) || node.duration <= 0) {
			this.seeking = false;
			return;
		}
		const nextTime = (Number(domEvent.target.value) / 100) * node.duration;
		node.currentTime = nextTime;
		this.seeking = false;
		this.emit('audio-player:change', {
			src: this.state.src,
			currentTime: nextTime,
		});
	}
	handleMute() {
		const node = this.refs.audio;
		if (!node) {
			return;
		}
		node.muted = !node.muted;
		this.state.muted = node.muted;
	}
	handleVolume(domEvent) {
		domEvent.stopPropagation();
		const node = this.refs.audio;
		const nextVolume = Number(domEvent.target.value);
		if (!node) {
			return;
		}
		node.volume = nextVolume;
		this.state.volume = nextVolume;
		if (nextVolume === 0) {
			this.state.muted = true;
			node.muted = true;
			return;
		}
		if (this.state.muted === true) {
			this.state.muted = false;
			node.muted = false;
		}
	}
	handleSkip(delta) {
		const node = this.refs.audio;
		if (!node) {
			return;
		}
		const nextTime = Math.max(0, Math.min(node.duration || 0, node.currentTime + delta));
		node.currentTime = nextTime;
		this.paintClock(nextTime, node.duration);
		this.emit('audio-player:change', {
			src: this.state.src,
			currentTime: nextTime,
		});
	}
	handleSkipBack() {
		this.handleSkip(-10);
	}
	handleSkipForward() {
		this.handleSkip(10);
	}
	render() {
		this.html`
			<div class="ap" data-artwork=${this.artworkToken} ?data-playing=${this.state.playing}>
				<audio #audio
					preload="metadata"
					@play=${this.handleNativePlay}
					@pause=${this.handleNativePause}
					@ended=${this.handleEnded}
					@loadedmetadata=${this.handleMeta}
					@timeupdate=${this.handleTimeUpdate}></audio>
				<div class="ap-art" ?hidden=${this.artHidden}>
					<img class="ap-art-img" src=${this.state.artworkSrc} alt="" loading="lazy">
				</div>
				<div class="ap-body">
					<div class="ap-copy">
						<div class="ap-heading">${this.state.heading}</div>
						<div class="ap-artist" ?hidden=${this.artistHidden}>${this.state.artist}</div>
					</div>
					<div class="ap-seek-row">
						<span #elapsed class="ap-time">0:00</span>
						<input #seek class="ap-seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek"
							@input=${this.handleSeekInput} @change=${this.handleSeekChange}>
						<span #total class="ap-time">0:00</span>
					</div>
					<div class="ap-transport">
						<button type="button" class="ap-btn" aria-label="Back 10 seconds" @click=${this.handleSkipBack}>
							<ui-icon .state.name=${'skip-back'} .state.size=${'sm'}></ui-icon>
						</button>
						<button type="button" class="ap-btn ap-play" aria-label=${this.playLabel} @click=${this.handlePlayToggle}>
							<ui-icon .state.name=${this.playIcon} .state.size=${'md'}></ui-icon>
						</button>
						<button type="button" class="ap-btn" aria-label="Forward 10 seconds" @click=${this.handleSkipForward}>
							<ui-icon .state.name=${'skip-forward'} .state.size=${'sm'}></ui-icon>
						</button>
						<button type="button" class="ap-btn" aria-label="Mute" @click=${this.handleMute}>
							<ui-icon .state.name=${this.volumeIcon} .state.size=${'sm'}></ui-icon>
						</button>
						<input class="ap-vol" type="range" min="0" max="1" step="0.05" .value=${this.state.volume}
							aria-label="Volume" @input=${this.handleVolume}>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-audio-player', UIAudioPlayer);
