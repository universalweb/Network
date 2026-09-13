/*
	DESCRIPTION: ui-text-message — the BUBBLE. One utterance of text, shaped and
	tinted by who said it.
	Split out of ui-message, which used to be both the row and the bubble at
	once. That made text the only thing a message could contain: an attachment,
	a chart or an image had to be bolted into the same padded, tinted box, or
	sit outside the message entirely. Now ui-message is the ROW — avatar,
	author, timestamp, alignment — and whatever it contains is the caller's
	choice. This is the piece to reach for when that content is words.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-text-message .state.text=${'Hello'}></ui-text-message>
	  <ui-text-message .state.text=${'Sent'} .state.side=${'end'}></ui-text-message>
	  <ui-text-message .state.tone=${'danger'} .state.text=${'Failed'}></ui-text-message>
	  <ui-text-message>arbitrary slotted content</ui-text-message>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import { WebComponent } from 'webcomponent';
const TONES = new Set([
	'default',
	'accent',
	'success',
	'warning',
	'danger',
	'info',
	'neutral',
]);
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
export class UITextMessage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		textMessage: './text-message.css',
	};
	static state = {
		text: '',
		/*
		 * Which way the bubble points. 'start' is someone else's message (the
		 * tail sits on the leading edge), 'end' is yours. Purely visual — WHO
		 * said it is ui-message's business, and a caller that wants a centred
		 * system notice uses 'none'.
		 */
		side: 'start',
		tone: 'default',
		size: 'md',
		/* Squares the tail-side corner. A run of consecutive messages from one
		   author reads as a group when only the last one carries a tail. */
		tail: true,
	};
	sideFlag() {
		const side = this.state.side;
		return side === 'end' || side === 'none' ? side : 'start';
	}
	toneFlag() {
		return TONES.has(this.state.tone) ? this.state.tone : 'default';
	}
	sizeFlag() {
		return SIZES.has(this.state.size) ? this.state.size : 'md';
	}
	/*
	 * Text is a text spot, so it is escaped — a chat bubble is the single most
	 * likely place for hostile input to arrive. Markup belongs to ui-ai-message,
	 * which parses markdown into a known-safe subset on purpose.
	 */
	render() {
		this.html`
			<div class="text-message"
				data-side=${this.sideFlag}
				data-tone=${this.toneFlag}
				data-size=${this.sizeFlag}
				?data-tail=${this.state.tail !== false}>${this.state.text}<slot></slot></div>
		`;
	}
}
customElements.define('ui-text-message', UITextMessage);
