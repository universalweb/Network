import '../../../global/kbd/kbd.js';
import { WebComponent } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
class HelpShortcutRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		row: './help-panel-row.css',
	};
	// The shortcut item lands over these defaults when the list binds it as the
	// row's state — no parent-side normalization. `<ui-kbd>` owns the cap/glyph
	// rendering; the row just lays out keys + description.
	static state = {
		id: '',
		keys: [],
		separator: '+',
		desc: '',
	};
	render() {
		this.html `
			<div class="hp-row">
				<ui-kbd .state.values=${this.state.keys} .state.separator=${this.state.separator}></ui-kbd>
				<span class="hp-desc">${this.state.desc}</span>
			</div>
		`;
	}
}
customElements.define('help-shortcut-row', HelpShortcutRow);
export class HelpPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		help: './help-panel.css',
	};
	// Pulldown hotkeys are this panel's own structural config (app-component tier
	// rule) — they live here, not passed in. `list('shortcuts', …)` binds the key
	// directly; each item lands over HelpShortcutRow's static-state defaults and is
	// keyed by `id` via the default keyFn (no keyFn arg needed).
	static state = {
		classes: new Set(['help-panel']),
		panelId: 'AGENT',
		showDot: true,
		heading: 'HOTKEYS',
		shortcuts: [
			{
				id: 'esc',
				keys: ['Esc'],
				desc: 'Close pulldown',
			},
			{
				id: 'send',
				keys: ['Enter'],
				desc: 'Send message',
			},
			{
				id: 'newline',
				keys: ['Shift', 'Enter'],
				desc: 'Newline in chat',
			},
			{
				id: 'toggle',
				keys: ['~', '`'],
				separator: '/',
				desc: 'Toggle pulldown',
			},
		],
	};
	renderBody() {
		return this.htmlElement `
			<div class="hp-body">
				<div class="hp-list">
					${this.list('shortcuts', HelpShortcutRow)}
				</div>
			</div>
		`;
	}
}
customElements.define('help-panel', HelpPanel);
