import '../modal/modal.js';
import { WebComponent } from 'webcomponent';
// `<ui-whitebox-modal>` — bright-background modal sized around its media
// payload. Drop in an image or video URL via state, call `.open()`, and the
// modal centers the content on white with a large, obvious close icon at
// the top-right so it's hard to miss. Uses the shared <ui-modal> internals
// so it participates in modal stacking, focus management, and Esc routing
// — including the built-in close / maximize control strip (no bespoke
// close button to duplicate).
const VIDEO_EXTENSIONS = new Set([
	'mp4', 'webm', 'mov', 'm4v', 'ogv',
]);
function isVideoSrc(src) {
	const cleaned = String(src ?? '').split('?')[0].split('#')[0];
	const dot = cleaned.lastIndexOf('.');
	if (dot < 0) {
		return false;
	}
	return VIDEO_EXTENSIONS.has(cleaned.slice(dot + 1).toLowerCase());
}
export class UIWhiteboxModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		whiteboxModal: './whitebox-modal.css',
	};
	static state = {
		src: '',
		alt: '',
		caption: '',
		modal: {
			modal: true,
			open: false,
			showClose: true,
			showMaximize: true,
		},
	};
	open() {
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	mediaNode() {
		const src = this.state.src;
		const video = isVideoSrc(src);
		return video ? this.htmlElement`<video class="wb-media" src="${src}" controls playsinline preload="metadata"></video>` : this.htmlElement`<img class="wb-media" src="${src}" alt="${this.state.alt}" draggable="false">`;
	}
	captionNode() {
		const caption = this.state.caption;
		return caption ? this.htmlElement`<div class="wb-caption">${caption}</div>` : '';
	}
	render() {
		this.html`
			<ui-modal #modal class="whitebox-host" .state=${this.state.modal} style="--ui-modal-max-width: min(96vw, 1280px); --ui-modal-max-height: 96dvh">
				<div class="wb-shell">
					<div class="wb-stage">
						${this.mediaNode}
					</div>
					${this.captionNode}
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('ui-whitebox-modal', UIWhiteboxModal);
