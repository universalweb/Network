/*
	DESCRIPTION: ui-checkout-summary — subtotal / tax / total + submit.
	Composes ui-price and ui-button. Caller supplies the figures.
	── EVENTS ───────────────────────────────────────────────────────────
	  checkout-summary:submit { subtotal, tax, total }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-checkout-summary .state.subtotal=${96} .state.tax=${8} .state.total=${104}></ui-checkout-summary>
*/
import '../button/button.js';
import '../price/price.js';
import { WebComponent } from 'webcomponent';
export class UICheckoutSummary extends WebComponent {
	static url = import.meta.url;
	static styles = {
		checkoutSummary: './checkout-summary.css',
	};
	static state = {
		heading: 'Summary',
		subtotal: 0,
		tax: 0,
		total: 0,
		currency: 'USD',
		submitLabel: 'Checkout',
		busy: false,
	};
	handleSubmit() {
		this.emit('checkout-summary:submit', {
			subtotal: this.state.subtotal,
			tax: this.state.tax,
			total: this.state.total,
		});
	}
	render() {
		this.html`
			<section class="checkout-summary">
				<h2 class="checkout-summary-heading">${this.state.heading}</h2>
				<dl class="checkout-summary-rows">
					<div class="checkout-summary-row">
						<dt>Subtotal</dt>
						<dd><ui-price .state.amount=${this.state.subtotal} .state.currency=${this.state.currency} .state.size=${'sm'}></ui-price></dd>
					</div>
					<div class="checkout-summary-row">
						<dt>Tax</dt>
						<dd><ui-price .state.amount=${this.state.tax} .state.currency=${this.state.currency} .state.size=${'sm'}></ui-price></dd>
					</div>
					<div class="checkout-summary-row" data-total>
						<dt>Total</dt>
						<dd><ui-price .state.amount=${this.state.total} .state.currency=${this.state.currency} .state.size=${'md'}></ui-price></dd>
					</div>
				</dl>
				<ui-button
					.state.label=${this.state.submitLabel}
					.state.tone=${'primary'}
					.state.fullwidth=${true}
					.state.disabled=${this.state.busy}
					.state.loading=${this.state.busy}
					@button:click=${this.handleSubmit}></ui-button>
			</section>
		`;
	}
}
customElements.define('ui-checkout-summary', UICheckoutSummary);
