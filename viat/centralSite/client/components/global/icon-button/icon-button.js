import '../button/button.js';
import '../icon/icon.js';
import { classList, WebComponent } from '../../core/index.js';
/*
 * `<ui-icon-button>` — a thin composition: a `<ui-button>` wrapping a `<ui-icon>`.
 * Defaults to variant `icon` / tone `neutral` (dock, toolbar). Split-button and
 * other chrome can pass solid/outline + tone so the caret matches a primary.
 *
 * Configured by flat keys `icon` / `tooltip` / `size` / `tone` / `variant` /
 * `animated`, bound straight onto the children as direct `.state.key=` reads.
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
		tone: 'neutral',
		// Default chrome-light icon control; use solid/outline to match a split.
		variant: 'icon',
		// True disc (FAB-like). Off by default — dock/toolbar stay rounded-square.
		circle: false,
		animated: '',
		disabled: false,
		emitName: 'icon-button:click',
		// Forwarded to the real <button> (native popover invoker + a11y).
		popoverTarget: '',
		expanded: '',
		hasPopup: '',
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
		if (this.state.disabled) {
			return;
		}
		const {
			id, icon, active,
		} = this.state;
		this.emit(this.state.emitName || 'icon-button:click', {
			id,
			icon,
			active,
		});
	}
	render() {
		this.html`
			<ui-button class=${classList('icon-button', this.state.classes, {
				active: this.state.active,
			})}
				.state.variant=${this.state.variant || 'icon'}
				.state.tone=${this.state.tone || 'neutral'}
				.state.size=${this.state.size || 'md'}
				.state.circle=${this.state.circle}
				.state.disabled=${this.state.disabled}
				.state.tooltip=${this.state.tooltip}
				.state.popoverTarget=${this.state.popoverTarget}
				.state.expanded=${this.state.expanded}
				.state.hasPopup=${this.state.hasPopup}
				@button:click=${this.handleActivate}>
				<ui-icon slot="lead" .state.name=${this.state.icon} .state.size=${this.state.size} .state.animated=${this.state.animated}></ui-icon>
			</ui-button>
		`;
	}
}
customElements.define('ui-icon-button', IconButtonBase);
