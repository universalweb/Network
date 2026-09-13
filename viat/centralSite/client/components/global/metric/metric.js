/*
	DESCRIPTION: ui-metric — KPI chrome: label, value, optional signed delta.
	The visualization is a slot — place any chart (ui-sparkline, ui-line-chart, …).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-metric .state.label=${'TPS (peak)'} .state.value=${'9,410'} .state.delta=${12.4}
	    .state.tone=${'accent'}>
	    <ui-sparkline .state.values=${series} .state.variant=${'area'} .state.tone=${'accent'}></ui-sparkline>
	  </ui-metric>
	`delta` is a signed number; rising reads success / falling reads danger —
	set `invertDelta` when down is good (e.g. latency). `deltaSuffix` defaults '%'.
	─────────────────────────────────────────────────────────────────────
*/
import { isNumber, WebComponent } from 'webcomponent';
export class UIMetric extends WebComponent {
	static url = import.meta.url;
	static styles = {
		metric: './metric.css',
	};
	static state = {
		label: '',
		value: '',
		hint: '',
		tone: 'accent',
		delta: null,
		deltaSuffix: '%',
		invertDelta: false,
		tooltip: '',
		deltaTooltip: '',
	};
	deltaShown() {
		return isNumber(this.state.delta) && this.state.delta !== 0;
	}
	deltaHidden() {
		return !this.deltaShown();
	}
	hintHidden() {
		return !this.state.hint;
	}
	deltaTone() {
		const rising = this.state.delta > 0;
		const good = this.state.invertDelta ? !rising : rising;
		return good ? 'success' : 'danger';
	}
	deltaText() {
		const arrow = this.state.delta > 0 ? '▲' : '▼';
		return `${arrow} ${Math.abs(this.state.delta)}${this.state.deltaSuffix}`;
	}
	/* Host [data-chart] opts the card into fill-available chart layout. */
	syncChartPresence() {
		const slot = this.refs.chart;
		const filled = Boolean(slot?.assignedElements({
			flatten: true,
		}).length);
		this.toggleAttribute('data-chart', filled);
	}
	onMount() {
		this.syncChartPresence();
	}
	render() {
		this.html`
			<div class="metric" data-tone=${this.state.tone} tooltip=${this.state.tooltip}>
				<div class="metric-chrome">
					<div class="metric-head">
						<span class="metric-label">${this.state.label}</span>
						<span class="metric-hint" ?hidden=${this.hintHidden}>${this.state.hint}</span>
					</div>
					<div class="metric-row">
						<span class="metric-value">${this.state.value}</span>
						<span class="metric-delta" data-delta=${this.deltaTone} tooltip=${this.state.deltaTooltip} ?hidden=${this.deltaHidden}>${this.deltaText}</span>
					</div>
				</div>
				<div class="metric-chart">
					<slot #chart @slotchange=${this.syncChartPresence}></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-metric', UIMetric);
