import '../close-button/close-button.js';
import { WebComponent } from 'webcomponent';
/*
 * `<ui-panel-header>` — title strip for panels / slideouts / drawers.
 * Heading is uppercase and centered. Optional start/end slots for controls;
 * `showClose` mounts a trailing `<ui-close-button>`.
 *
 *   <ui-panel-header .state.heading=${'Notifications'} .state.showClose=${true}>
 *     <button slot="end" type="button">Clear All</button>
 *   </ui-panel-header>
 */
export class UIPanelHeader extends WebComponent {
	static url = import.meta.url;
	static styles = {
		panelHeader: './panel-header.css',
	};
	static state = {
		heading: '',
		showClose: false,
		closeLabel: 'Close',
	};
	handleCloseClick() {
		this.emit('panel-header:close', {});
	}
	render() {
		this.html`
			<header class="ph">
				<div class="ph-start">
					<slot name="start"></slot>
				</div>
				<span class="ph-heading">${this.state.heading}</span>
				<div class="ph-end">
					<slot name="end"></slot>
					<ui-close-button
						class="ph-close"
						?hidden=${!this.state.showClose}
						.state.label=${this.state.closeLabel}
						@close-button:click=${this.handleCloseClick}></ui-close-button>
				</div>
			</header>
		`;
	}
}
customElements.define('ui-panel-header', UIPanelHeader);
