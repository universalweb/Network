/*
	DESCRIPTION: ui-divider — a separator rule (the MUI "Divider" gap). Horizontal
	or vertical, solid/dashed, optional inset, and an optional centred LABEL
	("…  OR  …"). The label/line structure is always rendered; CSS collapses it to a
	bare rule when there's no label, so the same element serves both modes without a
	`^html` branch. `label` is text-interpolated (escaped) — no raw injection.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-divider></ui-divider>
	  <ui-divider .state.label=${'OR'}></ui-divider>
	  <ui-divider .state.orientation=${'vertical'}></ui-divider>
	  <ui-divider .state.variant=${'dashed'} .state.inset=${'both'}></ui-divider>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
export class UIDivider extends WebComponent {
	static url = import.meta.url;
	static styles = {
		divider: './divider.css',
	};
	static state = {
		// Enumerated dims ride as data-* attributes (the surface/badge doctrine):
		// a `[data-*]` selector can't be hijacked by the uwc.util class utilities.
		orientation: 'horizontal',
		variant: 'solid',
		inset: 'none',
		label: '',
	};
	render() {
		// A label only lays out on the horizontal axis; a vertical divider is always a
		// bare rule. `?data-labeled` flips the inner layout from rule → flex-with-text.
		const labeled = this.state.orientation === 'horizontal' && this.state.label !== '';
		this.html`
			<div class="divider"
				data-orientation=${this.state.orientation}
				data-variant=${this.state.variant}
				data-inset=${this.state.inset}
				?data-labeled=${labeled}
				role="separator"
				aria-orientation=${this.state.orientation}>
				<span class="divider-line" aria-hidden="true"></span>
				<span class="divider-label">${this.state.label}</span>
				<span class="divider-line" aria-hidden="true"></span>
			</div>
		`;
	}
}
customElements.define('ui-divider', UIDivider);
