/*
 * `<ui-ai-usage>` — token / cost meter for a chat turn or session. Pure
 * display: formats prompt/completion/total (and optional cost). Drive with
 * `.promptTokens`, `.completionTokens`, `.totalTokens` (0 = hide that field),
 * `.cost` (number, null/NaN = hide), `.currency`, `.label`. Emits nothing.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
function formatCount(value) {
	const number = Number(value);
	if (!Number.isFinite(number) || number <= 0) {
		return '';
	}
	return new Intl.NumberFormat().format(Math.round(number));
}
function formatCost(value, currency) {
	const number = Number(value);
	if (!Number.isFinite(number)) {
		return '';
	}
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currency || 'USD',
		maximumFractionDigits: 4,
	}).format(number);
}
export class UIAiUsage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		usage: './ai-usage.css',
	};
	static state = {
		label: 'Usage',
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
		cost: null,
		currency: 'USD',
	};
	get promptLabel() {
		return formatCount(this.state.promptTokens);
	}
	get completionLabel() {
		return formatCount(this.state.completionTokens);
	}
	get totalLabel() {
		const total = Number(this.state.totalTokens);
		if (Number.isFinite(total) && total > 0) {
			return formatCount(total);
		}
		const inTokens = Number(this.state.promptTokens) || 0;
		const outTokens = Number(this.state.completionTokens) || 0;
		const sum = inTokens + outTokens;
		return sum > 0 ? formatCount(sum) : '';
	}
	get costLabel() {
		return formatCost(this.state.cost, this.state.currency);
	}
	get isEmpty() {
		return !this.promptLabel && !this.completionLabel && !this.totalLabel && !this.costLabel;
	}
	render() {
		this.html`
			<div class="ai-usage" ?hidden=${this.isEmpty}>
				<ui-icon class="ai-usage-icon" .state.name=${'activity'} .state.size=${'xs'}></ui-icon>
				<span class="ai-usage-title" ?hidden=${!this.state.label}>${this.state.label}</span>
				<span class="ai-usage-stat" ?hidden=${!this.promptLabel} tooltip="Prompt tokens">
					<span class="ai-usage-k">in</span>
					<span class="ai-usage-v">${this.promptLabel}</span>
				</span>
				<span class="ai-usage-stat" ?hidden=${!this.completionLabel} tooltip="Completion tokens">
					<span class="ai-usage-k">out</span>
					<span class="ai-usage-v">${this.completionLabel}</span>
				</span>
				<span class="ai-usage-stat" ?hidden=${!this.totalLabel} tooltip="Total tokens">
					<span class="ai-usage-k">Σ</span>
					<span class="ai-usage-v">${this.totalLabel}</span>
				</span>
				<span class="ai-usage-stat ai-usage-cost" ?hidden=${!this.costLabel} tooltip="Estimated cost">
					<span class="ai-usage-v">${this.costLabel}</span>
				</span>
			</div>
		`;
	}
}
customElements.define('ui-ai-usage', UIAiUsage);
