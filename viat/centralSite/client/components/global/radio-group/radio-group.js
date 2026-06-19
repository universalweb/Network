/*
	DESCRIPTION: ui-radio-group — a managed wrapper over NATIVE radio inputs. The
	whole point vs ui-toggle-group (a segmented JS selector) is that this leans on
	the platform: native single-select grouping + arrow-key roving + a11y come free,
	scoped inside this one shadow root, so a constant `name` is safe.
	Selection is CONTROLLED but render-light: `value` is NOT a render dependency, so
	user clicks don't rebuild the inputs (no focus loss). A programmatic `.value`
	change is reconciled imperatively via `syncChecked`; only an `items` change
	re-renders the list.
	── EVENTS ───────────────────────────────────────────────────────────
	  radio:change { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-radio-group .legend=${'Plan'} .value=${'pro'} .items=${[
	    { value: 'free', label: 'Free' },
	    { value: 'pro',  label: 'Pro', description: 'Everything in Free, plus…' },
	    { value: 'ent',  label: 'Enterprise', disabled: true },
	  ]}></ui-radio-group>
	  el.addEventListener('radio:change', e => setPlan(e.detail.data.value));
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
const esc = (value) => String(value).replace(/[&<>"]/g, (char) => {
	return {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
	}[char];
});
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
		// Imperative reconcile keeps `value` OUT of the render path (no rebuild on
		// click). Async so an items-driven re-render lands its inputs first.
		this.observeAsync('value', this.syncChecked);
		this.observeAsync('items', this.syncChecked);
	}
	syncChecked() {
		const inputs = this.refs.group?.querySelectorAll('input[type="radio"]');
		if (!inputs) {
			return;
		}
		const value = String(this.state.value);
		for (let index = 0; index < inputs.length; index += 1) {
			inputs[index].checked = inputs[index].value === value;
		}
	}
	handleChange(domEvent) {
		const input = domEvent.target;
		if (input && input.type === 'radio') {
			this.emit('radio:change', {
				value: input.value,
			});
		}
	}
	render() {
		this.html `
			<fieldset #group class="radio-group"
				data-orientation=${this.state.orientation}
				?disabled=${this.state.disabled}
				@change=${this.handleChange}>
				^html${this.renderLegend}
				^html${this.renderOptions}
			</fieldset>
		`;
	}
	renderLegend() {
		return this.state.legend
			? `<legend class="radio-legend">${esc(this.state.legend)}</legend>`
			: '';
	}
	renderOptions() {
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		let markup = '';
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			const disabled = item.disabled ? ' disabled' : '';
			const desc = item.description
				? `<span class="radio-desc">${esc(item.description)}</span>`
				: '';
			markup += `<label class="radio"${item.disabled ? ' data-disabled' : ''}>
				<input type="radio" name="opt" value="${esc(item.value)}"${disabled}>
				<span class="radio-control" aria-hidden="true"></span>
				<span class="radio-text">
					<span class="radio-label">${esc(item.label)}</span>
					${desc}
				</span>
			</label>`;
		}
		return markup;
	}
}
customElements.define('ui-radio-group', UIRadioGroup);
