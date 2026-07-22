import { WebComponent } from '../../core/index.js';
function clampPercent(value) {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return 0;
	}
	if (value < 0) {
		return 0;
	}
	if (value > 100) {
		return 100;
	}
	return value;
}
export class UILoadingBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		loadingBar: './loading-bar.css',
	};
	static state = {
		indeterminate: false,
		label: '',
		showValue: false,
		value: 0,
	};
	/* Single clamped source for the fill width, aria-valuenow, and the readout. */
	get percent() {
		return clampPercent(this.state.value);
	}
	render() {
		this.html`
			<div
				class="bar"
				?data-indeterminate=${this.state.indeterminate}
				role="progressbar"
				aria-label=${this.state.label}
				aria-valuenow=${this.percent}
				aria-valuemin="0"
				aria-valuemax="100">
				<div class="bar-track">
					<div class="bar-fill" style=${`width:${this.percent}%`}></div>
				</div>
				${this.state.showValue ? this.htmlElement`<span class="bar-value">${`${Math.round(this.percent)}%`}</span>` : ''}
			</div>
		`;
	}
}
customElements.define('ui-loading-bar', UILoadingBar);
