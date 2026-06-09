import { WebComponent, classList } from 'webcomponent';
// `<ui-bar>` — the shared bar primitive: a themed flex container with three
// optional regions (start / center / end) plus a default slot. Pure layout —
// no placement, no fixed-chrome machinery, no behaviour. Every named bar
// (app bar, toolbar, dock, status bar) composes this and adds its own role,
// exactly as `<ui-icon-button>` composes `<ui-button>`.
//
// Theme per composing bar through CSS custom properties: --bar-height,
// --bar-width (vertical), --bar-bg, --bar-border, --bar-padding, --bar-gap.
export class UIBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		bar: './bar.css',
	};
	static state = {
		orientation: 'horizontal',
	};
	render() {
		
		this.html`
			<div class=${classList('bar', () => {
				return `bar-${this.state.orientation || 'horizontal'}`;
			})}>
				<div class="bar-region bar-start"><slot name="start"></slot></div>
				<div class="bar-region bar-center"><slot name="center"></slot></div>
				<div class="bar-region bar-end"><slot name="end"></slot></div>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-bar', UIBar);
