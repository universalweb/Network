/*
	DESCRIPTION: ui-parallax — declarative host for core Parallax.
	Slots default content onto a surface that translate3d-shifts with scroll.
	factor · axis (y|x). Uses this.parallax() (auto-cleaned on disconnect).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-parallax .state.factor=${0.25}>
	    <ui-card>Layer</ui-card>
	  </ui-parallax>
	  // or any element: <div parallax="0.2">…</div>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import { WebComponent } from 'webcomponent';
export class UIParallax extends WebComponent {
	static url = import.meta.url;
	static styles = {
		parallax: './parallax.css',
	};
	static state = {
		factor: 0.18,
		axis: 'y',
	};
	layer = null;
	onMount() {
		this.layer = this.parallax(this.refs.surface, {
			factor: this.state.factor,
			axis: this.state.axis === 'x' ? 'x' : 'y',
			scroller: 'nearest',
		});
		this.observe([
			'factor',
			'axis',
		], this.syncLayer);
	}
	syncLayer() {
		if (!this.layer) {
			return;
		}
		const factor = Number(this.state.factor);
		this.layer.factor = Number.isFinite(factor) ? factor : 0.18;
		this.layer.axis = this.state.axis === 'x' ? 'x' : 'y';
		this.layer.applyShift();
	}
	render() {
		this.html`
			<div class="px-surface" #surface>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-parallax', UIParallax);
