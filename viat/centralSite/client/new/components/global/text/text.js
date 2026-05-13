import { WebComponent } from '../../core/index.js';
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
	get hostClass() {
		const parts = [
			'text', `var-${this.state.variant}`, `tone-${this.state.tone}`, `align-${this.state.align}`,
		];
		if (this.state.weight) {
			parts.push(`weight-${this.state.weight}`);
		}
		if (this.state.truncate) {
			parts.push('is-truncate');
		}
		return parts.join(' ');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<span class="${() => {
				return this.hostClass;
			}}"><slot></slot></span>
		`;
	}
}
customElements.define('ui-text', UIText);
