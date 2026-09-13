/**
 *	NAME: VideoPlayer
 *	TAG: ui-video-player
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-video-player — full video player surface: native <video> plus
 *	transport (play/pause, seek, skip, mute, volume, rate, fullscreen).
 *	Shares UIMediaPlayer with ui-audio-player. Not a short, not
 *	hover-autoplay, not a YouTube embed.
 *	REJECTED: adopting ui-media-stage (img-only figure, in-stage chevrons,
 *	no transport); adopting ui-hover-video-player (hover autoplay, no
 *	controls); adopting ui-youtube-video-player (embed wrapper); adopting
 *	ui-media-toolbar (image chrome); duplicating audio-player transport;
 *	extending UIAudioPlayer (artwork/artist chrome is audio policy).
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-video-player .state.src=${url} .state.heading=${'Clip'}
 *	    .state.poster=${poster}></ui-video-player>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIVideoPlayer } from './video-player.js';
 *	  const host = new UIVideoPlayer({ src, heading: 'Clip' });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  video-player:play { src }
 *	  video-player:pause { src }
 *	  video-player:change { src, currentTime }
 *	  video-player:complete { src }
 *	  video-player:error { src, message }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-04
 *	─────────────────────────────────────────────────────────────────────
 */
import '../aspect-ratio/aspect-ratio.js';
import '../icon/icon.js';
import { isFunction, isTrue } from '@universalweb/utilitylib';
import {
	armLazy,
	onLazyVisible,
	syncLazy,
} from 'webcomponent';
import { UIMediaPlayer } from '../../core/media/mediaPlayer.js';
export class UIVideoPlayer extends UIMediaPlayer {
	static url = import.meta.url;
	static styles = {
		videoPlayer: './video-player.css',
	};
	static state = {
		poster: '',
		ratio: '16/9',
		captionsSrc: '',
		captionsLang: 'en',
		lazy: true,
		loaded: false,
		fullscreen: false,
	};
	eventPrefix() {
		return 'video-player';
	}
	mediaKind() {
		return 'video';
	}
	cssPrefix() {
		return 'video-player';
	}
	regionLabel() {
		return this.state.heading || 'Video player';
	}
	srcReady() {
		return isTrue(this.state.loaded);
	}
	onConnect() {
		super.onConnect();
		this.observe('lazy', this.onLazyFlag);
		this.observe('loaded', this.applyMediaFlags);
		armLazy(this);
		const doc = globalThis.document;
		if (!doc?.addEventListener) {
			return;
		}
		this.fullscreenAbort = new AbortController();
		doc.addEventListener('fullscreenchange', this, {
			signal: this.fullscreenAbort.signal,
		});
	}
	onVisible() {
		onLazyVisible(this);
	}
	onLazyFlag() {
		syncLazy(this);
	}
	onDisconnect() {
		this.fullscreenAbort?.abort();
		this.fullscreenAbort = null;
		super.onDisconnect();
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'fullscreenchange') {
			this.handleFullscreenChange();
		}
	}
	headingHidden() {
		return !this.state.heading;
	}
	captionsTrack() {
		if (!this.state.captionsSrc) {
			return '';
		}
		return this.htmlElement`<track kind="captions" src=${this.state.captionsSrc} srclang=${this.state.captionsLang} default>`;
	}
	handleFullscreen() {
		const shell = this.refs.shell;
		if (!shell) {
			return;
		}
		const doc = globalThis.document;
		if (doc?.fullscreenElement === shell) {
			if (isFunction(doc.exitFullscreen)) {
				doc.exitFullscreen();
			}
			return;
		}
		if (isFunction(shell.requestFullscreen)) {
			shell.requestFullscreen();
		}
	}
	handleFullscreenChange() {
		const doc = globalThis.document;
		this.state.fullscreen = doc?.fullscreenElement === this.refs.shell;
	}
	fullscreenIcon() {
		return isTrue(this.state.fullscreen) ? 'minimize' : 'maximize';
	}
	fullscreenLabel() {
		return isTrue(this.state.fullscreen) ? 'Exit fullscreen' : 'Fullscreen';
	}
	render() {
		this.html`
			<ui-aspect-ratio .state.ratio=${this.state.ratio || '16/9'}>
				<div class="video-player" #shell
					data-phase=${this.phaseToken}
					?data-playing=${this.state.playing}
					?data-muted=${this.state.muted}
					?data-loading=${this.state.loading}
					?data-fullscreen=${this.state.fullscreen}
					role="region"
					aria-label=${this.regionLabel}
					@keydown=${this.handleKeydown}>
					<video #media
						class="video-player-media"
						preload="metadata"
						playsinline
						poster=${this.state.poster}
						?loop=${this.state.loop}
						@play=${this.handleNativePlay}
						@pause=${this.handleNativePause}
						@ended=${this.handleEnded}
						@loadedmetadata=${this.handleMeta}
						@canplay=${this.handleCanPlay}
						@timeupdate=${this.handleTimeUpdate}
						@progress=${this.handleProgress}
						@waiting=${this.handleWaiting}
						@playing=${this.handlePlaying}
						@error=${this.handleError}
						@emptied=${this.handleEmptied}
						@loadstart=${this.handleLoadStart}>${this.captionsTrack}</video>
					<div class="video-player-live" #live aria-live="polite" aria-atomic="true"></div>
					<div class="video-player-empty">
						<ui-icon .state.name=${'clapperboard'} .state.size=${'md'}></ui-icon>
						<span class="video-player-status-title">No video source</span>
						<span class="video-player-status-hint">Pass src to load a clip.</span>
					</div>
					<div class="video-player-error">
						<ui-icon .state.name=${'circle-alert'} .state.size=${'md'}></ui-icon>
						<span class="video-player-status-title">Couldn't load video</span>
						<span class="video-player-status-hint">${this.state.failMessage}</span>
						<button type="button" data-variant="outline" data-tone="neutral" data-size="sm"
							data-interactive data-hover="wash" @click=${this.handleRetry}>Retry</button>
					</div>
					<div class="video-player-chrome">
						<div class="video-player-heading" ?hidden=${this.headingHidden}>${this.state.heading}</div>
						<div class="video-player-seek-row">
							<span #elapsed class="video-player-time">0:00</span>
							<div class="video-player-seek-stack">
								<div class="video-player-seek-rail" aria-hidden="true"></div>
								<input #seek class="video-player-seek" type="range" min="0" max="0" value="0" step="0.01" aria-label="Seek"
									@input=${this.handleSeekInput} @change=${this.handleSeekChange}>
							</div>
							<span #total class="video-player-time">0:00</span>
						</div>
						<div class="video-player-transport">
							<div class="video-player-cluster">
								<button type="button" class="video-player-skip is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
									data-interactive data-hover="wash" aria-label="Back 10 seconds" @click=${this.handleSkipBack}>
									<ui-icon .state.name=${'skip-back'} .state.size=${'sm'}></ui-icon>
								</button>
								<button type="button" class="video-player-play is-icon-only is-circle" data-variant="solid" data-tone="primary" data-size="md"
									data-interactive data-hover="wash" aria-label=${this.playLabel} ?disabled=${this.playDisabled} @click=${this.handlePlayToggle}>
									<ui-icon .state.name=${this.playIcon} .state.size=${'md'} .state.spin=${this.state.loading}></ui-icon>
								</button>
								<button type="button" class="video-player-skip is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
									data-interactive data-hover="wash" aria-label="Forward 10 seconds" @click=${this.handleSkipForward}>
									<ui-icon .state.name=${'skip-forward'} .state.size=${'sm'}></ui-icon>
								</button>
							</div>
							<div class="video-player-gain">
								<button type="button" class="is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
									data-interactive data-hover="wash" aria-label=${this.muteLabel} ?aria-pressed=${this.state.muted} @click=${this.handleMute}>
									<ui-icon .state.name=${this.volumeIcon} .state.size=${'sm'}></ui-icon>
								</button>
								<div class="video-player-vol-stack">
									<div class="video-player-vol-rail" aria-hidden="true"></div>
									<input #vol class="video-player-vol" type="range" min="0" max="1" step="0.01" .value=${this.state.volume}
										aria-label="Volume" @input=${this.handleVolume}>
								</div>
								<select #rate class="video-player-rate" aria-label="Playback speed" .value=${this.state.playbackRate} @change=${this.handleRate}>
									<option value="0.5">0.5×</option>
									<option value="0.75">0.75×</option>
									<option value="1">1×</option>
									<option value="1.25">1.25×</option>
									<option value="1.5">1.5×</option>
									<option value="2">2×</option>
								</select>
								<button type="button" class="is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
									data-interactive data-hover="wash" aria-label=${this.fullscreenLabel} @click=${this.handleFullscreen}>
									<ui-icon .state.name=${this.fullscreenIcon} .state.size=${'sm'}></ui-icon>
								</button>
							</div>
						</div>
					</div>
				</div>
			</ui-aspect-ratio>
		`;
	}
}
customElements.define('ui-video-player', UIVideoPlayer);
