/*
	DESCRIPTION: ui-spark-track — a heat strip of per-sample cells (jsperf
	`.tp-spark-track`). Each cell is one timing sample in run order; colour
	mixes danger→success by rank in the series. Not a polyline (ui-sparkline)
	and not a tab strip (ui-tracker).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-spark-track .state.values=${[12, 18, 9, 22]} .state.label=${'stability'}></ui-spark-track>
*/
import {
	componentPartial,
	isArray,
	WebComponent,
} from 'webcomponent';
export class UISparkTrack extends WebComponent {
	static url = import.meta.url;
	static styles = {
		sparkTrack: './spark-track.css',
	};
	static state = {
		values: [],
		label: '',
		scaleLabel: '',
	};
	get valueMin() {
		const values = this.state.values;
		if (!isArray(values) || values.length === 0) {
			return 0;
		}
		let min = Infinity;
		const count = values.length;
		for (let index = 0; index < count; index += 1) {
			const value = Number(values[index]);
			if (Number.isFinite(value) && value < min) {
				min = value;
			}
		}
		return Number.isFinite(min) ? min : 0;
	}
	get valueMax() {
		const values = this.state.values;
		if (!isArray(values) || values.length === 0) {
			return 1;
		}
		let max = -Infinity;
		const count = values.length;
		for (let index = 0; index < count; index += 1) {
			const value = Number(values[index]);
			if (Number.isFinite(value) && value > max) {
				max = value;
			}
		}
		return Number.isFinite(max) ? max : 1;
	}
	cellFast(value) {
		const min = this.valueMin;
		const span = (this.valueMax - min) || 1;
		const number = Number(value);
		const ratio = Number.isFinite(number) ? (number - min) / span : 0;
		return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
	}
	cellTip(value) {
		const number = Number(value);
		if (!Number.isFinite(number)) {
			return '';
		}
		return `${number}`;
	}
	/*
	 * componentPartial, NOT componentHTML: the cell carries `tooltip=`, which is a
	 * BEHAVIOR. componentHTML rejects behaviors outright (assertLightTemplate), so
	 * the row factory threw on every cell, the list never materialised, and the
	 * component painted an empty shadow root. componentPartial is the light-row
	 * factory that permits behaviors — and `tooltip=` is the only one it allows,
	 * which is exactly what this needs.
	 */
	cellRow(value) {
		return componentPartial`<span class="spark-track-cell" style=${`--spark-track-fast:${this.cellFast(value)}%`} tooltip=${this.cellTip(value)}></span>`;
	}
	render() {
		this.html`
			<div class="spark-track" aria-label=${this.state.label || 'sample track'}>
				<span class="spark-track-label" ?hidden=${!this.state.label}>${this.state.label}</span>
				<span class="spark-track-track">${this.list('values', this.cellRow)}</span>
				<span class="spark-track-scale" ?hidden=${!this.state.scaleLabel}>${this.state.scaleLabel}</span>
			</div>
		`;
	}
}
customElements.define('ui-spark-track', UISparkTrack);
