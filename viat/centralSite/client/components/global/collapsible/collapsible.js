/*
	DESCRIPTION: ui-collapsible — lightweight disclosure (Collapsible).
	Slots: default = content; name="trigger" optional custom trigger.
	Emits collapsible:toggle { open }.
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UICollapsible extends WebComponent {
	static url = import.meta.url;
	static styles = {
		collapsible: './collapsible.css',
	};
	static state = {
		open: false,
		heading: '',
		disabled: false,
	};
	toggle() {
		if (this.state.disabled) {
			return;
		}
		const open = !this.state.open;
		this.state.open = open;
		this.emit('collapsible:toggle', {
			open,
		});
	}
	handleTrigger() {
		this.toggle();
	}
	render() {
		this.html`
			<div class="cl" ?data-open=${this.state.open} ?data-disabled=${this.state.disabled}>
				<button class="cl-trigger" type="button"
					?disabled=${this.state.disabled}
					aria-expanded=${this.state.open ? 'true' : 'false'}
					@click=${this.handleTrigger}>
					<slot name="trigger">
						<span class="cl-heading">${this.state.heading}</span>
						<ui-icon class="cl-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
					</slot>
				</button>
				<div class="cl-panel" ?hidden=${!this.state.open}>
					<div class="cl-body"><slot></slot></div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-collapsible', UICollapsible);
