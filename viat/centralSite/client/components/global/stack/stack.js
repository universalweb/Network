/*
	DESCRIPTION: ui-stack — flex layout primitive.
	Primary axis API: orientation horizontal | vertical (+ reverse).
	Legacy direction still accepted (row/column/… or horizontal/vertical).
	All dims ride as data-* so they never collide with uwc.util class utilities
	(layer order: util BEATS components).
*/
import { WebComponent } from 'webcomponent';
/* Map state → flex-direction token for data-dir. */
function resolveDirection(state) {
	const raw = state.direction;
	// Explicit flex-direction still wins (full control / reverse forms).
	if (
		raw === 'row' ||
		raw === 'row-reverse' ||
		raw === 'column' ||
		raw === 'column-reverse'
	) {
		return raw;
	}
	// direction may also carry the orientation synonym.
	let horizontal = state.orientation === 'horizontal';
	if (raw === 'horizontal') {
		horizontal = true;
	} else if (raw === 'vertical') {
		horizontal = false;
	}
	if (horizontal) {
		return state.reverse ? 'row-reverse' : 'row';
	}
	return state.reverse ? 'column-reverse' : 'column';
}
export class UIStack extends WebComponent {
	static url = import.meta.url;
	static styles = {
		stack: './stack.css',
	};
	static state = {
		/*
		 * Axis: horizontal (row) | vertical (column). Preferred over raw direction
		 * for everyday layout — pair with reverse for *-reverse flex.
		 */
		orientation: 'vertical',
		// Flip the main axis (row-reverse / column-reverse).
		reverse: false,
		/*
		 * Optional override: full flex-direction, or the synonyms
		 * horizontal/vertical. Empty string → use orientation + reverse.
		 */
		direction: '',
		gap: 'md',
		align: 'stretch',
		justify: 'start',
		wrap: false,
		inline: false,
	};
	/*
	 * Resolved flex-direction for data-dir. Bare method so the patch pass
	 * re-reads orientation/reverse/direction.
	 */
	dir() {
		return resolveDirection(this.state);
	}
	render() {
		this.html`
			<div
				data-dir=${this.dir}
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
