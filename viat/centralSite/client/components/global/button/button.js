/**
 *	NAME: Button
 *	TAG: ui-button
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	ui-button — action control. Inner native button or anchor carries
 *	data-variant, data-tone, and data-size; the component sheet is
 *	structure only. Tooltip rides state onto the inner control, not a
 *	host tooltip= attribute. href renders a real <a> so modifier-click
 *	and middle-click work.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-button .state.label=${'Save'}></ui-button>
 *	  <ui-button .state.href=${'/wallet'}></ui-button>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIButton } from './button.js';
 *	  const host = new UIButton({ label: 'Save', tone: 'primary' });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  button:click { href }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-02
 *	─────────────────────────────────────────────────────────────────────
 */
import { classList, WebComponent } from 'webcomponent';
import { UIIcon } from '../icon/icon.js';
const ICON_SPIN_STYLE_ID = 'ui-button-icon-spin';
const ICON_SPIN_CSS = `@property --ui-btn-icon-spin {
	syntax: "<angle>";
	inherits: true;
	initial-value: 0deg;
}`;
/*
 * `@property` inside a shadow-adopted sheet is ignored. Register on the
 * document so --ui-btn-icon-spin interpolates. Idempotent: the style node
 * is keyed, so HMR / a second import does not duplicate it.
 */
function ensureIconSpinProperty() {
	const doc = globalThis.document;
	if (!doc?.head || doc.getElementById(ICON_SPIN_STYLE_ID)) {
		return;
	}
	const style = doc.createElement('style');
	style.id = ICON_SPIN_STYLE_ID;
	style.textContent = ICON_SPIN_CSS;
	doc.head.append(style);
}
ensureIconSpinProperty();
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
		// True disc — equal hit box + full radius. Icon-only FABs / speed-dial /
		// to-top set this; consumers must NOT fake it with --ui-btn-radius alone
		// (that yields a pill when width ≠ height after size padding).
		circle: false,
		// Tooltip text — pass via `.tooltip` / `.state` (NOT a bare `tooltip=`
		// attribute). The global `tooltip=` behavior attaches to whatever element
		// carries it; a bare attribute lands on the HOST, but the inner <button> is
		// the innermost hover target and wins the tooltip service's "latest-entered"
		// race — so it must carry the text itself via `tooltip=${this.state.tooltip}`
		// below. Hence the text has to reach STATE. (`title` is a native HTMLElement
		// property — a `title=`/`.title=` binding sets the OS tooltip and never reaches
		// state, leaving this one empty; that's the trap this key name avoids.)
		tooltip: '',
		// Forced tooltip SIDE (top|bottom|left|right). Empty = automatic, which
		// requests top and lets the engine flip/search. Rides the same inner
		// element as `tooltip` for the same reason: the <button> is the hover
		// target, so it must carry both halves or the side never reaches the
		// element the service looks up.
		tooltipPlacement: '',
		// Native Popover API invoker — must land on the real <button>, not a CE host
		// (light-dismiss + toggle race). Empty = attribute omitted.
		popoverTarget: '',
		// Optional expanded mirror for menu invokers (string 'true'|'false'|'').
		expanded: '',
		hasPopup: '',
		// When set, render a real <a data-variant> (⌘-click / middle-click work).
		href: '',
		target: '',
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
	/* htmlElement so the label is escaped (a raw string + ^html is XSS). */
	renderLabel() {
		return this.state.label ? this.htmlElement`<span class="btn-label">${this.state.label}</span>` : '';
	}
	handleClick(domEvent) {
		if (this.state.disabled || this.state.loading) {
			domEvent.preventDefault();
			domEvent.stopImmediatePropagation();
			return;
		}
		this.emit('button:click', {
			href: this.state.href || undefined,
		});
	}
	controlClass() {
		return classList(
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
			},
			() => {
				return this.state.circle && 'is-circle';
			}
		);
	}
	render() {
		// Real anchor when href is set — native ⌘-click / middle-click / status URL.
		if (this.state.href) {
			this.html`
				<a
					part="button"
					data-variant=${this.state.variant || 'solid'}
					data-tone=${this.state.tone || 'neutral'}
					data-size=${this.state.size || 'md'}
					class=${this.controlClass}
					href=${this.state.href}
					target=${this.state.target || undefined}
					rel=${this.state.target === '_blank' ? 'noopener noreferrer' : undefined}
					aria-disabled=${this.state.disabled || this.state.loading ? 'true' : 'false'}
					aria-label=${this.state.tooltip || this.state.label}
					tooltip=${this.state.tooltip}
					tooltipPlacement=${this.state.tooltipPlacement}
					@click=${this.handleClick}>
					${this.renderLead}
					<slot name="lead"></slot>
					${this.renderLabel}
					<slot></slot>
					${this.renderTrail}
					<slot name="trail"></slot>
				</a>
			`;
			return;
		}
		this.html`
			<button
				part="button"
				data-variant=${this.state.variant || 'solid'}
				data-tone=${this.state.tone || 'neutral'}
				data-size=${this.state.size || 'md'}
				class=${this.controlClass}
				?disabled=${this.state.disabled || this.state.loading}
				aria-label=${this.state.tooltip || this.state.label}
				tooltip=${this.state.tooltip}
				tooltipPlacement=${this.state.tooltipPlacement}
				popovertarget=${this.state.popoverTarget || undefined}
				aria-expanded=${this.state.expanded || undefined}
				aria-haspopup=${this.state.hasPopup || undefined}
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
/* Re-export so a UIButton import also registers <ui-icon>. */
export { UIIcon };
