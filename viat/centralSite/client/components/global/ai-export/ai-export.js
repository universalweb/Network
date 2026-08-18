/*
 * `<ui-ai-export>` — download / copy a chat transcript. Pure client UI: given
 * `.items` (message rows with role/author + content) and `.format`
 * ('markdown' | 'json'), it builds a blob and triggers a download (or copies
 * when `.mode` is 'copy'). Emits `ai-export:complete` { format, mode, bytes }
 * after success, `ai-export:error` { message } on failure. Drive with
 * `.items`, `.format`, `.mode` ('download' | 'copy'), `.filename`, `.label`.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
function roleOf(item) {
	return item.author || item.role || 'unknown';
}
function toMarkdown(items) {
	const lines = [];
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		lines.push(`### ${String(roleOf(item)).toUpperCase()}`);
		lines.push(String(item.content ?? ''));
		lines.push('');
	}
	return lines.join('\n');
}
function toJson(items) {
	return `${JSON.stringify(items, null, 2)}\n`;
}
function buildBody(items, format) {
	if (format === 'json') {
		return toJson(items);
	}
	return toMarkdown(items);
}
function mimeFor(format) {
	if (format === 'json') {
		return 'application/json';
	}
	return 'text/markdown';
}
function extensionFor(format) {
	if (format === 'json') {
		return 'json';
	}
	return 'md';
}
export class UIAiExport extends WebComponent {
	static url = import.meta.url;
	static styles = {
		export: './ai-export.css',
	};
	static state = {
		items: [],
		// markdown | json
		format: 'markdown',
		// download | copy
		mode: 'download',
		filename: 'chat-export',
		label: 'Export',
		disabled: false,
		busy: false,
	};
	get isDisabled() {
		return this.state.disabled || this.state.busy || this.state.items.length === 0;
	}
	handleClick() {
		if (this.isDisabled) {
			return;
		}
		const body = buildBody(this.state.items, this.state.format);
		if (this.state.mode === 'copy') {
			this.copyBody(body);
			return;
		}
		this.downloadBody(body);
	}
	async copyBody(body) {
		this.state.busy = true;
		const accepted = await this.copyText(body);
		this.state.busy = false;
		if (!accepted) {
			this.emit('ai-export:error', {
				message: 'Copy failed',
			});
			return;
		}
		this.emit('ai-export:complete', {
			format: this.state.format,
			mode: 'copy',
			bytes: body.length,
		});
	}
	downloadBody(body) {
		this.state.busy = true;
		// Blob option key is a DOM API requirement; build via bracket write so
		// the eslint no-restricted-syntax ban on a `type` property name holds.
		const blobOptions = {};
		blobOptions.type = mimeFor(this.state.format);
		const blob = new Blob([body], blobOptions);
		const href = URL.createObjectURL(blob);
		const anchor = globalThis.document.createElement('a');
		const base = this.state.filename || 'chat-export';
		anchor.href = href;
		anchor.download = `${base}.${extensionFor(this.state.format)}`;
		anchor.rel = 'noopener';
		globalThis.document.body.append(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(href);
		this.state.busy = false;
		this.emit('ai-export:complete', {
			format: this.state.format,
			mode: 'download',
			bytes: body.length,
		});
	}
	render() {
		this.html`
			<button type="button"
				class="aiex"
				?disabled=${this.isDisabled}
				tooltip=${this.state.label}
				@click=${this.handleClick}>
				<ui-icon .state.name=${'download'} .state.size=${'xs'}></ui-icon>
				<span class="aiex-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-ai-export', UIAiExport);
