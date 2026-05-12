import '../spinner/spinner.js';
import { WebComponent } from '../../core/index.js';
export class UILoadingScreen extends WebComponent {
	static url = import.meta.url;
	static styles = {
		loadingScreen: './loading-screen.css',
	};
	static state = {
		blocking: true,
		message: '',
		open: false,
		title: 'Loading',
		variant: 'overlay',
	};
	get hostClass() {
		return `loading-screen variant-${this.state.variant}${this.state.open ? ' is-open' : ''}${this.state.blocking ? ' is-blocking' : ''}`;
	}
	open(detail = {}) {
		Object.assign(this.state, {
			open: true,
		}, detail);
	}
	close() {
		this.state.open = false;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => this.hostClass}"
				role="status"
				aria-live="polite"
				aria-hidden="${() => (this.state.open ? 'false' : 'true')}">
				<div class="loading-card">
					<ui-spinner .state=${{
						label: '',
						size: 'lg',
						variant: 'ring',
					}}></ui-spinner>
					<div class="loading-text">
						<div class="loading-title">${this.state.title}</div>
						${this.state.message ? this.htmlElement `<div class="loading-message">${this.state.message}</div>` : ''}
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-loading-screen', UILoadingScreen);
