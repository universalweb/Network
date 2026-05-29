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
		// Child-state for the composed <ui-icon> — a reactive key on the one
		// state tree, bound bare in render(); not a loose instance field.
		iconState: {
			name: 'x',
			size: 'sm',
		},
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
				<ui-icon class="cb-icon" .state=${this.state.iconState}></ui-icon>
			</button>
		`;
	}
}
customElements.define('ui-close-button', UICloseButton);
