/*
	DESCRIPTION: ui-plus-minus — plus/minus glyph. Two ui-icon minus
	bars share one cell: the second rotates 90deg out of the first
	(plus) and back onto it (minus). Rest 90deg = plus; 0deg = minus.
	Minus on host hover, ancestor `--ui-plus-minus-turn: 0deg`, or
	`.state.minus`.
	Author: Universal Web
	Date: 2026-08-27
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-plus-minus></ui-plus-minus>
	  <ui-plus-minus .state.size=${'sm'} .state.minus=${this.state.open}></ui-plus-minus>
	  Parent CSS:
	    .trigger:hover, .trigger[data-open] { --ui-plus-minus-turn: 0deg; }
*/
import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
export class UIPlusMinus extends WebComponent {
	static url = import.meta.url;
	static styles = {
		plusMinus: './plus-minus.css',
	};
	static state = {
		size: 'sm',
		minus: false,
	};
	onConnect() {
		this.observe('minus', this.syncMinus);
		this.syncMinus(this.state.minus);
	}
	syncMinus(next) {
		this.toggleAttribute('data-minus', next === true);
	}
	render() {
		this.html`
			<span class="plus-minus" aria-hidden="true">
				<ui-icon class="plus-minus-h" .state.name=${'minus'} .state.size=${this.state.size || 'sm'}></ui-icon>
				<ui-icon class="plus-minus-v" .state.name=${'minus'} .state.size=${this.state.size || 'sm'}></ui-icon>
			</span>
		`;
	}
}
customElements.define('ui-plus-minus', UIPlusMinus);
