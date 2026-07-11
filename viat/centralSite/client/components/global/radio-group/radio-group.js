/*
	DESCRIPTION: ui-radio-group — a managed wrapper over NATIVE radio inputs. The
	whole point vs ui-toggle-group (a segmented JS selector) is that this leans on
	the platform: native single-select grouping + arrow-key roving + a11y come free,
	scoped inside this one shadow root, so a constant `name` is safe.
	Rows are ui-radio-option children (light DOM, so every native input stays in
	THIS shadow root and groups by `name`). Selection is CONTROLLED but render-light:
	`value` is NOT a render dependency, so user clicks don't rebuild the inputs (no
	focus loss). A programmatic `.value` change is reconciled imperatively via
	`syncChecked`; only an `items` change re-renders the list.
	── EVENTS ───────────────────────────────────────────────────────────
	  radio-group:change { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-radio-group .state.legend=${'Plan'} .state.value=${'pro'} .state.items=${[
	    { value: 'free', label: 'Free' },
	    { value: 'pro',  label: 'Pro', description: 'Everything in Free, plus…' },
	    { value: 'ent',  label: 'Enterprise', disabled: true },
	  ]} @radio-group:change=${this.handlePlanChange}></ui-radio-group>   // e.detail.data.value
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
class UIRadioOption extends WebComponent {
	static useShadow = false;
	static state = {
		value: '',
		label: '',
		description: '',
		disabled: false,
	};
	render() {
		this.html`<label class="radio" ?data-disabled=${this.state.disabled}>
			<input type="radio" name="opt" value=${this.state.value} ?disabled=${this.state.disabled}>
			<span class="radio-control" aria-hidden="true"></span>
			<span class="radio-text">
				<span class="radio-label">${this.state.label}</span>
				${this.renderDescription}
			</span>
		</label>`;
	}
	renderDescription() {
		return this.state.description ? this.htmlElement`<span class="radio-desc">${this.state.description}</span>` : '';
	}
}
customElements.define('ui-radio-option', UIRadioOption);
export class UIRadioGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		radioGroup: './radio-group.css',
	};
	static state = {
		items: [],
		value: '',
		legend: '',
		orientation: 'vertical',
		disabled: false,
	};
	onMount() {
		this.syncChecked();
		/*
		 * Imperative reconcile keeps `value` OUT of the render path (no rebuild on
		 * click). Async so an items-driven re-render lands its inputs first.
		 */
		this.observeAsync('value', this.syncChecked);
		this.observeAsync('items', this.syncChecked);
	}
	syncChecked() {
		const inputs = this.refs.group?.querySelectorAll('input[type="radio"]');
		if (!inputs) {
			return;
		}
		const value = String(this.state.value);
		const inputsLength = inputs.length;
		for (let index = 0; index < inputsLength; index += 1) {
			inputs[index].checked = inputs[index].value === value;
		}
	}
	handleChange(domEvent) {
		const input = domEvent.target;
		if (input && input.type === 'radio') {
			this.emit('radio-group:change', {
				value: input.value,
			});
		}
	}
	optionKey(item) {
		return item.value ?? item.label;
	}
	renderLegend() {
		return this.state.legend ? this.htmlElement`<legend class="radio-legend">${this.state.legend}</legend>` : '';
	}
	render() {
		this.html`
			<fieldset #group class="radio-group"
				data-orientation=${this.state.orientation}
				?disabled=${this.state.disabled}
				@change=${this.handleChange}>
				${this.renderLegend}
				${this.list('items', UIRadioOption, this.optionKey)}
			</fieldset>
		`;
	}
}
customElements.define('ui-radio-group', UIRadioGroup);
