/*
	DESCRIPTION: ui-compare — before/after comparison.
	`before` sits under `after`. Wipe clips `after` along the separator;
	`variant:'transparency'` leaves both full-bleed and drives after-opacity
	from a range input (and wheel while the pointer is over that slider).
	`orientation` matches ui-tabs / ui-resizable / ui-slider:
	horizontal = drag left/right (vertical separator); vertical = drag
	up/down (horizontal separator). One pointer engine serves both.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-compare .state.before=${before} .state.after=${after}
	    .state.value=${50} @compare:change=${this.onCompare}></ui-compare>
	  <ui-compare .state.before=${before} .state.after=${after}
	    .state.orientation=${'vertical'}></ui-compare>
	  <ui-compare .state.before=${before} .state.after=${after}
	    .state.variant=${'transparency'}></ui-compare>
	  el.state.before = beforeUrl;
	  el.state.after = afterUrl;
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-21
*/
import '../icon/icon.js';
import { isNumber, WebComponent } from 'webcomponent';
function clampPercent(value) {
	const parsed = Number(value);
	if (!isNumber(parsed) || !Number.isFinite(parsed)) {
		return 50;
	}
	if (parsed < 0) {
		return 0;
	}
	if (parsed > 100) {
		return 100;
	}
	return parsed;
}
/**
 * `<ui-compare>` — before/after media comparison.
 * State `before` / `after` are image URLs (slots of the same name take any
 * content). Bind through `.state.before` / `.state.after` — not the
 * ChildNode `before()` / `after()` methods.
 */
export class UICompare extends WebComponent {
	static url = import.meta.url;
	static styles = {
		compare: './compare.css',
	};
	static state = {
		value: 50,
		// horizontal | vertical — same vocabulary as ui-tabs / ui-resizable
		orientation: 'horizontal',
		// wipe | transparency
		variant: 'wipe',
		before: '',
		after: '',
		get beforeSrc() {
			return this.state.before;
		},
		set beforeSrc(value) {
			this.state.before = value;
		},
		get afterSrc() {
			return this.state.after;
		},
		set afterSrc(value) {
			this.state.after = value;
		},
		beforeAlt: 'Before',
		afterAlt: 'After',
		label: 'Compare',
		slideOnHover: false,
		disabled: false,
		dragging: false,
	};
	activePointerId = null;
	dragRect = null;
	/*
	 * THE ONLY WAY TO READ THE VALUE. applyValue() clamps everything it writes,
	 * but a parent binding `.state.value=${150}` writes state directly and never
	 * reaches it — so every READ has to gate too. That gate used to be
	 * hand-rolled at three call sites and forgotten at four more, which is how
	 * aria-valuenow came to announce 150 against its own aria-valuemax of 100.
	 * One accessor means a new read site cannot forget.
	 */
	currentValue() {
		return clampPercent(this.state.value);
	}
	get value() {
		return this.currentValue();
	}
	set value(next) {
		this.state.value = clampPercent(next);
	}
	orientationFlag() {
		return this.state.orientation === 'vertical' ? 'vertical' : 'horizontal';
	}
	variantFlag() {
		return this.state.variant === 'transparency' ? 'transparency' : 'wipe';
	}
	isTransparency() {
		return this.state.variant === 'transparency';
	}
	isWipe() {
		return this.state.variant !== 'transparency';
	}
	startArrowName() {
		return this.state.orientation === 'vertical' ? 'chevron-up' : 'chevron-left';
	}
	endArrowName() {
		return this.state.orientation === 'vertical' ? 'chevron-down' : 'chevron-right';
	}
	positionStyle() {
		const value = this.currentValue();
		return `--compare-pos:${value}%;--compare-opacity:${value / 100}`;
	}
	applyValue(next, live) {
		const value = clampPercent(next);
		if (this.state.value !== value) {
			this.state.value = value;
		}
		if (live) {
			this.emit('compare:input', {
				value,
			});
			return;
		}
		this.emit('compare:change', {
			value,
		});
	}
	valueFromPointer(domEvent) {
		const rect = this.dragRect;
		if (!rect) {
			return this.currentValue();
		}
		if (this.state.orientation === 'vertical') {
			const height = rect.height;
			if (height <= 0) {
				return this.currentValue();
			}
			return ((domEvent.clientY - rect.top) / height) * 100;
		}
		const width = rect.width;
		if (width <= 0) {
			return this.currentValue();
		}
		return ((domEvent.clientX - rect.left) / width) * 100;
	}
	bindRect() {
		const stage = this.refs.stage;
		this.dragRect = stage ? stage.getBoundingClientRect() : null;
	}
	handlePointerDown(domEvent) {
		if (this.state.disabled || this.isTransparency() || domEvent.button !== 0) {
			return;
		}
		this.bindRect();
		this.activePointerId = domEvent.pointerId;
		this.state.dragging = true;
		domEvent.currentTarget.setPointerCapture?.(domEvent.pointerId);
		this.applyValue(this.valueFromPointer(domEvent), true);
	}
	handlePointerMove(domEvent) {
		if (this.state.disabled || this.isTransparency()) {
			return;
		}
		if (this.state.slideOnHover && this.activePointerId === null) {
			this.bindRect();
			this.applyValue(this.valueFromPointer(domEvent), true);
			return;
		}
		if (this.activePointerId !== domEvent.pointerId) {
			return;
		}
		this.applyValue(this.valueFromPointer(domEvent), true);
	}
	handlePointerUp(domEvent) {
		if (this.activePointerId !== domEvent.pointerId) {
			return;
		}
		this.activePointerId = null;
		this.dragRect = null;
		this.state.dragging = false;
		this.emit('compare:change', {
			value: this.currentValue(),
		});
	}
	handleKeydown(domEvent) {
		if (this.state.disabled || this.isTransparency()) {
			return;
		}
		const step = domEvent.shiftKey ? 10 : 2;
		const current = this.currentValue();
		let next = current;
		switch (domEvent.key) {
			case 'ArrowLeft':
			case 'ArrowUp': {
				next = current - step;
				break;
			}
			case 'ArrowRight':
			case 'ArrowDown': {
				next = current + step;
				break;
			}
			case 'Home': {
				next = 0;
				break;
			}
			case 'End': {
				next = 100;
				break;
			}
			case 'PageDown': {
				next = current - 10;
				break;
			}
			case 'PageUp': {
				next = current + 10;
				break;
			}
			default: {
				return;
			}
		}
		domEvent.preventDefault();
		this.applyValue(next, false);
	}
	handleSliderInput(domEvent) {
		domEvent.stopPropagation();
		this.applyValue(domEvent.currentTarget.value, true);
	}
	handleSliderChange(domEvent) {
		domEvent.stopPropagation();
		this.applyValue(domEvent.currentTarget.value, false);
	}
	handleSliderWheel(domEvent) {
		if (this.state.disabled || this.isWipe()) {
			return;
		}
		const delta = domEvent.deltaY;
		if (!delta) {
			return;
		}
		domEvent.preventDefault();
		const step = domEvent.shiftKey ? 10 : 2;
		const next = this.currentValue() + (delta < 0 ? step : -step);
		this.applyValue(next, true);
	}
	render() {
		this.html`
			<div class="compare"
				data-orientation=${this.orientationFlag}
				data-variant=${this.variantFlag}
				?data-disabled=${this.state.disabled}
				?data-dragging=${this.state.dragging}
				?data-hover-slide=${this.state.slideOnHover}
				style=${this.positionStyle}>
				<div class="compare-stage" #stage
					@pointerdown=${this.handlePointerDown}
					@pointermove=${this.handlePointerMove}
					@pointerup=${this.handlePointerUp}
					@pointercancel=${this.handlePointerUp}>
					<div class="compare-layer compare-before">
						<slot name="before">
							<img class="compare-img" src=${this.state.before} alt=${this.state.beforeAlt} ?hidden=${!this.state.before}>
						</slot>
					</div>
					<div class="compare-layer compare-after">
						<slot name="after">
							<img class="compare-img" src=${this.state.after} alt=${this.state.afterAlt} ?hidden=${!this.state.after}>
						</slot>
					</div>
					<button type="button" class="compare-handle"
						?hidden=${this.isTransparency}
						role="slider"
						aria-label=${this.state.label}
						aria-orientation=${this.orientationFlag}
						aria-valuemin=${0}
						aria-valuemax=${100}
						aria-valuenow=${this.currentValue}
						?disabled=${this.state.disabled}
						@keydown=${this.handleKeydown}>
						<span class="compare-rail" aria-hidden="true"></span>
						<span class="compare-knob" aria-hidden="true">
							<ui-icon .state.name=${this.startArrowName} .state.size=${'xs'}></ui-icon>
							<ui-icon .state.name=${this.endArrowName} .state.size=${'xs'}></ui-icon>
						</span>
					</button>
				</div>
				<label class="compare-slider" ?hidden=${this.isWipe} @wheel.prevent=${this.handleSliderWheel}>
					<input class="compare-range" type="range"
						min="0" max="100" step="1"
						.value=${this.currentValue}
						aria-label=${this.state.label}
						?disabled=${this.state.disabled}
						@input=${this.handleSliderInput}
						@change=${this.handleSliderChange}>
				</label>
			</div>
		`;
	}
}
customElements.define('ui-compare', UICompare);
