import { WebComponent } from '../../core/index.js';
export class UISkeleton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		skeleton: './skeleton.css',
	};
	static state = {
		height: '1em',
		lines: 1,
		radius: '0.25rem',
		variant: 'text',
		width: '100%',
	};
	/* Raw placeholder markup (pure display, no interactivity) → an `^html` string is
	   correct here; a list()/child would be overkill for non-reactive bars. Multi-line
	   text variant taper the last line to 70%; every other variant is a single bar at
	   the requested width. Called as a bare method ref, so its state reads are tracked. */
	renderMarkup() {
		const {
			variant, lines, width, height, radius,
		} = this.state;
		if (variant !== 'text' || lines <= 1) {
			return `<span class="skeleton-line" style="width:${width};height:${height};border-radius:${radius}"></span>`;
		}
		let markup = '';
		for (let index = 0; index < lines; index++) {
			const lineWidth = index === lines - 1 ? '70%' : '100%';
			markup += `<span class="skeleton-line" style="width:${lineWidth};height:${height};border-radius:${radius}"></span>`;
		}
		return markup;
	}
	render() {
		this.html `
			<div class="skeleton" data-variant=${this.state.variant} aria-busy="true" aria-live="polite">
				^html${this.renderMarkup}
			</div>
		`;
	}
}
customElements.define('ui-skeleton', UISkeleton);
