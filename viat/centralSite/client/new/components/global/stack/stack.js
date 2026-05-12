import { WebComponent } from '../../core/index.js';
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
	get hostClass() {
		const parts = [
			'stack',
			`dir-${this.state.direction}`,
			`gap-${this.state.gap}`,
			`align-${this.state.align}`,
			`justify-${this.state.justify}`,
		];
		if (this.state.wrap) {
			parts.push('is-wrap');
		}
		if (this.state.inline) {
			parts.push('is-inline');
		}
		return parts.join(' ');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="${() => this.hostClass}">
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-stack', UIStack);
