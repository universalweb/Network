import { THEMES, getTheme, setTheme } from './theme-manager.js';
import { hostSheet, resetSheet } from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
let dropStylesInjected = false;
function ensureDropStyles() {
	if (dropStylesInjected) {
		return;
	}
	dropStylesInjected = true;
	const s = document.createElement('style');
	s.textContent = `
		.viat-theme-drop {
			position: fixed;
			z-index: 9999;
			min-width: 120px;
			background: var(--popup-bg, #07080c);
			border: 1px solid var(--popup-border, rgba(109,74,255,0.22));
			border-radius: var(--radius, 10px);
			box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(109,74,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
			overflow: hidden;
			display: flex;
			flex-direction: column;
			font-family: var(--font-mono, 'JetBrains Mono', monospace);
		}
		.viat-theme-opt {
			background: transparent;
			border: none;
			border-bottom: 1px solid var(--dark-divider-faint, rgba(255,255,255,0.022));
			color: var(--text-offwhite, #adb4cc);
			font-family: inherit;
			font-size: 0.5625rem;
			letter-spacing: 0.15em;
			padding: 9px 14px;
			text-align: left;
			text-transform: uppercase;
			cursor: pointer;
			width: 100%;
			transition: background 0.15s, color 0.15s;
		}
		.viat-theme-opt:last-child { border-bottom: none; }
		.viat-theme-opt:hover { background: var(--surface-tint, rgba(255,255,255,0.05)); color: var(--text-main, #e8eaf2); }
		.viat-theme-opt.active { color: var(--cyan, #a78bfa); background: var(--cyan-tint-faint, rgba(109,74,255,0.034)); }
	`;
	document.head.append(s);
}
const btnStyles = hostSheet(`
:host { display: inline-block; }
.ts-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	background: var(--cyan-tint-faint);
	border: 1px solid var(--cyan-glow-medium);
	border-radius: var(--tb-badge-radius, 20px);
	color: var(--cyan);
	font-family: var(--font-mono);
	font-size: 0.625rem;
	letter-spacing: 0.15em;
	padding: 3px 10px;
	cursor: pointer;
	text-transform: uppercase;
	transition: border-color 0.2s, background 0.2s;
	white-space: nowrap;
}
.ts-btn:hover {
	background: var(--cyan-tint);
	border-color: var(--cyan-glow-strong);
}
.ts-arrow {
	opacity: 0.5;
	font-size: 0.45rem;
	line-height: 1;
}
`);
export class ViatThemeSelect extends WebComponent {
	open = false;
	dropdown = null;
	_closeTimer = null;
	constructor() {
		super([resetSheet, btnStyles]);
		this.state = {
			theme: getTheme(),
		};
		this.addEvent('toggle', 'click', this.handleToggle);
		this.addEventListener('mouseleave', this.handleHostLeave);
	}
	onDisconnect() {
		this.closeDropdown();
	}
	cancelClose() {
		clearTimeout(this._closeTimer);
	}
	handleHostLeave() {
		this._closeTimer = setTimeout(this.closeDropdown.bind(this), 120);
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
		const { theme } = this.state;
		const div = document.createElement('div');
		div.className = 'viat-theme-drop';
		for (const t of THEMES) {
			const btn = document.createElement('button');
			btn.className = `viat-theme-opt${t.id === theme ? ' active' : ''}`;
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
		});
		document.addEventListener('click', this.closeOutside, {
			capture: true,
		});
	}
	closeDropdown() {
		clearTimeout(this._closeTimer);
		this.dropdown?.remove();
		this.dropdown = null;
		this.open = false;
		document.removeEventListener('click', this.closeOutside, {
			capture: true,
		});
	}
	pickTheme(id) {
		setTheme(id);
		this.closeDropdown();
		this.updateState({
			theme: id,
		});
	}
	render() {
		const { theme } = this.state;
		const current = THEMES.find((t) => {
			return t.id === theme;
		})?.label ?? theme;
		this.shadowRoot.innerHTML = `
			<button class="ts-btn" data-onclick="toggle">
				${current}<span class="ts-arrow">${this.open ? '▲' : '▼'}</span>
			</button>
		`;
		if (this.dropdown) {
			this.dropdown.querySelectorAll('.viat-theme-opt').forEach((el) => {
				el.classList.toggle('active', el.textContent.trim().toLowerCase() === current.toLowerCase());
			});
		}
	}
}
customElements.define('viat-theme-select', ViatThemeSelect);
