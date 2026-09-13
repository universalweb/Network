/**
 *	NAME: MediaStage
 *	TAG: ui-media-stage
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-media-stage — prev / figure / next plus optional copy
 *	(heading, caption, subtitle, description) and optional index dots. The host
 *	owns the collection and the zoom/rotate/flip math; this stage paints one
 *	src and emits prev/next/dot. fit=contain (default) centres at natural size;
 *	fit=cover fills the box. Dots stay off until showDots and dotCount>=2.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-media-stage
 *	    .state.src=${src} .state.alt=${alt}
 *	    .state.caption=${label} .state.showNav=${true}
 *	    .state.showDots=${true} .state.dotCount=${4} .state.activeIndex=${0}
 *	    .state.fit=${'contain'}
 *	    .state.interactive=${true} .state.transform=${transform}></ui-media-stage>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIMediaStage } from './media-stage.js';
 *	  const host = new UIMediaStage({ src, alt, interactive: true });
 *	  host.addEventListener('media-stage:activate', () => {
 *	    openLightbox();
 *	  });
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  media-stage:prev
 *	  media-stage:next
 *	  media-stage:activate
 *	  media-stage:dot { index }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-03
 *	─────────────────────────────────────────────────────────────────────
 */
import '../icon/icon.js';
import { isTrue, WebComponent } from 'webcomponent';
import {
	isCopyHidden,
	mediaCopyAlign,
	resolveMediaCopy,
} from '../../core/media/mediaCopy.js';
const FITS = new Set([
	'contain',
	'cover',
]);
export class UIMediaStage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		stage: './media-stage.css',
	};
	static state = {
		src: '',
		alt: '',
		heading: '',
		caption: '',
		subtitle: '',
		description: '',
		captionAlign: 'center',
		showHeading: true,
		showCaption: true,
		showSubtitle: true,
		showDescription: true,
		showNav: true,
		showDots: false,
		dotCount: 0,
		activeIndex: 0,
		dots: [],
		// contain = natural size, centred. cover = fill the stage box.
		fit: 'contain',
		transform: '',
		interactive: false,
		overlay: false,
	};
	onConnect() {
		this.observe([
			'dotCount',
			'activeIndex',
		], this.syncDots, {
			immediate: true,
		});
		this.observe('fit', this.syncFit, {
			immediate: true,
		});
	}
	syncFit() {
		this.dataset.fit = FITS.has(this.state.fit) ? this.state.fit : 'contain';
	}
	syncDots() {
		const count = Math.max(0, Number(this.state.dotCount) || 0);
		const activeIndex = Number(this.state.activeIndex) || 0;
		const dots = this.state.dots;
		if (!dots || dots.length !== count) {
			const next = [];
			for (let index = 0; index < count; index += 1) {
				next.push({
					id: index,
					label: `Slide ${index + 1}`,
					active: index === activeIndex,
				});
			}
			this.state.dots = next;
			return;
		}
		for (let index = 0; index < count; index += 1) {
			const item = dots[index];
			const nextActive = index === activeIndex;
			if (item.active !== nextActive) {
				item.active = nextActive;
			}
		}
	}
	beforeRender() {
		this.toggleAttribute('data-overlay', isTrue(this.state.overlay));
		this.toggleAttribute('data-interactive', isTrue(this.state.interactive));
		this.dataset.fit = FITS.has(this.state.fit) ? this.state.fit : 'contain';
	}
	copyHeading() {
		return resolveMediaCopy(this.state).heading;
	}
	copyCaption() {
		return resolveMediaCopy(this.state).caption;
	}
	copySubtitle() {
		return resolveMediaCopy(this.state).subtitle;
	}
	copyDescription() {
		return resolveMediaCopy(this.state).description;
	}
	copyAlign() {
		return mediaCopyAlign(this.state.captionAlign);
	}
	headingHidden() {
		return isCopyHidden(this.state, 'heading');
	}
	captionHidden() {
		return isCopyHidden(this.state, 'caption');
	}
	subtitleHidden() {
		return isCopyHidden(this.state, 'subtitle');
	}
	descriptionHidden() {
		return isCopyHidden(this.state, 'description');
	}
	navHidden() {
		return !isTrue(this.state.showNav);
	}
	dotsHidden() {
		return !isTrue(this.state.showDots) || (Number(this.state.dotCount) || 0) < 2;
	}
	dotMark(item) {
		return this.partial`
			<button type="button" class="media-dot" ?data-active=${item.active}
				aria-label=${item.label || ''}
				aria-current=${item.active === true ? 'true' : 'false'}
				@click=${this.handleDotClick}></button>`;
	}
	handlePrev() {
		this.emit('media-stage:prev');
	}
	handleNext() {
		this.emit('media-stage:next');
	}
	handleDotClick(domEvent, item, itemIndex) {
		if (typeof domEvent?.stopPropagation === 'function') {
			domEvent.stopPropagation();
		}
		const index = Number.isFinite(itemIndex) ? itemIndex : Number(item?.id);
		this.emit('media-stage:dot', {
			index,
		});
	}
	handleActivate() {
		if (!isTrue(this.state.interactive)) {
			return;
		}
		this.emit('media-stage:activate');
	}
	render() {
		this.html`
			<div class="media-stage">
				<button type="button" class="media-nav media-prev" ?hidden=${this.navHidden} aria-label="Previous" @click=${this.handlePrev}>
					<ui-icon .state.name=${'chevron-left'} .state.size=${'lg'}></ui-icon>
				</button>
				<figure class="media-figure" @click=${this.handleActivate}>
					<img class="media-full" src=${this.state.src} alt=${this.state.alt} style=${this.state.transform}>
					<figcaption class="media-copy" data-align=${this.copyAlign}>
						<p class="media-copy-heading" ?hidden=${this.headingHidden}>${this.copyHeading}</p>
						<p class="media-copy-caption" ?hidden=${this.captionHidden}>${this.copyCaption}</p>
						<p class="media-copy-subtitle" ?hidden=${this.subtitleHidden}>${this.copySubtitle}</p>
						<p class="media-copy-description" ?hidden=${this.descriptionHidden}>${this.copyDescription}</p>
					</figcaption>
				</figure>
				<button type="button" class="media-nav media-next" ?hidden=${this.navHidden} aria-label="Next" @click=${this.handleNext}>
					<ui-icon .state.name=${'chevron-right'} .state.size=${'lg'}></ui-icon>
				</button>
				<nav class="media-dots" ?hidden=${this.dotsHidden} aria-label="Slides">
					${this.list('dots', this.dotMark)}
				</nav>
			</div>
		`;
	}
}
customElements.define('ui-media-stage', UIMediaStage);
