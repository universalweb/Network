import { WebComponent } from '../../core/index.js';
const SPRITE_URL = new URL('./sprite.svg', import.meta.url).href;
export class UIIcon extends WebComponent {
	static url = import.meta.url;
	static styles = {
		icon: './icon.css',
	};
	static state = {
		name: '',
		size: 'md',
		tone: 'default',
		spin: false,
	};
	get hostClass() {
		const parts = ['icon', `size-${this.state.size}`, `tone-${this.state.tone}`];
		if (this.state.spin) {
			parts.push('is-spinning');
		}
		return parts.join(' ');
	}
	iconHref() {
		return `${SPRITE_URL}#${this.state.name}`;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<svg class="${this.hostClass}" aria-hidden="true">
				<use href=${this.iconHref}></use>
			</svg>
		`;
	}
}
customElements.define('ui-icon', UIIcon);
