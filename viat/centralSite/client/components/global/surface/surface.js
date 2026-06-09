import { WebComponent, classList } from '../../core/index.js';
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
	render() {
		
		this.html `
			<div class=${classList(
				'surface',
				() => {
					return `tone-${this.state.tone}`;
				},
				() => {
					return `pad-${this.state.padding}`;
				},
				() => {
					return `radius-${this.state.radius}`;
				},
				() => {
					return `elev-${this.state.elevation}`;
				},
				() => {
					return this.state.border && 'has-border';
				},
				() => {
					return this.state.interactive && 'is-interactive';
				}
			)}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-surface', UISurface);
