import '../button/button.js';
import '../icon/icon.js';
import { WebComponent, classList } from '../../core/index.js';
// `<ui-icon-button>` — a thin composition: a `<ui-button>` in its icon variant
// wrapping a `<ui-icon>`. The two raw primitives stay independent, first-class
// framework elements; this only pairs them so every piece of chrome (dock, top
// bar, toolbar) gets one consistent icon control instead of three near-copies.
//
// Configured by the flat keys `icon` / `tooltip` / `size` / `animate`. The two
// child-state bundles `buttonState` / `iconState` are declared reactive keys on
// the one state tree — `onConnect` composes them from the flat keys and keeps
// them in step. render() binds them straight, `.state=${this.state.X}`; no
// per-render method ever fabricates a child's state object (Doctrine 7).
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
		onClick: '',
		// Child-state bundles — composed in onConnect, bound bare in render().
		buttonState: {
			variant: 'icon',
			tone: 'neutral',
			title: '',
		},
		iconState: {
			name: '',
			size: 'md',
			animate: '',
		},
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	onConnect() {
		// Compose the child bundles from the flat config before the first
		// render, then keep them in step — list-driven instances may receive
		// their `icon` / `tooltip` after connect, so the watches are required,
		// not just future-proofing.
		this.syncButtonState();
		this.syncIconState();
		this.observe('tooltip', () => {
			this.syncButtonState();
		});
		this.observe('icon', () => {
			this.syncIconState();
		});
		this.observe('size', () => {
			this.syncIconState();
		});
		this.observe('animate', () => {
			this.syncIconState();
		});
	}
	syncButtonState() {
		this.state.buttonState = {
			variant: 'icon',
			tone: 'neutral',
			title: this.state.tooltip,
		};
	}
	syncIconState() {
		this.state.iconState = {
			name: this.state.icon,
			size: this.state.size,
			animate: this.state.animate,
		};
	}
	onMount() {
		this.classList.toggle('active', Boolean(this.state.active));
		this.observe('active', (next) => {
			this.classList.toggle('active', Boolean(next));
		});
	}
	handleActivate() {
		this.emit(this.state.onClick || 'buttonClick', {});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<ui-button class=${classList('icon-button', this.state.classes, () => {
				return this.state.active && 'active';
			})}
				.state=${this.state.buttonState}
				@buttonClick=${this.handleActivate}>
				<ui-icon slot="lead" .state=${this.state.iconState}></ui-icon>
			</ui-button>
		`;
	}
}
customElements.define('ui-icon-button', IconButtonBase);
