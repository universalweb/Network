/*
	DESCRIPTION: ui-slider — a themeable single OR dual-thumb (range) slider that
	goes beyond the native classless <input type="range">: a second thumb, tick
	marks, a value bubble, and a vertical orientation. The track is the pointer
	surface AND the positioning context; thumbs are real focusable role="slider"
	buttons (full keyboard: arrows / Page / Home / End), positioned by CSS custom
	props the render publishes (--val for single, --lo/--hi for range).
	── WHY DIRECT POINTER CAPTURE (not dragSnap / dragTrack) ─────────────
	  Both gesture engines are DETENT engines — dragSnap is binary (open/closed),
	  dragTrack commits a single ±1 step. A slider needs CONTINUOUS absolute
	  position → value mapping, so the track owns @pointerdown/move/up directly
	  (all framework-bound → auto-cleaned) and uses setPointerCapture so a drag
	  that travels off the track keeps reporting. (The shared `createPointerDrag`
	  the dragTrack header names is a FUTURE extraction, not this.)
	── OWNERSHIP ─────────────────────────────────────────────────────────
	  CONTROLLED on PRIMITIVES — `value` (single) and `low`/`high` (range) are
	  plain numbers with matching reactive accessors (mirrors ui-switch's
	  `checked`). No array in state → no controlled-echo wasted-set. The active
	  thumb is LATCHED at pointerdown (never recomputed mid-drag, or thumbs swap
	  when they cross) and crossing is CLAMPED, not swapped (low ≤ high).
	── EVENTS ───────────────────────────────────────────────────────────
	  slider:input  { value } | { low, high }   live, every tracked move / key
	  slider:change { value } | { low, high }   on release / key commit
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-slider .state.value=${40} .state.min=${0} .state.max=${100} @slider:change=${e => save(e.detail.data.value)}></ui-slider>
	  <ui-slider .state.range=${true} .state.low=${20} .state.high=${70} .state.marks=${true}></ui-slider>
	  <ui-slider .state.orientation=${'vertical'} .state.step=${5} .state.showLabel=${'always'}></ui-slider>
	──────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
// Auto tick marks (marks === true) are skipped past this many detents — a tiny
// step over a huge range would stamp thousands of dots; pass an explicit marks
// array when that many are genuinely wanted.
const MAX_AUTO_MARKS = 51;
export class UISlider extends WebComponent {
	static url = import.meta.url;
	static styles = {
		slider: './slider.css',
	};
	static state = {
		min: 0,
		max: 100,
		step: 1,
		// single-thumb value
		value: 0,
		// range lower / upper thumbs
		low: 0,
		high: 100,
		range: false,
		// 'horizontal' | 'vertical'
		orientation: 'horizontal',
		disabled: false,
		// false | true (auto at each step) | [{ value, label? }]
		marks: false,
		// 'auto' (hover/focus/drag) | 'always' | 'off' — the value bubble
		showLabel: 'auto',
		valueSuffix: '',
		// (value) => string — overrides default formatting
		formatLabel: null,
		// base aria-label
		label: '',
		// Internal reactive render buffers — NOT public API.
		// markItems: rebuilt from the marks config, bound via list().
		markItems: [],
		// dragging: drives the drag-visual data-attr (bubble in 'auto').
		dragging: false,
	};
	// Per-drag scratch (non-reactive). Active thumb is latched here at pointerdown.
	activeThumb = null;
	activePointerId = null;
	dragRect = null;
	// `.value=` / `.low=` / `.high=` reach state through these explicit setters (a bare
	// dotted prop no longer auto-routes), which coerce the incoming value to a Number.
	// Templates use the `.state.value=` channel; these serve DOM-property / attr writes.
	get value() {
		return this.state.value;
	}
	set value(next) {
		this.state.value = Number(next);
	}
	get low() {
		return this.state.low;
	}
	set low(next) {
		this.state.low = Number(next);
	}
	get high() {
		return this.state.high;
	}
	set high(next) {
		this.state.high = Number(next);
	}
	onConnect() {
		this.reconfigure();
		// A grid / mode change re-normalizes the seed and rebuilds marks. PRIMITIVE
		// keys only — never value/low/high (those are written by interaction).
		this.observe([
			'min',
			'max',
			'step',
			'range',
			'marks',
		], this.reconfigure);
	}
	reconfigure() {
		this.normalizeSeed();
		this.rebuildMarks();
	}
	// Snap seeded values onto the current grid + clamp the range pair so the first
	// paint is honest regardless of the order props arrived in.
	normalizeSeed() {
		this.state.value = this.quantize(Number(this.state.value));
		if (this.state.range) {
			let lo = this.quantize(Number(this.state.low));
			let hi = this.quantize(Number(this.state.high));
			if (lo > hi) {
				const swap = lo;
				lo = hi;
				hi = swap;
			}
			this.state.low = lo;
			this.state.high = hi;
		}
	}
	rebuildMarks() {
		const marks = this.state.marks;
		if (Array.isArray(marks)) {
			this.state.markItems = marks;
			return;
		}
		if (marks !== true) {
			this.state.markItems = [];
			return;
		}
		const min = Number(this.state.min);
		const max = Number(this.state.max);
		const step = Number(this.state.step) || 1;
		const count = Math.floor((max - min) / step);
		if (count < 0 || count + 1 > MAX_AUTO_MARKS) {
			this.state.markItems = [];
			return;
		}
		const items = new Array(count + 1);
		for (let index = 0; index <= count; index += 1) {
			items[index] = {
				value: this.clampRaw(min + (index * step)),
			};
		}
		this.state.markItems = items;
	}
	decimals() {
		const step = String(Number(this.state.step) || 1);
		const dot = step.indexOf('.');
		return dot < 0 ? 0 : step.length - dot - 1;
	}
	clampRaw(value) {
		const min = Number(this.state.min);
		const max = Number(this.state.max);
		let next = value;
		if (next < min) {
			next = min;
		}
		if (next > max) {
			next = max;
		}
		// Kill binary float dust from the step arithmetic (0.1 + 0.2 …).
		return Number(next.toFixed(this.decimals()));
	}
	quantize(value) {
		const raw = Number(value);
		if (Number.isNaN(raw)) {
			return Number(this.state.min);
		}
		const min = Number(this.state.min);
		const step = Number(this.state.step) || 1;
		const steps = Math.round((raw - min) / step);
		return this.clampRaw(min + (steps * step));
	}
	toPercent(value) {
		const min = Number(this.state.min);
		const span = Number(this.state.max) - min;
		if (span <= 0) {
			return 0;
		}
		const ratio = (Number(value) - min) / span;
		return Math.min(100, Math.max(0, ratio * 100));
	}
	thumbValue(which) {
		if (which === 'low') {
			return this.state.low;
		}
		if (which === 'high') {
			return this.state.high;
		}
		return this.state.value;
	}
	// Each thumb's effective bounds — in range mode a thumb is fenced by its
	// neighbor (clamp-don't-swap), and aria-valuemin/max mirror these.
	thumbMin(which) {
		if (which === 'high') {
			return this.state.low;
		}
		return Number(this.state.min);
	}
	thumbMax(which) {
		if (which === 'low') {
			return this.state.high;
		}
		return Number(this.state.max);
	}
	formatValue(value) {
		if (typeof this.state.formatLabel === 'function') {
			return this.state.formatLabel(value);
		}
		return `${value}${this.state.valueSuffix}`;
	}
	// Write a thumb, fenced by its neighbor; guarded so an unchanged quantized
	// value doesn't patch-pass for nothing. Emits the live input event on change.
	applyThumb(which, value) {
		let next = value;
		const lo = this.thumbMin(which);
		const hi = this.thumbMax(which);
		if (next < lo) {
			next = lo;
		}
		if (next > hi) {
			next = hi;
		}
		if (this.state[which] === next) {
			return false;
		}
		this.state[which] = next;
		this.emitInput();
		return true;
	}
	nearestThumb(value) {
		const distLow = Math.abs(value - this.state.low);
		const distHigh = Math.abs(value - this.state.high);
		if (distLow < distHigh) {
			return 'low';
		}
		if (distHigh < distLow) {
			return 'high';
		}
		// Tie (incl. stacked thumbs): a press at or below the pair drags low down,
		// otherwise drags high up — the intuitive direction.
		return value <= this.state.low ? 'low' : 'high';
	}
	valueFromPointer(domEvent) {
		const rect = this.dragRect;
		if (!rect) {
			return Number(this.state.min);
		}
		let ratio;
		if (this.state.orientation === 'vertical') {
			// Inverted: the top of a vertical track is the MAX.
			ratio = rect.height > 0 ? 1 - ((domEvent.clientY - rect.top) / rect.height) : 0;
		} else {
			ratio = rect.width > 0 ? (domEvent.clientX - rect.left) / rect.width : 0;
		}
		ratio = Math.min(1, Math.max(0, ratio));
		const min = Number(this.state.min);
		return this.quantize(min + (ratio * (Number(this.state.max) - min)));
	}
	focusActive() {
		const ref = this.activeThumb === 'high' ? this.refs.thumbhigh : this.refs.thumbmain;
		ref?.focus();
	}
	handlePointerDown(domEvent) {
		if (this.state.disabled) {
			return;
		}
		if (domEvent.button !== undefined && domEvent.button !== 0) {
			return;
		}
		const track = this.refs.track;
		if (!track) {
			return;
		}
		domEvent.preventDefault();
		// Cache the rect ONCE — a slider drag doesn't scroll, so re-measuring per
		// move is pure layout thrash.
		this.dragRect = track.getBoundingClientRect();
		const value = this.valueFromPointer(domEvent);
		const which = this.state.range ? this.nearestThumb(value) : 'value';
		this.activeThumb = which;
		this.activePointerId = domEvent.pointerId;
		this.state.dragging = true;
		track.setPointerCapture(domEvent.pointerId);
		// Jump the latched thumb to the press (click-to-position), then focus it.
		this.applyThumb(which, value);
		this.focusActive();
	}
	handlePointerMove(domEvent) {
		if (this.activeThumb === null || domEvent.pointerId !== this.activePointerId) {
			return;
		}
		this.applyThumb(this.activeThumb, this.valueFromPointer(domEvent));
	}
	handlePointerUp(domEvent) {
		if (this.activeThumb === null || domEvent.pointerId !== this.activePointerId) {
			return;
		}
		const track = this.refs.track;
		if (track && track.hasPointerCapture(domEvent.pointerId)) {
			track.releasePointerCapture(domEvent.pointerId);
		}
		this.activeThumb = null;
		this.activePointerId = null;
		this.dragRect = null;
		this.state.dragging = false;
		this.emitChange();
	}
	handleKeydown(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const which = domEvent.currentTarget.dataset.thumb;
		const step = Number(this.state.step) || 1;
		const big = step * 10;
		const current = this.thumbValue(which);
		let next = current;
		switch (domEvent.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = current + step;
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				next = current - step;
				break;
			case 'PageUp':
				next = current + big;
				break;
			case 'PageDown':
				next = current - big;
				break;
			case 'Home':
				next = Number(this.state.min);
				break;
			case 'End':
				next = Number(this.state.max);
				break;
			default:
				return;
		}
		domEvent.preventDefault();
		if (this.applyThumb(which, this.quantize(next))) {
			this.emitChange();
		}
	}
	payload() {
		if (this.state.range) {
			return {
				low: this.state.low,
				high: this.state.high,
			};
		}
		return {
			value: this.state.value,
		};
	}
	emitInput() {
		this.emit('slider:input', this.payload());
	}
	emitChange() {
		this.emit('slider:change', this.payload());
	}
	// Track CSS vars the thumbs + fill read for position. Bare method ref →
	// reactive computed spot; re-runs when value/low/high change.
	trackVars() {
		if (this.state.range) {
			return `--lo:${this.toPercent(this.state.low)}%;--hi:${this.toPercent(this.state.high)}%`;
		}
		return `--val:${this.toPercent(this.state.value)}%`;
	}
	thumbAria(which) {
		const base = this.state.label || 'Value';
		if (!this.state.range) {
			return base;
		}
		return `${base} ${which === 'high' ? 'maximum' : 'minimum'}`;
	}
	// The main thumb is `value` in single mode, the `low` thumb in range mode.
	// These no-arg refs keep its bindings reactive without per-render closures.
	mainKey() {
		return this.state.range ? 'low' : 'value';
	}
	mainAria() {
		return this.thumbAria(this.mainKey());
	}
	mainMin() {
		return this.thumbMin(this.mainKey());
	}
	mainMax() {
		return this.thumbMax(this.mainKey());
	}
	mainNow() {
		return this.thumbValue(this.mainKey());
	}
	mainText() {
		return this.formatValue(this.mainNow());
	}
	highAria() {
		return this.thumbAria('high');
	}
	highMin() {
		return this.thumbMin('high');
	}
	highMax() {
		return this.thumbMax('high');
	}
	highText() {
		return this.formatValue(this.state.high);
	}
	thumbTabindex() {
		return this.state.disabled ? -1 : 0;
	}
	hideHigh() {
		return this.state.range !== true;
	}
	markKey(mark) {
		return mark.value;
	}
	markNode(mark) {
		const pos = this.toPercent(mark.value);
		if (mark.label != null) {
			return html`<span class="sl-mark" style=${`--pos:${pos}%`}><span class="sl-mark-label">${mark.label}</span></span>`;
		}
		return html`<span class="sl-mark" style=${`--pos:${pos}%`}></span>`;
	}
	render() {
		this.html`
			<div class="sl" data-orientation=${this.state.orientation}
				?data-range=${this.state.range} ?data-disabled=${this.state.disabled}
				?data-dragging=${this.state.dragging} data-label=${this.state.showLabel}>
				<div #track class="sl-track" style=${this.trackVars}
					@pointerdown=${this.handlePointerDown}
					@pointermove=${this.handlePointerMove}
					@pointerup=${this.handlePointerUp}
					@pointercancel=${this.handlePointerUp}>
					<span class="sl-rail"></span>
					<span class="sl-fill"></span>
					${this.list('markItems', this.markNode, this.markKey)}
					<button #thumbmain class="sl-thumb" type="button"
						data-thumb=${this.mainKey} role="slider"
						aria-orientation=${this.state.orientation}
						tabindex=${this.thumbTabindex} ?disabled=${this.state.disabled}
						aria-label=${this.mainAria} aria-valuemin=${this.mainMin}
						aria-valuemax=${this.mainMax} aria-valuenow=${this.mainNow}
						aria-valuetext=${this.mainText} @keydown=${this.handleKeydown}>
						<span class="sl-bubble">${this.mainText}</span>
					</button>
					<button #thumbhigh class="sl-thumb sl-thumb-high" type="button"
						data-thumb="high" role="slider" ?hidden=${this.hideHigh}
						aria-orientation=${this.state.orientation}
						tabindex=${this.thumbTabindex} ?disabled=${this.state.disabled}
						aria-label=${this.highAria} aria-valuemin=${this.highMin}
						aria-valuemax=${this.highMax} aria-valuenow=${this.state.high}
						aria-valuetext=${this.highText} @keydown=${this.handleKeydown}>
						<span class="sl-bubble">${this.highText}</span>
					</button>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-slider', UISlider);
