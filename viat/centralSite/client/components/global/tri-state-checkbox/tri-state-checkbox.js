/*
	DESCRIPTION: ui-tri-state-checkbox — three-state box. Cycle is
	null (empty) → false (X) → true (check) → null. Icons swap per state via
	`unsetIcon` / `falseIcon` / `trueIcon` (ui-icon names) or slots
	`unset` / `false` / `true`.
	── EVENTS ───────────────────────────────────────────────────────────
	  tri-state-checkbox:change { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tri-state-checkbox
	    .state.label=${'Review'}
	    .state.value=${this.state.flag}
	    @tri-state-checkbox:change=${this.handleFlag}></ui-tri-state-checkbox>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import {
	isFalse,
	isTrue,
} from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
export class UITriStateCheckbox extends WebComponent {
	static url = import.meta.url;
	static styles = {
		triStateCheckbox: './tri-state-checkbox.css',
	};
	static state = {
		value: null,
		disabled: false,
		invalid: false,
		size: 'md',
		label: '',
		description: '',
		unsetIcon: '',
		falseIcon: 'x',
		trueIcon: 'check',
	};
	sizeToken() {
		if (SIZES.has(this.state.size)) {
			return this.state.size;
		}
		return 'md';
	}
	hasCopy() {
		return Boolean(this.state.label || this.state.description);
	}
	lacksCopy() {
		return !this.hasCopy();
	}
	lacksLabel() {
		return !this.state.label;
	}
	lacksDescription() {
		return !this.state.description;
	}
	faceState() {
		if (isTrue(this.state.value)) {
			return 'true';
		}
		if (isFalse(this.state.value)) {
			return 'false';
		}
		return 'unset';
	}
	iconName() {
		if (isTrue(this.state.value)) {
			return this.state.trueIcon || 'check';
		}
		if (isFalse(this.state.value)) {
			return this.state.falseIcon || 'x';
		}
		return this.state.unsetIcon || '';
	}
	hasNamedIcon() {
		return Boolean(this.iconName());
	}
	ariaChecked() {
		if (isTrue(this.state.value)) {
			return 'true';
		}
		if (isFalse(this.state.value)) {
			return 'false';
		}
		return 'mixed';
	}
	onConnect() {
		this.setAttribute('role', 'checkbox');
		this.syncHost();
		this.observe([
			'value',
			'disabled',
		], this.syncHost);
		this.on('click', this.handleClick);
		this.on('keydown', this.handleKey);
	}
	onRender() {
		bindSlot(this, this.refs.slot_unset);
		bindSlot(this, this.refs.slot_false);
		bindSlot(this, this.refs.slot_true);
		this.syncSlotFlags();
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'slotchange') {
			this.syncSlotFlags();
		}
	}
	syncSlotFlags() {
		this.toggleAttribute('data-slot-unset', slotFilled(this.refs.slot_unset));
		this.toggleAttribute('data-slot-false', slotFilled(this.refs.slot_false));
		this.toggleAttribute('data-slot-true', slotFilled(this.refs.slot_true));
	}
	syncHost() {
		this.setAttribute('aria-checked', this.ariaChecked());
		if (this.state.disabled) {
			this.setAttribute('aria-disabled', 'true');
			this.tabIndex = -1;
			return;
		}
		this.removeAttribute('aria-disabled');
		this.tabIndex = 0;
	}
	handleClick() {
		if (this.state.disabled) {
			return;
		}
		this.commitValue(nextValue(this.state.value));
	}
	handleKey(domEvent) {
		if (this.state.disabled) {
			return;
		}
		if (domEvent.key !== ' ' && domEvent.key !== 'Enter') {
			return;
		}
		domEvent.preventDefault();
		this.commitValue(nextValue(this.state.value));
	}
	commitValue(next) {
		this.state.value = next;
		this.emit('tri-state-checkbox:change', {
			value: next,
		});
	}
	render() {
		this.html`
			<span class="tri" data-size=${this.sizeToken}
				data-face=${this.faceState}
				?data-named=${this.hasNamedIcon}
				?data-invalid=${this.state.invalid}
				?data-disabled=${this.state.disabled}>
				<span class="tri-face" aria-hidden="true">
					<span class="tri-slot tri-slot-unset"><slot #slot_unset name="unset"></slot></span>
					<span class="tri-slot tri-slot-false"><slot #slot_false name="false"></slot></span>
					<span class="tri-slot tri-slot-true"><slot #slot_true name="true"></slot></span>
					<ui-icon class="tri-icon" .state.name=${this.iconName} .state.size=${'sm'}></ui-icon>
				</span>
				<span class="tri-copy" ?hidden=${this.lacksCopy}>
					<span class="tri-label" ?hidden=${this.lacksLabel}>${this.state.label}</span>
					<span class="tri-desc" ?hidden=${this.lacksDescription}>${this.state.description}</span>
				</span>
			</span>
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
function nextValue(current) {
	if (isFalse(current)) {
		return true;
	}
	if (isTrue(current)) {
		return null;
	}
	return false;
}
customElements.define('ui-tri-state-checkbox', UITriStateCheckbox);
