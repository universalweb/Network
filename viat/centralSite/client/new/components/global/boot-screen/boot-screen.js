import '../loading-bar/loading-bar.js';
import { WebComponent } from '../../core/index.js';
const FADE_MS = 420;
export class BootScreen extends WebComponent {
	static url = import.meta.url;
	static styles = {
		bootScreen: './boot-screen.css',
	};
	static state = {
		title: 'Welcome to Viat',
		closing: false,
	};
	barState() {
		return {
			indeterminate: true,
			label: 'Loading Viat',
		};
	}
	get hostClass() {
		return `boot-screen${this.state.closing ? ' is-closing' : ''}`;
	}
	dismiss() {
		if (this.state.closing) {
			return;
		}
		this.state.closing = true;
		this.setTimeout(() => {
			this.remove();
		}, FADE_MS);
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${this.hostClass}" role="status" aria-live="polite">
				<div class="bs-stage">
					<div class="bs-glow"></div>
					<div class="bs-logo">⩝</div>
					<div class="bs-title">${this.state.title}</div>
					<ui-loading-bar .state=${this.barState}></ui-loading-bar>
				</div>
			</div>
		`;
	}
}
customElements.define('boot-screen', BootScreen);
