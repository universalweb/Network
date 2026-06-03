import { WebComponent, classList } from '../../core/index.js';
export class UISpinner extends WebComponent {
	static url = import.meta.url;
	static styles = {
		spinner: './spinner.css',
	};
	static state = {
		label: '',
		size: 'md',
		variant: 'ring',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${classList(
				'spinner',
				() => {
					return `spinner-${this.state.size}`;
				},
				() => {
					return `spinner-${this.state.variant}`;
				}
			)} role="status" aria-live="polite">
				<svg class="spinner-svg" viewBox="0 0 50 50" aria-hidden="true">
					<circle class="spinner-track" cx="25" cy="25" r="20" fill="none"></circle>
					<circle class="spinner-arc" cx="25" cy="25" r="20" fill="none"></circle>
				</svg>
				^html${this.state.label ? `<span class="spinner-label">${this.state.label}</span>` : ''}
			</div>
		`;
	}
}
customElements.define('ui-spinner', UISpinner);
