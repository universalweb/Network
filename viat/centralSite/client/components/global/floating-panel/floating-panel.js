import '../icon/icon.js';
import { MorphSurface } from '../morph-surface/morph-surface.js';
// `<ui-floating-panel>` — a cult-ui-style surface that GROWS OUT of its trigger and
// shrinks back into it. All morph/dismiss/anchor machinery lives in `MorphSurface`;
// this only supplies the trigger + panel markup and inherits the base's "anchor under
// the trigger" positioning + default spring. The overlay stays in THIS shadow (NOT a
// `<portal>` — that would orphan the panel's <slot>); `position: fixed` already
// escapes ancestor overflow. The container springs while header/body/footer stagger
// in over it (CSS) — cult-ui's container-vs-content decomposition.
//
// Usage:
//   <ui-floating-panel .state.label=${'Filters ▾'} .state.heading=${'Filter results'} .state.footer=${true}>
//     …panel body…
//     <div slot="footer">…actions…</div>
//   </ui-floating-panel>
// NB: the panel-title prop is `heading`, NOT `title` — `title` is a native
// HTMLElement property (the tooltip), so `.title=` would never reach state.
export class UIFloatingPanel extends MorphSurface {
	static url = import.meta.url;
	static styles = {
		floatingPanel: './floating-panel.css',
	};
	// Merges over the base `{ open }` via the framework's static-state chain-merge.
	static state = {
		label: 'Open',
		heading: '',
		footer: false,
	};
	render() {
		this.html`
			<button
				class="fp-trigger"
				type="button"
				#trigger
				aria-haspopup="dialog"
				aria-expanded=${() => {
					return this.state.open ? 'true' : 'false';
				}}
				@click=${this.handleTriggerClick}>
				<slot name="trigger">${this.state.label}</slot>
			</button>
			<div class="fp-overlay" #overlay>
				<div class="fp-backdrop" @click=${this.handleBackdropClick}></div>
				<div class="fp-panel" #surface role="dialog" aria-label=${this.state.heading}>
					<header class="fp-head">
						<span class="fp-title">${this.state.heading}</span>
						<button class="fp-close" type="button" aria-label="Close" @click=${this.handleCloseClick}>
							<ui-icon .state.name=${'x'} .state.size=${'sm'}></ui-icon>
						</button>
					</header>
					<div class="fp-body"><slot></slot></div>
					<footer class="fp-foot" ?hidden=${() => {
						return !this.state.footer;
					}}><slot name="footer"></slot></footer>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-floating-panel', UIFloatingPanel);
