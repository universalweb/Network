import '../spinner/spinner.js';
import { WebComponent, classList } from '../../core/index.js';
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
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${classList(
				'loading-screen',
				() => {
					return `variant-${this.state.variant}`;
				},
				() => {
					return this.state.open && 'is-open';
				},
				() => {
					return this.state.blocking && 'is-blocking';
				}
			)}
				role="status"
				aria-live="polite"
				aria-hidden="${() => {
					return (this.state.open ? 'false' : 'true');
				}}">
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
