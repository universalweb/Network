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
		size: 'md',
	};
	handleClick() {
		this.emit('close-button:click', {});
	}
	iconSize() {
		return this.state.size === 'sm' ? 'xs' : 'sm';
	}
	render() {
		this.html`
			<button
				class="cb"
				data-size=${this.state.size || 'md'}
				@click=${this.handleClick}
				aria-label=${this.state.label}>
				<ui-icon class="cb-icon" .state.name=${'x'} .state.size=${this.iconSize}></ui-icon>
			</button>
		`;
	}
}
customElements.define('ui-close-button', UICloseButton);
