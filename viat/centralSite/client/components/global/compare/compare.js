/*
	DESCRIPTION: ui-compare — before/after content slider (PrimeVue Compare).
	Two stacked layers; a keyboard-accessible handle clips the after layer.
	Slots `before` / `after` take any content; `beforeSrc` / `afterSrc` paint
	images when the slots are empty. `slideOnHover` tracks pointer without a drag.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-compare .state.beforeSrc=${before} .state.afterSrc=${after}
	    .state.value=${50} @compare:change=${this.onCompare}></ui-compare>
	  <ui-compare .state.orientation=${'vertical'} .state.slideOnHover=${true}>
	    <div slot="before">…</div>
	    <div slot="after">…</div>
	  </ui-compare>
	─────────────────────────────────────────────────────────────────────
*/
import { isNumber } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
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
export class UICompare extends WebComponent {
	static url = import.meta.url;
	static styles = {
		compare: './compare.css',
	};
	static state = {
		value: 50,
		// horizontal | vertical
		orientation: 'horizontal',
		beforeSrc: '',
		afterSrc: '',
		beforeAlt: 'Before',
		afterAlt: 'After',
		label: 'Compare',
		slideOnHover: false,
		disabled: false,
		dragging: false,
	};
	activePointerId = null;
	dragRect = null;
	get value() {
		return this.state.value;
	}
	set value(next) {
		this.state.value = clampPercent(next);
	}
	orientationFlag() {
		return this.state.orientation === 'vertical' ? 'vertical' : 'horizontal';
	}
	positionStyle() {
		return `--cp-pos:${clampPercent(this.state.value)}%`;
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
			return this.state.value;
		}
		if (this.state.orientation === 'vertical') {
			const height = rect.height;
			if (height <= 0) {
				return this.state.value;
			}
			return ((domEvent.clientY - rect.top) / height) * 100;
		}
		const width = rect.width;
		if (width <= 0) {
			return this.state.value;
		}
		return ((domEvent.clientX - rect.left) / width) * 100;
	}
	bindRect() {
		const stage = this.refs.stage;
		this.dragRect = stage ? stage.getBoundingClientRect() : null;
	}
	handlePointerDown(domEvent) {
		if (this.state.disabled || domEvent.button !== 0) {
			return;
		}
		this.bindRect();
		this.activePointerId = domEvent.pointerId;
		this.state.dragging = true;
		domEvent.currentTarget.setPointerCapture?.(domEvent.pointerId);
		this.applyValue(this.valueFromPointer(domEvent), true);
	}
	handlePointerMove(domEvent) {
		if (this.state.disabled) {
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
			value: clampPercent(this.state.value),
		});
	}
	handleKeydown(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const step = domEvent.shiftKey ? 10 : 2;
		const current = clampPercent(this.state.value);
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
	render() {
		this.html`
			<div class="cp"
				#stage
				style=${this.positionStyle}
				data-orientation=${this.orientationFlag}
				?data-disabled=${this.state.disabled}
				?data-dragging=${this.state.dragging}
				?data-hover-slide=${this.state.slideOnHover}
				@pointerdown=${this.handlePointerDown}
				@pointermove=${this.handlePointerMove}
				@pointerup=${this.handlePointerUp}
				@pointercancel=${this.handlePointerUp}>
				<div class="cp-layer cp-before">
					<slot name="before">
						<img class="cp-img" src=${this.state.beforeSrc} alt=${this.state.beforeAlt} ?hidden=${!this.state.beforeSrc}>
					</slot>
				</div>
				<div class="cp-layer cp-after">
					<slot name="after">
						<img class="cp-img" src=${this.state.afterSrc} alt=${this.state.afterAlt} ?hidden=${!this.state.afterSrc}>
					</slot>
				</div>
				<button type="button" class="cp-handle" #handle
					role="slider"
					aria-label=${this.state.label}
					aria-orientation=${this.orientationFlag}
					aria-valuemin=${0}
					aria-valuemax=${100}
					aria-valuenow=${this.state.value}
					?disabled=${this.state.disabled}
					@keydown=${this.handleKeydown}>
					<span class="cp-grip" aria-hidden="true"></span>
				</button>
			</div>
		`;
	}
}
customElements.define('ui-compare', UICompare);
