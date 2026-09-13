/*
	DESCRIPTION: ui-scroll-area — overflow container with themed scrollbars
	(Scroll Area). maxHeight bounds the box; orientation vertical|horizontal|both.
*/
import { classList, WebComponent } from 'webcomponent';
export class UIScrollArea extends WebComponent {
	static url = import.meta.url;
	static styles = {
		scrollArea: './scroll-area.css',
	};
	static state = {
		// CSS length, e.g. '16rem' | 320 (px)
		maxHeight: '16rem',
		// vertical | horizontal | both
		orientation: 'vertical',
		/*
		 * Soft-mask the scrolling edges so clipped content reads as CONTINUING
		 * rather than ending. Themed scrollbars are thin and, on a trackpad,
		 * usually hidden until you move — without this the box gives no sign it
		 * scrolls at all, which is the complaint this answers.
		 *
		 *   'none'  no mask
		 *   'both'  (default) fade the leading AND trailing edge
		 *   'start' | 'end'   fade one edge only
		 *
		 * Painted by the shared `.scroll-fade` utility (uwc.util-scroll-fade), not
		 * a private mask here — one recipe, so a page-level scroller and this
		 * component fade identically.
		 */
		fade: 'both',
	};
	/*
	 * The bound goes on the element that actually SCROLLS. It used to sit on the
	 * outer `.scroll-area` with the viewport picking it up via
	 * `max-block-size: inherit` — but max-block-size is not an inherited
	 * property, so that only ever worked by copying the parent's used value and
	 * broke the moment the outer box was sized by anything else.
	 */
	viewportStyle() {
		const maxHeight = this.state.maxHeight;
		if (maxHeight == null || maxHeight === false || maxHeight === '') {
			return '';
		}
		const value = typeof maxHeight === 'number' ? `${maxHeight}px` : String(maxHeight);
		return `max-block-size:${value}`;
	}
	/*
	 * Which shared fade class the viewport wears. The utility's plain
	 * `.scroll-fade` masks both block edges and `.scroll-fade-x` does the inline
	 * axis, so a horizontal area needs the -x variant for the SAME 'both'.
	 */
	fadeClass() {
		const fade = this.state.fade;
		if (fade === 'none' || fade === false) {
			return '';
		}
		const inline = this.state.orientation === 'horizontal';
		if (fade === 'start' || fade === 'end') {
			return inline ? `scroll-fade-x-${fade}` : `scroll-fade-${fade}`;
		}
		return inline ? 'scroll-fade-x' : 'scroll-fade';
	}
	render() {
		this.html`
			<div class="scroll-area" data-orientation=${this.state.orientation}>
				<div class=${classList('scroll-area-viewport', this.fadeClass)} style=${this.viewportStyle}>
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-scroll-area', UIScrollArea);
