/*
	DESCRIPTION: ui-fieldset — legend + optional toggleable body.
	Semantic fieldset/legend. Public state key is `legend` (`heading` aliases it).
	When toggleable, the legend is a button that emits fieldset:toggle { open }.
	icon / iconCollapsed swap the indicator; omit both for a rotating chevron.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-fieldset .state.legend=${'Shipping'}>…</ui-fieldset>
	  <ui-fieldset .state.legend=${'Invoice'} .state.toggleable=${true}
	    .state.open=${this.state.open} @fieldset:toggle=${this.onToggle}>
	    …
	  </ui-fieldset>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-21
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
		get legend() {
			return this.state.heading;
		},
		set legend(value) {
			this.state.heading = value;
		},
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
	isBodyOpen() {
		return this.state.toggleable !== true || this.state.open !== false;
	}
	isBodyClosed() {
		return this.state.toggleable === true && this.state.open === false;
	}
	expandedFlag() {
		if (this.state.open === false) {
			return 'false';
		}
		return 'true';
	}
	toggleIconName() {
		if (this.state.open === false) {
			return this.state.iconCollapsed || this.state.icon || 'chevron-down';
		}
		return this.state.icon || 'chevron-down';
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
		this.html`
			<fieldset class="fieldset"
				?data-toggleable=${this.state.toggleable === true}
				?data-open=${this.isBodyOpen}
				?data-disabled=${this.state.disabled}
				?data-icon-swap=${this.usesIconSwap}>
				<legend class="fieldset-legend" id=${this.legendId}>
					<button type="button" class="fieldset-trigger"
						?hidden=${this.state.toggleable !== true}
						?disabled=${this.state.disabled}
						aria-expanded=${this.expandedFlag}
						aria-controls=${this.panelId}
						@click=${this.handleTrigger}>
						<span class="fieldset-label">${this.state.heading}</span>
						<ui-icon class="fieldset-chevron" aria-hidden="true" .state.name=${this.toggleIconName} .state.size=${'sm'}></ui-icon>
					</button>
					<span class="fieldset-label fieldset-static" ?hidden=${this.state.toggleable === true}>${this.state.heading}</span>
				</legend>
				<div class="fieldset-body" id=${this.panelId} role="region" aria-labelledby=${this.legendId} ?inert=${this.isBodyClosed}>
					<div class="fieldset-inner"><slot></slot></div>
				</div>
			</fieldset>
		`;
	}
}
customElements.define('ui-fieldset', UIFieldset);
