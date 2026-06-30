/*
	DESCRIPTION: ui-fab — a floating action button. A thin composition over ui-button
	(NOT a reimplementation): it sets `--ui-btn-radius: 999px` (a custom property that
	pierces the shadow boundary into the framework button sheet) for the circular
	shape, adds elevation, and fixes the button to a viewport corner via an inner
	`position: fixed` wrapper — so the host stays `display: contents` and no
	imperative host-attribute reflection is needed. `extended` swaps the icon-only
	circle for an icon+label pill. The icon is passed as `.leadicon=` so ui-button
	renders it through the property accessor (a string `<ui-icon name=…>` would be blank).
	── EVENTS ───────────────────────────────────────────────────────────
	  fab:click { source }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-fab .icon=${'plus'} .label=${'New'} @fab:click=${this.create}></ui-fab>
	  <ui-fab .icon=${'edit'} .label=${'Compose'} .extended=${true} .position=${'bottom-start'}></ui-fab>
	  <ui-fab .icon=${'plus'} .position=${'static'}></ui-fab>   <!-- inline, not fixed -->
	──────────────────────────────────────────────────────────────────────
*/
import '../button/button.js';
import { WebComponent } from '../../core/index.js';
export class UIFab extends WebComponent {
	static url = import.meta.url;
	static styles = {
		fab: './fab.css',
	};
	static state = {
		icon: '',
		label: '',
		tone: 'primary',
		size: 'lg',
		extended: false,
		// bottom-end (default) · bottom-start · top-end · top-start · static (inline)
		position: 'bottom-end',
		disabled: false,
	};
	handleClick(domEvent) {
		// Swallow the composed button's bubbling buttonClick so only fab:click surfaces.
		domEvent.stopPropagation();
		this.emit('fab:click', {
			source: this,
		});
	}
	render() {
		// Label only shows in the extended pill; otherwise it becomes the a11y tooltip.
		const label = this.state.extended ? this.state.label : '';
		this.html `
			<div class="fab" data-position=${this.state.position} ?data-extended=${this.state.extended}>
				<ui-button
					class="fab-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${this.state.size}
					.state.leadicon=${this.state.icon}
					.state.label=${label}
					.state.tooltip=${this.state.extended ? '' : this.state.label}
					.state.disabled=${this.state.disabled}
					@buttonClick=${this.handleClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-fab', UIFab);
