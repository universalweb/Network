/*
	DESCRIPTION: ui-message — one entry in a conversation: who said it, when, and
	WHATEVER they said. Avatar, author, timestamp and alignment; the content is
	the caller's.
	IT IS NOT A BUBBLE. It used to be both — a padded, tinted box with `content`
	rendered as text — which made words the only thing a message could hold. An
	attachment, a chart or an image had to be forced into that same box or sit
	outside the message entirely. The bubble is now ui-text-message, and this
	composes it as a CONVENIENCE when `text` is set. Anything slotted joins it:
	  <ui-message .state.author=${'user'} .state.text=${'Hello'}></ui-message>
	  <ui-message .state.author=${'assistant'} .state.time=${Date.now()}>
	    <ui-text-message .state.text=${'Here is the file'}></ui-text-message>
	    <ui-attachment .state.name=${'report.pdf'} .state.size=${248000}></ui-attachment>
	  </ui-message>
	  <ui-message .state.author=${'assistant'}>
	    <ui-bar-chart .state.items=${series}></ui-bar-chart>
	  </ui-message>
	Distinct from ui-ai-message, which is the agent transcript: markdown,
	streaming, reasoning blocks and tool calls. Use this for everything else.
	────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import '../avatar/avatar.js';
import '../text-message/text-message.js';
import { WebComponent } from 'webcomponent';
const AUTHORS = new Set([
	'user',
	'assistant',
	'system',
]);
function normalizeAuthor(author) {
	return AUTHORS.has(author) ? author : 'user';
}
export class UIMessage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		message: './message.css',
	};
	static state = {
		author: 'user',
		/*
		 * Convenience only. When set, the row composes a ui-text-message around it
		 * — the common case, without making every caller mount the bubble by hand.
		 * Leave it empty and slot whatever the message actually contains.
		 */
		text: '',
		time: 0,
		tone: '',
		/* Display name. Falls back to the author role, so a log with real people
		   reads as their names rather than "You" thirty times. */
		name: '',
		/* Avatar image; initials come from `name` when there is none. */
		avatar: '',
		showAvatar: false,
		/*
		 * Which edge the message hangs from. 'auto' (default) puts the user on the
		 * end and everyone else on the start — the arrangement every chat client
		 * uses — while 'start' / 'end' force it for a log that reads in one column.
		 */
		align: 'auto',
		/* A run from one author drops the header and avatar, so it reads as one
		   turn rather than the same name stamped five times. */
		continued: false,
	};
	authorFlag() {
		return normalizeAuthor(this.state.author);
	}
	alignFlag() {
		const align = this.state.align;
		if (align === 'start' || align === 'end') {
			return align;
		}
		return this.authorFlag() === 'user' ? 'end' : 'start';
	}
	authorLabel() {
		const displayName = String(this.state.name ?? '').trim();
		if (displayName !== '') {
			return displayName;
		}
		const author = this.authorFlag();
		if (author === 'user') {
			return 'You';
		}
		if (author === 'assistant') {
			return 'Assistant';
		}
		return 'System';
	}
	timeLabel() {
		const time = this.state.time;
		if (!time) {
			return '';
		}
		const stamp = new Date(time);
		if (Number.isNaN(stamp.getTime())) {
			return '';
		}
		return stamp.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	}
	hideTime() {
		return this.timeLabel() === '';
	}
	/* A continued message keeps its alignment but drops the identity chrome. */
	hideHead() {
		return this.state.continued === true;
	}
	hideAvatar() {
		return this.state.showAvatar !== true || this.state.continued === true;
	}
	/*
	 * The convenience bubble, only when there is text. A caller that slots its
	 * own content and sets no text gets no stray empty box.
	 */
	renderText() {
		if (String(this.state.text ?? '').trim() === '') {
			return '';
		}
		return this.htmlElement`<ui-text-message
			.state.text=${this.state.text}
			.state.side=${this.alignFlag()}
			.state.tone=${this.state.tone || 'default'}></ui-text-message>`;
	}
	render() {
		this.html`
			<article class="message"
				data-author=${this.authorFlag}
				data-align=${this.alignFlag}
				data-tone=${this.state.tone || 'default'}
				?data-continued=${this.state.continued === true}>
				<ui-avatar class="message-avatar"
					?hidden=${this.hideAvatar}
					.state.src=${this.state.avatar}
					.state.name=${this.authorLabel}
					.state.size=${'sm'}></ui-avatar>
				<div class="message-column">
					<header class="message-head" ?hidden=${this.hideHead}>
						<span class="message-author">${this.authorLabel}</span>
						<time class="message-time" ?hidden=${this.hideTime}>${this.timeLabel}</time>
					</header>
					<div class="message-body">
						${this.renderText}
						<slot></slot>
					</div>
				</div>
			</article>
		`;
	}
}
customElements.define('ui-message', UIMessage);
