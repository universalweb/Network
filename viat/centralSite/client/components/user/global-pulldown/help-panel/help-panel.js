import { WebComponent, each } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
class HelpShortcutRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		row: './help-panel-row.css',
	};
	static state = {
		id: '',
		keys: [],
		joiner: '/',
		desc: '',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="hp-row">
				<span class="hp-keys">${this.buildKeysMarkup}</span>
				<span class="hp-desc">${this.state.desc}</span>
			</div>
		`;
	}
	buildKeysMarkup() {
		const keys = this.state.keys ?? [];
		const joiner = this.state.joiner ?? '/';
		const joinerClass = joiner === '+' ? 'hp-plus' : 'hp-sep';
		let markup = '';
		for (let i = 0; i < keys.length; i++) {
			if (i > 0) {
				markup += `<span class="${joinerClass}">${joiner}</span>`;
			}
			markup += `<kbd>${keys[i]}</kbd>`;
		}
		return markup;
	}
}
customElements.define('help-shortcut-row', HelpShortcutRow);
export class HelpPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		help: './help-panel.css',
	};
	static state = {
		classes: new Set(['help-panel']),
		id: 'AGENT',
		showDot: true,
		title: 'HOTKEYS',
		shortcuts: [],
	};
	set shortcuts(list) {
		this.state.shortcuts = Array.isArray(list) ? list : [];
	}
	get shortcuts() {
		return this.state.shortcuts;
	}
	normalizedShortcuts() {
		const list = this.state.shortcuts ?? [];
		const out = [];
		for (let i = 0; i < list.length; i++) {
			const item = list[i];
			out.push({
				id: item.id ?? `s${i}`,
				keys: item.keys ?? [],
				joiner: item.joiner ?? '/',
				desc: item.desc ?? '',
			});
		}
		return out;
	}
	renderBody() {
		return this.htmlElement `
			<div class="hp-body">
				<div class="hp-list">
					${() => {
						return each(this.normalizedShortcuts(), HelpShortcutRow, (item) => {
							return item.id;
						});
					}}
				</div>
			</div>
		`;
	}
}
customElements.define('help-panel', HelpPanel);
