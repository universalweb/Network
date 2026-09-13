import { WebComponent } from '../../core/index.js';
import { ANIMATED_ICONS, resolveAnimatedIcon } from './animated.js';
const SPRITE_URL = new URL('./sprite.svg', import.meta.url).href;
export { ANIMATED_ICONS, resolveAnimatedIcon };
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
		/*
		 * Inline path `d` (Lucide 24 viewBox). When set, the sprite `<use>` is
		 * omitted so CSS can interpolate `d` (sprite symbols cannot). Empty =
		 * sprite `<use>` as usual.
		 */
		path: '',
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
	/*
	 * An UNNAMED icon must not emit a sprite reference. `<use href="sprite.svg#">`
	 * is a dangling external reference: the browser resolves it per instance and
	 * the cost is real and reproducible — 50 unnamed icons measured 104-262ms of
	 * main-thread blocking, while 50 NAMED ones measure 0ms. Unnamed icons are
	 * common (any component that passes an icon field only sometimes), and one
	 * page alone — the ui-tracker demo — mounts 78 of them, which was the whole
	 * of its ~600-1200ms navigation stall.
	 *
	 * Empty href resolves to no attribute at all through the attribute spot, so
	 * the `<use>` stays inert. The `<svg>` itself is always rendered: `:host` is
	 * inline-flex and `data-size` carries the box, so keeping it means an unnamed
	 * icon still reserves exactly the space it always did — a pure cost removal
	 * with no layout change.
	 */
	/*
	 * Name resolution: an `anim-*` registry hit supplies the Lucide glyph
	 * and the wallet recipe. Explicit `state.animated` still wins so the
	 * two-field form (`name: 'wallet', animated: 'bob'`) keeps working.
	 * Unregistered names are sprite ids, unchanged.
	 */
	glyphName() {
		return resolveAnimatedIcon(this.state.name)?.glyph ?? this.state.name;
	}
	animateName() {
		if (this.state.animated) {
			return this.state.animated;
		}
		return resolveAnimatedIcon(this.state.name)?.animate ?? '';
	}
	iconHref() {
		if (this.state.path) {
			return '';
		}
		const iconName = this.glyphName();
		return iconName ? `${SPRITE_URL}#${iconName}` : '';
	}
	useHidden() {
		return Boolean(this.state.path);
	}
	pathHidden() {
		return !this.state.path;
	}
	/*
	 * Inline `<path>` lives in this.html so the template parser emits
	 * SVGPathElement. htmlElement() / createElement('path') is HTML
	 * namespace and does not paint inside <svg>.
	 */
	render() {
		this.html`
			<svg
				class="icon"
				viewBox=${this.state.path ? '0 0 24 24' : undefined}
				data-size=${this.state.size}
				data-tone=${this.state.tone}
				data-animate=${this.animateName}
				?data-spin=${this.state.spin}
				aria-hidden="true">
				<path part="stroke" d=${this.state.path || undefined} ?hidden=${this.pathHidden}></path>
				<use href=${this.iconHref} ?hidden=${this.useHidden}></use>
			</svg>
		`;
	}
}
customElements.define('ui-icon', UIIcon);
