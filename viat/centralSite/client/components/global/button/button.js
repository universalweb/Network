import { classList, WebComponent } from '../../core/index.js';
import { UIIcon } from '../icon/icon.js';
export class UIButton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		button: './button.css',
	};
	/*
	 * Per-theme RULE overrides live in `./themes/{id}.css`, adopted into the
	 * shadow root by theme (unlayered, so they beat the uwc.base button module).
	 * Dark flattens the icon-variant hover — no wash, no border.
	 */
	static themes = ['dark'];
	static state = {
		tone: 'neutral',
		variant: 'solid',
		size: 'md',
		label: '',
		leadicon: '',
		trailicon: '',
		disabled: false,
		loading: false,
		fullwidth: false,
		// Tooltip text — pass via `.tooltip` / `.state` (NOT a bare `tooltip=`
		// attribute). The global `tooltip=` behavior attaches to whatever element
		// carries it; a bare attribute lands on the HOST, but the inner <button> is
		// the innermost hover target and wins the tooltip service's "latest-entered"
		// race — so it must carry the text itself via `tooltip=${this.state.tooltip}`
		// below. Hence the text has to reach STATE. (`title` is a native HTMLElement
		// property — a `title=`/`.title=` binding sets the OS tooltip and never reaches
		// state, leaving this one empty; that's the trap this key name avoids.)
		tooltip: '',
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? Boolean((state ?? {}).tooltip),
		});
	}
	/*
	 * Lead/trail render as ELEMENTS via htmlElement, never as ^html strings —
	 * a string-built `<ui-icon name="x">` carries a bare HTML attribute, which does
	 * not reach ui-icon's state (there is no attribute→state mirror), so the icon
	 * renders blank. As an element it takes the `.state.name=` channel instead.
	 */
	renderLead() {
		if (this.state.loading) {
			return this.htmlElement`<span class="btn-spinner" aria-hidden="true"></span>`;
		}
		if (this.state.leadicon) {
			return this.htmlElement`<ui-icon class="btn-icon lead" .state.name=${this.state.leadicon} .state.size=${'sm'}></ui-icon>`;
		}
		return '';
	}
	renderTrail() {
		if (this.state.trailicon) {
			return this.htmlElement`<ui-icon class="btn-icon trail" .state.name=${this.state.trailicon} .state.size=${'sm'}></ui-icon>`;
		}
		return '';
	}
	/* Same ternary as before — htmlElement so label is escaped (raw string + ^html was XSS). */
	renderLabel() {
		return this.state.label ? this.htmlElement`<span class="btn-label">${this.state.label}</span>` : '';
	}
	handleClick(domEvent) {
		if (this.state.disabled || this.state.loading) {
			domEvent.preventDefault();
			domEvent.stopImmediatePropagation();
			return;
		}
		this.emit('button:click', {});
	}
	render() {
		this.html`
			<button
				data-variant=${this.state.variant || 'solid'}
				data-tone=${this.state.tone || 'neutral'}
				data-size=${this.state.size || 'md'}
				class=${classList(
					() => {
						return this.state.disabled && 'is-disabled';
					},
					() => {
						return this.state.loading && 'is-loading';
					},
					() => {
						return this.state.fullwidth && 'is-full';
					},
					() => {
						return !this.state.label && 'is-icon-only';
					}
				)}
				?disabled=${this.state.disabled || this.state.loading}
				aria-label=${this.state.tooltip || this.state.label}
				tooltip=${this.state.tooltip}
				@click=${this.handleClick}>
				${this.renderLead}
				<slot name="lead"></slot>
				${this.renderLabel}
				<slot></slot>
				${this.renderTrail}
				<slot name="trail"></slot>
			</button>
		`;
	}
}
customElements.define('ui-button', UIButton);
// Keep UIIcon available so consumers reaching for an icon glyph next to UIButton don't have to add a separate import.
export { UIIcon };
