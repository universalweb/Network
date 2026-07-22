import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
/*
 * Strip the common leading indentation off a code string so example code
 * authored inside a template literal (which carries the source's own nesting)
 * renders flush. Leading blank lines and all trailing whitespace are trimmed;
 * the smallest leading-whitespace run among the remaining non-blank lines is
 * removed from every line, preserving relative indentation.
 */
function dedentCode(source) {
	const raw = String(source ?? '').replace(/^\n+|\s+$/g, '');
	if (!raw) {
		return '';
	}
	const lines = raw.split('\n');
	let minIndent = Infinity;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.trim() === '') {
			continue;
		}
		const indent = line.length - line.trimStart().length;
		if (indent < minIndent) {
			minIndent = indent;
		}
	}
	if (!Number.isFinite(minIndent) || minIndent === 0) {
		return lines.join('\n');
	}
	const out = new Array(lines.length);
	for (let index = 0; index < lines.length; index += 1) {
		out[index] = lines[index].slice(minIndent);
	}
	return out.join('\n');
}
/**
 * `<ui-code-block>` — read-only example-code display. Renders a dedented code
 * string as XSS-safe `textContent` in a themed `<pre>`, with a language label
 * and a one-click copy button (framework `copyText`, no try/catch). Drive it
 * with `.code=${'…'}` and optional `.language=${'html'}`.
 */
export class UICodeBlock extends WebComponent {
	static url = import.meta.url;
	static styles = {
		codeBlock: './code-block.css',
	};
	static state = {
		code: '',
		language: '',
		// Transient — flips true for a moment after a successful copy so the
		// button can echo the result; self-clears.
		copied: false,
	};
	get displayCode() {
		return dedentCode(this.state.code);
	}
	async handleCopy() {
		const accepted = await this.copyText(this.displayCode);
		if (!accepted) {
			return;
		}
		this.state.copied = true;
		this.setTimeout(() => {
			this.state.copied = false;
		}, 1400);
	}
	render() {
		this.html`
			<figure class="cb">
				<figcaption class="cb-bar">
					<span class="cb-lang">${this.state.language || 'code'}</span>
					<button class="cb-copy" type="button" tooltip="Copy to clipboard" @click=${this.handleCopy}>
						<ui-icon class="cb-copy-icon" .state.name=${this.state.copied ? 'check' : 'copy'} .state.size=${'xs'}></ui-icon>
						<span class="cb-copy-text">${this.state.copied ? 'Copied' : 'Copy'}</span>
					</button>
				</figcaption>
				<pre class="cb-pre"><code class="cb-code">^text${this.displayCode}</code></pre>
			</figure>
		`;
	}
}
customElements.define('ui-code-block', UICodeBlock);
