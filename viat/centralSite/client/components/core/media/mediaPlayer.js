/*
	UIMediaPlayer — shared HTMLMediaElement transport. Not a custom element.
	Callers: ui-audio-player, ui-video-player, ui-video-short. Each owns
	chrome, event prefix, and the <audio> or <video> tag (#media). This
	class owns src/play/pause/seek/volume/rate/loading/failed, the clock
	paint (refs, never currentTime in state), and the keyboard map.
	Artwork, artist, poster, and collection index stay with the caller.
*/
import { isFunction, isTrue } from '@universalweb/utilitylib';
import { WebComponent } from '../base.js';
import {
	bufferedEnd,
	clampMediaTime,
	clampUnit,
	formatClock,
	isEditableTarget,
	mediaMessage,
	mediaNoun,
	resolvedSrc,
	SEEK_SECONDS,
	SKIP_SECONDS,
	VOLUME_STEP,
} from './mediaTransport.js';
export class UIMediaPlayer extends WebComponent {
	static state = {
		src: '',
		heading: '',
		playing: false,
		muted: false,
		volume: 1,
		playbackRate: 1,
		loading: false,
		failed: false,
		failMessage: '',
		loop: false,
	};
	seeking = false;
	onInit() {
		this.catchPlayRejected = () => {
			this.onPlayRejected();
		};
	}
	onConnect() {
		this.observe([
			'volume',
			'muted',
			'src',
			'playbackRate',
		], this.applyMediaFlags);
	}
	onMount() {
		this.applyMediaFlags();
		this.paintClock();
		this.paintGain();
	}
	onRender() {
		this.applyMediaFlags();
		this.paintClock();
		this.paintGain();
	}
	onDisconnect() {
		const node = this.mediaNode();
		if (node) {
			node.pause();
			node.removeAttribute('src');
			node.load();
		}
		this.seeking = false;
	}
	eventPrefix() {
		return 'media-player';
	}
	mediaKind() {
		return 'media';
	}
	cssPrefix() {
		return 'media-player';
	}
	regionLabel() {
		return this.state.heading || mediaNoun(this.mediaKind());
	}
	srcReady() {
		return true;
	}
	mediaNode() {
		return this.refs.media;
	}
	emitTransport(action, extra) {
		const payload = {
			src: this.state.src,
			...extra,
		};
		this.emit(`${this.eventPrefix()}:${action}`, payload);
	}
	/*
	 * Push src / volume / muted / rate onto the media element. `src` is applied
	 * only when it actually changes — re-setting the same URL calls load() and
	 * kills playback.
	 */
	applyMediaFlags() {
		const node = this.mediaNode();
		if (!node) {
			return;
		}
		this.applySrc(node);
		const volume = clampUnit(Number(this.state.volume));
		node.volume = volume;
		node.muted = isTrue(this.state.muted);
		const rate = Number(this.state.playbackRate);
		if (Number.isFinite(rate) && rate > 0) {
			node.playbackRate = rate;
		}
		this.paintGain();
	}
	applySrc(node) {
		if (!this.srcReady()) {
			return;
		}
		const src = resolvedSrc(this.state.src);
		const current = node.getAttribute('src') || '';
		if (src === '') {
			if (current !== '') {
				node.removeAttribute('src');
				node.load();
				if (isTrue(this.state.playing)) {
					this.state.playing = false;
				}
				if (isTrue(this.state.loading)) {
					this.state.loading = false;
				}
				if (isTrue(this.state.failed)) {
					this.assignState({
						failed: false,
						failMessage: '',
					});
				}
			}
			this.paintClock(0, 0);
			return;
		}
		if (current === src) {
			return;
		}
		node.setAttribute('src', src);
		node.load();
		if (isTrue(this.state.failed)) {
			this.assignState({
				failed: false,
				failMessage: '',
			});
		}
		if (isTrue(this.state.playing)) {
			this.state.playing = false;
		}
		this.paintClock(0, 0);
	}
	onPlayRejected() {
		// Autoplay policy / missing src — native `play` never fired, so playing stays false.
	}
	phaseToken() {
		if (!this.state.src) {
			return 'empty';
		}
		if (isTrue(this.state.failed)) {
			return 'error';
		}
		if (isTrue(this.state.loading)) {
			return 'loading';
		}
		return 'ready';
	}
	playDisabled() {
		return !this.state.src || isTrue(this.state.failed);
	}
	playIcon() {
		if (isTrue(this.state.loading) && !isTrue(this.state.playing)) {
			return 'loader-circle';
		}
		return this.state.playing ? 'pause' : 'play';
	}
	volumeIcon() {
		if (isTrue(this.state.muted) || clampUnit(Number(this.state.volume)) === 0) {
			return 'volume-x';
		}
		if (clampUnit(Number(this.state.volume)) < 0.4) {
			return 'volume-1';
		}
		return 'volume-2';
	}
	playLabel() {
		if (isTrue(this.state.loading) && !isTrue(this.state.playing)) {
			return 'Loading';
		}
		return this.state.playing ? 'Pause' : 'Play';
	}
	muteLabel() {
		return isTrue(this.state.muted) ? 'Unmute' : 'Mute';
	}
	handlePlayToggle() {
		const node = this.mediaNode();
		if (!node || this.playDisabled()) {
			return;
		}
		this.applySrc(node);
		if (node.paused) {
			const playResult = node.play();
			if (isFunction(playResult?.catch)) {
				playResult.catch(this.catchPlayRejected);
			}
			return;
		}
		node.pause();
	}
	handleNativePlay(domEvent) {
		domEvent.stopPropagation();
		this.state.playing = true;
		this.paintLive(`Playing ${this.state.heading || mediaNoun(this.mediaKind())}`);
		this.emitTransport('play');
	}
	handleNativePause(domEvent) {
		domEvent.stopPropagation();
		this.state.playing = false;
		this.paintLive('Paused');
		this.emitTransport('pause');
	}
	handleEnded(domEvent) {
		domEvent.stopPropagation();
		this.state.playing = false;
		const node = this.mediaNode();
		if (node && node.currentTime !== 0 && !isTrue(this.state.loop)) {
			node.currentTime = 0;
		}
		this.paintClock(0, node?.duration || 0);
		this.paintLive('Playback complete');
		this.emitTransport('complete');
	}
	handleMeta() {
		this.applyMediaFlags();
		this.paintClock();
	}
	handleCanPlay() {
		if (isTrue(this.state.loading)) {
			this.state.loading = false;
		}
		this.paintClock();
	}
	handleTimeUpdate(domEvent) {
		domEvent.stopPropagation();
		if (this.seeking) {
			return;
		}
		this.paintClock();
	}
	handleProgress() {
		this.paintClock();
	}
	handleWaiting() {
		if (!this.state.src || isTrue(this.state.failed) || isTrue(this.state.loading)) {
			return;
		}
		this.state.loading = true;
	}
	handlePlaying() {
		if (isTrue(this.state.loading)) {
			this.state.loading = false;
		}
	}
	handleLoadStart() {
		if (!this.state.src || isTrue(this.state.failed) || isTrue(this.state.loading)) {
			return;
		}
		this.state.loading = true;
	}
	handleEmptied() {
		if (!this.state.src) {
			this.state.loading = false;
		}
	}
	handleError(domEvent) {
		domEvent.stopPropagation();
		const node = this.mediaNode();
		const message = mediaMessage(node, this.mediaKind());
		this.assignState({
			failed: true,
			failMessage: message,
			loading: false,
			playing: false,
		});
		this.paintLive(`Couldn't load ${mediaNoun(this.mediaKind())}`);
		this.emitTransport('error', {
			message,
		});
	}
	handleRetry() {
		const node = this.mediaNode();
		this.assignState({
			failed: false,
			failMessage: '',
			loading: true,
		});
		if (node) {
			node.load();
		}
	}
	paintClock(currentTime, duration) {
		const node = this.mediaNode();
		const elapsedTime = currentTime ?? node?.currentTime ?? 0;
		const totalTime = duration ?? node?.duration ?? 0;
		const elapsed = this.refs.elapsed;
		const total = this.refs.total;
		const seek = this.refs.seek;
		if (elapsed) {
			elapsed.textContent = formatClock(elapsedTime);
		}
		if (total) {
			total.textContent = formatClock(totalTime);
		}
		if (seek) {
			const hasDuration = Number.isFinite(totalTime) && totalTime > 0;
			seek.max = hasDuration ? String(totalTime) : '0';
			seek.disabled = !hasDuration;
			if (!this.seeking) {
				seek.value = hasDuration ? String(elapsedTime) : '0';
			}
			seek.setAttribute('aria-valuetext', `${formatClock(elapsedTime)} of ${formatClock(totalTime)}`);
		}
		this.paintPlayed(elapsedTime, totalTime, node);
	}
	paintPlayed(currentTime, duration, node) {
		const shell = this.refs.shell;
		if (!shell) {
			return;
		}
		const prefix = this.cssPrefix();
		const played = Number.isFinite(duration) && duration > 0 ? clampUnit(currentTime / duration) : 0;
		const buffered = node ? clampUnit(bufferedEnd(node) / (duration || 1)) : 0;
		shell.style.setProperty(`--${prefix}-played`, `${(played * 100).toFixed(2)}%`);
		shell.style.setProperty(`--${prefix}-buffered`, `${(buffered * 100).toFixed(2)}%`);
	}
	paintGain() {
		const shell = this.refs.shell;
		const volume = clampUnit(Number(this.state.volume));
		const prefix = this.cssPrefix();
		if (shell) {
			shell.style.setProperty(`--${prefix}-volume`, `${(volume * 100).toFixed(2)}%`);
		}
		const slider = this.refs.vol;
		if (slider) {
			const label = isTrue(this.state.muted) ? 'Muted' : `${Math.round(volume * 100)} percent`;
			slider.setAttribute('aria-valuetext', label);
		}
	}
	paintLive(message) {
		const live = this.refs.live;
		if (!live) {
			return;
		}
		live.textContent = message;
	}
	handleSeekInput(domEvent) {
		domEvent.stopPropagation();
		this.seeking = true;
		const nextTime = Number(domEvent.target.value);
		const duration = this.mediaNode()?.duration || 0;
		if (this.refs.elapsed) {
			this.refs.elapsed.textContent = formatClock(nextTime);
		}
		this.paintPlayed(nextTime, duration, this.mediaNode());
	}
	handleSeekChange(domEvent) {
		domEvent.stopPropagation();
		this.seeking = false;
		this.seekTo(Number(domEvent.target.value));
	}
	seekTo(nextTime) {
		const node = this.mediaNode();
		const clamped = clampMediaTime(node, nextTime);
		if (clamped === null) {
			return;
		}
		node.currentTime = clamped;
		this.paintClock(clamped, node.duration);
		this.paintLive(`${formatClock(clamped)} of ${formatClock(node.duration)}`);
		this.emitTransport('change', {
			currentTime: clamped,
		});
	}
	handleMute() {
		const node = this.mediaNode();
		const nextMuted = !isTrue(this.state.muted);
		this.state.muted = nextMuted;
		if (node) {
			node.muted = nextMuted;
		}
		this.paintGain();
	}
	applyVolume(nextVolume) {
		const volume = clampUnit(nextVolume);
		const node = this.mediaNode();
		this.state.volume = volume;
		if (node) {
			node.volume = volume;
		}
		if (volume === 0) {
			this.state.muted = true;
			if (node) {
				node.muted = true;
			}
		} else if (isTrue(this.state.muted)) {
			this.state.muted = false;
			if (node) {
				node.muted = false;
			}
		}
		this.paintGain();
	}
	handleVolume(domEvent) {
		domEvent.stopPropagation();
		this.applyVolume(Number(domEvent.target.value));
	}
	nudgeVolume(delta) {
		const current = clampUnit(Number(this.state.volume));
		this.applyVolume(current + delta);
	}
	handleSkip(delta) {
		const node = this.mediaNode();
		if (!node) {
			return;
		}
		this.seekTo((node.currentTime || 0) + delta);
	}
	handleSkipBack() {
		this.handleSkip(-SKIP_SECONDS);
	}
	handleSkipForward() {
		this.handleSkip(SKIP_SECONDS);
	}
	handleRate(domEvent) {
		domEvent.stopPropagation();
		const nextRate = Number(domEvent.target.value);
		if (!Number.isFinite(nextRate) || nextRate <= 0) {
			return;
		}
		this.state.playbackRate = nextRate;
		const node = this.mediaNode();
		if (node) {
			node.playbackRate = nextRate;
		}
	}
	handleKeydown(domEvent) {
		if (domEvent.defaultPrevented) {
			return;
		}
		const target = domEvent.target;
		const field = isEditableTarget(target);
		const key = domEvent.key;
		switch (key) {
			case ' ':
			case 'k':
			case 'K': {
				if (key === ' ' && target instanceof HTMLButtonElement) {
					break;
				}
				if (target instanceof HTMLSelectElement) {
					break;
				}
				domEvent.preventDefault();
				this.handlePlayToggle();
				break;
			}
			case 'ArrowLeft': {
				if (field) {
					break;
				}
				domEvent.preventDefault();
				this.handleSkip(domEvent.shiftKey ? -SKIP_SECONDS : -SEEK_SECONDS);
				break;
			}
			case 'ArrowRight': {
				if (field) {
					break;
				}
				domEvent.preventDefault();
				this.handleSkip(domEvent.shiftKey ? SKIP_SECONDS : SEEK_SECONDS);
				break;
			}
			case 'ArrowUp': {
				if (field) {
					break;
				}
				domEvent.preventDefault();
				this.nudgeVolume(VOLUME_STEP);
				break;
			}
			case 'ArrowDown': {
				if (field) {
					break;
				}
				domEvent.preventDefault();
				this.nudgeVolume(-VOLUME_STEP);
				break;
			}
			case 'Home': {
				if (field) {
					break;
				}
				domEvent.preventDefault();
				this.seekTo(0);
				break;
			}
			case 'End': {
				if (field) {
					break;
				}
				domEvent.preventDefault();
				this.seekTo(this.mediaNode()?.duration || 0);
				break;
			}
			case 'm':
			case 'M': {
				if (target instanceof HTMLSelectElement) {
					break;
				}
				domEvent.preventDefault();
				this.handleMute();
				break;
			}
			default: {
				break;
			}
		}
	}
}
