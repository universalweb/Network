/*
	DESCRIPTION: ui-image — single image with radius/shadow config.
	Optional click opens a lightbox (composes ui-whitebox-modal).
	── EVENTS ───────────────────────────────────────────────────────────
	  image:click { src, alt }
	  image:open { src }
	  image:close { src }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-image .state.src=${url} .state.alt=${'Hero'} .state.radius=${'lg'}
	    .state.shadow=${'md'} .state.preview=${true}></ui-image>
	──────────────────────────────────────────────────────────────────────
*/
import '../whitebox-modal/whitebox-modal.js';
import { WebComponent } from 'webcomponent';
const RADIUS = new Set([
	'none', 'sm', 'md', 'lg', 'full',
]);
const SHADOW = new Set([
	'none', 'sm', 'md', 'lg',
]);
function tokenIn(value, allowed, fallback) {
	const token = String(value || fallback);
	return allowed.has(token) ? token : fallback;
}
export class UIImage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		image: './image.css',
	};
	static state = {
		src: '',
		alt: '',
		caption: '',
		radius: 'md',
		shadow: 'none',
		preview: false,
		fit: 'cover',
	};
	radiusToken() {
		return tokenIn(this.state.radius, RADIUS, 'md');
	}
	shadowToken() {
		return tokenIn(this.state.shadow, SHADOW, 'none');
	}
	captionHidden() {
		return !this.state.caption;
	}
	handleActivate() {
		this.emit('image:click', {
			src: this.state.src,
			alt: this.state.alt,
		});
		if (this.state.preview !== true) {
			return;
		}
		this.refs.box?.open();
		this.emit('image:open', {
			src: this.state.src,
		});
	}
	handleLightboxClose() {
		this.emit('image:close', {
			src: this.state.src,
		});
	}
	mediaNode() {
		if (this.state.preview === true) {
			return this.htmlElement`
				<button type="button" class="im-hit" @click=${this.handleActivate}>
					<img class="im-img" src=${this.state.src} alt=${this.state.alt} loading="lazy">
				</button>
			`;
		}
		return this.htmlElement`<img class="im-img" src=${this.state.src} alt=${this.state.alt} loading="lazy">`;
	}
	render() {
		this.html`
			<figure class="im" data-radius=${this.radiusToken} data-shadow=${this.shadowToken} data-fit=${this.state.fit}>
				${this.mediaNode}
				<figcaption class="im-cap" ?hidden=${this.captionHidden}>${this.state.caption}</figcaption>
			</figure>
			<ui-whitebox-modal #box
				.state.src=${this.state.src}
				.state.alt=${this.state.alt}
				.state.caption=${this.state.caption}
				@modal:close=${this.handleLightboxClose}></ui-whitebox-modal>
		`;
	}
}
customElements.define('ui-image', UIImage);
