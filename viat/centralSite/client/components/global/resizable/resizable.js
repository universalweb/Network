/*
	DESCRIPTION: ui-resizable — two-pane split with a drag handle (Resizable).
	Slots: name="start", name="end". orientation horizontal|vertical.
	primarySize is the start pane fraction 0..1. 0 is a legal min — the start
	pane may collapse; the handle stays a grab target. min/max apply per
	section: minPrimary/maxPrimary for start, minSecondary/maxSecondary for end.
	Drag uses setPointerCapture on the handle (same pattern as ui-slider).
*/
import { isNumber } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
function resolveBound(raw, fallback) {
	if (isNumber(raw) && Number.isFinite(raw)) {
		return raw;
	}
	if (raw === '' || raw === null || raw === undefined) {
		return fallback;
	}
	const numeric = Number(raw);
	if (Number.isFinite(numeric)) {
		return numeric;
	}
	return fallback;
}
export class UIResizable extends WebComponent {
	static url = import.meta.url;
	static styles = {
		resizable: './resizable.css',
	};
	static state = {
		// horizontal = side-by-side; vertical = stacked
		orientation: 'horizontal',
		// Start pane share — 0 is legal (fully collapsed, handle still grabable).
		primarySize: 0.4,
		minPrimary: 0.15,
		maxPrimary: 0.85,
		minSecondary: 0,
		maxSecondary: 1,
		disabled: false,
	};
	dragging = false;
	activePointerId = null;
	dragRect = null;
	primaryStyle() {
		const fraction = this.clampPrimary(this.state.primarySize);
		return `flex:0 0 ${(fraction * 100).toFixed(2)}%`;
	}
	ariaValueNow() {
		return this.clampPrimary(this.state.primarySize);
	}
	ariaOrientation() {
		// Separator axis is cross-axis to the split direction.
		return this.state.orientation === 'vertical' ? 'horizontal' : 'vertical';
	}
	effectiveMin() {
		const minPrimary = resolveBound(this.state.minPrimary, 0.15);
		const maxSecondary = resolveBound(this.state.maxSecondary, 1);
		return Math.max(minPrimary, 1 - maxSecondary);
	}
	effectiveMax() {
		const maxPrimary = resolveBound(this.state.maxPrimary, 0.85);
		const minSecondary = resolveBound(this.state.minSecondary, 0);
		return Math.min(maxPrimary, 1 - minSecondary);
	}
	clampPrimary(value) {
		const min = this.effectiveMin();
		const max = this.effectiveMax();
		let next = Number(value);
		if (!Number.isFinite(next)) {
			next = 0.4;
		}
		const lo = min <= max ? min : max;
		const hi = min <= max ? max : min;
		if (next < lo) {
			return lo;
		}
		if (next > hi) {
			return hi;
		}
		return next;
	}
	isCollapsedStart() {
		return this.clampPrimary(this.state.primarySize) === 0;
	}
	isCollapsedEnd() {
		return this.clampPrimary(this.state.primarySize) === 1;
	}
	handlePointerDown(domEvent) {
		if (this.state.disabled) {
			return;
		}
		if (domEvent.button !== undefined && domEvent.button !== 0) {
			return;
		}
		const handle = domEvent.currentTarget;
		if (!handle) {
			return;
		}
		domEvent.preventDefault();
		this.dragging = true;
		this.activePointerId = domEvent.pointerId;
		// Cache once — drag does not reflow the host box.
		this.dragRect = this.getBoundingClientRect();
		this.toggleAttribute('data-dragging', true);
		handle.setPointerCapture(domEvent.pointerId);
		this.applyPointer(domEvent);
	}
	handlePointerMove(domEvent) {
		if (!this.dragging || domEvent.pointerId !== this.activePointerId) {
			return;
		}
		this.applyPointer(domEvent);
	}
	handlePointerUp(domEvent) {
		if (!this.dragging || domEvent.pointerId !== this.activePointerId) {
			return;
		}
		const handle = domEvent.currentTarget;
		if (handle?.hasPointerCapture?.(domEvent.pointerId)) {
			handle.releasePointerCapture(domEvent.pointerId);
		}
		this.dragging = false;
		this.activePointerId = null;
		this.dragRect = null;
		this.toggleAttribute('data-dragging', false);
	}
	applyPointer(domEvent) {
		const box = this.dragRect ?? this.getBoundingClientRect();
		const isHorizontal = this.state.orientation !== 'vertical';
		let fraction = 0.4;
		if (isHorizontal) {
			fraction = (domEvent.clientX - box.left) / (box.width || 1);
		} else {
			fraction = (domEvent.clientY - box.top) / (box.height || 1);
		}
		this.commitPrimary(fraction);
	}
	handleKeydown(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const key = domEvent.key;
		if (key === 'Home') {
			domEvent.preventDefault();
			this.commitPrimary(this.effectiveMin());
			return;
		}
		if (key === 'End') {
			domEvent.preventDefault();
			this.commitPrimary(this.effectiveMax());
			return;
		}
		const step = domEvent.shiftKey ? 0.1 : 0.02;
		const isHorizontal = this.state.orientation !== 'vertical';
		let delta = 0;
		if (isHorizontal) {
			if (key === 'ArrowLeft') {
				delta = -step;
			} else if (key === 'ArrowRight') {
				delta = step;
			}
		} else if (key === 'ArrowUp') {
			delta = -step;
		} else if (key === 'ArrowDown') {
			delta = step;
		}
		if (!delta) {
			return;
		}
		domEvent.preventDefault();
		this.commitPrimary(this.state.primarySize + delta);
	}
	commitPrimary(value) {
		const next = this.clampPrimary(value);
		if (next === this.state.primarySize) {
			return;
		}
		this.state.primarySize = next;
		this.emit('resizable:change', {
			primarySize: next,
		});
	}
	render() {
		this.html`
			<div class="rz" data-orientation=${this.state.orientation} ?data-disabled=${this.state.disabled}
				?data-collapsed-start=${this.isCollapsedStart}
				?data-collapsed-end=${this.isCollapsedEnd}>
				<div class="rz-pane rz-start" style=${this.primaryStyle}><slot name="start"></slot></div>
				<div class="rz-handle" role="separator" tabindex="0"
					aria-orientation=${this.ariaOrientation}
					aria-valuemin=${this.effectiveMin}
					aria-valuemax=${this.effectiveMax}
					aria-valuenow=${this.ariaValueNow}
					@pointerdown=${this.handlePointerDown}
					@pointermove=${this.handlePointerMove}
					@pointerup=${this.handlePointerUp}
					@pointercancel=${this.handlePointerUp}
					@keydown=${this.handleKeydown}></div>
				<div class="rz-pane rz-end"><slot name="end"></slot></div>
			</div>
		`;
	}
}
customElements.define('ui-resizable', UIResizable);
