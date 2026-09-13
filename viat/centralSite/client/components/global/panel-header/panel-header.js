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
		closeIcon: 'x',
	};
	handleCloseClick() {
		this.emit('panel-header:close', {});
	}
	render() {
		this.html`
			<header class="panel-header">
				<div class="panel-header-start">
					<slot name="start"></slot>
				</div>
				<span class="panel-header-heading">${this.state.heading}</span>
				<div class="panel-header-end">
					<slot name="end"></slot>
					<ui-close-button
						class="panel-header-close"
						?hidden=${!this.state.showClose}
						.state.label=${this.state.closeLabel}
						.state.icon=${this.state.closeIcon}
						@close-button:click=${this.handleCloseClick}></ui-close-button>
				</div>
			</header>
		`;
	}
}
customElements.define('ui-panel-header', UIPanelHeader);
