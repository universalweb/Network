import { WebComponent, classList } from '../../core/index.js';
export class UIText extends WebComponent {
	static url = import.meta.url;
	static styles = {
		text: './text.css',
	};
	static state = {
		variant: 'body',
		tone: 'default',
		align: 'start',
		weight: '',
		truncate: false,
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<span class=${classList(
				'text',
				() => {
					return `var-${this.state.variant}`;
				},
				() => {
					return `tone-${this.state.tone}`;
				},
				() => {
					return `align-${this.state.align}`;
				},
				() => {
					return this.state.weight && `weight-${this.state.weight}`;
				},
				() => {
					return this.state.truncate && 'is-truncate';
				}
			)}><slot></slot></span>
		`;
	}
}
customElements.define('ui-text', UIText);
