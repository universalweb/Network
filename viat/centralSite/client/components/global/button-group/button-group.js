/*
	DESCRIPTION: ui-button-group — visually attaches a cluster of slotted <ui-button>s
	into one segmented control (shared edges, squared inner corners, collapsed borders).
	Presentation only — no value/selection state (that's ui-toggle-group's job). Works
	across the shadow boundary by setting the inherited `--ui-btn-radius` custom property
	on each slotted button, which its inner <button> honours.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-button-group>
	    <ui-button .state=${{ label: 'Day',   variant: 'outline' }}></ui-button>
	    <ui-button .state=${{ label: 'Week',  variant: 'outline' }}></ui-button>
	    <ui-button .state=${{ label: 'Month', variant: 'outline' }}></ui-button>
	  </ui-button-group>
	  <ui-button-group .state.orientation=${'vertical'}> … </ui-button-group>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
export class UIButtonGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		buttonGroup: './button-group.css',
	};
	static state = {
		orientation: 'horizontal',
	};
	render() {
		this.html`
			<div class="btng" data-orientation=${this.state.orientation} role="group">
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-button-group', UIButtonGroup);
