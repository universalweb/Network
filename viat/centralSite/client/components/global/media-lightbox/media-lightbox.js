/**
 *	NAME: MediaLightbox
 *	TAG: ui-media-lightbox
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-media-lightbox — modal dialog shell composing
 *	ui-media-toolbar, ui-media-stage, and an optional thumb strip.
 *	The dialog stays mounted; showModal requires it in the tree.
 *	Off the escapable stack — the UA light-dismisses modal dialogs.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-media-lightbox
 *	    .state.items=${shots}
 *	    .state.showToolbar=${true}
 *	    .state.showThumbs=${true}></ui-media-lightbox>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIMediaLightbox } from './media-lightbox.js';
 *	  const host = new UIMediaLightbox({ items: shots, showToolbar: true });
 *	  document.body.append(host);
 *	  host.show(0);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  media-lightbox:change { index, item }
 *	  media-lightbox:close { index }
 *	  media-lightbox:download { src, filename, ok }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-03
 *	─────────────────────────────────────────────────────────────────────
 */
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
import { lockBackgroundScroll, unlockBackgroundScroll } from '../scroll-lock.js';
const RADIUS = new Set([
	'none', 'sm', 'md', 'lg',
]);
function radiusToken(value) {
	const token = String(value || 'md');
	return RADIUS.has(token) ? token : 'md';
}
export class UIMediaLightbox extends WebComponent {
	static url = import.meta.url;
	static styles = {
		lightbox: './media-lightbox.css',
	};
	static state = {
		items: [],
		activeIndex: 0,
		showToolbar: true,
		showThumbs: true,
		showFlip: true,
		showZoom: true,
		showRotate: true,
		showDownload: true,
		zoom: 1,
		rotate: 0,
		flipX: false,
		flipY: false,
		radius: 'md',
		showHeading: true,
		showCaption: true,
		showSubtitle: true,
		showDescription: true,
		captionAlign: 'center',
	};
	overlayOpen = false;
	onConnect() {
		this.syncActiveFlags();
		this.observe('activeIndex', this.onActiveIndexChange);
	}
	onDisconnect() {
		if (this.overlayOpen) {
			unlockBackgroundScroll();
			this.overlayOpen = false;
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
	show(index) {
		const items = this.state.items;
		const nextIndex = Number.isInteger(index) ? index : this.state.activeIndex;
		if (!items[nextIndex]) {
			return;
		}
		this.state.activeIndex = nextIndex;
		this.resetTransform();
		const dialog = this.refs.dialog;
		if (dialog && !dialog.open) {
			dialog.showModal();
		}
		if (!this.overlayOpen) {
			this.overlayOpen = true;
			lockBackgroundScroll();
			globalThis.document?.addEventListener('keydown', this, true);
		}
	}
	hide() {
		if (!this.overlayOpen) {
			return;
		}
		this.overlayOpen = false;
		const dialog = this.refs.dialog;
		if (dialog?.open) {
			dialog.close();
		}
		unlockBackgroundScroll();
		globalThis.document?.removeEventListener('keydown', this, true);
		this.emit('media-lightbox:close', {
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
		this.emit('media-lightbox:change', {
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
		this.state.activeIndex = index;
		this.emit('media-lightbox:change', {
			index,
			item: this.state.items[index],
		});
	}
	handlePrev() {
		this.step(-1);
	}
	handleNext() {
		this.step(1);
	}
	handleBackdrop(domEvent) {
		if (!this.overlayOpen) {
			return;
		}
		if (this.isProtectedHit(domEvent)) {
			return;
		}
		this.hide();
	}
	isProtectedHit(domEvent) {
		const path = typeof domEvent.composedPath === 'function' ? domEvent.composedPath() : [domEvent.target];
		const count = path.length;
		const dialog = this.refs.dialog;
		for (let index = 0; index < count; index += 1) {
			const node = path[index];
			if (node === dialog) {
				return false;
			}
			if (this.isProtectedNode(node)) {
				return true;
			}
		}
		return false;
	}
	isProtectedNode(node) {
		if (!node || node.nodeType !== 1) {
			return false;
		}
		const tag = node.localName;
		if (tag === 'ui-media-toolbar' || tag === 'ui-gallery-thumb' || tag === 'ui-icon-button') {
			return true;
		}
		const tokens = node.classList;
		if (!tokens) {
			return false;
		}
		return tokens.contains('media-nav') ||
			tokens.contains('media-figure') ||
			tokens.contains('media-full') ||
			tokens.contains('media-copy') ||
			tokens.contains('media-copy-heading') ||
			tokens.contains('media-copy-caption') ||
			tokens.contains('media-copy-subtitle') ||
			tokens.contains('media-copy-description') ||
			tokens.contains('media-lb-bar') ||
			tokens.contains('gt') ||
			tokens.contains('gt-img') ||
			tokens.contains('gallery-thumb-copy') ||
			tokens.contains('gallery-thumb-heading') ||
			tokens.contains('gallery-thumb-caption') ||
			tokens.contains('gallery-thumb-subtitle') ||
			tokens.contains('gallery-thumb-description');
	}
	handleDialogClose() {
		if (this.overlayOpen) {
			this.hide();
		}
	}
	handleLightboxKey(domEvent) {
		if (!this.overlayOpen) {
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
				this.hide();
				break;
			}
			default: {
				break;
			}
		}
	}
	handleToolbarAction(domEvent) {
		const action = domEvent.detail?.data?.action;
		if (!action) {
			return;
		}
		switch (action) {
			case 'fullscreen':
			case 'close': {
				this.hide();
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
		this.emit('media-lightbox:download', result);
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
	hideToolbar() {
		return !isTrue(this.state.showToolbar);
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
			<dialog #dialog class="media-lb" data-radius=${this.radiusToken} ?data-thumbs=${this.state.showThumbs} @click=${this.handleBackdrop} @close=${this.handleDialogClose} @gallery-thumb:select=${this.handleThumbSelect} @media-toolbar:action=${this.handleToolbarAction} @media-stage:prev=${this.handlePrev} @media-stage:next=${this.handleNext}>
				<header class="media-lb-bar" ?hidden=${this.hideToolbar}>
					<ui-media-toolbar
						.state.showFlip=${this.state.showFlip}
						.state.showZoom=${this.state.showZoom}
						.state.showRotate=${this.state.showRotate}
						.state.showDownload=${this.state.showDownload}
						.state.overlay=${true}></ui-media-toolbar>
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
					.state.interactive=${false}
					.state.overlay=${true}></ui-media-stage>
				<footer class="media-thumbs">
					${this.list('items', UIGalleryThumb, this.itemKey)}
				</footer>
			</dialog>
		`;
	}
}
customElements.define('ui-media-lightbox', UIMediaLightbox);
