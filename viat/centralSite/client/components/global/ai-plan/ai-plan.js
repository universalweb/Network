/*
 * `<ui-ai-plan>` — an agent's ordered task plan: a numbered list of steps each
 * carrying a status (done · active · pending · error) shown as a tinted status
 * glyph. Pure display — steps pass through `list()` as-is and a light row owns
 * each step's marker/label, so updating a step's status in the bound array
 * re-tints just that row. Drive it with `.steps` ([{ id?, label, status, detail? }])
 * and an optional `.label` heading.
 */
import '../icon/icon.js';
import { html, WebComponent } from 'webcomponent';
function statusIcon(status) {
	if (status === 'done') {
		return 'circle-check';
	}
	if (status === 'active') {
		return 'loader-circle';
	}
	if (status === 'error') {
		return 'circle-x';
	}
	return 'circle-dashed';
}
export class UIAiPlan extends WebComponent {
	static url = import.meta.url;
	static styles = {
		plan: './ai-plan.css',
	};
	static state = {
		label: 'Plan',
		items: [],
	};
	stepKey(step) {
		return step.id ?? step.label;
	}
	renderStep(step) {
		// Light rows can't embed a nested html`` fragment (it serializes), so the
		// detail span is always emitted and hidden via `.aip-detail:empty` in CSS.
		const status = step.status || 'pending';
		return html`
			<li class="aip-step" data-status=${status}>
				<ui-icon class="aip-mark" .state.name=${statusIcon(status)} .state.size=${'sm'} ?spin=${status === 'active'}></ui-icon>
				<span class="aip-text">
					<span class="aip-label">${step.label}</span>
					<span class="aip-detail">${step.detail || ''}</span>
				</span>
			</li>
		`;
	}
	render() {
		this.html`
			<section class="aip">
				<header class="aip-head" ?hidden=${!this.state.label}>
					<ui-icon class="aip-head-icon" .state.name=${'list-checks'} .state.size=${'sm'}></ui-icon>
					<span class="aip-title">${this.state.label}</span>
				</header>
				<ol class="aip-list">${this.list('items', this.renderStep, this.stepKey)}</ol>
			</section>
		`;
	}
}
customElements.define('ui-ai-plan', UIAiPlan);
