/*
	DESCRIPTION: ui-cart — shopping cart. Renders items as ui-cart-item via list().
	── EVENTS ───────────────────────────────────────────────────────────
	  cart:change { items }
	  cart:remove { id }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-cart .state.heading=${'Cart'} .state.items=${items} @cart:change=${this.onCart}></ui-cart>
*/
import { isArray, WebComponent } from 'webcomponent';
import { UICartItem } from '../cart-item/cart-item.js';
export class UICart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		cart: './cart.css',
	};
	static state = {
		heading: '',
		items: [],
		currency: 'USD',
	};
	replaceItem(itemId, patch) {
		const items = this.state.items;
		if (!isArray(items)) {
			return;
		}
		const next = [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			if (item?.id === itemId) {
				next.push({
					...item,
					...patch,
				});
			} else {
				next.push(item);
			}
		}
		this.state.items = next;
		this.emit('cart:change', {
			items: next,
		});
	}
	handleItemChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data?.id) {
			return;
		}
		this.replaceItem(data.id, {
			qty: data.value,
		});
	}
	handleItemRemove(domEvent) {
		const itemId = domEvent.detail?.data?.id;
		if (!itemId) {
			return;
		}
		const items = this.state.items;
		if (!isArray(items)) {
			return;
		}
		const next = [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (items[index]?.id !== itemId) {
				next.push(items[index]);
			}
		}
		this.state.items = next;
		this.emit('cart:remove', {
			id: itemId,
		});
		this.emit('cart:change', {
			items: next,
		});
	}
	render() {
		this.html`
			<section class="cart">
				<h2 class="cart-heading" ?hidden=${!this.state.heading}>${this.state.heading}</h2>
				<div class="cart-list" @cart-item:change=${this.handleItemChange} @cart-item:remove=${this.handleItemRemove}>
					${this.list('items', UICartItem)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-cart', UICart);
