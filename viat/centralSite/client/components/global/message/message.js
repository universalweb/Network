/*
	DESCRIPTION: ui-message — generic chat / feedback bubble.
	author: user | assistant | system. Distinct from ui-ai-message (markdown,
	streaming, reasoning). Compose this for non-AI logs; keep ui-ai-message
	for the agent transcript.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-message .state.author=${'user'} .state.content=${'Hello'}></ui-message>
	─────────────────────────────────────────────────────────────────────
*/
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
		content: '',
		time: 0,
		tone: '',
	};
	authorFlag() {
		return normalizeAuthor(this.state.author);
	}
	authorLabel() {
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
		return !this.timeLabel();
	}
	render() {
		this.html`
			<article class="msg" data-author=${this.authorFlag} data-tone=${this.state.tone || 'default'}>
				<header class="msg-head">
					<span class="msg-author">${this.authorLabel}</span>
					<time class="msg-time" ?hidden=${this.hideTime}>${this.timeLabel}</time>
				</header>
				<div class="msg-body">${this.state.content}<slot></slot></div>
			</article>
		`;
	}
}
customElements.define('ui-message', UIMessage);
