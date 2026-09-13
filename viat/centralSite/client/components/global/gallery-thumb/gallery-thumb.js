/**
 *	NAME: GalleryThumb
 *	TAG: ui-gallery-thumb
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-gallery-thumb — one selectable thumbnail in a media strip.
 *	Emits the item; the host writes `active`. Copy fields (heading, caption,
 *	subtitle, description) are optional and collapse when empty.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-gallery-thumb
 *	    .state.src=${src} .state.alt=${alt}
 *	    .state.label=${label} .state.active=${false}></ui-gallery-thumb>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIGalleryThumb } from './gallery-thumb.js';
 *	  const host = new UIGalleryThumb({ src, alt, label });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  gallery-thumb:select { id, src, item }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-03
 *	─────────────────────────────────────────────────────────────────────
 */
import { WebComponent } from 'webcomponent';
import {
	isCopyHidden,
	mediaCopyAlign,
	resolveMediaCopy,
} from '../../core/media/mediaCopy.js';
export class UIGalleryThumb extends WebComponent {
	static url = import.meta.url;
	static styles = {
		thumb: './gallery-thumb.css',
	};
	static state = {
		id: '',
		src: '',
		alt: '',
		label: '',
		heading: '',
		caption: '',
		subtitle: '',
		description: '',
		captionAlign: 'center',
		showHeading: true,
		showCaption: true,
		showSubtitle: true,
		showDescription: true,
		thumbIndex: 0,
		active: false,
	};
	beforeRender() {
		const index = Number(this.state.thumbIndex) || 0;
		this.style.setProperty('--thumb-index', String(index));
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
	handleActivate() {
		this.emit('gallery-thumb:select', {
			id: this.state.id,
			src: this.state.src,
			item: {
				id: this.state.id,
				src: this.state.src,
				alt: this.state.alt,
				label: this.state.label,
			},
		});
	}
	render() {
		this.html`
			<button type="button" class="gt" ?data-active=${this.state.active} @click=${this.handleActivate}>
				<img class="gt-img" src=${this.state.src} alt=${this.state.alt} loading="lazy">
				<div class="gallery-thumb-copy" data-align=${this.copyAlign}>
					<span class="gallery-thumb-heading" ?hidden=${this.headingHidden}>${this.copyHeading}</span>
					<span class="gallery-thumb-caption" ?hidden=${this.captionHidden}>${this.copyCaption}</span>
					<span class="gallery-thumb-subtitle" ?hidden=${this.subtitleHidden}>${this.copySubtitle}</span>
					<span class="gallery-thumb-description" ?hidden=${this.descriptionHidden}>${this.copyDescription}</span>
				</div>
			</button>
		`;
	}
}
customElements.define('ui-gallery-thumb', UIGalleryThumb);
