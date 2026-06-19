import '../bar/bar.js';
import { WebComponent, filter } from 'webcomponent';
import { IconButtonBase } from '../icon-button/icon-button.js';
/*
 * `<ui-app-bar>` — the global top bar. Pure chrome: a fixed-top `<header>`
 * composing a `<ui-bar>` with `start` / `center` / `end` regions. The `end`
 * region also renders an `actions` config as `<ui-icon-button>`s. No pulldown,
 * no gesture — that coupling is the Viat composition's concern.
 */
export class UIAppBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		appBar: './app-bar.css',
	};
	/*
	 * Per-theme RULE overrides (structure: float radius / shadow / hairlines)
	 * in `./themes/{id}.css` — adopted by theme, absent files are graceful.
	 */
	static themes = [
		'gnosis', 'codex',
	];
	static state = {
		actions: [],
	};
	render() {
		this.html `
			<header class="app-bar">
				<ui-bar class="app-bar-bar">
					<slot slot="start" name="start"></slot>
					<slot slot="center" name="center"></slot>
					<div slot="end" class="app-bar-end">
						<slot name="end"></slot>
						${filter('actions', IconButtonBase, 'hidden')}
					</div>
				</ui-bar>
			</header>
		`;
	}
}
customElements.define('ui-app-bar', UIAppBar);
