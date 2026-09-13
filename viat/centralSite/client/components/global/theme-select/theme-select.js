import '../icon/icon.js';
import '../invert-arrow/invert-arrow.js';
import { html, WebComponent } from 'webcomponent';
import { setTheme, THEMES } from './theme-manager.js';
/*
	ui-theme-select — popover theme picker. Options come from the live THEMES
	registry via `list('items', this.themeOption)` (light html rows — auto-escaped
	labels; no `^html` string map). Active theme is mirrored onto item.active at
	observe-time from global.theme (tabs-style flag write).
*/
function themesAsItems(activeId) {
	const items = [];
	for (const theme of THEMES.values()) {
		items.push({
			id: theme.id,
			label: theme.label,
			active: theme.id === activeId,
		});
	}
	return items;
}
export class UIThemeSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		themeSelect: './theme-select.css',
	};
	static state = {
		items: [],
	};
	onConnect() {
		this.syncThemes();
		this.observeGlobal('theme', this.syncThemes);
	}
	/* Rebuild from THEMES so runtime registerTheme() shows up; stamp active flags. */
	syncThemes() {
		this.state.items = themesAsItems(this.global.theme);
	}
	get currentLabel() {
		return THEMES.get(this.global.theme)?.label ?? this.global.theme;
	}
	handlePopupClick(domEvent) {
		const themeId = domEvent.target?.dataset?.themeId;
		if (!themeId) {
			return;
		}
		this.refs.drop?.hidePopover();
		setTheme(themeId);
	}
	themeOption(item) {
		return html`<button type="button" class="theme-option" data-theme-id=${item.id} ?data-active=${item.active}>${item.label}</button>`;
	}
	themeKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<button #btn class="theme-select-button" popovertarget="theme-drop">
				<span class="theme-select-label">${() => {
					return this.currentLabel;
				}}</span>
				<ui-invert-arrow class="theme-select-arrow" .state.size=${'xs'}></ui-invert-arrow>
			</button>
			<div #drop class="theme-drop glass" id="theme-drop" popover="auto"
				@click=${this.handlePopupClick}>
				${this.list('items', this.themeOption, this.themeKey)}
			</div>
		`;
	}
}
customElements.define('ui-theme-select', UIThemeSelect);
