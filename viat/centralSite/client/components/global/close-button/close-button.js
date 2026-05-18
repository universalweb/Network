import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
// `<ui-close-button>` — drop-in × button with a built-in hover animation.
// Modals (and any other dismissible surface) should use this instead of
// rolling their own × so the animation stays consistent and the a11y label
// is correct by default.
export class UICloseButton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		closeButton: './close-button.css',
	};
	static state = {
		label: 'Close',
	};
	iconState = {
		name: 'x',
		size: 'sm',
	};
	handleClick = (domEvent) => {
		this.emit('close-click', {
			source: this,
			original: domEvent,
		});
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<button class="cb" @click=${this.handleClick} aria-label=${() => this.state.label}>
				<ui-icon class="cb-icon" .state=${this.iconState}></ui-icon>
			</button>
		`;
	}
}
customElements.define('ui-close-button', UICloseButton);
