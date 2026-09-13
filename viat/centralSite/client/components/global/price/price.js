/*
	DESCRIPTION: ui-price — formatted currency amount. Blank-slate primitive;
	the caller supplies `amount` and `currency`. Optional `original` paints a
	strike-through compare price and a computed discount percent.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-price .state.amount=${1299} .state.currency=${'USD'} .state.size=${'md'}></ui-price>
	  <ui-price .state.amount=${2590} .state.original=${4317} .state.currency=${'USD'}></ui-price>
*/
import { WebComponent } from 'webcomponent';
const SIZES = new Set([
	'sm', 'md', 'lg',
]);
export class UIPrice extends WebComponent {
	static url = import.meta.url;
	static styles = {
		price: './price.css',
	};
	static state = {
		amount: 0,
		currency: 'USD',
		size: 'md',
		original: null,
		showPercent: true,
	};
	formatAmount(amount) {
		const value = Number(amount);
		const currency = this.state.currency || 'USD';
		if (!Number.isFinite(value)) {
			return '';
		}
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
		}).format(value);
	}
	get display() {
		return this.formatAmount(this.state.amount);
	}
	originalDisplay() {
		return this.formatAmount(this.state.original);
	}
	originalHidden() {
		const raw = this.state.original;
		if (raw === null || raw === undefined || raw === '') {
			return true;
		}
		const original = Number(raw);
		if (!Number.isFinite(original)) {
			return true;
		}
		return original === Number(this.state.amount);
	}
	percentValue() {
		const original = Number(this.state.original);
		const amount = Number(this.state.amount);
		if (!Number.isFinite(original) || original <= 0 || !Number.isFinite(amount)) {
			return 0;
		}
		return Math.round(((original - amount) / original) * 100);
	}
	percentLabel() {
		const value = this.percentValue();
		if (value <= 0) {
			return '';
		}
		return `-${value}%`;
	}
	percentHidden() {
		if (this.originalHidden()) {
			return true;
		}
		if (this.state.showPercent === false) {
			return true;
		}
		return this.percentValue() <= 0;
	}
	get resolvedSize() {
		return SIZES.has(this.state.size) ? this.state.size : 'md';
	}
	render() {
		this.html`
			<span class="price" data-size=${this.resolvedSize}>
				<s class="price-original" ?hidden=${this.originalHidden}>${this.originalDisplay}</s>
				<span class="price-amount">${this.display}</span>
				<span class="price-percent" data-tone=${'danger'} ?hidden=${this.percentHidden}>${this.percentLabel}</span>
			</span>
		`;
	}
}
customElements.define('ui-price', UIPrice);
