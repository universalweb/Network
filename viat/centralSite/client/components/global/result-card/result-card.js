/*
	DESCRIPTION: ui-result-card — a benchmark result tile (jsperf `.tp-result`).
	Three tones mapped from the source classes: `is-fastest` → success,
	`is-slowest` → danger, default/`tiedWithFastest` → neutral. Optional error
	string replaces the figures row.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-result-card .state.tone=${'success'} .state.ops=${9410} .state.percent=${100}></ui-result-card>
*/
import { WebComponent } from 'webcomponent';
const TONES = new Set([
	'success', 'danger', 'neutral',
]);
export class UIResultCard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		resultCard: './result-card.css',
	};
	static state = {
		tone: 'neutral',
		percent: 0,
		ops: 0,
		unit: 'ops/sec',
		moe: '',
		tag: '',
		rel: '',
		samples: '',
		heap: '',
		errorText: '',
	};
	get resolvedTone() {
		return TONES.has(this.state.tone) ? this.state.tone : 'neutral';
	}
	get barWidth() {
		const percent = Number(this.state.percent) || 0;
		return `${Math.max(0, Math.min(100, percent))}%`;
	}
	render() {
		this.html`
			<div class="result-card" data-tone=${this.resolvedTone}>
				<p class="result-card-error" ?hidden=${!this.state.errorText}>${this.state.errorText}</p>
				<div class="result-card-body" ?hidden=${Boolean(this.state.errorText)}>
					<div class="result-card-bar" aria-hidden="true">
						<span class="result-card-fill" style=${`inline-size:${this.barWidth}`}></span>
					</div>
					<div class="result-card-figures">
						<span class="result-card-ops">${this.state.ops} <em>${this.state.unit}</em></span>
						<span class="result-card-moe" ?hidden=${!this.state.moe}>${this.state.moe}</span>
						<span class="result-card-tag" ?hidden=${!this.state.tag}>${this.state.tag}</span>
						<span class="result-card-rel" ?hidden=${!this.state.rel}>${this.state.rel}</span>
						<span class="result-card-samples" ?hidden=${!this.state.samples}>${this.state.samples}</span>
						<span class="result-card-heap" ?hidden=${!this.state.heap}>${this.state.heap}</span>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-result-card', UIResultCard);
