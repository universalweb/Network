/*
	DESCRIPTION: ui-message-scroller — stick-to-bottom scroll host for
	ui-message rows (or any list of bubbles). Pins to the latest item unless
	the user scrolls up.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-message-scroller .state.items=${this.state.thread}></ui-message-scroller>
	─────────────────────────────────────────────────────────────────────
*/
import { isTrue } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { UIMessage } from '../message/message.js';
const PIN_THRESHOLD = 48;
export class UIMessageScroller extends WebComponent {
	static url = import.meta.url;
	static styles = {
		messageScroller: './message-scroller.css',
	};
	static state = {
		items: [],
		stick: true,
		maxHeight: '18rem',
	};
	pinned = true;
	onConnect() {
		this.observe('items', this.handleItemsChange);
	}
	onMount() {
		this.scrollToEnd();
	}
	handleItemsChange() {
		if (this.pinned && isTrue(this.state.stick)) {
			this.scrollToEnd();
		}
	}
	handleScroll() {
		const scroller = this.refs.scroller;
		if (!scroller) {
			return;
		}
		const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
		this.pinned = distance <= PIN_THRESHOLD;
	}
	scrollToEnd() {
		const scroller = this.refs.scroller;
		if (!scroller) {
			return;
		}
		scroller.scrollTop = scroller.scrollHeight;
		this.pinned = true;
	}
	itemKey(item) {
		return item.id ?? item.key;
	}
	render() {
		this.html`
			<div
				class="ms"
				#scroller
				style=${`--ms-max:${this.state.maxHeight || '18rem'}`}
				@scroll=${this.handleScroll}>
				${this.list('items', UIMessage, this.itemKey)}
			</div>
		`;
	}
}
customElements.define('ui-message-scroller', UIMessageScroller);
