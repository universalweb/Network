import { html, WebComponent } from '../../core/index.js';
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
		// Structural line keys for list() — rebuilt when lines/variant change.
		lineItems: [],
	};
	onConnect() {
		this.observe('lines', this.syncLines);
		this.observe('variant', this.syncLines);
		this.syncLines();
	}
	/* Pure-display bars: list of light rows (no ^html string builder). Multi-line
	   text variant tapers the last line to 70%; other variants are one bar. */
	syncLines() {
		const multi = this.state.variant === 'text' && Number(this.state.lines) > 1;
		const count = multi ? Math.max(1, Number(this.state.lines) || 1) : 1;
		const next = [];
		for (let index = 0; index < count; index += 1) {
			next.push({
				id: index,
				taper: multi && index === count - 1,
			});
		}
		this.state.lineItems = next;
	}
	lineRow(item) {
		const width = item.taper ? '70%' : this.state.width;
		const style = `width:${width};height:${this.state.height};border-radius:${this.state.radius}`;
		return html`<span class="skeleton-line" style=${style}></span>`;
	}
	lineKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<div class="skeleton" data-variant=${this.state.variant} aria-busy="true" aria-live="polite">
				${this.list('lineItems', this.lineRow, this.lineKey)}
			</div>
		`;
	}
}
customElements.define('ui-skeleton', UISkeleton);
