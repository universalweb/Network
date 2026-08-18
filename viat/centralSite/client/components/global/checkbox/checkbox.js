/*
	DESCRIPTION: ui-checkbox — binary toggle engine. One native
	<input type="checkbox">, config flips the paint: square+checkmark (default)
	or track+thumb (`variant: 'switch'`). ui-switch is the thin preset.
	Checked face is solid fill with a contrasting check .
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-checkbox .state.checked=${this.state.agree} .state.label=${'I agree'}
	    .state.description=${'Required to continue'}
	    @checkbox:change=${this.handleAgree}></ui-checkbox>
	  <ui-checkbox .state.invalid=${true} .state.label=${'Accept'}></ui-checkbox>
	  <ui-switch .state.checked=${this.state.darkMode} .state.label=${'Dark mode'}
	    @switch:change=${this.handleToggle}></ui-switch>
	Sizes: 'sm' | 'md' | 'lg'. `indeterminate` is a DOM property on the native
	input — there is no such attribute. Invalid → aria-invalid + error chrome.
	Custom indicator (PrimeVue checkbox#indicator): `icon` / `checkedIcon` /
	`indeterminateIcon` are ui-icon names. Named slots `icon` / `checked` /
	`indeterminate` replace the matching face with slotted SVG (or ui-icon).
	Unset keys keep the default check / dash.
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
export class UICheckbox extends WebComponent {
	static url = import.meta.url;
	static styles = {
		checkbox: './checkbox.css',
	};
	static state = {
		checked: false,
		indeterminate: false,
		disabled: false,
		// Error / invalid chrome (aria-invalid on the native input).
		invalid: false,
		required: false,
		size: 'md',
		label: '',
		// Secondary line under the label (Description).
		description: '',
		// Optional native form association.
		name: '',
		value: 'on',
		variant: 'checkbox',
		// Unchecked / checked / indeterminate ui-icon names. Empty = default mark.
		icon: '',
		checkedIcon: '',
		indeterminateIcon: '',
	};
	// `.checked=` reaches state through this explicit setter (a bare dotted prop no
	// longer auto-routes), which coerces the incoming value to a strict boolean.
	get checked() {
		return this.state.checked;
	}
	set checked(value) {
		this.state.checked = Boolean(value);
	}
	get indeterminate() {
		return this.state.indeterminate;
	}
	set indeterminate(value) {
		this.state.indeterminate = Boolean(value);
	}
	changeEvent() {
		if (this.state.variant === 'switch') {
			return 'switch:change';
		}
		return 'checkbox:change';
	}
	switchRole() {
		if (this.state.variant === 'switch') {
			return 'switch';
		}
		return false;
	}
	hasCopy() {
		return Boolean(this.state.label || this.state.description);
	}
	indicatorName() {
		if (this.state.indeterminate) {
			return this.state.indeterminateIcon || '';
		}
		if (this.state.checked) {
			return this.state.checkedIcon || '';
		}
		return this.state.icon || '';
	}
	hasNamedIcon() {
		return Boolean(this.indicatorName());
	}
	onRender() {
		bindSlot(this, this.refs.slot_icon);
		bindSlot(this, this.refs.slot_checked);
		bindSlot(this, this.refs.slot_indeterminate);
		this.syncSlotFlags();
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'slotchange') {
			this.syncSlotFlags();
		}
	}
	syncSlotFlags() {
		this.toggleAttribute('data-slot-icon', slotFilled(this.refs.slot_icon));
		this.toggleAttribute('data-slot-checked', slotFilled(this.refs.slot_checked));
		this.toggleAttribute('data-slot-indeterminate', slotFilled(this.refs.slot_indeterminate));
	}
	handleChange(domEvent) {
		// Absorb the native event: `change` is composed:true, so it leaks out of
		// this shadow and would reach consumers alongside the namespaced re-emit.
		domEvent.stopPropagation();
		// Read the native control directly — it is the source of truth at the
		// moment of the change, independent of binding-update ordering.
		const nativeInput = domEvent.target;
		const next = Boolean(nativeInput.checked);
		this.state.checked = next;
		this.state.indeterminate = Boolean(nativeInput.indeterminate);
		this.emit(this.changeEvent(), {
			checked: next,
			value: this.state.value,
		});
	}
	render() {
		/* `.indeterminate=` writes the native DOM property. HTML has no such
		   attribute — `?indeterminate=` is a silent no-op. */
		this.html`
			<label class="sw" data-size=${this.state.size} data-variant=${this.state.variant}
				?data-invalid=${this.state.invalid}
				?data-disabled=${this.state.disabled}
				?data-has-copy=${this.hasCopy}>
				<input class="sw-input" type="checkbox"
					role=${this.switchRole}
					name=${this.state.name}
					value=${this.state.value}
					.checked=${this.state.checked}
					.indeterminate=${this.state.indeterminate}
					?disabled=${this.state.disabled}
					?required=${this.state.required}
					aria-invalid=${this.state.invalid ? 'true' : 'false'}
					@change=${this.handleChange}>
				<span class="sw-face" aria-hidden="true" ?data-named=${this.hasNamedIcon}>
					<span class="sw-thumb"></span>
					<span class="sw-slot sw-slot-icon"><slot #slot_icon name="icon"></slot></span>
					<span class="sw-slot sw-slot-checked"><slot #slot_checked name="checked"></slot></span>
					<span class="sw-slot sw-slot-indeterminate"><slot #slot_indeterminate name="indeterminate"></slot></span>
					<ui-icon class="sw-named" .state.name=${this.indicatorName} .state.size=${'sm'}></ui-icon>
					<svg class="sw-mark" viewBox="0 0 16 16" focusable="false">
						<path class="sw-check" d="M3.2 8.2 L6.6 11.4 L12.8 4.6"/>
						<path class="sw-dash" d="M3.4 8 H12.6"/>
					</svg>
				</span>
				<span class="sw-copy" ?hidden=${!this.hasCopy}>
					<span class="sw-label" ?hidden=${!this.state.label}>${this.state.label}</span>
					<span class="sw-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
				</span>
			</label>
		`;
	}
}
const boundSlots = new WeakSet();
function bindSlot(component, slot) {
	if (!slot || boundSlots.has(slot)) {
		return;
	}
	boundSlots.add(slot);
	slot.addEventListener('slotchange', component);
}
function slotFilled(slot) {
	return Boolean(slot?.assignedNodes({
		flatten: true,
	}).length);
}
customElements.define('ui-checkbox', UICheckbox);
