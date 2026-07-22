/*
	DESCRIPTION: ui-card — a STRUCTURED content card (the MUI "Card"): media banner +
	header (avatar · heading/subheading · trailing action) + body + actions row,
	composed on ui-surface for tone/elevation/border/radius. This is the opposite of
	ui-surface (a blank Paper) and distinct from ui-panel (an opinionated id//title
	status panel) and ui-expandable-card (a MorphSurface). Optional regions
	(media/avatar/header-action/actions) auto-collapse via slotchange, so an empty
	slot adds no chrome. `heading`/`subheading` avoid the native `title`/`open`
	prop-name footgun.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-card .state.heading=${'Atlas Rig'} .state.subheading=${'Sector 7'} .state.interactive=${true}>
	    <img slot="media" src="rig.jpg" alt="">
	    <ui-avatar slot="avatar" …></ui-avatar>
	    <ui-icon-button slot="header-action" …></ui-icon-button>
	    Body content goes in the default slot.
	    <div slot="actions"><ui-button>Open</ui-button></div>
	  </ui-card>
	──────────────────────────────────────────────────────────────────────
*/
import '../surface/surface.js';
import { WebComponent } from 'webcomponent';
export class UICard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		card: './card.css',
	};
	static state = {
		heading: '',
		subheading: '',
		interactive: false,
		// Child-state for the composed <ui-surface>; consumers can override any key.
		// Padding is `none` — each card region owns its own padding so media bleeds
		// edge-to-edge while text regions stay inset.
		surfaceState: {
			tone: 'panel',
			padding: 'none',
			radius: 'lg',
			border: true,
			elevation: '1',
		},
	};
	onMount() {
		// Empty optional regions collapse: toggle `hidden` on each wrapper from its
		// slot's assigned elements, so no media/avatar/action chrome shows unfilled.
		// Use #refs (lowercased) instead of querySelector per UWC modern practice.
		const wraps = [
			'mediawrap', 'avatarwrap', 'headeractionwrap', 'actionswrap',
		];
		for (let index = 0; index < wraps.length; index += 1) {
			this.wireCollapse(this.refs[wraps[index]]);
		}
	}
	wireCollapse(wrap) {
		const slot = wrap?.querySelector('slot');
		if (!slot) {
			return;
		}
		const sync = () => {
			wrap.toggleAttribute('hidden', slot.assignedElements().length === 0);
		};
		slot.addEventListener('slotchange', sync);
		sync();
	}
	render() {
		const surfaceState = {
			...this.state.surfaceState,
			interactive: this.state.interactive,
		};
		const hasHead = Boolean(this.state.heading || this.state.subheading);
		this.html`
			<ui-surface .state=${surfaceState}>
				<article class="card" ?data-interactive=${this.state.interactive}>
					<div class="card-media" #mediawrap><slot name="media"></slot></div>
					<header class="card-header" ?data-show=${hasHead}>
						<div class="card-avatar" #avatarwrap><slot name="avatar"></slot></div>
						<div class="card-heads">
							<h3 class="card-heading">${this.state.heading}</h3>
							<p class="card-subheading">${this.state.subheading}</p>
						</div>
						<div class="card-header-action" #headeractionwrap><slot name="header-action"></slot></div>
					</header>
					<div class="card-body"><slot></slot></div>
					<div class="card-actions" #actionswrap><slot name="actions"></slot></div>
				</article>
			</ui-surface>
		`;
	}
}
customElements.define('ui-card', UICard);
