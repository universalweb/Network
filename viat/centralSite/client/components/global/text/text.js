import { WebComponent, classList } from '../../core/index.js';
/**
 * Typographic text primitive. Two content modes, same styling:
 *   - SLOT (trusted/composed): `<ui-text variant="h1">Heading</ui-text>` — the
 *     caller owns what goes inside.
 *   - VALUE (untrusted/safe): `<ui-text .value=${userInput}></ui-text>` — the
 *     text flows in as DATA and is rendered via the `^text` sigil →
 *     `textContent`, so any markup in it is inert (never parsed as HTML). This
 *     is the XSS-safe path: passing untrusted strings as `.value` can never
 *     execute, unlike slotting them where the parent's auto-classifying spot
 *     might innerHTML them before this component sees them.
 * `value` defaults to '' → empty `^text` spot, slot renders as before.
 */
export class UIText extends WebComponent {
	static url = import.meta.url;
	static styles = {
		text: './text.css',
	};
	static state = {
		value: '',
		variant: 'body',
		tone: 'default',
		align: 'start',
		weight: '',
		truncate: false,
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<span class=${classList(
				'text',
				() => {
					return `var-${this.state.variant}`;
				},
				() => {
					return `tone-${this.state.tone}`;
				},
				() => {
					return `align-${this.state.align}`;
				},
				() => {
					return this.state.weight && `weight-${this.state.weight}`;
				},
				() => {
					return this.state.truncate && 'is-truncate';
				}
			)}>^text${this.state.value}<slot></slot></span>
		`;
	}
}
customElements.define('ui-text', UIText);
