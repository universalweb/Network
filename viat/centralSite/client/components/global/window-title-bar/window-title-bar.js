import '../bar/bar.js';
import { WebComponent } from 'webcomponent';
/*
 * `<ui-window-title-bar>` — OS-window chrome strip. Composes `<ui-bar>`.
 * Buttons live on ONE side (`side` start | end — never both). Heading sits
 * `place` center | opposite the buttons. Policy (which buttons, labels,
 * window min/max/close) belongs to the caller.
 *
 *   <ui-window-title-bar .state.heading=${'Settings'} .state.side=${'end'}>
 *     <ui-close-button @close-button:click=${this.handleClose}></ui-close-button>
 *   </ui-window-title-bar>
 *
 * Author: Universal Web
 * Date: 2026-08-21
 */
export class UIWindowTitleBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		windowTitleBar: './window-title-bar.css',
	};
	static state = {
		heading: '',
		side: 'end',
		place: 'opposite',
		cap: 'start',
	};
	onConnect() {
		this.observe([
			'side', 'place', 'cap',
		], this.syncLayout);
		this.syncLayout();
	}
	/*
	 * `cap` is reflected to the HOST and styled there — it is deliberately NOT
	 * forwarded to the composed <ui-bar>. Passing it made ui-bar draw its own
	 * corner inside the host's, so the same curve was computed in three places
	 * and only agreed by coincidence.
	 */
	syncLayout() {
		this.dataset.side = this.controlsSlotName();
		this.dataset.place = this.state.place === 'center' ? 'center' : 'opposite';
		const cap = this.state.cap || 'start';
		if (cap === 'start' || cap === 'end') {
			this.dataset.cap = cap;
		} else {
			this.removeAttribute('data-cap');
		}
	}
	controlsSlotName() {
		return this.state.side === 'start' ? 'start' : 'end';
	}
	headingSlotName() {
		if (this.state.place === 'center') {
			return 'center';
		}
		if (this.state.side === 'start') {
			return 'end';
		}
		return 'start';
	}
	headingMuted() {
		const heading = this.state.heading;
		return typeof heading !== 'string' || heading.length === 0;
	}
	render() {
		this.html`
			<ui-bar class="title-bar" .state.orientation=${'horizontal'}>
				<span
					class="title-bar-heading"
					slot=${this.headingSlotName}
					?hidden=${this.headingMuted}>${this.state.heading}</span>
				<div class="title-bar-controls" slot=${this.controlsSlotName}>
					<slot></slot>
				</div>
			</ui-bar>
		`;
	}
}
customElements.define('ui-window-title-bar', UIWindowTitleBar);
