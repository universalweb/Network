import '../icon/icon.js';
import '../switch/switch.js';
import { WebComponent } from 'webcomponent';
/*
 * Switch-row for secondary control-center settings (volume-like toggles).
 */
export class ControlCenterRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		controlCenterRow: './control-center-row.css',
	};
	static state = {
		itemId: '',
		label: '',
		icon: '',
		description: '',
		checked: false,
		disabled: false,
	};
	handleSwitchChange(domEvent) {
		const checked = Boolean(domEvent.detail?.data?.checked ?? domEvent.detail?.data?.value);
		this.state.checked = checked;
		this.emit('control-center-row:change', {
			id: this.state.itemId,
			item: {
				id: this.state.itemId,
				label: this.state.label,
				icon: this.state.icon,
				description: this.state.description,
				checked,
				disabled: this.state.disabled,
			},
			checked,
		});
	}
	render() {
		this.html`
			<div class="cc-row" ?data-disabled=${this.state.disabled}>
				<span class="cc-row-icon" aria-hidden="true">
					<ui-icon .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
				</span>
				<div class="cc-row-text">
					<span class="cc-row-label">${this.state.label}</span>
					<span class="cc-row-desc" ?hidden=${() => {
						return !this.state.description;
					}}>${this.state.description}</span>
				</div>
				<ui-switch
					.state.checked=${this.state.checked}
					.state.disabled=${this.state.disabled}
					@switch:change=${this.handleSwitchChange}></ui-switch>
			</div>
		`;
	}
}
customElements.define('ui-control-center-row', ControlCenterRow);
