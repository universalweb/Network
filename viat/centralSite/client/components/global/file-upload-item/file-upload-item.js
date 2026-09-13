/*
	DESCRIPTION: ui-file-upload-item — one selected-file row. Thumbnail
	(object URL for image/video, type-icon glyph otherwise) plus a type icon,
	name, size, and close. Emits file-upload-item:remove { id }.
	── USAGE ────────────────────────────────────────────────────────────
	  list('fileItems', UIFileUploadItem) with { id, file }
	─────────────────────────────────────────────────────────────────────
*/
import '../close-button/close-button.js';
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
/*
 * Kind detection, the type-icon map and the size formatter now live in
 * ../file-kind.js. ui-attachment answers the same three questions about a file
 * the user has ALREADY sent — no picker, no input — so a second copy would be
 * two places to disagree on what counts as an image, or on whether 1024 bytes
 * reads as "1.0 KB".
 *
 * Imported for use below AND re-exported, because consumers already import
 * these three from this module.
 */
import {
	fileKind,
	fileTypeIcon,
	formatFileSize,
} from '../file-kind.js';
export {
	fileKind,
	fileTypeIcon,
	formatFileSize,
};
export class UIFileUploadItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		fileUploadItem: './file-upload-item.css',
	};
	static state = {
		id: '',
		file: null,
		hasMedia: false,
	};
	previewUrl = '';
	onConnect() {
		this.observe('file', this.onFileChange);
		this.armPreview();
	}
	onDisconnect() {
		this.revokePreview();
	}
	onFileChange() {
		this.armPreview();
	}
	armPreview() {
		this.revokePreview();
		const file = this.state.file;
		const kind = file ? fileKind(file.type, file.name) : 'file';
		let nextUrl = '';
		if (file && (kind === 'image' || kind === 'video')) {
			const urlApi = globalThis.URL;
			if (urlApi?.createObjectURL) {
				nextUrl = urlApi.createObjectURL(file);
			}
		}
		this.previewUrl = nextUrl;
		const hasMedia = Boolean(nextUrl);
		if (this.state.hasMedia !== hasMedia) {
			this.state.hasMedia = hasMedia;
		}
	}
	revokePreview() {
		const url = this.previewUrl;
		if (!url) {
			return;
		}
		this.previewUrl = '';
		globalThis.URL?.revokeObjectURL?.(url);
	}
	handlePreviewError() {
		this.revokePreview();
		if (this.state.hasMedia) {
			this.state.hasMedia = false;
		}
	}
	seekPoster(domEvent) {
		const media = domEvent.currentTarget;
		if (!media || media.currentTime > 0) {
			return;
		}
		if (!Number.isFinite(media.duration) || media.duration <= 0) {
			return;
		}
		media.currentTime = Math.min(0.1, media.duration / 4);
	}
	handleRemove() {
		this.emit('file-upload-item:remove', {
			id: this.state.id,
		});
	}
	currentKind() {
		const file = this.state.file;
		return fileKind(file?.type, file?.name);
	}
	typeIconName() {
		return fileTypeIcon(this.currentKind());
	}
	fileLabel() {
		return this.state.file?.name || '';
	}
	sizeLabel() {
		return formatFileSize(this.state.file?.size);
	}
	removeLabel() {
		const fileName = this.fileLabel();
		if (fileName) {
			return `Remove ${fileName}`;
		}
		return 'Remove file';
	}
	hasMediaPreview() {
		return this.state.hasMedia === true && Boolean(this.previewUrl);
	}
	hideImagePreview() {
		return !(this.hasMediaPreview() && this.currentKind() === 'image');
	}
	hideVideoPreview() {
		return !(this.hasMediaPreview() && this.currentKind() === 'video');
	}
	hideFallback() {
		return this.hasMediaPreview() && (this.currentKind() === 'image' || this.currentKind() === 'video');
	}
	imageSrc() {
		if (this.hideImagePreview()) {
			return '';
		}
		return this.previewUrl;
	}
	videoSrc() {
		if (this.hideVideoPreview()) {
			return '';
		}
		return this.previewUrl;
	}
	render() {
		this.html`
			<div class="file-upload-item" data-kind=${this.currentKind}>
				<div class="file-upload-item-thumb-slot">
					<img class="file-upload-item-media" alt=""
						?hidden=${this.hideImagePreview}
						src=${this.imageSrc}
						@error=${this.handlePreviewError}>
					<video class="file-upload-item-media" muted playsinline preload="metadata"
						?hidden=${this.hideVideoPreview}
						src=${this.videoSrc}
						@loadeddata=${this.seekPoster}
						@error=${this.handlePreviewError}></video>
					<div class="file-upload-item-fallback" aria-hidden="true" ?hidden=${this.hideFallback}>
						<ui-icon .state.name=${this.typeIconName} .state.size=${'md'}></ui-icon>
					</div>
				</div>
				<div class="file-upload-item-meta">
					<ui-icon class="file-upload-item-kind" aria-hidden="true"
						.state.name=${this.typeIconName}
						.state.size=${'sm'}></ui-icon>
					<div class="file-upload-item-copy">
						<span class="file-upload-item-name">${this.fileLabel}</span>
						<span class="file-upload-item-size">${this.sizeLabel}</span>
					</div>
				</div>
				<ui-close-button
					class="file-upload-item-close"
					.state.label=${this.removeLabel}
					.state.size=${'sm'}
					@close-button:click=${this.handleRemove}></ui-close-button>
			</div>
		`;
	}
}
customElements.define('ui-file-upload-item', UIFileUploadItem);
