import { WebComponent } from '../../core/index.js';
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
		this.html`
			<div
				class="spinner"
				data-size=${this.state.size}
				data-variant=${this.state.variant}
				role="status" aria-live="polite">
				<svg class="spinner-svg" viewBox="0 0 50 50" aria-hidden="true">
					<circle class="spinner-track" cx="25" cy="25" r="20" fill="none"></circle>
					<circle class="spinner-arc" cx="25" cy="25" r="20" fill="none"></circle>
				</svg>
				<span class="spinner-label" ?hidden=${!this.state.label}>${this.state.label}</span>
			</div>
		`;
	}
}
customElements.define('ui-spinner', UISpinner);
