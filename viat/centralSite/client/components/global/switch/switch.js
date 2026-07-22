/*
	DESCRIPTION: ui-switch — CSS-first toggle switch built over a real, focusable
	<input type="checkbox" role="switch"> so keyboard (Space) + form semantics come
	free; the track/thumb are drawn purely in CSS off the `:checked` state.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	Public surface is the reactive `checked` accessor + a `switch:change` event
	(two-way `$checked` is native-element-only, so a host binding uses `.checked=`):
	  <ui-switch .state.checked=${this.state.darkMode} .state.label=${'Dark mode'}
	    @switch:change=${this.handleToggle}></ui-switch>
	Sizes: 'sm' | 'md' | 'lg'.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
export class UISwitch extends WebComponent {
	static url = import.meta.url;
	static styles = {
		switchControl: './switch.css',
	};
	static state = {
		checked: false,
		disabled: false,
		size: 'md',
		label: '',
	};
	// `.checked=` reaches state through this explicit setter (a bare dotted prop no
	// longer auto-routes), which coerces the incoming value to a strict boolean.
	get checked() {
		return this.state.checked;
	}
	set checked(value) {
		this.state.checked = Boolean(value);
	}
	handleChange(domEvent) {
		// Read the native control directly — it is the source of truth at the
		// moment of the change, independent of binding-update ordering.
		const next = Boolean(domEvent.target.checked);
		this.state.checked = next;
		this.emit('switch:change', {
			checked: next,
		});
	}
	render() {
		this.html`
			<label class="sw" data-size=${this.state.size}>
				<input class="sw-input" type="checkbox" role="switch"
					.checked=${this.state.checked}
					?disabled=${this.state.disabled}
					@change=${this.handleChange}>
				<span class="sw-track"><span class="sw-thumb"></span></span>
				<span class="sw-label" ?hidden=${!this.state.label}>${this.state.label}</span>
			</label>
		`;
	}
}
customElements.define('ui-switch', UISwitch);
