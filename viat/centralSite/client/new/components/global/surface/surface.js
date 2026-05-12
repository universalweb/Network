import { WebComponent } from '../../core/index.js';
export class UISurface extends WebComponent {
	static url = import.meta.url;
	static styles = {
		surface: './surface.css',
	};
	static state = {
		tone: 'panel',
		padding: 'md',
		radius: 'md',
		elevation: '0',
		border: false,
		interactive: false,
	};
	get hostClass() {
		const parts = [
			'surface', `tone-${this.state.tone}`, `pad-${this.state.padding}`, `radius-${this.state.radius}`, `elev-${this.state.elevation}`,
		];
		if (this.state.border) {
			parts.push('has-border');
		}
		if (this.state.interactive) {
			parts.push('is-interactive');
		}
		return parts.join(' ');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return this.hostClass;
			}}">
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-surface', UISurface);
