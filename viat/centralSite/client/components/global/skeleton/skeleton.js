import { WebComponent, classList } from '../../core/index.js';
export class UISkeleton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		skeleton: './skeleton.css',
	};
	static state = {
		height: '1em',
		lines: 1,
		radius: '4px',
		variant: 'text',
		width: '100%',
	};
	get isMulti() {
		return this.state.variant === 'text' && this.state.lines > 1;
	}
	get singleStyle() {
		return `width:${this.state.width};height:${this.state.height};border-radius:${this.state.radius}`;
	}
	renderLines() {
		const out = [];
		for (let index = 0; index < this.state.lines; index++) {
			const lineWidth = index === this.state.lines - 1 ? '70%' : '100%';
			out.push(`<span class="skeleton-line" style="width:${lineWidth};height:${this.state.height};border-radius:${this.state.radius}"></span>`);
		}
		return out.join('');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${classList('skeleton', () => {
				return `variant-${this.state.variant}`;
			})} aria-busy="true" aria-live="polite">
				^html${() => {
					return (this.isMulti ? this.renderLines() : `<span class="skeleton-line" style="${this.singleStyle}"></span>`);
				}}
			</div>
		`;
	}
}
customElements.define('ui-skeleton', UISkeleton);
