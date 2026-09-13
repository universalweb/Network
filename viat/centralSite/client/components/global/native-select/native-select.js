/*
	DESCRIPTION: ui-native-select — Native Select alias of ui-select.
	Wraps a real <select> with UWC state (value, items, disabled, size).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-native-select
	    .state.value=${'usd'}
	    .state.items=${[{ value: 'usd', label: 'USD' }]}
	    @select:change=${this.onPick}></ui-native-select>
	─────────────────────────────────────────────────────────────────────
*/
import { UISelect } from '../select/select.js';
export class UINativeSelect extends UISelect {
	static url = import.meta.url;
	static styles = {
		select: '../select/select.css',
	};
}
customElements.define('ui-native-select', UINativeSelect);
