/*
	DESCRIPTION: ui-attachment — a file the user has ALREADY sent or received.
	Type icon (or a thumbnail when `src` points at an image), name, size and an
	optional description; optionally removable, and optionally a link.
	NOT a picker. ui-file-upload owns choosing files, and its row
	(ui-file-upload-item) is bound to a live `File` object with an object-URL
	preview it must revoke. An attachment is the settled counterpart: it takes
	plain values — a name, a byte count, a URL — because by the time it renders
	there is no File in hand, only a record of one. Both answer "what kind of
	file is this" through the shared ../file-kind.js, so they cannot disagree.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-attachment .state.name=${'report.pdf'} .state.size=${248000}></ui-attachment>
	  <ui-attachment .state.name=${'download'} .state.mime=${'image/png'}></ui-attachment>
	  <ui-attachment .state.name=${'shot.png'} .state.src=${'/u/shot.png'}></ui-attachment>
	  <ui-attachment .state.name=${'notes.md'} .state.href=${'/files/notes.md'}></ui-attachment>
	  <ui-attachment .state.name=${'old.zip'} .state.removable=${true}
	    @attachment:remove=${this.drop}></ui-attachment>
	─────────────────────────────────────────────────────────────────────
	── EVENTS ───────────────────────────────────────────────────────────
	  attachment:remove { id, name }
	  attachment:open   { id, name, href }   — only when there is no href
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import '../close-button/close-button.js';
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
import { fileKind, fileTypeIcon, formatFileSize } from '../file-kind.js';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
export class UIAttachment extends WebComponent {
	static url = import.meta.url;
	static styles = {
		attachment: './attachment.css',
	};
	static state = {
		id: '',
		name: '',
		/* Bytes. 0 and '' both mean "no size to show" rather than "zero bytes",
		   because an attachment record often carries the name alone. */
		size: 0,
		/*
		 * MIME when the caller has it; the extension is used when it does not.
		 * Named `mime` rather than `type`: `type` is a forbidden state key here
		 * (it collides with native element properties), and this is the more exact
		 * word for what it holds anyway.
		 */
		mime: '',
		/* Optional preview image. Only honoured for image kinds — a thumbnail of
		   a .zip is a broken image with extra steps. */
		src: '',
		/* Optional caption under the name: "uploaded 2h ago", an author, a note. */
		description: '',
		href: '',
		removable: false,
		disabled: false,
		size_: 'md',
		/*
		 * The src that failed to load, so a broken thumbnail falls back to the type
		 * icon rather than the browser's broken-image glyph. Reactive, because the
		 * figure is chosen from it — a plain field would change without repainting.
		 * Storing the URL (ui-avatar's shape) means a changed src recovers with no
		 * reset step to sequence.
		 */
		failedSrc: '',
	};
	kind() {
		return fileKind(this.state.mime, this.state.name);
	}
	iconName() {
		return fileTypeIcon(this.kind());
	}
	/*
	 * A ZERO size means "no size on the record", not "an empty file". An
	 * attachment often carries only a name, and formatFileSize(0) is a perfectly
	 * good "0 B" — which would be a lie here. An actually-empty file is a case
	 * worth showing nothing for too.
	 */
	sizeLabel() {
		const bytes = Number(this.state.size);
		if (!Number.isFinite(bytes) || bytes <= 0) {
			return '';
		}
		return formatFileSize(bytes);
	}
	hideSize() {
		return this.sizeLabel() === '';
	}
	hideDescription() {
		return String(this.state.description ?? '').trim() === '';
	}
	/* A thumbnail only for images, only with a src, and only while it works. */
	showThumb() {
		const src = String(this.state.src ?? '').trim();
		return src !== '' && this.kind() === 'image' && this.state.failedSrc !== src;
	}
	hideThumb() {
		return !this.showThumb();
	}
	hideIcon() {
		return this.showThumb();
	}
	thumbSrc() {
		return this.showThumb() ? String(this.state.src).trim() : '';
	}
	handleThumbError(domEvent) {
		const src = String(domEvent?.currentTarget?.getAttribute('src') ?? '').trim();
		if (src === '' || this.state.failedSrc === src) {
			return;
		}
		this.state.failedSrc = src;
	}
	hideRemove() {
		return this.state.removable !== true;
	}
	removeLabel() {
		return this.state.name ? `Remove ${this.state.name}` : 'Remove attachment';
	}
	handleRemove() {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('attachment:remove', {
			id: this.state.id,
			name: this.state.name,
		});
	}
	/*
	 * A row with an href is a real <a> — middle-click, copy-link and open-in-new
	 * all keep working, which a click handler would silently break. Without one
	 * the row reports the intent instead and the host decides what opening means.
	 */
	handleActivate(domEvent) {
		if (this.state.disabled === true) {
			domEvent.preventDefault();
			return;
		}
		if (String(this.state.href ?? '').trim() !== '') {
			return;
		}
		this.emit('attachment:open', {
			id: this.state.id,
			name: this.state.name,
			href: this.state.href,
		});
	}
	rowTag() {
		return String(this.state.href ?? '').trim() === '' ? 'div' : 'a';
	}
	rowSize() {
		return SIZES.has(this.state.size_) ? this.state.size_ : 'md';
	}
	/*
	 * The row is an <a> when there is an href and a <div> when there is not, so
	 * the two forms are separate templates: a tag name is not a spot, and an
	 * <a> with no href is neither focusable nor useful.
	 *
	 * The body is written out in both rather than shared through a method spot,
	 * because `htmlElement` mounts EXACTLY ONE root and this body is two
	 * siblings (figure + copy) — returning both throws. Wrapping them in a
	 * carrier element just to satisfy that would add a box to the layout for a
	 * code-sharing reason, which is the wrong trade in a flex row.
	 */
	render() {
		if (this.rowTag() === 'a') {
			this.html`
				<a class="attachment" data-kind=${this.kind} data-size=${this.rowSize}
					?data-disabled=${this.state.disabled}
					href=${this.state.href}
					@click=${this.handleActivate}>
					<span class="attachment-figure">
						<img class="attachment-thumb" alt="" loading="lazy"
							?hidden=${this.hideThumb}
							src=${this.thumbSrc}
							@error=${this.handleThumbError}>
						<ui-icon class="attachment-icon" aria-hidden="true"
							?hidden=${this.hideIcon}
							.state.name=${this.iconName}
							.state.size=${'sm'}></ui-icon>
					</span>
					<span class="attachment-copy">
						<span class="attachment-name">${this.state.name}</span>
						<span class="attachment-meta">
							<span class="attachment-size" ?hidden=${this.hideSize}>${this.sizeLabel}</span>
							<span class="attachment-description" ?hidden=${this.hideDescription}>${this.state.description}</span>
						</span>
					</span>
					<ui-close-button class="attachment-remove"
						?hidden=${this.hideRemove}
						.state.label=${this.removeLabel}
						.state.size=${'sm'}
						@close-button:click=${this.handleRemove}></ui-close-button>
				</a>
			`;
			return;
		}
		this.html`
			<div class="attachment" data-kind=${this.kind} data-size=${this.rowSize}
				?data-disabled=${this.state.disabled}
				@click=${this.handleActivate}>
				<span class="attachment-figure">
					<img class="attachment-thumb" alt="" loading="lazy"
						?hidden=${this.hideThumb}
						src=${this.thumbSrc}
						@error=${this.handleThumbError}>
					<ui-icon class="attachment-icon" aria-hidden="true"
						?hidden=${this.hideIcon}
						.state.name=${this.iconName}
						.state.size=${'sm'}></ui-icon>
				</span>
				<span class="attachment-copy">
					<span class="attachment-name">${this.state.name}</span>
					<span class="attachment-meta">
						<span class="attachment-size" ?hidden=${this.hideSize}>${this.sizeLabel}</span>
						<span class="attachment-description" ?hidden=${this.hideDescription}>${this.state.description}</span>
					</span>
				</span>
				<ui-close-button class="attachment-remove"
					?hidden=${this.hideRemove}
					.state.label=${this.removeLabel}
					.state.size=${'sm'}
					@close-button:click=${this.handleRemove}></ui-close-button>
			</div>
		`;
	}
}
customElements.define('ui-attachment', UIAttachment);
