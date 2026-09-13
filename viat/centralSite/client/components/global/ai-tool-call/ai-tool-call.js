/*
 * `<ui-ai-tool-call>` — a collapsible card for one agent tool invocation: the
 * tool name, a running/done/error status, and the call's arguments + result
 * rendered through <ui-json-inspector> (collapsible, type-tinted, copy-path).
 * Protocol-agnostic display: the AI chat maps the live `$VIAT.CMD[name, id, …]`
 * / `$AI.CMD[…]` round-trip onto `.name` / `.args` / `.result` / `.status`.
 * Emits nothing — it is a read-only surface. Drive with `.name`, `.callId`,
 * `.args`, `.result`, `.status` (running | done | error), `.expanded`.
 */
import '../icon/icon.js';
import '../json-inspector/json-inspector.js';
import { WebComponent } from 'webcomponent';
export class UIAiToolCall extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toolCall: './ai-tool-call.css',
	};
	static state = {
		name: '',
		callId: '',
		args: null,
		result: null,
		status: 'running',
		expanded: false,
	};
	get statusIcon() {
		const status = this.state.status;
		if (status === 'done') {
			return 'circle-check';
		}
		if (status === 'error') {
			return 'circle-x';
		}
		return 'loader-circle';
	}
	get statusLabel() {
		const status = String(this.state.status || 'running');
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
	get hasResult() {
		return this.state.status !== 'running' || this.state.result !== null;
	}
	onConnect() {
		// <ui-json-inspector>.data is a plain accessor that loses a value set
		// before it connects (the parent-prop seeding race). Feed it imperatively
		// via refs once mounted, and on every args/result change — the reliable
		// post-connect path.
		this.observe([
			'args',
			'result',
		], this.syncInspectors);
	}
	onMount() {
		this.syncInspectors();
	}
	syncInspectors() {
		const argsView = this.refs.argsview;
		if (argsView) {
			argsView.data = this.state.args;
		}
		const resultView = this.refs.resultview;
		if (resultView) {
			resultView.data = this.state.result;
		}
	}
	handleToggle(domEvent) {
		const next = Boolean(domEvent.target.open);
		if (next === this.state.expanded) {
			return;
		}
		this.state.expanded = next;
	}
	render() {
		this.html`
			<details class="ai-tool-call" data-status=${this.state.status} ?open=${this.state.expanded} @toggle=${this.handleToggle}>
				<summary class="ai-tool-call-summary">
					<ui-icon class="ai-tool-call-tool" .state.name=${'wrench'} .state.size=${'sm'}></ui-icon>
					<code class="ai-tool-call-name">${this.state.name}</code>
					<span class="ai-tool-call-status">
						<ui-icon class="ai-tool-call-status-icon" .state.name=${this.statusIcon} .state.size=${'xs'} ?spin=${this.state.status === 'running'}></ui-icon>
						<span class="ai-tool-call-status-label">${this.statusLabel}</span>
					</span>
					<ui-icon class="ai-tool-call-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</summary>
				<div class="ai-tool-call-body">
					<div class="ai-tool-call-section">
						<span class="ai-tool-call-section-label">Arguments</span>
						<ui-json-inspector #argsview .state.expandDepth=${1} .state.rootLabel=${'args'}></ui-json-inspector>
					</div>
					<div class="ai-tool-call-section" ?hidden=${!this.hasResult}>
						<span class="ai-tool-call-section-label">Result</span>
						<ui-json-inspector #resultview .state.expandDepth=${1} .state.rootLabel=${'result'}></ui-json-inspector>
					</div>
				</div>
			</details>
		`;
	}
}
customElements.define('ui-ai-tool-call', UIAiToolCall);
