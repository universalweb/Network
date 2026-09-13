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
	Custom indicator: `icon` / `checkedIcon` / `indeterminateIcon` /
	`negativeIcon` are ui-icon names. Named slots `icon` / `checked` /
	`indeterminate` / `negative` replace the matching face. Unset keys keep the
	default check / dash / x.
	`cycle`: 'binary' (empty↔positive, default) · 'tri' (empty→partial→positive)
	· 'quad' (empty→partial→negative→positive). Quad/tri clicks advance `mark`
	and skip the native toggle. `mark` is empty | partial | negative | positive.
	`layout: 'item'` paints a full-width selectable row; the native label still
	toggles the control when the row is clicked.
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
const MARK_EMPTY = 'empty';
const MARK_PARTIAL = 'partial';
const MARK_NEGATIVE = 'negative';
const MARK_POSITIVE = 'positive';
const CYCLE_BINARY = 'binary';
const CYCLE_TRI = 'tri';
const CYCLE_QUAD = 'quad';
const MARKS_BINARY = [
	MARK_EMPTY,
	MARK_POSITIVE,
];
const MARKS_TRI = [
	MARK_EMPTY,
	MARK_PARTIAL,
	MARK_POSITIVE,
];
const MARKS_QUAD = [
	MARK_EMPTY,
	MARK_PARTIAL,
	MARK_NEGATIVE,
	MARK_POSITIVE,
];
function normalizeCycle(cycle) {
	if (cycle === CYCLE_QUAD || cycle === 4 || cycle === 'four') {
		return CYCLE_QUAD;
	}
	if (cycle === CYCLE_TRI || cycle === 3 || cycle === 'ternary') {
		return CYCLE_TRI;
	}
	return CYCLE_BINARY;
}
function normalizeMark(mark) {
	if (mark === MARK_PARTIAL || mark === 'mixed' || mark === 'indeterminate') {
		return MARK_PARTIAL;
	}
	if (mark === MARK_NEGATIVE || mark === 'no' || mark === 'reject') {
		return MARK_NEGATIVE;
	}
	if (mark === MARK_POSITIVE || mark === 'yes' || mark === 'on' || mark === true) {
		return MARK_POSITIVE;
	}
	return MARK_EMPTY;
}
function sequenceFor(cycle) {
	if (cycle === CYCLE_QUAD) {
		return MARKS_QUAD;
	}
	if (cycle === CYCLE_TRI) {
		return MARKS_TRI;
	}
	return MARKS_BINARY;
}
export class UICheckbox extends WebComponent {
	static url = import.meta.url;
	static styles = {
		checkbox: './checkbox.css',
	};
	static state = {
		checked: false,
		indeterminate: false,
		/*
		 * Visual mark. Binary derives this from checked/indeterminate.
		 * Tri/quad treat it as the source of truth.
		 */
		mark: MARK_EMPTY,
		cycle: CYCLE_BINARY,
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
		negativeIcon: '',
		layout: '',
	};
	beforeRender() {
		this.dataset.layout = this.state.layout || '';
	}
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
	/*
	 * The `?hidden` spot needs something it can CALL. `?hidden=${!this.hasCopy}`
	 * negates the function OBJECT, which is always truthy, so the flag was a
	 * hard-coded false and the copy wrapper rendered even with no label and no
	 * description — an empty span still taking the label row's flex gap.
	 */
	hideCopy() {
		return !this.hasCopy();
	}
	cycleMode() {
		return normalizeCycle(this.state.cycle);
	}
	resolvedMark() {
		if (this.cycleMode() !== CYCLE_BINARY) {
			return normalizeMark(this.state.mark);
		}
		if (this.state.indeterminate) {
			return MARK_PARTIAL;
		}
		if (this.state.checked) {
			return MARK_POSITIVE;
		}
		return MARK_EMPTY;
	}
	indicatorName() {
		const mark = this.resolvedMark();
		if (mark === MARK_PARTIAL) {
			return this.state.indeterminateIcon || '';
		}
		if (mark === MARK_NEGATIVE) {
			return this.state.negativeIcon || '';
		}
		if (mark === MARK_POSITIVE) {
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
		bindSlot(this, this.refs.slot_negative);
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
		this.toggleAttribute('data-slot-negative', slotFilled(this.refs.slot_negative));
	}
	applyMark(mark) {
		const next = normalizeMark(mark);
		const checked = next === MARK_POSITIVE;
		const indeterminate = next === MARK_PARTIAL;
		if (this.state.mark !== next) {
			this.state.mark = next;
		}
		if (this.state.checked !== checked) {
			this.state.checked = checked;
		}
		if (this.state.indeterminate !== indeterminate) {
			this.state.indeterminate = indeterminate;
		}
		this.emit(this.changeEvent(), {
			checked,
			indeterminate,
			mark: next,
			value: this.state.value,
		});
	}
	advanceMark() {
		const sequence = sequenceFor(this.cycleMode());
		const current = this.resolvedMark();
		let index = 0;
		const markCount = sequence.length;
		for (let markIndex = 0; markIndex < markCount; markIndex += 1) {
			if (sequence[markIndex] === current) {
				index = markIndex;
				break;
			}
		}
		const nextIndex = (index + 1) % markCount;
		this.applyMark(sequence[nextIndex]);
	}
	handleInputClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		if (this.cycleMode() === CYCLE_BINARY) {
			return;
		}
		domEvent.preventDefault();
		this.advanceMark();
	}
	handleChange(domEvent) {
		// Absorb the native event: `change` is composed:true, so it leaks out of
		// this shadow and would reach consumers alongside the namespaced re-emit.
		domEvent.stopPropagation();
		if (this.cycleMode() !== CYCLE_BINARY) {
			return;
		}
		// Read the native control directly — it is the source of truth at the
		// moment of the change, independent of binding-update ordering.
		const nativeInput = domEvent.target;
		const next = Boolean(nativeInput.checked);
		this.state.checked = next;
		this.state.indeterminate = false;
		this.state.mark = next ? MARK_POSITIVE : MARK_EMPTY;
		this.emit(this.changeEvent(), {
			checked: next,
			indeterminate: false,
			mark: this.state.mark,
			value: this.state.value,
		});
	}
	render() {
		/* `.indeterminate=` writes the native DOM property. HTML has no such
		   attribute — `?indeterminate=` is a silent no-op. */
		this.html`
			<label class="checkbox" data-size=${this.state.size} data-variant=${this.state.variant}
				data-mark=${this.resolvedMark}
				data-cycle=${this.cycleMode}
				?data-invalid=${this.state.invalid}
				?data-disabled=${this.state.disabled}
				?data-has-copy=${this.hasCopy}>
				<input class="checkbox-input" type="checkbox"
					role=${this.switchRole}
					name=${this.state.name}
					value=${this.state.value}
					.checked=${this.state.checked}
					.indeterminate=${this.state.indeterminate}
					?disabled=${this.state.disabled}
					?required=${this.state.required}
					aria-invalid=${this.state.invalid ? 'true' : 'false'}
					@click=${this.handleInputClick}
					@change=${this.handleChange}>
				<span class="checkbox-face" aria-hidden="true" ?data-named=${this.hasNamedIcon}>
					<span class="checkbox-thumb"></span>
					<span class="checkbox-slot checkbox-slot-icon"><slot #slot_icon name="icon"></slot></span>
					<span class="checkbox-slot checkbox-slot-checked"><slot #slot_checked name="checked"></slot></span>
					<span class="checkbox-slot checkbox-slot-indeterminate"><slot #slot_indeterminate name="indeterminate"></slot></span>
					<span class="checkbox-slot checkbox-slot-negative"><slot #slot_negative name="negative"></slot></span>
					<ui-icon class="checkbox-named" .state.name=${this.indicatorName} .state.size=${'sm'}></ui-icon>
					<svg class="checkbox-mark checkbox-check" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
						<path class="checkbox-check-path" d="M3.2 8.2 6.6 11.6 12.8 4.4"></path>
					</svg>
					<ui-icon class="checkbox-mark checkbox-dash" .state.name=${'minus'} .state.size=${'sm'}></ui-icon>
					<ui-icon class="checkbox-mark checkbox-x" .state.name=${'x'} .state.size=${'sm'}></ui-icon>
				</span>
						<span class="checkbox-copy" ?hidden=${this.hideCopy}>
					<span class="checkbox-label" ?hidden=${!this.state.label}>${this.state.label}</span>
					<span class="checkbox-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
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
