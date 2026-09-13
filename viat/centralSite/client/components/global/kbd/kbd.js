/*
	DESCRIPTION: ui-kbd — a keyboard-shortcut hint. Binds `keys[]` straight off
	state via `list()` with a light html row per key — the caller's strings pass
	through exactly as provided (no wrapping, no enrichment). Each row maps its
	own modifier-name → glyph inline (cmd→⌘, shift→⇧, …); the joining separator
	is pure CSS (`.kbd-cap:not(:first-child)::before`, fed by `--kbd-sep`).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-kbd .state.values=${['cmd', 'k']}></ui-kbd>          → ⌘ + K
	  <ui-kbd .state.values=${['ctrl', 'shift', 'p']}></ui-kbd> → ⌃ + ⇧ + P
	  <ui-kbd .state.values=${['esc']} .state.separator=${' '}></ui-kbd>
	Pure presentation — no events. Drives help panels & menu hints.
	─────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
/*
 * Modifier-name → glyph map. Matched case-insensitively; an unmapped token
 * falls through to its upper-cased self (so 'k' → 'K', 'F5' → 'F5').
 */
const GLYPHS = new Map([
	['cmd', '⌘'],
	['command', '⌘'],
	['meta', '⌘'],
	['super', '⌘'],
	['win', '⊞'],
	['ctrl', '⌃'],
	['control', '⌃'],
	['alt', '⌥'],
	['option', '⌥'],
	['opt', '⌥'],
	['shift', '⇧'],
	['enter', '↵'],
	['return', '↵'],
	['esc', 'Esc'],
	['escape', 'Esc'],
	['tab', '⇥'],
	['space', '␣'],
	['up', '↑'],
	['down', '↓'],
	['left', '←'],
	['right', '→'],
	['backspace', '⌫'],
	['delete', '⌦'],
	['del', '⌦'],
]);
function capFor(token) {
	const raw = String(token ?? '').trim();
	if (raw === '') {
		return '';
	}
	const glyph = GLYPHS.get(raw.toLowerCase());
	return glyph || (raw.length === 1 ? raw.toUpperCase() : raw);
}
export class UIKbd extends WebComponent {
	static url = import.meta.url;
	static styles = {
		kbd: './kbd.css',
	};
	static state = {
		values: [],
		separator: '+',
		tooltip: '',
	};
	sepStyle() {
		/* Feed the rows' ::before; single quotes in the separator are escaped so
		   the CSS string value stays well-formed. */
		const separator = String(this.state.separator ?? '+').replace(/'/g, '\\\'');
		return `--kbd-sep:'${separator}'`;
	}
	/* Light html row — plain values only; the key string is displayed as-is.
	   Keyed by the token itself (a shortcut never repeats a key). */
	keyCap(token) {
		return html`<span class="kbd-cap"><kbd class="kbd-key">${capFor(token)}</kbd></span>`;
	}
	/*
	 * A token that caps to nothing must not become a row. The separator is a CSS
	 * ::before on every cap after the first, so an empty / whitespace / nullish
	 * entry does not render as "nothing" — it renders as an empty 1.9em key box
	 * WITH a leading separator. Lists built by split() or filter() hand those
	 * over routinely, so the guard belongs here rather than at every call site.
	 */
	hasCap(token) {
		return capFor(token) !== '';
	}
	keyId(token) {
		return token;
	}
	render() {
		this.html`
			<kbd class="kbd" role="group" style=${this.sepStyle} tooltip=${this.state.tooltip}>
				${this.filter('values', this.keyCap, this.hasCap, this.keyId)}
			</kbd>
		`;
	}
}
customElements.define('ui-kbd', UIKbd);
