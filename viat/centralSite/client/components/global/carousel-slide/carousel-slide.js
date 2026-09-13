import { WebComponent } from 'webcomponent';
export class UICarouselSlide extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carouselSlide: './carousel-slide.css',
	};
	static state = {
		id: '',
		eyebrow: '',
		heading: '',
		description: '',
		image: '',
		tone: 'accent',
		active: false,
	};
	onConnect() {
		// Reflect active to the host so the parent's transition CSS can target it
		// (the parent owns slide-vs-fade layout; the host is the positioned item).
		this.observe('active', () => {
			this.toggleAttribute('data-active', Boolean(this.state.active));
		}, {
			immediate: true,
		});
	}
	render() {
		this.html`
			<article class="slide" data-tone=${this.state.tone}>
				<span class="slide-media" ?hidden=${Boolean(this.state.image)} aria-hidden="true"></span>
				<img class="slide-img" ?hidden=${!this.state.image} src=${this.state.image || ''} alt="" loading="lazy">
				<span class="slide-body">
					<span class="slide-eyebrow" ?hidden=${!this.state.eyebrow}>${this.state.eyebrow}</span>
					<span class="slide-heading" ?hidden=${!this.state.heading}>${this.state.heading}</span>
					<span class="slide-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
				</span>
			</article>
		`;
	}
}
customElements.define('ui-carousel-slide', UICarouselSlide);
