import '../icon/icon.js';
import { MorphSurface } from '../morph-surface/morph-surface.js';
// `<ui-popover>` — a compact cult-ui popover that morphs out of its trigger. Lighter
// than ui-floating-panel: snappier spring, a transparent click-catcher backdrop (no
// scrim/blur — a popover shouldn't dim the page), an optional small heading, and a
// single content fade rather than a per-part stagger. Inherits all morph/dismiss
// machinery + "anchor under the trigger" positioning from MorphSurface.
//
// Usage:
//   <ui-popover .state.label=${'Account ▾'} .state.heading=${'Signed in as'}>
//     …popover content…
//   </ui-popover>
export class UIPopover extends MorphSurface {
	static url = import.meta.url;
	static styles = {
		popover: './popover.css',
	};
	static state = {
		label: 'Open',
		heading: '',
	};
	// Snappier than the panel — cult-ui popover spring is tighter (bounce ~0.05).
	openDuration() {
		return 300;
	}
	closeDuration() {
		return 200;
	}
	render() {
		this.html`
			<button
				class="pp-trigger"
				type="button"
				#trigger
				aria-haspopup="dialog"
				aria-expanded=${() => {
					return this.state.open ? 'true' : 'false';
				}}
				@click=${this.handleTriggerClick}>
				<slot name="trigger">${this.state.label}</slot>
			</button>
			<div class="pp-overlay" #overlay>
				<div class="pp-backdrop" @click=${this.handleBackdropClick}></div>
				<div class="pp-surface" #surface role="dialog" aria-label=${this.state.heading}>
					<div class="pp-heading" ?hidden=${() => {
						return !this.state.heading;
					}}>${this.state.heading}</div>
					<div class="pp-body"><slot></slot></div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-popover', UIPopover);
