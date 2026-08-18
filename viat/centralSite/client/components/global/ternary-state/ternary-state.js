/*
	DESCRIPTION: ui-ternary-state — three-way segmented control. Positive (green),
	negative (red), and neutral (yellow). Labels, values, and colors are caller
	config. `value` is null or one of the three values (defaults
	'positive' | 'negative' | 'neutral'; override via *Value keys).
	── EVENTS ───────────────────────────────────────────────────────────
	  ternary-state:change { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-ternary-state
	    .state.display=${'icon-label'}
	    .state.colorTarget=${'icon'}
	    .state.positiveLabel=${'Pass'}
	    .state.negativeLabel=${'Fail'}
	    .state.neutralLabel=${'Flag'}
	    .state.value=${this.state.review}
	    @ternary-state:change=${this.handleReview}></ui-ternary-state>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
const DISPLAYS = new Set([
	'label',
	'icon',
	'icon-label',
]);
const COLOR_TARGETS = new Set([
	'fill',
	'icon',
]);
const KEY_POSITIVE = 'positive';
const KEY_NEGATIVE = 'negative';
const KEY_NEUTRAL = 'neutral';
export class UITernaryState extends WebComponent {
	static url = import.meta.url;
	static styles = {
		ternaryState: './ternary-state.css',
	};
	static state = {
		value: null,
		disabled: false,
		size: 'md',
		positiveLabel: '',
		negativeLabel: '',
		neutralLabel: '',
		positiveValue: KEY_POSITIVE,
		negativeValue: KEY_NEGATIVE,
		neutralValue: KEY_NEUTRAL,
		positiveColor: '',
		negativeColor: '',
		neutralColor: '',
		display: 'label',
		colorTarget: 'fill',
		positiveIcon: '',
		negativeIcon: '',
		neutralIcon: '',
	};
	sizeToken() {
		if (SIZES.has(this.state.size)) {
			return this.state.size;
		}
		return 'md';
	}
	displayToken() {
		if (DISPLAYS.has(this.state.display)) {
			return this.state.display;
		}
		return 'label';
	}
	colorTargetToken() {
		if (COLOR_TARGETS.has(this.state.colorTarget)) {
			return this.state.colorTarget;
		}
		return 'fill';
	}
	hidesIcon() {
		return this.displayToken() === 'label';
	}
	hidesLabel() {
		return this.displayToken() === 'icon';
	}
	positiveIconName() {
		return this.state.positiveIcon || 'check';
	}
	negativeIconName() {
		return this.state.negativeIcon || 'x';
	}
	neutralIconName() {
		return this.state.neutralIcon || 'minus';
	}
	positiveDisplay() {
		return this.state.positiveLabel || this.state.positiveValue;
	}
	negativeDisplay() {
		return this.state.negativeLabel || this.state.negativeValue;
	}
	neutralDisplay() {
		return this.state.neutralLabel || this.state.neutralValue;
	}
	positiveStyle() {
		return colorStyle(this.state.positiveColor);
	}
	negativeStyle() {
		return colorStyle(this.state.negativeColor);
	}
	neutralStyle() {
		return colorStyle(this.state.neutralColor);
	}
	isPositive() {
		return this.state.value === this.state.positiveValue;
	}
	isNegative() {
		return this.state.value === this.state.negativeValue;
	}
	isNeutral() {
		return this.state.value === this.state.neutralValue;
	}
	positivePressed() {
		return this.isPositive() ? 'true' : 'false';
	}
	negativePressed() {
		return this.isNegative() ? 'true' : 'false';
	}
	neutralPressed() {
		return this.isNeutral() ? 'true' : 'false';
	}
	handleClick(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const key = domEvent.currentTarget?.dataset?.key;
		const next = this.valueFor(key);
		if (next === undefined) {
			return;
		}
		if (this.state.value === next) {
			this.state.value = null;
		} else {
			this.state.value = next;
		}
		this.emit('ternary-state:change', {
			value: this.state.value,
		});
	}
	handleKey(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const order = [
			this.state.positiveValue,
			this.state.negativeValue,
			this.state.neutralValue,
		];
		const current = this.state.value;
		let index = order.indexOf(current);
		if (domEvent.key === 'ArrowRight' || domEvent.key === 'ArrowDown') {
			domEvent.preventDefault();
			index = index < 0 ? 0 : (index + 1) % 3;
			this.commitValue(order[index]);
			return;
		}
		if (domEvent.key === 'ArrowLeft' || domEvent.key === 'ArrowUp') {
			domEvent.preventDefault();
			index = index < 0 ? 2 : (index + 2) % 3;
			this.commitValue(order[index]);
			return;
		}
		if (domEvent.key === 'Home') {
			domEvent.preventDefault();
			this.commitValue(order[0]);
			return;
		}
		if (domEvent.key === 'End') {
			domEvent.preventDefault();
			this.commitValue(order[2]);
			return;
		}
		if (domEvent.key === 'Escape' || domEvent.key === 'Backspace') {
			domEvent.preventDefault();
			this.commitValue(null);
		}
	}
	valueFor(key) {
		switch (key) {
			case KEY_POSITIVE: {
				return this.state.positiveValue;
			}
			case KEY_NEGATIVE: {
				return this.state.negativeValue;
			}
			case KEY_NEUTRAL: {
				return this.state.neutralValue;
			}
			default: {
				return undefined;
			}
		}
	}
	commitValue(next) {
		if (this.state.value === next) {
			return;
		}
		this.state.value = next;
		this.emit('ternary-state:change', {
			value: next,
		});
	}
	render() {
		this.html`
			<div class="ts" role="group" data-size=${this.sizeToken}
				data-display=${this.displayToken}
				data-color-target=${this.colorTargetToken}
				?data-disabled=${this.state.disabled}
				@keydown=${this.handleKey}>
				<button type="button" class="ts-btn" data-key=${KEY_POSITIVE} data-tone=${'success'}
					style=${this.positiveStyle}
					aria-pressed=${this.positivePressed}
					?disabled=${this.state.disabled}
					@click=${this.handleClick}>
					<ui-icon class="ts-icon" .state.name=${this.positiveIconName} .state.size=${'sm'} ?hidden=${this.hidesIcon}></ui-icon>
					<span class="ts-label" ?hidden=${this.hidesLabel}>${this.positiveDisplay}</span>
				</button>
				<button type="button" class="ts-btn" data-key=${KEY_NEGATIVE} data-tone=${'danger'}
					style=${this.negativeStyle}
					aria-pressed=${this.negativePressed}
					?disabled=${this.state.disabled}
					@click=${this.handleClick}>
					<ui-icon class="ts-icon" .state.name=${this.negativeIconName} .state.size=${'sm'} ?hidden=${this.hidesIcon}></ui-icon>
					<span class="ts-label" ?hidden=${this.hidesLabel}>${this.negativeDisplay}</span>
				</button>
				<button type="button" class="ts-btn" data-key=${KEY_NEUTRAL} data-tone=${'warning'}
					style=${this.neutralStyle}
					aria-pressed=${this.neutralPressed}
					?disabled=${this.state.disabled}
					@click=${this.handleClick}>
					<ui-icon class="ts-icon" .state.name=${this.neutralIconName} .state.size=${'sm'} ?hidden=${this.hidesIcon}></ui-icon>
					<span class="ts-label" ?hidden=${this.hidesLabel}>${this.neutralDisplay}</span>
				</button>
			</div>
		`;
	}
}
function colorStyle(color) {
	if (!color) {
		return '';
	}
	return `--ts-fill:${color}`;
}
customElements.define('ui-ternary-state', UITernaryState);
