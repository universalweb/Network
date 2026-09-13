/*
	DESCRIPTION: ui-cart-item — one cart line: label, price, qty stepper, remove.
	── EVENTS ───────────────────────────────────────────────────────────
	  cart-item:change { id, value }
	  cart-item:remove { id }
	── USAGE ────────────────────────────────────────────────────────────
	  list('items', UICartItem) with { id, label, price, qty, currency? }
*/
import '../button/button.js';
import '../number-stepper/number-stepper.js';
import '../price/price.js';
import { WebComponent } from 'webcomponent';
export class UICartItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		cartItem: './cart-item.css',
	};
	static state = {
		id: '',
		label: '',
		price: 0,
		qty: 1,
		currency: 'USD',
		max: 99,
	};
	handleQty(domEvent) {
		const value = Number(domEvent.detail?.data?.value);
		if (!Number.isFinite(value)) {
			return;
		}
		this.state.qty = value;
		this.emit('cart-item:change', {
			id: this.state.id,
			value,
		});
	}
	handleRemove() {
		this.emit('cart-item:remove', {
			id: this.state.id,
		});
	}
	render() {
		this.html`
			<div class="cart-item">
				<div class="cart-item-copy">
					<span class="cart-item-label">${this.state.label}</span>
					<ui-price .state.amount=${this.state.price} .state.currency=${this.state.currency} .state.size=${'sm'}></ui-price>
				</div>
				<ui-number-stepper
						.state.value=${this.state.qty}
						.state.min=${1}
						.state.max=${this.state.max}
						.state.label=${'Quantity'}
						@number-stepper:change=${this.handleQty}></ui-number-stepper>
				<ui-button
					.state.label=${'Remove'}
					.state.variant=${'ghost'}
					.state.size=${'sm'}
					@button:click=${this.handleRemove}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-cart-item', UICartItem);
