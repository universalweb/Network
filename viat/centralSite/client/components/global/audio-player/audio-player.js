/*
	DESCRIPTION: ui-audio-player — music/recordings with artwork + transport.
	Author: Universal Web
	Date: 2026-08-21
	Transport (src, play/pause, seek, volume, rate, loading, failed) lives on
	UIMediaPlayer. This class is the audio caller: artwork, artist, heading
	chrome, and the <audio> tag. `src` is applied imperatively — a template
	`src=` binding re-sets the attribute on every patch pass and
	HTMLMediaElement treats that as load(), killing playback.
	No waveform: a real AnalyserNode needs AudioContext + a one-shot
	MediaElementSource (CORS-gated, rAF while playing). A fake/static
	waveform is dishonest, so the scrubber's real buffered range is the viz.
	── EVENTS ───────────────────────────────────────────────────────────
	  audio-player:play { src }
	  audio-player:pause { src }
	  audio-player:change { src, currentTime }
	  audio-player:complete { src }
	  audio-player:error { src, message }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-audio-player .state.src=${url} .state.heading=${'Track'}
	    .state.artist=${'Artist'} .state.artwork=${'cover'}></ui-audio-player>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { UIMediaPlayer } from '../../core/media/mediaPlayer.js';
const ARTWORK = new Set([
	'cover', 'disc', 'banner', 'hidden',
]);
export class UIAudioPlayer extends UIMediaPlayer {
	static url = import.meta.url;
	static styles = {
		audioPlayer: './audio-player.css',
	};
	static state = {
		artist: '',
		artworkSrc: '',
		artwork: 'cover',
	};
	eventPrefix() {
		return 'audio-player';
	}
	mediaKind() {
		return 'audio';
	}
	cssPrefix() {
		return 'audio-player';
	}
	regionLabel() {
		return this.state.heading || 'Audio player';
	}
	artworkToken() {
		const token = String(this.state.artwork || 'cover');
		return ARTWORK.has(token) ? token : 'cover';
	}
	artHidden() {
		return this.artworkToken() === 'hidden';
	}
	artImgHidden() {
		return !this.state.artworkSrc;
	}
	artPhHidden() {
		return Boolean(this.state.artworkSrc);
	}
	artistHidden() {
		return !this.state.artist;
	}
	copyHidden() {
		return !this.state.heading && !this.state.artist;
	}
	render() {
		this.html`
			<div class="audio-player" #shell
				data-phase=${this.phaseToken}
				data-artwork=${this.artworkToken}
				?data-playing=${this.state.playing}
				?data-muted=${this.state.muted}
				?data-loading=${this.state.loading}
				role="region"
				aria-label=${this.regionLabel}
				@keydown=${this.handleKeydown}>
				<audio #media
					preload="metadata"
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
					@loadstart=${this.handleLoadStart}></audio>
				<div class="audio-player-live" #live aria-live="polite" aria-atomic="true"></div>
				<div class="audio-player-art" ?hidden=${this.artHidden}>
					<img class="audio-player-art-img" ?hidden=${this.artImgHidden} src=${this.state.artworkSrc} alt="" decoding="async" aria-hidden="true">
					<div class="audio-player-art-ph" ?hidden=${this.artPhHidden} aria-hidden="true">
						<ui-icon .state.name=${'music'} .state.size=${'lg'}></ui-icon>
					</div>
				</div>
				<div class="audio-player-body">
					<div class="audio-player-copy" ?hidden=${this.copyHidden}>
						<div class="audio-player-heading">${this.state.heading}</div>
						<div class="audio-player-artist" ?hidden=${this.artistHidden}>${this.state.artist}</div>
					</div>
					<div class="audio-player-empty">
						<ui-icon .state.name=${'audio-lines'} .state.size=${'md'}></ui-icon>
						<span class="audio-player-status-title">No audio source</span>
						<span class="audio-player-status-hint">Pass src to load a track.</span>
					</div>
					<div class="audio-player-error">
						<ui-icon .state.name=${'circle-alert'} .state.size=${'md'}></ui-icon>
						<span class="audio-player-status-title">Couldn't load audio</span>
						<span class="audio-player-status-hint">${this.state.failMessage}</span>
						<button type="button" data-variant="outline" data-tone="neutral" data-size="sm" @click=${this.handleRetry}>Retry</button>
					</div>
					<div class="audio-player-seek-row">
						<span #elapsed class="audio-player-time">0:00</span>
						<div class="audio-player-seek-stack">
							<div class="audio-player-seek-rail" aria-hidden="true"></div>
							<input #seek class="audio-player-seek" type="range" min="0" max="0" value="0" step="0.01" aria-label="Seek"
								@input=${this.handleSeekInput} @change=${this.handleSeekChange}>
						</div>
						<span #total class="audio-player-time">0:00</span>
					</div>
					<div class="audio-player-transport">
						<div class="audio-player-cluster">
							<button type="button" class="audio-player-skip is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
								aria-label="Back 10 seconds" @click=${this.handleSkipBack}>
								<ui-icon .state.name=${'skip-back'} .state.size=${'sm'}></ui-icon>
							</button>
							<button type="button" class="audio-player-play is-icon-only is-circle" data-variant="solid" data-tone="primary" data-size="md"
								aria-label=${this.playLabel} ?disabled=${this.playDisabled} @click=${this.handlePlayToggle}>
								<ui-icon .state.name=${this.playIcon} .state.size=${'md'} .state.spin=${this.state.loading}></ui-icon>
							</button>
							<button type="button" class="audio-player-skip is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
								aria-label="Forward 10 seconds" @click=${this.handleSkipForward}>
								<ui-icon .state.name=${'skip-forward'} .state.size=${'sm'}></ui-icon>
							</button>
						</div>
						<div class="audio-player-gain">
							<button type="button" class="is-icon-only is-circle" data-variant="icon" data-tone="neutral" data-size="sm"
								aria-label=${this.muteLabel} ?aria-pressed=${this.state.muted} @click=${this.handleMute}>
								<ui-icon .state.name=${this.volumeIcon} .state.size=${'sm'}></ui-icon>
							</button>
							<div class="audio-player-vol-stack">
								<div class="audio-player-vol-rail" aria-hidden="true"></div>
								<input #vol class="audio-player-vol" type="range" min="0" max="1" step="0.01" .value=${this.state.volume}
									aria-label="Volume" @input=${this.handleVolume}>
							</div>
							<select #rate class="audio-player-rate" aria-label="Playback speed" .value=${this.state.playbackRate} @change=${this.handleRate}>
								<option value="0.5">0.5×</option>
								<option value="0.75">0.75×</option>
								<option value="1">1×</option>
								<option value="1.25">1.25×</option>
								<option value="1.5">1.5×</option>
								<option value="2">2×</option>
							</select>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-audio-player', UIAudioPlayer);
