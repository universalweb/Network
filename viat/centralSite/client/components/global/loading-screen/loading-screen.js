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
		heading: 'Loading',
		variant: 'overlay',
	};
	open(detail = {}) {
		this.assignState({
			...detail,
			open: true,
		});
	}
	close() {
		this.state.open = false;
	}
	render() {
		this.html`
			<div
				class="loading-screen"
				data-variant=${this.state.variant}
				?data-open=${this.state.open}
				?data-blocking=${this.state.blocking}
				role="status"
				aria-live="polite"
				aria-hidden=${this.state.open ? 'false' : 'true'}>
				<div class="loading-card">
					<ui-spinner .state=${{
						label: '',
						size: 'lg',
						variant: 'ring',
					}}></ui-spinner>
					<div class="loading-text">
						<div class="loading-title">${this.state.heading}</div>
						${this.state.message ? this.htmlElement`<div class="loading-message">${this.state.message}</div>` : ''}
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-loading-screen', UILoadingScreen);
