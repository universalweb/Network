/*
	DESCRIPTION: ui-invert-arrow — dropdown caret. The glyph is ui-icon
	(same as ui-close-button). Lucide chevron-down is inlined on the icon
	so CSS can interpolate `d` — sprite `<use>` cannot. The two segments
	fold through a straight line into the opposite caret. Invert on host
	hover, ancestor `--ui-invert-arrow-turn: 180deg`, or `.state.inverted`.
	Author: Universal Web
	Date: 2026-08-27
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-invert-arrow></ui-invert-arrow>
	  <ui-invert-arrow .state.size=${'sm'} .state.inverted=${this.state.open}></ui-invert-arrow>
	  Parent CSS:
	    .trigger:hover, .trigger[data-open] { --ui-invert-arrow-turn: 180deg; }
*/
import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
const CHEVRON_DOWN = 'M6 9L12 15L18 9';
export class UIInvertArrow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		invertArrow: './invert-arrow.css',
	};
	static state = {
		name: 'chevron-down',
		size: 'sm',
		inverted: false,
	};
	onConnect() {
		this.observe('inverted', this.syncInverted);
		this.syncInverted(this.state.inverted);
	}
	syncInverted(next) {
		this.toggleAttribute('data-inverted', next === true);
	}
	render() {
		this.html`
			<ui-icon
				class="invert-arrow-icon"
				.state.name=${this.state.name || 'chevron-down'}
				.state.size=${this.state.size || 'sm'}
				.state.path=${CHEVRON_DOWN}>
			</ui-icon>
		`;
	}
}
customElements.define('ui-invert-arrow', UIInvertArrow);
