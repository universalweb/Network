/*
	DESCRIPTION: ui-tracker — a row of status squares (à la Tremor Tracker /
	uptime bars). Each segment is a thin bar tinted by its tone; together they
	read as a dense health/uptime history at a glance.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-tracker .segments=${[
	    { tone: 'success', label: 'block 4821 · ok' },
	    { tone: 'success' },
	    { tone: 'warning', label: 'slow finality' },
	    { tone: 'danger',  label: 'missed' },
	  ]}></ui-tracker>
	A segment may be a bare tone string (`'success'`) or `{ tone, label }`. The
	label is exposed as the segment's accessible name.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent, html, list } from 'webcomponent';
const TONES = new Set([
	'accent',
	'success',
	'warning',
	'danger',
	'info',
	'neutral',
]);
function normalizeTone(tone) {
	return TONES.has(tone) ? tone : 'neutral';
}
export class UITracker extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tracker: './tracker.css',
	};
	static state = {
		segments: [],
		label: '',
	};
	/* Light html row per segment — segments pass through as-is (bare tone string
	   OR {tone, label}); the row reads its own shape. `html` auto-escapes the
	   label, so no manual encoding. A labelled segment names itself for a11y. */
	segmentRow(segment) {
		const isString = typeof segment === 'string';
		const tone = normalizeTone(isString ? segment : segment?.tone);
		const label = isString ? '' : segment?.label;
		return label ? html `<span class="trk-seg" data-tone=${tone} aria-label=${label}></span>` : html `<span class="trk-seg" data-tone=${tone} aria-hidden="true"></span>`;
	}
	render() {
		this.html `
			<div class="trk" role="img" aria-label=${this.state.label}>
				${list('segments', this.segmentRow)}
			</div>
		`;
	}
}
customElements.define('ui-tracker', UITracker);
