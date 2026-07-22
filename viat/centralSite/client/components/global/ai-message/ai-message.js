import '../code-block/code-block.js';
import '../ai-reasoning/ai-reasoning.js';
import { html, WebComponent } from 'webcomponent';
import { segmentMarkdown } from './markdown.js';
/*
 * `<ui-ai-message>` — one chat message row AND the content-part dispatcher for
 * the AI chat. While `streaming` it shows the live token text as escaped plain
 * text (a cheap per-token text-node patch — it never re-parses mid-stream, so
 * the existing surgical-streaming optimization is preserved and the parser is
 * never fed an unclosed fence). On stream-end (`streaming` → false) it segments
 * the settled content into parts ONCE and routes each to its renderer. Drive it
 * with `.author`, `.content`, and `.streaming` (the parent flips `streaming` when
 * the SSE stream for this message completes). Built as the shared message-row
 * primitive the general (non-AI) `messages` surface will reuse.
 */
export class UIAiMessage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		message: './ai-message.css',
	};
	static state = {
		id: '',
		// `author` NOT `role`: `role` is a native Element ARIA-reflection property,
		// so a `.role=` binding sets the host attribute and silently misses state
		// (the native-prop-name footgun). OpenAI's user/assistant/system maps here.
		author: 'user',
		content: '',
		// Stream gate: true → live escaped text; false → settled, parsed parts.
		// Most messages (user turns, restored history) arrive already settled.
		streaming: false,
		// The agent's thinking (bridge `reasoning_content`). Streams live into a
		// collapsible block ABOVE the answer, independent of the stream/settled
		// toggle; empty = no block.
		reasoning: '',
		// Epoch ms (0 = no timestamp shown).
		time: 0,
		parts: [],
		// Transient — flips true briefly after a successful copy so the button
		// can echo the result; self-clears.
		copied: false,
	};
	get roleLabel() {
		const author = this.state.author;
		if (author === 'user') {
			return 'YOU';
		}
		if (author === 'assistant') {
			return 'AI';
		}
		return String(author).toUpperCase();
	}
	get timeLabel() {
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
	async handleCopy() {
		// Copy the raw markdown source — most useful for the user to re-paste.
		const accepted = await this.copyText(this.state.content);
		if (!accepted) {
			return;
		}
		this.state.copied = true;
		this.setTimeout(() => {
			this.state.copied = false;
		}, 1400);
	}
	onConnect() {
		// observeAsync (not observe) defers through the scheduler, so when the
		// parent replaces the message object with { …final content, streaming:
		// false } in ONE assignState, the gate fires AFTER both keys commit —
		// settle() then reads the fully-committed final content, never a stale
		// mid-stream value (the assignState key-order race).
		this.observeAsync('streaming', this.handleStreamGate);
		if (!this.state.streaming) {
			this.settle();
		}
	}
	handleStreamGate() {
		// Only the stream-end transition is load-bearing: parse the final
		// content exactly once when the parent clears the streaming flag.
		if (!this.state.streaming) {
			this.settle();
		}
	}
	settle() {
		// The USER's own turn renders LITERAL (escaped plain text) — a human
		// typing "what does ** do" must not get bold. Only the agent's output
		// (assistant/system) is markdown-segmented.
		if (this.state.author === 'user') {
			this.state.parts = [
				{
					id: 'u0',
					kind: 'plain',
					text: String(this.state.content ?? ''),
				},
			];
			return;
		}
		this.state.parts = segmentMarkdown(this.state.content);
	}
	renderPart(part) {
		// Dispatch by part.kind: fenced code → <ui-code-block> (its own copy
		// button + dedent); `plain` → escaped literal text; `text` → rendered
		// markdown injected as pre-escaped, renderer-safe html.
		if (part.kind === 'code') {
			return html`<ui-code-block .state.code=${part.code} .state.language=${part.lang}></ui-code-block>`;
		}
		if (part.kind === 'plain') {
			return html`<div class="aim-plain">${part.text}</div>`;
		}
		return html`<div class="aim-md">^html${part.html}</div>`;
	}
	partKey(part) {
		return part.id;
	}
	render() {
		this.html`
			<div class="aim" data-role=${this.state.author}>
				<header class="aim-head">
					<span class="aim-dot" aria-hidden="true"></span>
					<span class="aim-role">${this.roleLabel}</span>
					<time class="aim-time" ?hidden=${!this.state.time}>${this.timeLabel}</time>
					<button class="aim-copy" type="button" ?hidden=${this.state.streaming} tooltip="Copy message" @click=${this.handleCopy}>
						<ui-icon class="aim-copy-icon" .state.name=${this.state.copied ? 'check' : 'copy'} .state.size=${'xs'}></ui-icon>
					</button>
				</header>
				<ui-ai-reasoning class="aim-reasoning" ?hidden=${!this.state.reasoning} .state.text=${this.state.reasoning} .state.streaming=${this.state.streaming} .state.expanded=${this.state.streaming}></ui-ai-reasoning>
				<div class="aim-stream" ?hidden=${!this.state.streaming}>${this.state.content}</div>
				<div class="aim-rich" ?hidden=${this.state.streaming}>${this.list('parts', this.renderPart, this.partKey)}</div>
			</div>
		`;
	}
}
customElements.define('ui-ai-message', UIAiMessage);
