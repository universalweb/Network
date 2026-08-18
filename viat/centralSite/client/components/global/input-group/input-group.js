/*
	DESCRIPTION: ui-input-group — clusters leading/trailing addons around a
	control (Input Group). Slots: leading, default (control), trailing.
	One continuous field surface; unused addons collapse (no phantom gap).
*/
import { WebComponent } from 'webcomponent';
export class UIInputGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		inputGroup: './input-group.css',
	};
	static state = {
		size: 'md',
		// default | error
		tone: 'default',
		disabled: false,
	};
	onRendered() {
		this.wireSlots();
		this.syncAddonFlags();
	}
	wireSlots() {
		if (this.slotsWired) {
			return;
		}
		const lead = this.refs.lead;
		const trail = this.refs.trail;
		if (!lead || !trail) {
			return;
		}
		this.slotsWired = true;
		this.addEvent('slotchange', this.syncAddonFlags, lead);
		this.addEvent('slotchange', this.syncAddonFlags, trail);
	}
	syncAddonFlags() {
		const leadCount = this.refs.lead?.assignedNodes({
			flatten: true,
		})?.length ?? 0;
		const trailCount = this.refs.trail?.assignedNodes({
			flatten: true,
		})?.length ?? 0;
		this.toggleAttribute('data-has-leading', leadCount > 0);
		this.toggleAttribute('data-has-trailing', trailCount > 0);
	}
	render() {
		this.dataset.tone = this.state.tone || 'default';
		this.html`
			<div class="ig" data-size=${this.state.size} data-tone=${this.state.tone}
				?data-disabled=${this.state.disabled}>
				<span class="ig-addon ig-leading"><slot #lead name="leading"></slot></span>
				<div class="ig-control"><slot></slot></div>
				<span class="ig-addon ig-trailing"><slot #trail name="trailing"></slot></span>
			</div>
		`;
	}
}
customElements.define('ui-input-group', UIInputGroup);
