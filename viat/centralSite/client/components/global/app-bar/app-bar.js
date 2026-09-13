import '../bar/bar.js';
import { classList, ScrollDock, WebComponent } from 'webcomponent';
import { isCustomElementConstructor } from '../../core/template/list.js';
import { IconButtonBase } from '../icon-button/icon-button.js';
/*
 * `<ui-app-bar>` — the global top bar. Pure chrome: a fixed-top `<header>`
 * composing a `<ui-bar>` with `start` / `center` / `end` regions. The `end`
 * region also renders an `actions` config as `<ui-icon-button>`s. No pulldown,
 * no gesture — that coupling is the Viat composition's concern.
 *
 * `float` (default true): inset from the edges at rest; `data-scrolled` docks
 * it flush. `glass` (default true): `.glass` fill + blur on the bar surface.
 * Scroll ownership lives here via ScrollDock — callers pass a scroller
 * (`setScrollRoot`) instead of writing `data-scrolled` themselves.
 *
 * Usage:
 *   <ui-app-bar>
 *     <span slot="center">UWC</span>
 *   </ui-app-bar>
 *   appBar.setScrollRoot(stageElement); // or 'global' / 'nearest'
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
	static themes = ['gnosis', 'codex'];
	static state = {
		items: [],
		/*
		 * Row component for `items` — the same escape ui-toolbar carries, for
		 * the same reason: the end region is a bar of ACTIONS, and hard-coding
		 * ui-icon-button locked out any chrome built from text actions.
		 * Default unchanged, so existing callers are untouched.
		 */
		renderItem: null,
		float: true,
		glass: true,
	};
	scrollRoot = null;
	dock = null;
	onConnect() {
		this.observe('float', this.syncChrome);
		this.syncChrome();
	}
	onDisconnect() {
		this.detachDock();
	}
	setScrollRoot(scrollRoot) {
		this.scrollRoot = scrollRoot;
		if (this.isConnected) {
			this.attachDock();
		}
	}
	applyScrolled(scrolled) {
		this.toggleAttribute('data-scrolled', scrolled === true);
	}
	syncChrome() {
		this.dataset.float = this.state.float === false ? 'false' : 'true';
		this.attachDock();
	}
	detachDock() {
		this.dock?.detach();
		this.dock = null;
	}
	attachDock() {
		this.detachDock();
		if (this.state.float === false) {
			this.applyScrolled(true);
			return;
		}
		const scrollRoot = this.scrollRoot ?? 'nearest';
		this.dock = ScrollDock.attach(this, {
			scroller: scrollRoot,
		});
	}
	/**
	 * Row component for `items`, falling back to the icon-button default.
	 * @returns {Function} A custom element constructor.
	 */
	itemComponent() {
		if (isCustomElementConstructor(this.state.renderItem)) {
			return this.state.renderItem;
		}
		return IconButtonBase;
	}
	render() {
		this.html`
			<header class=${classList('app-bar', {
				glass: this.state.glass,
			})}>
				<ui-bar class="app-bar-bar">
					<slot slot="start" name="start"></slot>
					<slot slot="center" name="center"></slot>
					<div slot="end" class="app-bar-end">
						<slot name="end"></slot>
						${this.filter('items', this.itemComponent(), 'hidden')}
					</div>
				</ui-bar>
			</header>
		`;
	}
}
customElements.define('ui-app-bar', UIAppBar);
