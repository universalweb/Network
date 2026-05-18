import { THEMES, getTheme, setTheme } from './theme-manager.js';
import { WebComponent } from '../../core/index.js';
export class UIThemeSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		themeSelect: './theme-select.css',
	};
	static state = {
		dropStyle: '',
	};
	constructor(state = {}, config = {}) {
		super({
			theme: getTheme(),
			...state,
		}, config);
	}
	get currentLabel() {
		return THEMES.find((t) => {
			return t.id === this.state.theme;
		})?.label ?? this.state.theme;
	}
	handleBeforeToggle(domEvent) {
		if (domEvent.newState !== 'open') {
			return;
		}
		const btn = this.refs.btn;
		if (!btn) {
			return;
		}
		const rect = btn.getBoundingClientRect();
		const viewportH = globalThis.innerHeight;
		const gap = 6;
		const drop = this.refs.drop;
		const estimatedH = drop?.scrollHeight || ((THEMES.length * 32) + 4);
		const spaceBelow = viewportH - rect.bottom - gap;
		const spaceAbove = rect.top - gap;
		const right = globalThis.innerWidth - rect.right;
		const flipUp = spaceBelow < estimatedH && spaceAbove > spaceBelow;
		if (flipUp) {
			this.state.dropStyle = `bottom:${(viewportH - rect.top) + gap}px;right:${right}px`;
		} else {
			this.state.dropStyle = `top:${rect.bottom + gap}px;right:${right}px`;
		}
	}
	handlePopupClick(domEvent) {
		const themeId = domEvent.target?.dataset?.themeId;
		if (!themeId) {
			return;
		}
		setTheme(themeId);
		this.state.theme = themeId;
		this.refs.drop?.hidePopover();
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<button #btn class="ts-btn" popovertarget="theme-drop">
				${() => {
					return `${this.currentLabel}<span class="ts-arrow">▾</span>`;
				}}
			</button>
			<div #drop class="theme-drop" id="theme-drop" popover="auto"
				style="${() => {
					return this.state.dropStyle;
				}}"
				@beforetoggle=${this.handleBeforeToggle}
				@click=${this.handlePopupClick}>
				${() => {
					return THEMES.map((t) => {
						const active = t.id === this.state.theme ? ' active' : '';
						return `<button class="theme-option${active}" data-theme-id="${t.id}">${t.label}</button>`;
					}).join('');
				}}
			</div>
		`;
	}
}
customElements.define('ui-theme-select', UIThemeSelect);
