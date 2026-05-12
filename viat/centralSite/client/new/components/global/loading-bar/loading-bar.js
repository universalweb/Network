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
	get fillStyle() {
		return `width:${clampPercent(this.state.value)}%`;
	}
	get hostClass() {
		return `bar${this.state.indeterminate ? ' is-indeterminate' : ''}`;
	}
	get displayValue() {
		return `${Math.round(clampPercent(this.state.value))}%`;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => this.hostClass}"
				role="progressbar"
				aria-label="${this.state.label}"
				aria-valuenow="${() => clampPercent(this.state.value)}"
				aria-valuemin="0"
				aria-valuemax="100">
				<div class="bar-track">
					<div class="bar-fill" style="${() => this.fillStyle}"></div>
				</div>
				${this.state.showValue ? this.htmlValueLabel() : ''}
			</div>
		`;
	}
	htmlValueLabel() {
		return this.htmlElement `<span class="bar-value">${() => this.displayValue}</span>`;
	}
}
customElements.define('ui-loading-bar', UILoadingBar);
