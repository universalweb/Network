import '../icon/icon.js';
import { MorphSurface } from '../morph-surface/morph-surface.js';
// `<ui-expandable-card>` — a cult-ui card that expands IN PLACE: the collapsed card is
// the trigger, and an expanded surface morphs out of the card's OWN rect (not a
// separate anchor), covering it, then shrinks back in on close. The card never moves,
// so there's no layout shift. Inherits morph/dismiss from MorphSurface; overrides
// positioning to anchor the expanded surface at the card's top-left and carry its
// width as the expanded floor.
//
// Usage:
//   <ui-expandable-card .state.heading=${'Network node'} .state.summary=${'3 peers · 12ms'}>
//     …expanded detail…
//   </ui-expandable-card>
export class UIExpandableCard extends MorphSurface {
	static url = import.meta.url;
	static styles = {
		expandableCard: './expandable-card.css',
	};
	static state = {
		heading: '',
		summary: '',
	};
	// Anchor the expanded surface over the card (its top-left, not below it) and pass
	// the card's width as the expanded min so it grows OUT of the card cleanly.
	// Containing-block-relative (subtract overlay origin) — robust under transforms.
	positionSurface() {
		const overlay = this.refs.overlay;
		const surface = this.refs.surface;
		if (!overlay || !surface) {
			return;
		}
		const rect = this.fromRect();
		const overlayBox = overlay.getBoundingClientRect();
		surface.style.setProperty('--ms-anchor-top', `${rect.top - overlayBox.top}px`);
		surface.style.setProperty('--ms-anchor-left', `${rect.left - overlayBox.left}px`);
		surface.style.setProperty('--expandable-card-card-w', `${rect.width}px`);
	}
	render() {
		this.html`
			<button
				class="expandable-card-card"
				type="button"
				data-hover=${'glow'}
				#trigger
				aria-expanded=${() => {
					return this.state.open ? 'true' : 'false';
				}}
				@click=${this.handleTriggerClick}>
				<div class="expandable-card-card-head">
					<span class="expandable-card-card-title">${this.state.heading}</span>
					<ui-icon class="expandable-card-card-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</div>
				<p class="expandable-card-card-summary">${this.state.summary}</p>
			</button>
			<div class="expandable-card-overlay" #overlay popover="manual">
				<div class="expandable-card-backdrop" @click=${this.handleBackdropClick}></div>
				<div class="expandable-card-surface glass" #surface role="dialog" aria-label=${this.state.heading}>
					<header class="expandable-card-head">
						<span class="expandable-card-title">${this.state.heading}</span>
						<button class="expandable-card-close" type="button" aria-label="Close" @click=${this.handleCloseClick}>
							<ui-icon .state.name=${'x'} .state.size=${'sm'}></ui-icon>
						</button>
					</header>
					<div class="expandable-card-body"><slot></slot></div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-expandable-card', UIExpandableCard);
