/*
	DESCRIPTION: ui-fieldset — legend + optional toggleable body (PrimeVue Fieldset).
	Semantic fieldset/legend. When toggleable, the legend is a button that
	emits fieldset:toggle { open }. open is the disclosure flag (accordion parity).
	icon / iconCollapsed swap the indicator; omit both for a rotating chevron.
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
let fieldsetSeq = 0;
export class UIFieldset extends WebComponent {
	static url = import.meta.url;
	static styles = {
		fieldset: './fieldset.css',
	};
	static state = {
		heading: '',
		toggleable: false,
		open: true,
		disabled: false,
		icon: '',
		iconCollapsed: '',
	};
	onInit() {
		fieldsetSeq += 1;
		this.panelId = `ui-fieldset-${fieldsetSeq}`;
		this.legendId = `${this.panelId}-legend`;
	}
	usesIconSwap() {
		return Boolean(this.state.icon && this.state.iconCollapsed);
	}
	toggleIconName() {
		const isOpen = this.state.open !== false;
		if (isOpen) {
			return this.state.icon || 'chevron-down';
		}
		return this.state.iconCollapsed || this.state.icon || 'chevron-down';
	}
	toggle() {
		if (this.state.disabled || !this.state.toggleable) {
			return;
		}
		const nextOpen = !this.state.open;
		this.state.open = nextOpen;
		this.emit('fieldset:toggle', {
			open: nextOpen,
		});
	}
	handleTrigger() {
		this.toggle();
	}
	render() {
		const toggleable = this.state.toggleable === true;
		const isOpen = this.state.open !== false;
		const bodyOpen = !toggleable || isOpen;
		this.html`
			<fieldset class="fs"
				?data-toggleable=${toggleable}
				?data-open=${bodyOpen}
				?data-disabled=${this.state.disabled}
				?data-icon-swap=${this.usesIconSwap}>
				<legend class="fs-legend" id=${this.legendId}>
					<button type="button" class="fs-trigger"
						?hidden=${!toggleable}
						?disabled=${this.state.disabled}
						aria-expanded=${isOpen ? 'true' : 'false'}
						aria-controls=${this.panelId}
						@click=${this.handleTrigger}>
						<span class="fs-heading">${this.state.heading}</span>
						<ui-icon class="fs-chevron" .state.name=${this.toggleIconName} .state.size=${'sm'}></ui-icon>
					</button>
					<span class="fs-heading fs-static" ?hidden=${toggleable}>${this.state.heading}</span>
				</legend>
				<div class="fs-body" id=${this.panelId} role="region" aria-labelledby=${this.legendId} ?inert=${!bodyOpen}>
					<div class="fs-inner"><slot></slot></div>
				</div>
			</fieldset>
		`;
	}
}
customElements.define('ui-fieldset', UIFieldset);
