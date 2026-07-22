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
		animated: '',
	};
	/*
	 * size / tone / animate are enumerated single-value dimensions, so they ride
	 * as data-* ATTRIBUTES (decorated by attribute selectors in icon.css), not
	 * classes. A `tone-*` CLASS would collide with the framework's uwc.util
	 * `.tone-*` text utilities (which win by layer order) and silently override
	 * the icon's intended tone; a `[data-tone]` attribute cannot be matched by a
	 * class selector, so the collision is structurally impossible. spin is an
	 * additive boolean → a boolean attribute. Bare reads keep every spot reactive
	 * through the patch pass — no imperative class-string getter needed.
	 */
	render() {
		this.html`
			<svg
				class="icon"
				data-size=${this.state.size}
				data-tone=${this.state.tone}
				data-animate=${this.state.animated}
				?data-spin=${this.state.spin}
				aria-hidden="true">
				<use href=${`${SPRITE_URL}#${this.state.name}`}></use>
			</svg>
		`;
	}
}
customElements.define('ui-icon', UIIcon);
