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
	keyId(token) {
		return token;
	}
	render() {
		this.html`
			<kbd class="kbd" role="group" style=${this.sepStyle}>
				${this.list('values', this.keyCap, this.keyId)}
			</kbd>
		`;
	}
}
customElements.define('ui-kbd', UIKbd);
