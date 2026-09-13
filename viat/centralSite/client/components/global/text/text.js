import { WebComponent } from '../../core/index.js';
/**
 * Typographic text primitive. Two content modes, same styling:
 *   - SLOT (trusted/composed): `<ui-text .state.variant=${'h1'}>Heading</ui-text>` — the
 *     caller owns what goes inside. Drive variant/tone/align/weight via the
 *     `.state.` channel (`.state.variant=${'h1'}`, or `.state=` for a whole
 *     object) — a bare `.variant=` sets a dead DOM property and a bare
 *     `variant="h1"` attribute is inert (there is no attribute→state mirror).
 *   - VALUE (untrusted/safe): `<ui-text .state.value=${userInput}></ui-text>` — the
 *     text flows in as DATA and is rendered via the `^text` sigil →
 *     `textContent`, so any markup in it is inert (never parsed as HTML). This
 *     is the XSS-safe path: passing untrusted strings as `.state.value` can never
 *     execute, unlike slotting them where the parent's auto-classifying spot
 *     might innerHTML them before this component sees them.
 * `value` defaults to '' → empty `^text` spot, slot renders as before.
 *
 * variant/tone/align/weight are enumerated dims → `data-*` ATTRIBUTES (decorated
 * by attribute selectors in text.css), never `var-*`/`tone-*` classes. A `tone-*`
 * class collides with the uwc.util `.tone-*` text utilities (which win by layer
 * order and resolve to near-white for danger/warning); a `[data-tone]` attribute
 * cannot be matched by that class selector. truncate (boolean) is `?data-truncate`.
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
		this.html`
			<span
				class="text"
				data-variant=${this.state.variant}
				data-tone=${this.state.tone}
				data-align=${this.state.align}
				data-weight=${this.state.weight}
				?data-truncate=${this.state.truncate}>^text${this.state.value}<slot></slot></span>
		`;
	}
}
customElements.define('ui-text', UIText);
