/*
	DESCRIPTION: ui-separator — Separator alias of ui-divider.
	Same state: orientation · variant · inset · label · decorative.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-separator></ui-separator>
	  <ui-separator .state.orientation=${'vertical'}></ui-separator>
	─────────────────────────────────────────────────────────────────────
*/
import { UIDivider } from '../divider/divider.js';
export class UISeparator extends UIDivider {
	static url = import.meta.url;
	static styles = {
		divider: '../divider/divider.css',
	};
}
customElements.define('ui-separator', UISeparator);
