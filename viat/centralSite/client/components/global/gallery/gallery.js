/*
	DESCRIPTION: ui-gallery — image viewer with stage, thumbs, and fullscreen nav.
	Inline: optional header tools + main stage + footer thumbnail strip.
	Fullscreen is one mounted <ui-media-lightbox> (prev/next/Esc) — not
	whitebox — because multi-image nav is a different mechanic. Tools are CSS
	transforms (flip / zoom / rotate) plus download; they reset on image change.
	The overlay reuses the same ui-media-toolbar — it does not invent a second cluster.
	── EVENTS ───────────────────────────────────────────────────────────
	  gallery:select { index, item }
	  gallery:open { index, item }
	  gallery:close { index }
	  gallery:download { src, filename, ok }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-gallery .state.items=${[{ src, alt, label }]}
	    .state.layout=${'viewer'} .state.showThumbs=${true}
	    .state.showFlip=${true} .state.showZoom=${true}
	    .state.showRotate=${true} .state.showDownload=${true}></ui-gallery>
	──────────────────────────────────────────────────────────────────────
*/
import '../media-lightbox/media-lightbox.js';
import '../media-stage/media-stage.js';
import '../media-toolbar/media-toolbar.js';
import {
	isTrue,
	WebComponent,
} from 'webcomponent';
import {
	mediaActionPatch,
	mediaTransformStyle,
	runMediaDownload,
} from '../../core/media/mediaAction.js';
import { resolveMediaCopy } from '../../core/media/mediaCopy.js';
import { UIGalleryThumb } from '../gallery-thumb/gallery-thumb.js';
const RADIUS = new Set([
	'none', 'sm', 'md', 'lg',
]);
const LAYOUTS = new Set(['viewer', 'grid']);
function layoutToken(value) {
	const token = String(value || 'viewer');
	return LAYOUTS.has(token) ? token : 'viewer';
}
function radiusToken(value) {
	const token = String(value || 'md');
	return RADIUS.has(token) ? token : 'md';
}
export class UIGallery extends WebComponent {
	static url = import.meta.url;
	static styles = {
		gallery: './gallery.css',
	};
	static state = {
		items: [],
		columns: 3,
		gap: '0.5rem',
		radius: 'md',
		layout: 'viewer',
		activeIndex: 0,
		open: false,
		showThumbs: true,
		showToolbar: true,
		showFlip: true,
		showZoom: true,
		showRotate: true,
		showDownload: true,
		showHeading: true,
		showCaption: true,
		showSubtitle: true,
		showDescription: true,
		captionAlign: 'center',
		zoom: 1,
		rotate: 0,
		flipX: false,
		flipY: false,
	};
	onConnect() {
		this.syncActiveFlags();
		this.observe('activeIndex', this.onActiveIndexChange);
	}
	onActiveIndexChange() {
		this.resetTransform();
		this.syncActiveFlags();
	}
	resetTransform() {
		this.assignState({
			zoom: 1,
			rotate: 0,
			flipX: false,
			flipY: false,
		});
	}
	syncActiveFlags() {
		const items = this.state.items;
		const count = items.length;
		const activeIndex = this.state.activeIndex;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const nextActive = index === activeIndex;
			if (item.active !== nextActive) {
				item.active = nextActive;
			}
			if (item.thumbIndex !== index) {
				item.thumbIndex = index;
			}
		}
	}
	indexOfSrc(src, id) {
		const items = this.state.items;
		const count = items.length;
		if (id) {
			for (let index = 0; index < count; index += 1) {
				if (String(items[index].id) === String(id)) {
					return index;
				}
			}
		}
		for (let index = 0; index < count; index += 1) {
			if (items[index].src === src) {
				return index;
			}
		}
		return -1;
	}
	currentItem() {
		return this.state.items[this.state.activeIndex] || null;
	}
	showLightbox(index) {
		const items = this.state.items;
		if (!items[index]) {
			return;
		}
		this.state.activeIndex = index;
		this.resetTransform();
		this.state.open = true;
		this.refs.lightbox?.show(index);
		this.emit('gallery:open', {
			index,
			item: items[index],
		});
	}
	hideLightbox() {
		if (!isTrue(this.state.open)) {
			return;
		}
		this.refs.lightbox?.hide();
	}
	step(delta) {
		const count = this.state.items.length;
		if (count === 0) {
			return;
		}
		const next = (this.state.activeIndex + delta + count) % count;
		this.state.activeIndex = next;
		this.emit('gallery:select', {
			index: next,
			item: this.state.items[next],
		});
	}
	handleThumbSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = this.indexOfSrc(data.src, data.id);
		if (index < 0) {
			return;
		}
		this.emit('gallery:select', {
			index,
			item: this.state.items[index],
		});
		if (layoutToken(this.state.layout) === 'grid' && !isTrue(this.state.open)) {
			this.showLightbox(index);
			return;
		}
		this.state.activeIndex = index;
	}
	handlePrev() {
		this.step(-1);
	}
	handleNext() {
		this.step(1);
	}
	handleLightboxClosed() {
		if (!isTrue(this.state.open)) {
			return;
		}
		this.state.open = false;
		this.emit('gallery:close', {
			index: this.state.activeIndex,
		});
	}
	handleLightboxChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = data.index;
		if (index === this.state.activeIndex) {
			return;
		}
		this.state.activeIndex = index;
		this.emit('gallery:select', {
			index,
			item: this.state.items[index],
		});
	}
	handleLightboxDownload(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.emit('gallery:download', data);
	}
	handleStageActivate() {
		if (isTrue(this.state.open)) {
			return;
		}
		this.showLightbox(this.state.activeIndex);
	}
	handleFullscreen() {
		if (isTrue(this.state.open)) {
			this.hideLightbox();
			return;
		}
		this.showLightbox(this.state.activeIndex);
	}
	handleToolbarAction(domEvent) {
		const action = domEvent.detail?.data?.action;
		if (!action) {
			return;
		}
		switch (action) {
			case 'fullscreen': {
				this.handleFullscreen();
				break;
			}
			case 'close': {
				this.hideLightbox();
				break;
			}
			case 'download': {
				this.handleDownload();
				break;
			}
			default: {
				const patch = mediaActionPatch(this.state, action);
				if (patch) {
					this.assignState(patch);
				}
				break;
			}
		}
	}
	async handleDownload() {
		const result = await runMediaDownload(this.currentItem());
		if (!result) {
			return;
		}
		this.emit('gallery:download', result);
	}
	thumbsStyle() {
		if (layoutToken(this.state.layout) !== 'grid') {
			return '';
		}
		const columns = Number(this.state.columns) || 3;
		return `grid-template-columns: repeat(${columns}, 1fr); gap: ${this.state.gap};`;
	}
	layoutToken() {
		return layoutToken(this.state.layout);
	}
	radiusToken() {
		return radiusToken(this.state.radius);
	}
	currentSrc() {
		return this.currentItem()?.src || '';
	}
	currentAlt() {
		const item = this.currentItem();
		return item?.alt || item?.label || '';
	}
	currentHeading() {
		return resolveMediaCopy(this.currentItem()).heading;
	}
	currentCaption() {
		return resolveMediaCopy(this.currentItem()).caption;
	}
	currentSubtitle() {
		return resolveMediaCopy(this.currentItem()).subtitle;
	}
	currentDescription() {
		return resolveMediaCopy(this.currentItem()).description;
	}
	currentAlign() {
		return resolveMediaCopy(this.currentItem()).captionAlign;
	}
	hasNav() {
		return this.state.items.length >= 2;
	}
	hideInlineToolbar() {
		return isTrue(this.state.open);
	}
	imageTransform() {
		return mediaTransformStyle(
			this.state.zoom,
			this.state.rotate,
			this.state.flipX,
			this.state.flipY
		);
	}
	itemKey(item, index) {
		return item.id ?? item.src ?? index;
	}
	render() {
		this.html`
			<div class="gallery"
				data-layout=${this.layoutToken}
				data-radius=${this.radiusToken}
				?data-thumbs=${this.state.showThumbs}
				@media-toolbar:action=${this.handleToolbarAction}
				@media-stage:prev=${this.handlePrev}
				@media-stage:next=${this.handleNext}
				@media-stage:activate=${this.handleStageActivate}
				@gallery-thumb:select=${this.handleThumbSelect}>
				<header class="gallery-toolbar" ?hidden=${this.hideInlineToolbar}>
					<ui-media-toolbar
						.state.showFlip=${this.state.showFlip}
						.state.showZoom=${this.state.showZoom}
						.state.showRotate=${this.state.showRotate}
						.state.showDownload=${this.state.showDownload}
						.state.overlay=${false}></ui-media-toolbar>
				</header>
				<ui-media-stage
					.state.src=${this.currentSrc}
					.state.alt=${this.currentAlt}
					.state.heading=${this.currentHeading}
					.state.caption=${this.currentCaption}
					.state.subtitle=${this.currentSubtitle}
					.state.description=${this.currentDescription}
					.state.captionAlign=${this.currentAlign}
					.state.showHeading=${this.state.showHeading}
					.state.showCaption=${this.state.showCaption}
					.state.showSubtitle=${this.state.showSubtitle}
					.state.showDescription=${this.state.showDescription}
					.state.showNav=${this.hasNav}
					.state.transform=${this.imageTransform}
					.state.interactive=${true}></ui-media-stage>
				<footer class="gallery-thumbs" style=${this.thumbsStyle}>
					${this.list('items', UIGalleryThumb, this.itemKey)}
				</footer>
			</div>
			<ui-media-lightbox
				#lightbox
				.state.items=${this.state.items}
				.state.activeIndex=${this.state.activeIndex}
				.state.showToolbar=${this.state.showToolbar}
				.state.showThumbs=${this.state.showThumbs}
				.state.showFlip=${this.state.showFlip}
				.state.showZoom=${this.state.showZoom}
				.state.showRotate=${this.state.showRotate}
				.state.showDownload=${this.state.showDownload}
				.state.showHeading=${this.state.showHeading}
				.state.showCaption=${this.state.showCaption}
				.state.showSubtitle=${this.state.showSubtitle}
				.state.showDescription=${this.state.showDescription}
				.state.radius=${this.state.radius}
				@media-lightbox:close=${this.handleLightboxClosed}
				@media-lightbox:change=${this.handleLightboxChange}
				@media-lightbox:download=${this.handleLightboxDownload}></ui-media-lightbox>
		`;
	}
}
customElements.define('ui-gallery', UIGallery);
