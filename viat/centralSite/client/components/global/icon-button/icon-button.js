import '../button/button.js';
import '../icon/icon.js';
import { classList, WebComponent } from '../../core/index.js';
/*
 * `<ui-icon-button>` — a thin composition: a `<ui-button>` in its icon variant
 * wrapping a `<ui-icon>`. The two raw primitives stay independent, first-class
 * framework elements; this only pairs them so every piece of chrome (dock, top
 * bar, toolbar) gets one consistent icon control instead of three near-copies.
 *
 * Configured by the flat keys `icon` / `tooltip` / `size` / `animate`, bound
 * straight onto the children as direct `.prop=` bindings — each bare read is a
 * tracked renderDep, so a flat-key change patches the exact child property.
 * No child-state bundles, no observers, no sync methods.
 */
export class IconButtonBase extends WebComponent {
	static url = import.meta.url;
	static styles = {
		iconButton: './icon-button.css',
	};
	static state = {
		active: false,
		// Reactive class set: callers seed it with a context token (e.g.
		// `new Set(['rail-icon-btn'])`); runtime code adds/removes modifiers.
		classes: new Set(),
		icon: '',
		tooltip: '',
		size: 'md',
		animate: '',
		onClick: 'buttonClick',
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	onMount() {
		// Host-level `data-active` — reflected so parent CSS (dock, toolbar)
		// can paint the active control via `ui-icon-button[data-active]`. A
		// component can't `?attr` its own host in its own template, so this
		// reflection is the one sanctioned imperative host-decoration path.
		this.observe('active', (next) => {
			this.toggleAttribute('data-active', Boolean(next));
		}, {
			immediate: true,
		});
	}
	handleActivate() {
		this.emit(this.state.onClick || 'buttonClick', this.state);
	}
	render() {
		this.html `
			<ui-button class=${classList('icon-button', this.state.classes, {
				active: this.state.active,
			})}
				.variant=${'icon'}
				.tone=${'neutral'}
				.tooltip=${this.state.tooltip}
				@buttonClick=${this.handleActivate}>
				<ui-icon slot="lead" .name=${this.state.icon} .size=${this.state.size} .animate=${this.state.animate}></ui-icon>
			</ui-button>
		`;
	}
}
customElements.define('ui-icon-button', IconButtonBase);
