/*
	DESCRIPTION: ui-ternary-state — three-way segmented control. Composes
	<ui-tabs variant=pill toggleActive> so the active plate slides (same
	indicator as preview nav). Positive / negative / neutral map to tab ids.
	`value` is null or one of the three values (defaults
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
import '../tabs/tabs.js';
import { isTrue, WebComponent } from 'webcomponent';
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
		tabItems: [],
	};
	onConnect() {
		this.observe([
			'positiveLabel',
			'negativeLabel',
			'neutralLabel',
			'positiveValue',
			'negativeValue',
			'neutralValue',
			'positiveIcon',
			'negativeIcon',
			'neutralIcon',
			'display',
		], this.syncTabItems);
		this.observe([
			'value',
			'disabled',
			'size',
			'colorTarget',
			'positiveColor',
			'negativeColor',
			'neutralColor',
		], this.syncHostChrome);
		this.syncTabItems();
		this.syncHostChrome();
	}
	syncTabItems() {
		const display = this.displayToken();
		this.state.tabItems = [
			{
				id: this.state.positiveValue,
				label: this.positiveDisplay(),
				icon: display === 'label' ? '' : this.positiveIconName(),
				display,
				tone: 'success',
			},
			{
				id: this.state.negativeValue,
				label: this.negativeDisplay(),
				icon: display === 'label' ? '' : this.negativeIconName(),
				display,
				tone: 'danger',
			},
			{
				id: this.state.neutralValue,
				label: this.neutralDisplay(),
				icon: display === 'label' ? '' : this.neutralIconName(),
				display,
				tone: 'warning',
			},
		];
	}
	syncTone() {
		if (this.isPositive()) {
			this.dataset.tone = 'success';
			return;
		}
		if (this.isNegative()) {
			this.dataset.tone = 'danger';
			return;
		}
		if (this.isNeutral()) {
			this.dataset.tone = 'warning';
			return;
		}
		this.dataset.tone = '';
	}
	syncHostChrome() {
		this.syncTone();
		this.toggleAttribute('data-disabled', isTrue(this.state.disabled));
		this.dataset.size = this.sizeToken();
		this.dataset.colorTarget = this.colorTargetToken();
		this.syncCustomColors();
	}
	activeCustomColor() {
		if (this.isPositive()) {
			return this.state.positiveColor || '';
		}
		if (this.isNegative()) {
			return this.state.negativeColor || '';
		}
		if (this.isNeutral()) {
			return this.state.neutralColor || '';
		}
		return '';
	}
	syncCustomColors() {
		const color = this.activeCustomColor();
		if (!color) {
			this.style.removeProperty('--tab-button-selected-color');
			this.style.removeProperty('--tab-indicator-fill');
			return;
		}
		this.style.setProperty('--tab-button-selected-color', color);
		if (this.colorTargetToken() === 'icon') {
			this.style.removeProperty('--tab-indicator-fill');
			return;
		}
		this.style.setProperty('--tab-indicator-fill', `color-mix(in oklch, ${color} 32%, transparent)`);
	}
	activeTabId() {
		return this.state.value || '';
	}
	handleTabsChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		if (data.collapsed === true) {
			this.commitValue(null);
			return;
		}
		this.commitValue(data.id);
	}
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
	isPositive() {
		return this.state.value === this.state.positiveValue;
	}
	isNegative() {
		return this.state.value === this.state.negativeValue;
	}
	isNeutral() {
		return this.state.value === this.state.neutralValue;
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
			<ui-tabs class="ternary-state"
				?inert=${this.state.disabled}
				.state.variant=${'pill'}
				.state.toggleActive=${true}
				.state.contentMode=${'remote'}
				.state.items=${this.state.tabItems}
				.state.activeIndex=${this.activeTabId}
				@tabs:change=${this.handleTabsChange}></ui-tabs>
		`;
	}
}
customElements.define('ui-ternary-state', UITernaryState);
