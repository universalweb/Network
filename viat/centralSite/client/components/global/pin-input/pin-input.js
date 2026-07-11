/*
	DESCRIPTION: ui-pin-input — a segmented PIN / OTP entry (MUI "OTP", Radix
	"PinInput"): N single-character boxes with auto-advance, backspace-to-previous,
	arrow nav, paste/SMS-autofill distribution, and an optional numeric filter +
	masking. Use case: wallet unlock / one-time codes.
	ARCHITECTURE: boxes are light `list('boxes', this.boxRow)` <input>s in ONE
	shadow root with CONTAINER-DELEGATED events — NOT a child component per box —
	because cross-box FOCUS coordination (advance, backspace-to-prev, paste spread)
	IS the feature. Focus moves via `this.refs.boxes.querySelector('[data-index]')`
	(accepted focusItem pattern). The boxes are UNCONTROLLED: `boxRow` never reads
	`value`, and `boxes` only rebuilds when `length` changes, so typing does not
	destroy focused inputs. Value flows OUT via `syncValue` and IN via an
	echo-guarded `observe('value')`. masked/type/disabled mid-life → imperative
	attr sync (no list rebuild).
	── EVENTS ───────────────────────────────────────────────────────────
	  pin-input:input    { value }   on every change
	  pin-input:complete { value }   when all boxes are filled (autosubmit)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-pin-input .state.length=${6} .state.type=${'numeric'} @pin-input:complete=${e => unlock(e.detail.data.value)}></ui-pin-input>
	  <ui-pin-input .state.value=${this.state.code} .state.masked=${true} @pin-input:input=${e => this.state.code = e.detail.data.value}></ui-pin-input>
	  // reset after a failed attempt: pin.clear()  (or set .value back to '')
	──────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
export class UIPinInput extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pin: './pin-input.css',
	};
	static state = {
		value: '',
		length: 6,
		// 'numeric' (digits only, numeric keyboard) | 'text' (any char).
		type: 'numeric',
		masked: false,
		disabled: false,
		// Emit pin-input:complete when every box is filled.
		autosubmit: true,
		// Structural keys only — never holds digit values (uncontrolled inputs).
		boxes: [],
	};
	onConnect() {
		this.syncBoxes();
		// Async so the list remount lands before reflectValue re-pushes digits.
		this.observeAsync('length', this.handleLengthChange);
		this.observe('masked', this.syncBoxAttrs);
		this.observe('type', this.syncBoxAttrs);
		this.observe('disabled', this.syncBoxAttrs);
	}
	/* Rebuild the keyed box list when length changes (structure only). */
	syncBoxes() {
		const count = Math.max(0, Number(this.state.length) || 0);
		const prev = this.state.boxes;
		if (prev.length === count) {
			return;
		}
		const next = [];
		for (let index = 0; index < count; index += 1) {
			next.push({
				id: index,
			});
		}
		this.state.boxes = next;
	}
	handleLengthChange() {
		this.syncBoxes();
		// After the list remounts empty inputs, re-push any controlled value.
		this.reflectValue(this.state.value);
	}
	/* Mid-session masked/type/disabled — patch live inputs; do not rebuild. */
	syncBoxAttrs() {
		const count = this.state.boxes.length;
		const inputType = this.state.masked ? 'password' : 'text';
		const inputMode = this.state.type === 'numeric' ? 'numeric' : 'text';
		const disabled = this.state.disabled;
		for (let index = 0; index < count; index += 1) {
			const box = this.boxAt(index);
			if (!box) {
				continue;
			}
			box.type = inputType;
			box.inputMode = inputMode;
			box.disabled = disabled;
		}
	}
	boxAt(index) {
		return this.refs.boxes?.querySelector(`input[data-index="${index}"]`);
	}
	readBoxes() {
		const count = this.state.length;
		let out = '';
		for (let index = 0; index < count; index += 1) {
			out += this.boxAt(index)?.value ?? '';
		}
		return out;
	}
	// Read the boxes → publish to state.value (echo-guarded by reflectValue) + notify.
	syncValue() {
		const value = this.readBoxes();
		this.state.value = value;
		this.emit('pin-input:input', {
			value,
		});
		if (value.length === this.state.length && this.state.autosubmit) {
			this.emit('pin-input:complete', {
				value,
			});
		}
	}
	// External / programmatic value → boxes (the state→box direction, for `$value` /
	// `.value=` sets). State observers fire ASYNC, so an echo from our own typing can
	// arrive a tick late carrying a STALE intermediate value; don't let it fight the
	// user — while a box is focused, typing owns the boxes (box→state) and we never
	// write back. EXCEPTION: an empty value is a RESET (the wallet failed-attempt path:
	// validate → wrong → `state.value=''` while the last box still has focus); clearing
	// is always safe, and a typing-origin '' echo no-ops on the readBoxes() check below.
	reflectValue(next) {
		const value = String(next ?? '');
		if (value !== '' && this.refs.boxes?.contains(this.shadowRoot.activeElement)) {
			return;
		}
		if (value === this.readBoxes()) {
			return;
		}
		const count = this.state.length;
		for (let index = 0; index < count; index += 1) {
			const box = this.boxAt(index);
			if (box) {
				box.value = value[index] ?? '';
			}
		}
	}
	// Empty every box and return focus to the first — the discoverable reset for a
	// failed PIN attempt. (`state.value=''` also clears via reflectValue, but without
	// the refocus a consumer almost always wants.)
	clear() {
		const count = this.state.length;
		for (let index = 0; index < count; index += 1) {
			const box = this.boxAt(index);
			if (box) {
				box.value = '';
			}
		}
		this.syncValue();
		this.boxAt(0)?.focus();
	}
	onMount() {
		// Boxes exist now; immediate push of any caller-supplied value into them.
		this.observe('value', this.reflectValue, {
			immediate: true,
		});
		this.syncBoxAttrs();
	}
	handleInput(domEvent) {
		const box = domEvent.target;
		const index = Number(box.dataset.index);
		let chars = box.value;
		if (this.state.type === 'numeric') {
			chars = chars.replace(/\D/g, '');
		}
		if (chars.length > 1) {
			// Several chars landed in one box (SMS one-time-code autofill, or a paste
			// the browser routed as input) → spread across the boxes from here.
			box.value = '';
			this.distribute(chars, index);
			return;
		}
		box.value = chars;
		this.syncValue();
		if (chars && index < this.state.length - 1) {
			this.boxAt(index + 1)?.focus();
		}
	}
	handleKey(domEvent) {
		const box = domEvent.target;
		const index = Number(box.dataset.index);
		const last = this.state.length - 1;
		switch (domEvent.key) {
			case 'Backspace': {
				domEvent.preventDefault();
				if (box.value) {
					// Clear the current box; focus stays so a second Backspace steps back.
					box.value = '';
				} else if (index > 0) {
					const previous = this.boxAt(index - 1);
					if (previous) {
						previous.value = '';
						previous.focus();
					}
				}
				this.syncValue();
				break;
			}
			case 'ArrowLeft':
				domEvent.preventDefault();
				if (index > 0) {
					this.boxAt(index - 1)?.focus();
				}
				break;
			case 'ArrowRight':
				domEvent.preventDefault();
				if (index < last) {
					this.boxAt(index + 1)?.focus();
				}
				break;
			case 'Home':
				domEvent.preventDefault();
				this.boxAt(0)?.focus();
				break;
			case 'End':
				domEvent.preventDefault();
				this.boxAt(last)?.focus();
				break;
			default:
				break;
		}
	}
	handlePaste(domEvent) {
		domEvent.preventDefault();
		const text = domEvent.clipboardData?.getData('text') ?? '';
		this.distribute(text, Number(domEvent.target.dataset.index) || 0);
	}
	// Spread a multi-char string across the boxes from `start`, then focus the box
	// after the last filled one (or the final box). Shared by paste + autofill.
	distribute(text, start) {
		let chars = text;
		if (this.state.type === 'numeric') {
			chars = chars.replace(/\D/g, '');
		}
		const count = this.state.length;
		let index = start;
		for (let charIndex = 0; charIndex < chars.length && index < count; charIndex += 1) {
			const box = this.boxAt(index);
			if (box) {
				box.value = chars[charIndex];
			}
			index += 1;
		}
		this.syncValue();
		this.boxAt(Math.min(index, count - 1))?.focus();
	}
	handleFocusIn(domEvent) {
		// Select the box content so the next keystroke OVERWRITES — without this a
		// maxlength=1 filled box silently swallows the keypress (no input event).
		domEvent.target.select?.();
	}
	/* Light html row — never interpolates value (uncontrolled). Attrs seed once;
	   masked/type/disabled updates use syncBoxAttrs. */
	boxRow(item) {
		const index = item.id;
		const inputType = this.state.masked ? 'password' : 'text';
		const inputMode = this.state.type === 'numeric' ? 'numeric' : 'text';
		const autoComplete = index === 0 ? 'one-time-code' : 'off';
		return html`<input class="pin-box" data-index=${index} type=${inputType} inputmode=${inputMode} maxlength="1" aria-label=${`Digit ${index + 1}`} autocomplete=${autoComplete} ?disabled=${this.state.disabled}>`;
	}
	boxKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<div #boxes class="pin-row" role="group"
				@input=${this.handleInput} @keydown=${this.handleKey}
				@paste=${this.handlePaste} @focusin=${this.handleFocusIn}>
				${this.list('boxes', this.boxRow, this.boxKey)}
			</div>
		`;
	}
}
customElements.define('ui-pin-input', UIPinInput);
