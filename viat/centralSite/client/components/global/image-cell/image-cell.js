/*
	DESCRIPTION: ui-image-cell — one cell of ui-image-list. A cell WITH an href is a
	real <a> (native navigation); a cell without one is a <button> that emits
	image-cell:select { item } so the parent (ui-image-list) can re-emit its public
	image-list:select. The image aspect ratio is a group concern inherited from the
	list via the --il-aspect custom property, never stamped per item.
*/
import { WebComponent } from 'webcomponent';
export class UIImageCell extends WebComponent {
	static url = import.meta.url;
	static styles = {
		imageCell: './image-cell.css',
	};
	static state = {
		src: '',
		alt: '',
		title: '',
		href: '',
	};
	handleActivate() {
		this.emit('image-cell:select', {
			item: {
				src: this.state.src,
				alt: this.state.alt,
				title: this.state.title,
				href: this.state.href,
			},
		});
	}
	renderCaption() {
		return this.state.title ? this.htmlElement`<span class="il-caption">${this.state.title}</span>` : '';
	}
	render() {
		if (this.state.href) {
			this.html`<a class="il-fill" href=${this.state.href}>
				<img class="il-img" src=${this.state.src} alt=${this.state.alt} loading="lazy">
				${this.renderCaption}
			</a>`;
			return;
		}
		this.html`<button type="button" class="il-fill" @click=${this.handleActivate}>
			<img class="il-img" src=${this.state.src} alt=${this.state.alt} loading="lazy">
			${this.renderCaption}
		</button>`;
	}
}
customElements.define('ui-image-cell', UIImageCell);
