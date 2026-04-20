import { THEMES, getTheme, setTheme } from './theme-manager.js';
import { hostSheet, loadSheet, resetSheet } from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const btnStyles = await loadSheet(new URL('../styles/theme-select.css', import.meta.url));
const dropStyles = await loadSheet(new URL('../styles/theme-drop.css', import.meta.url));
let dropStylesInjected = false;
function ensureDropStyles() {
	if (dropStylesInjected) {
		return;
	}
	dropStylesInjected = true;
	document.adoptedStyleSheets = [...document.adoptedStyleSheets, dropStyles];
}
export class UIThemeSelect extends WebComponent {
	open = false;
	dropdown = null;
	closeTimer = null;
	constructor() {
		super([resetSheet, btnStyles]);
		this.closeOutside = this.closeOutside.bind(this);
		this.state = {
			theme: getTheme(),
		};
		this.addEvent('toggle', 'click', this.handleToggle);
		this.addEventListener('mouseleave', this.handleHostLeave.bind(this));
	}
	onDisconnect() {
		this.closeDropdown();
	}
	cancelClose() {
		this.clearTimeout(this.closeTimer);
	}
	handleHostLeave() {
		this.closeTimer = this.setTimeout(this.closeDropdown.bind(this), 120);
	}
	handleToggle() {
		this.open = !this.open;
		if (this.open) {
			this.openDropdown();
		} else {
			this.closeDropdown();
		}
		this.updateState({});
	}
	closeOutside(e) {
		if (e.composedPath().includes(this)) {
			return;
		}
		this.closeDropdown();
	}
	openDropdown() {
		ensureDropStyles();
		this.closeDropdown();
		const { theme } = this.STATE;
		const div = document.createElement('div');
		div.className = 'theme-drop';
		for (const t of THEMES) {
			const btn = document.createElement('button');
			btn.className = `theme-option${t.id === theme ? ' active' : ''}`;
			btn.textContent = t.label;
			btn.addEventListener('click', () => {
				this.pickTheme(t.id);
			});
			div.append(btn);
		}
		div.addEventListener('mouseenter', this.cancelClose.bind(this));
		div.addEventListener('mouseleave', this.closeDropdown.bind(this));
		document.body.append(div);
		this.dropdown = div;
		requestAnimationFrame(() => {
			if (!this.dropdown) {
				return;
			}
			const btn = this.shadowRoot?.querySelector('.ts-btn');
			if (!btn) {
				return;
			}
			const rect = btn.getBoundingClientRect();
			this.dropdown.style.top = `${rect.bottom + 6}px`;
			this.dropdown.style.right = `${window.innerWidth - rect.right}px`;
			this.dropdown.classList.add('open');
		});
		document.addEventListener('click', this.closeOutside, {
			capture: true,
		});
	}
	closeDropdown() {
		this.clearTimeout(this.closeTimer);
		if (!this.dropdown) {
			return;
		}
		this.open = false;
		const el = this.dropdown;
		this.dropdown = null;
		document.removeEventListener('click', this.closeOutside, {
			capture: true,
		});
		el.classList.remove('open');
		const remove = () => {
			return el.isConnected && el.remove();
		};
		el.addEventListener('transitionend', remove, {
			once: true,
		});
		this.setTimeout(remove, 300);
	}
	pickTheme(id) {
		setTheme(id);
		this.closeDropdown();
		this.updateState({
			theme: id,
		});
	}
	render() {
		this.html `
			<button class="ts-btn" data-onclick="toggle">
				${() => {
					const current = THEMES.find((t) => {
						return t.id === this.state.theme;
					})?.label ?? this.state.theme;
					return `${current}<span class="ts-arrow">${this.open ? '▲' : '▼'}</span>`;
				}}
			</button>
		`;
	}
}
customElements.define('ui-theme-select', UIThemeSelect);
