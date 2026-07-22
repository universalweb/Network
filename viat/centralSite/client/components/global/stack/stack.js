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
	render() {
		/* All dims are enumerated/boolean → data-* attributes (stack.css decorates
		   them). Notably `gap-*` as a class collided with the uwc.util `.gap-*`
		   spacing utilities; `[data-gap]` is immune. */
		this.html`
			<div
				class="stack"
				data-dir=${this.state.direction}
				data-gap=${this.state.gap}
				data-align=${this.state.align}
				data-justify=${this.state.justify}
				?data-wrap=${this.state.wrap}
				?data-inline=${this.state.inline}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-stack', UIStack);
