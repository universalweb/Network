/*
 * `<ui-ai-approval>` — human-in-the-loop gate for a pending (usually mutating)
 * agent tool call. Shows what the agent wants to run (name + summary + args via
 * <ui-json-inspector>) and Approve / Reject actions. On a decision it locks the
 * buttons, paints the outcome, and emits `ai-approval:decision`
 * { decision: 'approved' | 'rejected', name, callId } — the chat withholds the
 * tool round-trip until approval arrives. Drive with `.name`, `.callId`,
 * `.summary`, `.args`; read `.decided` ('' | 'approved' | 'rejected').
 */
import '../icon/icon.js';
import '../json-inspector/json-inspector.js';
import { WebComponent } from 'webcomponent';
export class UIAiApproval extends WebComponent {
	static url = import.meta.url;
	static styles = {
		approval: './ai-approval.css',
	};
	static state = {
		name: '',
		callId: '',
		summary: '',
		args: null,
		decided: '',
	};
	get hasArgs() {
		return this.state.args !== null && this.state.args !== undefined;
	}
	onConnect() {
		// <ui-json-inspector>.data is a plain accessor that loses a value set
		// before it connects; feed it imperatively via the ref once mounted and
		// on any args change (the reliable post-connect path).
		this.observe(['args'], this.syncInspector);
	}
	onMount() {
		this.syncInspector();
	}
	syncInspector() {
		const argsView = this.refs.argsview;
		if (argsView) {
			argsView.data = this.state.args;
		}
	}
	get outcomeIcon() {
		return this.state.decided === 'approved' ? 'circle-check' : 'circle-x';
	}
	get outcomeLabel() {
		return this.state.decided === 'approved' ? 'Approved' : 'Rejected';
	}
	handleApprove() {
		this.decide('approved');
	}
	handleReject() {
		this.decide('rejected');
	}
	decide(decision) {
		// First decision wins; a settled gate never re-fires.
		if (this.state.decided) {
			return;
		}
		this.state.decided = decision;
		this.emit('ai-approval:decision', {
			decision,
			name: this.state.name,
			callId: this.state.callId,
		});
	}
	render() {
		this.html`
			<section class="apv" data-decided=${this.state.decided || 'pending'}>
				<header class="apv-head">
					<ui-icon class="apv-icon" .state.name=${'circle-alert'} .state.size=${'sm'}></ui-icon>
					<span class="apv-title">Approval required</span>
					<code class="apv-name">${this.state.name}</code>
				</header>
				<p class="apv-summary" ?hidden=${!this.state.summary}>${this.state.summary}</p>
				<div class="apv-args" ?hidden=${!this.hasArgs}>
					<ui-json-inspector #argsview .state.expandDepth=${1} .state.rootLabel=${'args'}></ui-json-inspector>
				</div>
				<footer class="apv-actions" ?hidden=${this.state.decided}>
					<button type="button" data-variant="solid" data-tone="success" data-size="sm" @click=${this.handleApprove}>Approve</button>
					<button type="button" data-variant="ghost" data-tone="danger" data-size="sm" @click=${this.handleReject}>Reject</button>
				</footer>
				<div class="apv-outcome" data-decided=${this.state.decided} ?hidden=${!this.state.decided}>
					<ui-icon .state.name=${this.outcomeIcon} .state.size=${'xs'}></ui-icon>
					<span>${this.outcomeLabel}</span>
				</div>
			</section>
		`;
	}
}
customElements.define('ui-ai-approval', UIAiApproval);
