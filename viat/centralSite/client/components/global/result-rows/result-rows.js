/*
	DESCRIPTION: ui-result-rows — comparative benchmark rows (jsperf `.result-rows-rows`).
	Each item is a label, a group-scaled bar, an ops figure, and a verdict.
	Per-row `tone` is success (fastest) / danger (slowest) / neutral.
	Uses list() + a light html row (same group-max scale mechanic as ui-bar-list).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-result-rows .state.items=${[
	    { id: 'for', label: 'for-loop', value: 9410, tone: 'success', verdict: 'fastest' },
	    { id: 'map', label: 'map', value: 6120, tone: 'danger', verdict: '1.54× slower' },
	  ]}></ui-result-rows>
*/
import {
	html,
	isArray,
	WebComponent,
} from 'webcomponent';
const TONES = new Set([
	'success', 'danger', 'neutral',
]);
function formatOps(value) {
	const number = Number(value);
	if (!Number.isFinite(number) || number <= 0) {
		return '—';
	}
	return Math.round(number).toLocaleString('en-US');
}
function rowTone(item) {
	return TONES.has(item?.tone) ? item.tone : 'neutral';
}
export class UIResultRows extends WebComponent {
	static url = import.meta.url;
	static styles = {
		resultRows: './result-rows.css',
	};
	static state = {
		items: [],
		unit: 'ops/s',
	};
	get barScale() {
		const items = this.state.items;
		let max = 0;
		if (isArray(items)) {
			const count = items.length;
			for (let index = 0; index < count; index += 1) {
				const value = Number(items[index]?.value);
				if (Number.isFinite(value) && value > max) {
					max = value;
				}
			}
		}
		return max || 1;
	}
	resultRow(item) {
		const value = Number(item?.value) || 0;
		const pct = Math.max(0, Math.round((value / this.barScale) * 100));
		const tone = rowTone(item);
		return html`<div class="result-rows" data-tone=${tone}>
			<span class="result-rows-name">${item?.label ?? ''}</span>
			<span class="result-rows-bar" aria-hidden="true"><span class="result-rows-fill" style=${`inline-size:${pct}%`}></span></span>
			<span class="result-rows-ops">${formatOps(value)} <em>${this.state.unit}</em></span>
			<span class="result-rows-verdict">${item?.verdict ?? ''}</span>
		</div>`;
	}
	render() {
		this.html`
			<div class="rrs">
				${this.list('items', this.resultRow)}
			</div>
		`;
	}
}
customElements.define('ui-result-rows', UIResultRows);
