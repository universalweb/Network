/*
	DESCRIPTION: ui-number-stepper — a numeric input flanked by −/+ steppers, with
	min/max/step/precision clamping. DISTINCT from ui-stepper (the wizard progress
	indicator); this is the ±  amount control (MUI "Number Field"). −/+ are native
	buttons with unicode glyphs; `value` drives the field through a `.value=` bind,
	and a change commit reconciles imperatively so an out-of-range entry that clamps
	to the *same* value still snaps the field back.
	── EVENTS ───────────────────────────────────────────────────────────
	  stepper:change { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-number-stepper .state.value=${1} .state.min=${0} .state.max=${10} @number-stepper:change=${e => setQty(e.detail.data.value)}></ui-number-stepper>
	  <ui-number-stepper .state.value=${0.5} .state.step=${0.1} .state.precision=${1} .state.suffix=${'×'}></ui-number-stepper>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
export class UINumberStepper extends WebComponent {
	static url = import.meta.url;
	static styles = {
		numberStepper: './number-stepper.css',
	};
	static state = {
		value: 0,
		min: null,
		max: null,
		step: 1,
		precision: 0,
		suffix: '',
		label: '',
		disabled: false,
	};
	get display() {
		const precision = Number(this.state.precision) || 0;
		const value = Number(this.state.value);
		return (Number.isNaN(value) ? 0 : value).toFixed(precision);
	}
	clamp(value) {
		let next = Number(value);
		if (Number.isNaN(next)) {
			next = 0;
		}
		if (this.state.min != null && next < this.state.min) {
			next = Number(this.state.min);
		}
		if (this.state.max != null && next > this.state.max) {
			next = Number(this.state.max);
		}
		return Number(next.toFixed(Number(this.state.precision) || 0));
	}
	setValue(value) {
		const next = this.clamp(value);
		if (next !== this.state.value) {
			this.state.value = next;
			this.emit('number-stepper:change', {
				value: next,
			});
		} else if (this.refs.input) {
			// No state change (e.g. typed an out-of-range value that clamped back) —
			// re-render won't fire, so snap the field to canonical display by hand.
			this.refs.input.value = this.display;
		}
	}
	stepBy(direction) {
		const step = Number(this.state.step) || 1;
		this.setValue((Number(this.state.value) || 0) + (direction * step));
	}
	handleDec() {
		this.stepBy(-1);
	}
	handleInc() {
		this.stepBy(1);
	}
	handleInput(domEvent) {
		this.setValue(domEvent.target.value);
	}
	render() {
		const value = Number(this.state.value) || 0;
		const atMin = this.state.min != null && value <= Number(this.state.min);
		const atMax = this.state.max != null && value >= Number(this.state.max);
		this.html`
			<div class="number-stepper" ?data-disabled=${this.state.disabled}>
				<button class="ns-btn ns-dec" type="button" aria-label="Decrease"
					?disabled=${this.state.disabled || atMin} @click=${this.handleDec}>−</button>
				<input #input class="ns-input" type="text" inputmode="decimal"
					.value=${this.display}
					?disabled=${this.state.disabled}
					aria-label=${this.state.label || 'Value'}
					@change=${this.handleInput}>
				<span class="ns-suffix" ?hidden=${!this.state.suffix}>${this.state.suffix}</span>
				<button class="ns-btn ns-inc" type="button" aria-label="Increase"
					?disabled=${this.state.disabled || atMax} @click=${this.handleInc}>+</button>
			</div>
		`;
	}
}
customElements.define('ui-number-stepper', UINumberStepper);
