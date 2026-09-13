/*
	DESCRIPTION: ui-field-group — stacked field cluster (orientation + gap).
	Same layout contract as ui-stack; defaults to a vertical form group.
	Pair with ui-separator between sections.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-field-group>
	    <ui-field .state.label=${'Name'}><ui-input></ui-input></ui-field>
	    <ui-separator></ui-separator>
	    <ui-field .state.label=${'Email'}><ui-input></ui-input></ui-field>
	  </ui-field-group>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import { UIStack } from '../stack/stack.js';
export class UIFieldGroup extends UIStack {
	static url = import.meta.url;
	static styles = {
		stack: '../stack/stack.css',
	};
	static state = {
		orientation: 'vertical',
		reverse: false,
		direction: '',
		gap: 'md',
		align: 'stretch',
		justify: 'start',
		wrap: false,
		inline: false,
	};
}
customElements.define('ui-field-group', UIFieldGroup);
