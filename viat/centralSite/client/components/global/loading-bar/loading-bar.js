/*
	DESCRIPTION: ui-loading-bar — unknown-percent activity.
	Composes <ui-progress> in indeterminate mode. Default is the segmented
	fill-wave (same cells as progress). A continuous sweep is available via
	segmentShape: 'none'. This is NOT a determinate progress bar.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-loading-bar .state.label=${'Working'}></ui-loading-bar>
	  <ui-loading-bar .state.segmentShape=${'none'} .state.variant=${'liquid'}></ui-loading-bar>
*/
import '../progress/progress.js';
import { WebComponent } from 'webcomponent';
export class UILoadingBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		loadingBar: './loading-bar.css',
	};
	static state = {
		label: '',
		indeterminate: true,
		tone: 'accent',
		size: 'md',
		variant: 'solid',
		segmentShape: 'round',
		segments: 16,
		trackFit: 'fill',
	};
	render() {
		this.html`
			<ui-progress
				.state.indeterminate=${true}
				.state.showValue=${false}
				.state.animated=${true}
				.state.label=${this.state.label}
				.state.tone=${this.state.tone || 'accent'}
				.state.size=${this.state.size || 'md'}
				.state.variant=${this.state.variant || 'solid'}
				.state.segmentShape=${this.state.segmentShape || 'round'}
				.state.segments=${this.state.segments}
				.state.trackFit=${this.state.trackFit || 'fill'}
				aria-label=${this.state.label || 'Loading'}></ui-progress>
		`;
	}
}
customElements.define('ui-loading-bar', UILoadingBar);
