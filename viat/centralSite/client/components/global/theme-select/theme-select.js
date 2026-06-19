import '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
import { setTheme, THEMES } from './theme-manager.js';
export class UIThemeSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		themeSelect: './theme-select.css',
	};
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
	render() {
		this.html `
			<button #btn class="ts-btn" popovertarget="theme-drop">
				<span class="ts-label">${() => {
					return this.currentLabel;
				}}</span>
				<ui-icon class="ts-arrow" .name=${'chevron-down'} .size=${'xs'}></ui-icon>
			</button>
			<div #drop class="theme-drop" id="theme-drop" popover="auto"
				@click=${this.handlePopupClick}>
				^html${() => {
					const activeId = this.global.theme;
					return [...THEMES.values()].map((themeEntry) => {
						const active = themeEntry.id === activeId ? ' active' : '';
						return `<button class="theme-option${active}" data-theme-id="${themeEntry.id}">${themeEntry.label}</button>`;
					}).join('');
				}}
			</div>
		`;
	}
}
customElements.define('ui-theme-select', UIThemeSelect);
