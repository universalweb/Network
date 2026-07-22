import '../icon/icon.js';
import { MorphSurface } from '../morph-surface/morph-surface.js';
// `<ui-morph-drawer>` — a right-edge drawer that FLIES OUT of its trigger and grows
// into a full-height panel (rather than a plain edge slide), then shrinks back into
// the trigger on close. Inherits morph/dismiss from MorphSurface; the drawer is pinned
// to the edge in CSS, so positioning is a no-op (the morph grows it from the trigger
// rect). A touch slower than the panel to suit the larger travel.
//
// Usage:
//   <ui-morph-drawer .state.label=${'Details ▸'} .state.heading=${'Node details'}>
//     …drawer content…
//   </ui-morph-drawer>
export class UIMorphDrawer extends MorphSurface {
	static url = import.meta.url;
	static styles = {
		morphDrawer: './morph-drawer.css',
	};
	static state = {
		label: 'Open',
		heading: '',
	};
	// Bigger travel → a slightly longer, settled spring.
	openDuration() {
		return 420;
	}
	closeDuration() {
		return 300;
	}
	// The drawer is pinned to the viewport edge by CSS; there's nothing to anchor to
	// the trigger. The morph still grows it from `fromRect()` (the trigger).
	positionSurface() {}
	render() {
		this.html`
			<button
				class="dr-trigger"
				type="button"
				#trigger
				aria-haspopup="dialog"
				aria-expanded=${() => {
					return this.state.open ? 'true' : 'false';
				}}
				@click=${this.handleTriggerClick}>
				<slot name="trigger">${this.state.label}</slot>
			</button>
			<div class="dr-overlay" #overlay>
				<div class="dr-backdrop" @click=${this.handleBackdropClick}></div>
				<aside class="dr-surface" #surface role="dialog" aria-label=${this.state.heading}>
					<header class="dr-head">
						<span class="dr-title">${this.state.heading}</span>
						<button class="dr-close" type="button" aria-label="Close" @click=${this.handleCloseClick}>
							<ui-icon .state.name=${'x'} .state.size=${'sm'}></ui-icon>
						</button>
					</header>
					<div class="dr-body"><slot></slot></div>
				</aside>
			</div>
		`;
	}
}
customElements.define('ui-morph-drawer', UIMorphDrawer);
