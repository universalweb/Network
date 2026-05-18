import { WebComponent, classList } from '../../core/index.js';
export class UIStack extends WebComponent {
	static url = import.meta.url;
	static styles = {
		stack: './stack.css',
	};
	static state = {
		direction: 'column',
		gap: 'md',
		align: 'stretch',
		justify: 'start',
		wrap: false,
		inline: false,
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${classList(
				'stack',
				() => {
					return `dir-${this.state.direction}`;
				},
				() => {
					return `gap-${this.state.gap}`;
				},
				() => {
					return `align-${this.state.align}`;
				},
				() => {
					return `justify-${this.state.justify}`;
				},
				() => {
					return this.state.wrap && 'is-wrap';
				},
				() => {
					return this.state.inline && 'is-inline';
				}
			)}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-stack', UIStack);
