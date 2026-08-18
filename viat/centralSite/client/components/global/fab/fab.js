/*
	DESCRIPTION: ui-fab — a floating action button. Thin composition over ui-button:
	`.state.circle` for the icon-only disc (pill radius when extended), elevation,
	and a viewport corner via an inner `position: fixed` wrapper — host stays
	`display: contents`. `extended` swaps the icon-only circle for an icon+label
	pill. Icon via `.leadicon=` (property channel — string `<ui-icon name=…>` is blank).
	── EVENTS ───────────────────────────────────────────────────────────
	  fab:click {} (emitter under event.detail.source)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-fab .state.icon=${'plus'} .state.label=${'New'} @fab:click=${this.create}></ui-fab>
	  <ui-fab .state.icon=${'edit'} .state.label=${'Compose'} .state.extended=${true} .state.position=${'bottom-start'}></ui-fab>
	  <ui-fab .state.icon=${'plus'} .state.position=${'static'}></ui-fab>   <!-- inline, not fixed -->
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
		// Swallow the composed button's bubbling button:click so only fab:click surfaces.
		domEvent.stopPropagation();
		this.emit('fab:click', {});
	}
	render() {
		// Label only shows in the extended pill; otherwise it becomes the a11y tooltip.
		const label = this.state.extended ? this.state.label : '';
		this.html`
			<div class="fab" data-position=${this.state.position} ?data-extended=${this.state.extended}>
				<ui-button
					class="fab-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${this.state.size}
					.state.circle=${!this.state.extended}
					.state.leadicon=${this.state.icon}
					.state.label=${label}
					.state.tooltip=${this.state.extended ? '' : this.state.label}
					.state.disabled=${this.state.disabled}
					@button:click=${this.handleClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-fab', UIFab);
