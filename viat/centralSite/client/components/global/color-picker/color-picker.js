/*
	DESCRIPTION: ui-color-picker — an inline HSL color picker (zero-dep, no build).
	A saturation/lightness square (pointer-drag), a hue slider, an ALPHA slider
	(its own dial, checkerboard track), a format DROPDOWN (HEX / RGB / RGBA / HSL /
	HSLA — pick directly, no click-through), and a preset swatch grid all stay in
	sync on one HSL+alpha source of truth. Emits `color-picker:change` with { hex, rgb,
	rgba, hsl, hsla, alpha, format, value }. Wrap it in ui-popover for a
	trigger-driven picker.
	── CUSTOMIZE (defaults) ──────────────────────────────────────────────
	  .color    any notation (#hex / rgb()/ rgba() / hsl() / hsla()) — seeds the
	            starting color once on mount; alpha rides along only if the
	            notation carries it (rgba/hsla), else .alpha wins.
	  .alpha    0..100 starting transparency.   .format  starting field notation.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-color-picker .state.color=${'#6366f1'} .state.alpha=${85} .state.format=${'rgba'}
	    @color-picker:change=${this.handleColor}></ui-color-picker>
	─────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
const HEX6 = /^#?[0-9a-fA-F]{6}$/;
const HEX_PRESET = /^#[0-9a-fA-F]{3,8}$/;
// The value field cycles through these on each format-button press.
const FORMATS = [
	'hex',
	'rgb',
	'rgba',
	'hsl',
	'hsla',
];
function clampAlpha(value) {
	return Math.min(100, Math.max(0, Math.round(value)));
}
function toHexChannel(value) {
	return Math.round(value * 255).toString(16).padStart(2, '0');
}
// HSL → linear RGB in the 0..1 unit range — the shared core for both the hex and
// the 0..255 RGB conversions, so the channel maths lives in exactly one place.
function hslToRgbUnit(hue, saturation, lightness) {
	const sat = saturation / 100;
	const light = lightness / 100;
	const chroma = (1 - Math.abs((2 * light) - 1)) * sat;
	const huePrime = hue / 60;
	const second = chroma * (1 - Math.abs((huePrime % 2) - 1));
	let red = 0;
	let green = 0;
	let blue = 0;
	if (huePrime < 1) {
		red = chroma;
		green = second;
	} else if (huePrime < 2) {
		red = second;
		green = chroma;
	} else if (huePrime < 3) {
		green = chroma;
		blue = second;
	} else if (huePrime < 4) {
		green = second;
		blue = chroma;
	} else if (huePrime < 5) {
		red = second;
		blue = chroma;
	} else {
		red = chroma;
		blue = second;
	}
	const match = light - (chroma / 2);
	return [
		red + match, green + match, blue + match,
	];
}
function hslToHex(hue, saturation, lightness) {
	const [
		red,
		green,
		blue,
	] = hslToRgbUnit(hue, saturation, lightness);
	return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
}
function hslToRgb(hue, saturation, lightness) {
	const unit = hslToRgbUnit(hue, saturation, lightness);
	return [
		Math.round(unit[0] * 255),
		Math.round(unit[1] * 255),
		Math.round(unit[2] * 255),
	];
}
// 0..255 RGB → [hue, saturation%, lightness%]. The shared core for hex parsing
// and the rgb()/rgba() field parser.
function rgbToHsl(red255, green255, blue255) {
	const red = red255 / 255;
	const green = green255 / 255;
	const blue = blue255 / 255;
	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const delta = max - min;
	let hue = 0;
	if (delta !== 0) {
		if (max === red) {
			hue = ((green - blue) / delta) % 6;
		} else if (max === green) {
			hue = ((blue - red) / delta) + 2;
		} else {
			hue = ((red - green) / delta) + 4;
		}
		hue = Math.round(hue * 60);
		if (hue < 0) {
			hue += 360;
		}
	}
	const lightness = (max + min) / 2;
	const saturation = delta === 0 ? 0 : delta / (1 - Math.abs((2 * lightness) - 1));
	return [
		hue, Math.round(saturation * 100), Math.round(lightness * 100),
	];
}
function hexToHsl(hex) {
	const clean = hex.replace('#', '');
	return rgbToHsl(
		parseInt(clean.slice(0, 2), 16),
		parseInt(clean.slice(2, 4), 16),
		parseInt(clean.slice(4, 6), 16)
	);
}
// The saturation/value SQUARE is a standard HSV plane (white→hue left-to-right,
// hue→black top-to-bottom — see the .cp-sat / .cp-light gradients). The picker's
// source of truth is HSL, so the square converts between the two models on the
// SAME hue at its boundary: pointer XY → HSV → HSL going in, HSL → HSV to place the
// cursor going out. (Mapping XY straight onto HSL made the whole top edge read pure
// white — hsl(hue, anything, 100%) is white at every saturation.) Both helpers work
// in the 0..1 unit range; the call sites scale to/from the 0..100 state.
function hsvToHsl(saturation, value) {
	const lightness = value * (1 - (saturation / 2));
	const edge = Math.min(lightness, 1 - lightness);
	const satL = edge === 0 ? 0 : (value - lightness) / edge;
	return [
		satL,
		lightness,
	];
}
function hslToHsv(saturation, lightness) {
	const value = lightness + (saturation * Math.min(lightness, 1 - lightness));
	const satV = value === 0 ? 0 : 2 * (1 - (lightness / value));
	return [
		satV,
		value,
	];
}
// alpha lands as a 0..1 fraction in rgba()/hsla(); normalise it to the 0..100
// the slider speaks. A missing 4th channel means fully opaque.
function alphaFromChannel(channel) {
	if (channel === undefined) {
		return 100;
	}
	return clampAlpha(Number(channel) * 100);
}
// Parse the value field against the ACTIVE format (hex still wins if the text is
// plainly a hex string). Returns null on anything unparseable so a half-typed
// value never corrupts the live color.
function parseColor(raw, format) {
	const text = raw.trim();
	if (format === 'hex' || text.startsWith('#')) {
		if (!HEX6.test(text)) {
			return null;
		}
		const hsl = hexToHsl(text.startsWith('#') ? text : `#${text}`);
		return {
			hue: hsl[0],
			saturation: hsl[1],
			lightness: hsl[2],
			alpha: 100,
		};
	}
	const parts = text.match(/[\d.]+/g);
	if (!parts || parts.length < 3) {
		return null;
	}
	const first = Number(parts[0]);
	const second = Number(parts[1]);
	const third = Number(parts[2]);
	if (Number.isNaN(first) || Number.isNaN(second) || Number.isNaN(third)) {
		return null;
	}
	if (format === 'rgb' || format === 'rgba') {
		const hsl = rgbToHsl(first, second, third);
		return {
			hue: hsl[0],
			saturation: hsl[1],
			lightness: hsl[2],
			alpha: alphaFromChannel(parts[3]),
		};
	}
	return {
		hue: first,
		saturation: second,
		lightness: third,
		alpha: alphaFromChannel(parts[3]),
	};
}
// Pick the notation from the string itself — for the one-shot `.color` default
// (the live value field already knows its own format).
function detectFormat(raw) {
	const text = raw.trim().toLowerCase();
	if (text.startsWith('rgba')) {
		return 'rgba';
	}
	if (text.startsWith('rgb')) {
		return 'rgb';
	}
	if (text.startsWith('hsla')) {
		return 'hsla';
	}
	if (text.startsWith('hsl')) {
		return 'hsl';
	}
	return 'hex';
}
export class UIColorPicker extends WebComponent {
	static url = import.meta.url;
	static styles = {
		colorPicker: './color-picker.css',
	};
	static state = {
		hue: 210,
		saturation: 78,
		lightness: 56,
		alpha: 100,
		format: 'hex',
		// A starting color in any notation — parsed into the HSL+alpha source of
		// truth once, on mount (see applyDefaultColor). Empty = use hue/sat/light.
		color: '',
		presets: [
			'#ef4444',
			'#f59e0b',
			'#eab308',
			'#22c55e',
			'#14b8a6',
			'#06b6d4',
			'#3b82f6',
			'#6366f1',
			'#8b5cf6',
			'#ec4899',
			'#f43f5e',
			'#64748b',
		],
	};
	onMount() {
		this.applyDefaultColor();
		this.reflectValue();
		/*
		 * The format <select> and the active-preset outline both depend on state the
		 * list/each spots don't track (`format`; `hue`/`saturation`/`lightness`), so
		 * they are reconciled imperatively — the same value-out-of-render-path shape
		 * ui-select and ui-radio-group use for controlled native inputs.
		 */
		this.syncFormat();
		this.syncActiveSwatch();
		this.observe('format', this.syncFormat);
		this.observe([
			'hue',
			'saturation',
			'lightness',
		], this.syncActiveSwatch);
	}
	// Seed the HSL+alpha state from a `.color` default in any notation, once. The
	// parsed alpha is adopted ONLY when the notation carried one (rgba/hsla), so a
	// separate `.alpha` default still wins for the opaque notations.
	applyDefaultColor() {
		const raw = this.state.color;
		if (!raw) {
			return;
		}
		const format = detectFormat(raw);
		const parsed = parseColor(raw, format);
		if (!parsed) {
			return;
		}
		const next = {
			hue: parsed.hue,
			saturation: parsed.saturation,
			lightness: parsed.lightness,
		};
		if (format === 'rgba' || format === 'hsla') {
			next.alpha = parsed.alpha;
		}
		this.assignState(next);
	}
	hexValue() {
		return hslToHex(this.state.hue, this.state.saturation, this.state.lightness);
	}
	alphaFraction() {
		return clampAlpha(this.state.alpha) / 100;
	}
	// Opaque base — for the `hsl` payload key and the hue-slider thumb backdrop.
	cssColor() {
		return `hsl(${this.state.hue}, ${this.state.saturation}%, ${this.state.lightness}%)`;
	}
	// Alpha-aware — drives the preview swatch over its checkerboard.
	cssColorAlpha() {
		return `hsla(${this.state.hue}, ${this.state.saturation}%, ${this.state.lightness}%, ${this.alphaFraction()})`;
	}
	// The value field's text in the active format.
	formatValue() {
		const {
			hue, saturation, lightness, format,
		} = this.state;
		if (format === 'hsl') {
			return this.cssColor();
		}
		if (format === 'hsla') {
			return this.cssColorAlpha();
		}
		if (format === 'rgb' || format === 'rgba') {
			const [
				red,
				green,
				blue,
			] = hslToRgb(hue, saturation, lightness);
			if (format === 'rgba') {
				return `rgba(${red}, ${green}, ${blue}, ${this.alphaFraction()})`;
			}
			return `rgb(${red}, ${green}, ${blue})`;
		}
		return this.hexValue();
	}
	hueLayerStyle() {
		return `background-color: hsl(${this.state.hue}, 100%, 50%)`;
	}
	cursorStyle() {
		const [
			satV,
			valV,
		] = hslToHsv(this.state.saturation / 100, this.state.lightness / 100);
		return `left: ${satV * 100}%; top: ${(1 - valV) * 100}%`;
	}
	previewStyle() {
		return `--cp-color: ${this.cssColorAlpha()}`;
	}
	// The alpha track fades transparent → the current opaque color (over the
	// checkerboard baked into the CSS), so the dial reads as a transparency ramp.
	alphaTrackStyle() {
		return `--cp-alpha-color: ${this.cssColor()}`;
	}
	renderSwatch(hex) {
		return html`<button type="button" class="cp-swatch" data-color=${hex} style=${`background:${hex}`} aria-label=${hex}></button>`;
	}
	// One source for the emitted payload. `hex` (6-digit) and `hsl` keep their
	// original meaning for existing consumers; alpha-aware forms are additive.
	colorPayload() {
		const [
			red,
			green,
			blue,
		] = hslToRgb(this.state.hue, this.state.saturation, this.state.lightness);
		const fraction = this.alphaFraction();
		return {
			hex: this.hexValue(),
			rgb: `rgb(${red}, ${green}, ${blue})`,
			rgba: `rgba(${red}, ${green}, ${blue}, ${fraction})`,
			hsl: this.cssColor(),
			hsla: this.cssColorAlpha(),
			alpha: clampAlpha(this.state.alpha),
			format: this.state.format,
			value: this.formatValue(),
		};
	}
	emitChange() {
		this.reflectValue();
		this.emit('color-picker:change', this.colorPayload());
	}
	reflectValue() {
		const input = this.refs.valueinput;
		// Don't clobber the field while the user is typing in it.
		if (input && !input.matches(':focus')) {
			input.value = this.formatValue();
		}
	}
	syncFormat() {
		const control = this.refs.formatselect;
		if (control) {
			control.value = this.state.format;
		}
	}
	/* Prefer list handle rows over querySelectorAll — same key as this.list('presets', …). */
	syncActiveSwatch() {
		const handle = this.list('presets');
		if (!handle) {
			return;
		}
		const hue = this.state.hue;
		const saturation = this.state.saturation;
		const lightness = this.state.lightness;
		const count = handle.size;
		for (let index = 0; index < count; index += 1) {
			const swatch = handle.at(index);
			if (!swatch) {
				continue;
			}
			const hsl = hexToHsl(swatch.dataset.color);
			const isOn = hsl[0] === hue && hsl[1] === saturation && hsl[2] === lightness;
			swatch.toggleAttribute('data-on', isOn);
		}
	}
	updateFromSquare(domEvent) {
		const square = this.refs.square;
		if (!square) {
			return;
		}
		const rect = square.getBoundingClientRect();
		const pointerX = Math.min(rect.width, Math.max(0, domEvent.clientX - rect.left));
		const pointerY = Math.min(rect.height, Math.max(0, domEvent.clientY - rect.top));
		const [
			satL,
			lightL,
		] = hsvToHsl(pointerX / rect.width, 1 - (pointerY / rect.height));
		this.assignState({
			saturation: Math.round(satL * 100),
			lightness: Math.round(lightL * 100),
		});
		this.emitChange();
	}
	handleSquareDown(domEvent) {
		this.dragging = true;
		this.refs.square?.setPointerCapture?.(domEvent.pointerId);
		this.updateFromSquare(domEvent);
	}
	handleSquareMove(domEvent) {
		if (!this.dragging) {
			return;
		}
		this.updateFromSquare(domEvent);
	}
	handleSquareUp(domEvent) {
		this.dragging = false;
		this.refs.square?.releasePointerCapture?.(domEvent.pointerId);
	}
	handleHue(domEvent) {
		this.state.hue = Number(domEvent.target.value);
		this.emitChange();
	}
	handleAlpha(domEvent) {
		this.state.alpha = clampAlpha(Number(domEvent.target.value));
		this.emitChange();
	}
	handleFormatChange(domEvent) {
		this.state.format = domEvent.target.value;
		this.emitChange();
	}
	formatOption(fmt) {
		return html`<option value=${fmt}>${fmt.toUpperCase()}</option>`;
	}
	handleValue(domEvent) {
		const parsed = parseColor(domEvent.target.value, this.state.format);
		if (!parsed) {
			return;
		}
		this.assignState({
			hue: parsed.hue,
			saturation: parsed.saturation,
			lightness: parsed.lightness,
			alpha: parsed.alpha,
		});
		// Emit WITHOUT reflectValue — rewriting the field mid-type fights the user.
		this.emit('color-picker:change', this.colorPayload());
	}
	handlePreset(domEvent) {
		const hex = domEvent.target?.dataset?.color;
		if (!hex) {
			return;
		}
		const hsl = hexToHsl(hex);
		this.assignState({
			hue: hsl[0],
			saturation: hsl[1],
			lightness: hsl[2],
		});
		this.emitChange();
	}
	render() {
		this.html`
			<div class="cp">
				<div
					class="cp-square" #square
					style=${this.hueLayerStyle}
					@pointerdown=${this.handleSquareDown}
					@pointermove=${this.handleSquareMove}
					@pointerup=${this.handleSquareUp}
					@pointercancel=${this.handleSquareUp}
					@lostpointercapture=${this.handleSquareUp}>
					<span class="cp-sat" aria-hidden="true"></span>
					<span class="cp-light" aria-hidden="true"></span>
					<span class="cp-cursor" style=${this.cursorStyle} aria-hidden="true"></span>
				</div>
				<div class="cp-controls">
					<span class="cp-preview" style=${this.previewStyle} aria-hidden="true"></span>
					<div class="cp-dials">
						<input class="cp-hue" type="range" min="0" max="360" value=${this.state.hue} @input=${this.handleHue} aria-label="Hue">
						<input class="cp-alpha" type="range" min="0" max="100" value=${this.state.alpha} style=${this.alphaTrackStyle} @input=${this.handleAlpha} aria-label="Alpha">
					</div>
				</div>
				<div class="cp-value">
					<input class="cp-input" #valueinput type="text" spellcheck="false" @input=${this.handleValue} aria-label="Color value">
					<select class="cp-format" #formatselect @change=${this.handleFormatChange} aria-label="Color format">${this.each(FORMATS, this.formatOption)}</select>
				</div>
				<div class="cp-presets" #presets @click=${this.handlePreset}>${this.list('presets', this.renderSwatch)}</div>
			</div>
		`;
	}
}
customElements.define('ui-color-picker', UIColorPicker);
