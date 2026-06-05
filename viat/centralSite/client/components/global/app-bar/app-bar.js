import '../bar/bar.js';
import { WebComponent, filter } from 'webcomponent';
import { IconButtonBase } from '../icon-button/icon-button.js';
// `<ui-app-bar>` — the global top bar. Pure chrome: a fixed-top `<header>`
// composing a `<ui-bar>` with `start` / `center` / `end` regions. The `end`
// region also renders an `actions` config as `<ui-icon-button>`s. It mirrors
// the viewport width bucket onto its host as a `vw-*` class. No pulldown, no
// gesture — that coupling is the Viat composition's concern.
export class UIAppBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		appBar: './app-bar.css',
	};
	static state = {
		actions: [],
	};
	syncViewportClass() {
		// Mirror the viewport width bucket onto the host so `:host(.vw-xs)`
		// rules work without `:host-context()` (unsupported on older Safari).
		const bucket = this.globalState?.environment?.viewport?.w ?? 'lg';
		const next = [];
		const current = (this.classList.value || '').split(/\s+/);
		for (let index = 0; index < current.length; index += 1) {
			const token = current[index];
			if (token && !token.startsWith('vw-')) {
				next.push(token);
			}
		}
		next.push(`vw-${bucket}`);
		this.classList.value = next.join(' ');
	}
	onConnect() {
		this.syncViewportClass();
		this.delegate('viewport:change', this.handleViewportChange);
	}
	handleViewportChange() {
		this.syncViewportClass();
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
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
