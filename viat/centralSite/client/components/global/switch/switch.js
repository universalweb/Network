/*
	DESCRIPTION: ui-switch — ui-checkbox preset in switch variant. Track + thumb
	paint, role="switch", emits `switch:change`. All state + native checkbox
	behaviour inherited from UICheckbox.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	Public surface is the reactive `checked` accessor + a `switch:change` event
	(two-way `$checked` is native-element-only, so a host binding uses `.checked=`):
	  <ui-switch .state.checked=${this.state.darkMode} .state.label=${'Dark mode'}
	    @switch:change=${this.handleToggle}></ui-switch>
	Sizes: 'sm' | 'md' | 'lg'.
	─────────────────────────────────────────────────────────────────────
*/
import { UICheckbox } from '../checkbox/checkbox.js';
export class UISwitch extends UICheckbox {
	static state = {
		variant: 'switch',
	};
}
customElements.define('ui-switch', UISwitch);
