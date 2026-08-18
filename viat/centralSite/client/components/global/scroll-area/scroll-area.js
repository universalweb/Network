/*
	DESCRIPTION: ui-scroll-area — overflow container with themed scrollbars
	(Scroll Area). maxHeight bounds the box; orientation vertical|horizontal|both.
*/
import { WebComponent } from 'webcomponent';
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
	};
	boxStyle() {
		const maxHeight = this.state.maxHeight;
		if (maxHeight == null || maxHeight === false || maxHeight === '') {
			return '';
		}
		const value = typeof maxHeight === 'number' ? `${maxHeight}px` : String(maxHeight);
		return `max-block-size:${value}`;
	}
	render() {
		this.html`
			<div class="sa" data-orientation=${this.state.orientation} style=${this.boxStyle}>
				<div class="sa-viewport">
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-scroll-area', UIScrollArea);
