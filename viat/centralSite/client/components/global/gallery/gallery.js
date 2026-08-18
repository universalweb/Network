/*
	DESCRIPTION: ui-gallery — PrimeVue-style image viewer.
	Inline: optional header tools + main stage + footer thumbnail strip.
	Fullscreen is the same <dialog showModal> chrome (prev/next/Esc) — not
	whitebox — because multi-image nav is a different mechanic. Tools are CSS
	transforms (flip / zoom / rotate) plus download; they reset on image change.
	The overlay reuses the same tool toggles — it does not invent a second toolbar.
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
import '../icon/icon.js';
import '../icon-button/icon-button.js';
import { hasValue, isString, isTrue } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../scroll-lock.js';
const RADIUS = new Set([
	'none', 'sm', 'md', 'lg',
]);
const LAYOUTS = new Set(['viewer', 'grid']);
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;
const ROTATE_STEP = 90;
function layoutToken(value) {
	const token = String(value || 'viewer');
	return LAYOUTS.has(token) ? token : 'viewer';
}
function radiusToken(value) {
	const token = String(value || 'md');
	return RADIUS.has(token) ? token : 'md';
}
function downloadFilename(item) {
	const label = item?.label;
	if (isString(label) && label) {
		return label;
	}
	return 'image';
}
function triggerAnchorDownload(href, filename) {
	const documentRef = globalThis.document;
	if (!documentRef) {
		return;
	}
	const anchor = documentRef.createElement('a');
	anchor.href = href;
	anchor.download = filename;
	anchor.rel = 'noopener';
	anchor.click();
}
async function fetchDownloadBlob(src) {
	try {
		const response = await globalThis.fetch(src);
		if (!response.ok) {
			return {
				ok: false,
				errKind: 'http',
			};
		}
		const blob = await response.blob();
		return {
			ok: true,
			blob,
		};
	} catch (cause) {
		return {
			ok: false,
			errKind: 'network',
			cause,
		};
	}
}
export class UIGalleryThumb extends WebComponent {
	static url = import.meta.url;
	static styles = {
		gallery: './gallery.css',
	};
	static state = {
		id: '',
		src: '',
		alt: '',
		label: '',
		active: false,
	};
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
	captionHidden() {
		return !this.state.label;
	}
	render() {
		this.html`
			<button type="button" class="gt" ?data-active=${this.state.active} @click=${this.handleActivate}>
				<img class="gt-img" src=${this.state.src} alt=${this.state.alt} loading="lazy">
				<span class="gt-cap" ?hidden=${this.captionHidden}>${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-gallery-thumb', UIGalleryThumb);
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
		showFlip: true,
		showZoom: true,
		showRotate: true,
		showDownload: true,
		zoom: 1,
		rotate: 0,
		flipX: false,
		flipY: false,
	};
	onConnect() {
		this.syncActiveFlags();
		this.observe('activeIndex', this.onActiveIndexChange);
	}
	onDisconnect() {
		if (this.state.open === true) {
			unlockBackgroundScroll(this);
		}
		globalThis.document?.removeEventListener('keydown', this, true);
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'keydown') {
			this.handleLightboxKey(domEvent);
		}
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
		const dialog = this.refs.lightbox;
		if (dialog && !dialog.open) {
			dialog.showModal();
		}
		lockBackgroundScroll(this);
		globalThis.document?.addEventListener('keydown', this, true);
		this.emit('gallery:open', {
			index,
			item: items[index],
		});
	}
	hideLightbox() {
		if (this.state.open !== true) {
			return;
		}
		this.state.open = false;
		const dialog = this.refs.lightbox;
		if (dialog?.open) {
			dialog.close();
		}
		unlockBackgroundScroll(this);
		globalThis.document?.removeEventListener('keydown', this, true);
		this.emit('gallery:close', {
			index: this.state.activeIndex,
		});
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
		if (layoutToken(this.state.layout) === 'grid' && this.state.open !== true) {
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
	handleBackdrop(domEvent) {
		if (domEvent.target === this.refs.lightbox) {
			this.hideLightbox();
		}
	}
	handleDialogClose() {
		if (this.state.open === true) {
			this.hideLightbox();
		}
	}
	handleLightboxKey(domEvent) {
		if (this.state.open !== true) {
			return;
		}
		switch (domEvent.key) {
			case 'ArrowLeft': {
				domEvent.preventDefault();
				this.step(-1);
				break;
			}
			case 'ArrowRight': {
				domEvent.preventDefault();
				this.step(1);
				break;
			}
			case 'Escape': {
				this.hideLightbox();
				break;
			}
			default: {
				break;
			}
		}
	}
	handleStageActivate() {
		if (this.state.open === true) {
			return;
		}
		this.showLightbox(this.state.activeIndex);
	}
	handleFullscreen() {
		if (this.state.open === true) {
			this.hideLightbox();
			return;
		}
		this.showLightbox(this.state.activeIndex);
	}
	handleFlipX() {
		this.state.flipX = !isTrue(this.state.flipX);
	}
	handleFlipY() {
		this.state.flipY = !isTrue(this.state.flipY);
	}
	handleZoomIn() {
		const current = Number(this.state.zoom) || 1;
		this.state.zoom = Math.min(ZOOM_MAX, current + ZOOM_STEP);
	}
	handleZoomOut() {
		const current = Number(this.state.zoom) || 1;
		this.state.zoom = Math.max(ZOOM_MIN, current - ZOOM_STEP);
	}
	handleRotateLeft() {
		this.state.rotate = (Number(this.state.rotate) || 0) - ROTATE_STEP;
	}
	handleRotateRight() {
		this.state.rotate = (Number(this.state.rotate) || 0) + ROTATE_STEP;
	}
	async handleDownload() {
		const src = this.currentSrc();
		if (!hasValue(src) || src === '') {
			return;
		}
		const filename = downloadFilename(this.currentItem());
		const result = await fetchDownloadBlob(src);
		if (result.ok !== true) {
			triggerAnchorDownload(src, filename);
			this.emit('gallery:download', {
				src,
				filename,
				ok: false,
			});
			return;
		}
		const objectUrl = URL.createObjectURL(result.blob);
		triggerAnchorDownload(objectUrl, filename);
		URL.revokeObjectURL(objectUrl);
		this.emit('gallery:download', {
			src,
			filename,
			ok: true,
		});
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
	currentCaption() {
		return this.currentItem()?.label || '';
	}
	captionHidden() {
		return !this.currentCaption();
	}
	navHidden() {
		return this.state.items.length < 2;
	}
	fullIcon(overlay) {
		return overlay === true ? 'minimize' : 'maximize';
	}
	fullTip(overlay) {
		return overlay === true ? 'Exit fullscreen' : 'Fullscreen';
	}
	imageTransform() {
		const zoom = Number(this.state.zoom) || 1;
		const rotate = Number(this.state.rotate) || 0;
		const scaleX = isTrue(this.state.flipX) ? -zoom : zoom;
		const scaleY = isTrue(this.state.flipY) ? -zoom : zoom;
		return `transform: rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
	}
	itemKey(item, index) {
		return item.id ?? item.src ?? index;
	}
	toolbar(overlay) {
		const isOverlay = overlay === true;
		return this.htmlElement`
			<div class="gy-tools"
				?data-flip=${this.state.showFlip}
				?data-zoom=${this.state.showZoom}
				?data-rotate=${this.state.showRotate}
				?data-download=${this.state.showDownload}
				?data-open=${isOverlay}>
				<ui-icon-button data-tool="rotate" .state.icon=${'rotate-ccw'} .state.tooltip=${'Rotate left'} .state.size=${'sm'} @icon-button:click=${this.handleRotateLeft}></ui-icon-button>
				<ui-icon-button data-tool="rotate" .state.icon=${'rotate-cw'} .state.tooltip=${'Rotate right'} .state.size=${'sm'} @icon-button:click=${this.handleRotateRight}></ui-icon-button>
				<ui-icon-button data-tool="zoom" .state.icon=${'zoom-in'} .state.tooltip=${'Zoom in'} .state.size=${'sm'} @icon-button:click=${this.handleZoomIn}></ui-icon-button>
				<ui-icon-button data-tool="zoom" .state.icon=${'zoom-out'} .state.tooltip=${'Zoom out'} .state.size=${'sm'} @icon-button:click=${this.handleZoomOut}></ui-icon-button>
				<ui-icon-button data-tool="flip" .state.icon=${'flip-horizontal'} .state.tooltip=${'Flip horizontal'} .state.size=${'sm'} @icon-button:click=${this.handleFlipX}></ui-icon-button>
				<ui-icon-button data-tool="flip" .state.icon=${'flip-vertical'} .state.tooltip=${'Flip vertical'} .state.size=${'sm'} @icon-button:click=${this.handleFlipY}></ui-icon-button>
				<ui-icon-button data-tool="download" .state.icon=${'download'} .state.tooltip=${'Download'} .state.size=${'sm'} @icon-button:click=${this.handleDownload}></ui-icon-button>
				<ui-icon-button data-tool="full" .state.icon=${this.fullIcon(isOverlay)} .state.tooltip=${this.fullTip(isOverlay)} .state.size=${'sm'} @icon-button:click=${this.handleFullscreen}></ui-icon-button>
				<ui-icon-button data-tool="close" .state.icon=${'x'} .state.tooltip=${'Close'} .state.size=${'sm'} @icon-button:click=${this.hideLightbox}></ui-icon-button>
			</div>
		`;
	}
	closedToolbar() {
		return this.state.open === true ? '' : this.toolbar(false);
	}
	openToolbar() {
		return this.state.open === true ? this.toolbar(true) : '';
	}
	render() {
		this.html`
			<div class="gy"
				data-layout=${this.layoutToken}
				data-radius=${this.radiusToken}
				?data-thumbs=${this.state.showThumbs}
				@gallery-thumb:select=${this.handleThumbSelect}>
				<header class="gy-toolbar">
					${this.closedToolbar}
				</header>
				<div class="gy-stage">
					<button type="button" class="gy-nav gy-prev" ?hidden=${this.navHidden} aria-label="Previous" @click=${this.handlePrev}>
						<ui-icon .state.name=${'chevron-left'} .state.size=${'lg'}></ui-icon>
					</button>
					<figure class="gy-figure" @click=${this.handleStageActivate}>
						<img class="gy-full" src=${this.currentSrc} alt=${this.currentAlt} style=${this.imageTransform}>
						<figcaption class="gy-full-cap" ?hidden=${this.captionHidden}>${this.currentCaption}</figcaption>
					</figure>
					<button type="button" class="gy-nav gy-next" ?hidden=${this.navHidden} aria-label="Next" @click=${this.handleNext}>
						<ui-icon .state.name=${'chevron-right'} .state.size=${'lg'}></ui-icon>
					</button>
				</div>
				<footer class="gy-thumbs" style=${this.thumbsStyle}>
					${this.list('items', UIGalleryThumb, this.itemKey)}
				</footer>
			</div>
			<dialog #lightbox class="gy-lb" ?data-thumbs=${this.state.showThumbs} @click=${this.handleBackdrop} @close=${this.handleDialogClose} @gallery-thumb:select=${this.handleThumbSelect}>
				<header class="gy-toolbar gy-lb-bar">
					${this.openToolbar}
				</header>
				<div class="gy-stage gy-lb-stage">
					<button type="button" class="gy-nav gy-prev" ?hidden=${this.navHidden} aria-label="Previous" @click=${this.handlePrev}>
						<ui-icon .state.name=${'chevron-left'} .state.size=${'lg'}></ui-icon>
					</button>
					<figure class="gy-figure">
						<img class="gy-full" src=${this.currentSrc} alt=${this.currentAlt} style=${this.imageTransform}>
						<figcaption class="gy-full-cap" ?hidden=${this.captionHidden}>${this.currentCaption}</figcaption>
					</figure>
					<button type="button" class="gy-nav gy-next" ?hidden=${this.navHidden} aria-label="Next" @click=${this.handleNext}>
						<ui-icon .state.name=${'chevron-right'} .state.size=${'lg'}></ui-icon>
					</button>
				</div>
				<footer class="gy-thumbs">
					${this.list('items', UIGalleryThumb, this.itemKey)}
				</footer>
			</dialog>
		`;
	}
}
customElements.define('ui-gallery', UIGallery);
