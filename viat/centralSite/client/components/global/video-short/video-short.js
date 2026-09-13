/**
 *	NAME: VideoShort
 *	TAG: ui-video-short
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-video-short — vertical short-form playlist. Native
 *	<video> plus UIMediaPlayer transport (play/pause/seek/volume/rate).
 *	Prev/next is a composed ui-go-to block pad at center-end, ungated,
 *	cancelable: the pad is an action caller, not a scroll caller.
 *	Caller supplies `items` and the keep/step policy (`wrap`,
 *	`autoAdvance`); this class owns chrome and criteria plumbing.
 *	REJECTED: composing ui-video-player (full 16/9 chrome is a different
 *	surface); extending UIVideoPlayer (same reason video did not extend
 *	audio — chrome is policy); adopting ui-media-stage (img-only figure,
 *	in-stage chevrons, no transport); adopting ui-hover-video-player or
 *	ui-youtube-video-player; a third play/pause/seek implementation;
 *	hand-rolled edge anchoring (center-end already parks middle-right);
 *	two single tab go-tos (they overlap / fight cluster — the block pad
 *	IS the prev/next pair). Pad buttons stay discs: tab flattening is
 *	`:not(.go-to-pad)` on the engine.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-video-short .state.items=${clips} .state.activeIndex=${0}></ui-video-short>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIVideoShort } from './video-short.js';
 *	  const host = new UIVideoShort({ items: clips });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  video-short:play { src }
 *	  video-short:pause { src }
 *	  video-short:change { src, currentTime }
 *	  video-short:complete { src }
 *	  video-short:error { src, message }
 *	  video-short:step { index, item }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-04
 *	─────────────────────────────────────────────────────────────────────
 */
import '../aspect-ratio/aspect-ratio.js';
import '../go-to/go-to.js';
import '../icon/icon.js';
import { isArray, isFunction, isTrue } from '@universalweb/utilitylib';
import {
	armLazy,
	onLazyVisible,
	syncLazy,
} from 'webcomponent';
import { UIMediaPlayer } from '../../core/media/mediaPlayer.js';
export class UIVideoShort extends UIMediaPlayer {
	static url = import.meta.url;
	static styles = {
		videoShort: './video-short.css',
	};
	static state = {
		items: [],
		activeIndex: 0,
		wrap: true,
		autoAdvance: true,
		showNav: true,
		poster: '',
		caption: '',
		ratio: '9/16',
		lazy: true,
		loaded: false,
		muted: true,
	};
	wantPlay = false;
	eventPrefix() {
		return 'video-short';
	}
	mediaKind() {
		return 'video';
	}
	cssPrefix() {
		return 'video-short';
	}
	regionLabel() {
		return this.state.heading || this.state.caption || 'Video short';
	}
	srcReady() {
		return isTrue(this.state.loaded);
	}
	onConnect() {
		super.onConnect();
		this.observe([
			'items',
			'activeIndex',
		], this.syncActiveClip, {
			immediate: true,
		});
		this.observe('lazy', this.onLazyFlag);
		this.observe('loaded', this.applyMediaFlags);
		armLazy(this);
	}
	onVisible() {
		onLazyVisible(this);
	}
	onLazyFlag() {
		syncLazy(this);
	}
	clipCount() {
		return isArray(this.state.items) ? this.state.items.length : 0;
	}
	hasPlaylist() {
		return this.clipCount() >= 2;
	}
	syncActiveClip() {
		const series = isArray(this.state.items) ? this.state.items : [];
		const count = series.length;
		if (count === 0) {
			return;
		}
		let index = Number(this.state.activeIndex) || 0;
		if (index < 0) {
			index = 0;
		} else if (index >= count) {
			index = count - 1;
		}
		if (this.state.activeIndex !== index) {
			this.state.activeIndex = index;
		}
		const item = series[index];
		const src = item?.src || '';
		if (this.state.src !== src) {
			this.state.src = src;
		}
		const heading = item?.heading || '';
		if (this.state.heading !== heading) {
			this.state.heading = heading;
		}
		const caption = item?.caption || '';
		if (this.state.caption !== caption) {
			this.state.caption = caption;
		}
		const poster = item?.poster || '';
		if (this.state.poster !== poster) {
			this.state.poster = poster;
		}
	}
	stepClip(delta) {
		const series = isArray(this.state.items) ? this.state.items : [];
		const count = series.length;
		if (count < 2) {
			return;
		}
		let nextIndex = (Number(this.state.activeIndex) || 0) + delta;
		if (isTrue(this.state.wrap)) {
			nextIndex = ((nextIndex % count) + count) % count;
		} else if (nextIndex < 0) {
			nextIndex = 0;
		} else if (nextIndex >= count) {
			nextIndex = count - 1;
		}
		if (nextIndex === this.state.activeIndex) {
			return;
		}
		this.state.activeIndex = nextIndex;
		this.emit(`${this.eventPrefix()}:step`, {
			index: nextIndex,
			item: series[nextIndex],
		});
	}
	goPrev() {
		this.stepClip(-1);
	}
	goNext() {
		this.stepClip(1);
	}
	handleNavClick(domEvent) {
		domEvent.preventDefault();
		const direction = domEvent.detail?.data?.direction;
		if (direction === 'top') {
			this.goPrev();
			return;
		}
		if (direction === 'bottom') {
			this.goNext();
		}
	}
	playActive() {
		const node = this.mediaNode();
		if (!node || this.playDisabled()) {
			return;
		}
		this.applySrc(node);
		const playResult = node.play();
		if (isFunction(playResult?.catch)) {
			playResult.catch(this.catchPlayRejected);
		}
	}
	handleEnded(domEvent) {
		const previousSrc = this.state.src;
		super.handleEnded(domEvent);
		if (!isTrue(this.state.autoAdvance) || !this.hasPlaylist()) {
			return;
		}
		this.goNext();
		if (this.state.src === previousSrc) {
			this.playActive();
			return;
		}
		this.wantPlay = true;
	}
	handleCanPlay() {
		super.handleCanPlay();
		if (!this.wantPlay) {
			return;
		}
		this.wantPlay = false;
		this.playActive();
	}
	handleKeydown(domEvent) {
		if (domEvent.defaultPrevented) {
			return;
		}
		switch (domEvent.key) {
			case 'ArrowUp': {
				domEvent.preventDefault();
				this.goPrev();
				break;
			}
			case 'ArrowDown': {
				domEvent.preventDefault();
				this.goNext();
				break;
			}
			default: {
				super.handleKeydown(domEvent);
				break;
			}
		}
	}
	headingHidden() {
		return !this.state.heading;
	}
	captionHidden() {
		return !this.state.caption;
	}
	playHidden() {
		return isTrue(this.state.playing);
	}
	navMarkup() {
		if (!this.hasPlaylist() || !isTrue(this.state.showNav)) {
			return '';
		}
		return this.htmlElement`
			<ui-go-to
				.state.axes=${'block'}
				.state.position=${'center-end'}
				.state.gated=${false}
				.state.cluster=${true}
				.state.topLabel=${'Previous'}
				.state.bottomLabel=${'Next'}
				.state.smooth=${false}
				@go-to:click=${this.handleNavClick}></ui-go-to>
		`;
	}
	render() {
		this.html`
			${this.navMarkup}
			<ui-aspect-ratio .state.ratio=${this.state.ratio || '9/16'}>
				<div class="video-short" #shell
					data-phase=${this.phaseToken}
					?data-playing=${this.state.playing}
					?data-muted=${this.state.muted}
					?data-loading=${this.state.loading}
					role="region"
					aria-label=${this.regionLabel}
					@keydown=${this.handleKeydown}>
					<video #media
						class="video-short-media"
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
						@loadstart=${this.handleLoadStart}></video>
					<div class="video-short-live" #live aria-live="polite" aria-atomic="true"></div>
					<div class="video-short-empty">
						<ui-icon .state.name=${'clapperboard'} .state.size=${'md'}></ui-icon>
						<span class="video-short-status-title">No clips</span>
						<span class="video-short-status-hint">Pass items to load a playlist.</span>
					</div>
					<div class="video-short-error">
						<ui-icon .state.name=${'circle-alert'} .state.size=${'md'}></ui-icon>
						<span class="video-short-status-title">Couldn't load clip</span>
						<span class="video-short-status-hint">${this.state.failMessage}</span>
						<button type="button" data-variant="outline" data-tone="neutral" data-size="sm"
							data-interactive data-hover="wash" @click=${this.handleRetry}>Retry</button>
					</div>
					<button type="button" class="video-short-play is-icon-only is-circle"
						data-variant="solid" data-tone="primary" data-size="md"
						data-interactive data-hover="wash"
						?hidden=${this.playHidden}
						aria-label=${this.playLabel}
						?disabled=${this.playDisabled}
						@click=${this.handlePlayToggle}>
						<ui-icon .state.name=${this.playIcon} .state.size=${'md'} .state.spin=${this.state.loading}></ui-icon>
					</button>
					<div class="video-short-copy">
						<p class="video-short-heading" ?hidden=${this.headingHidden}>${this.state.heading}</p>
						<p class="video-short-caption" ?hidden=${this.captionHidden}>${this.state.caption}</p>
					</div>
				</div>
			</ui-aspect-ratio>
		`;
	}
}
customElements.define('ui-video-short', UIVideoShort);
