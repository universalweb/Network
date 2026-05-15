import { WebComponent, list } from '../../core/index.js';
import { DockIconButton } from './dock-icon-button.js';
const SQUEEZE_MS = 140;
const MOVE_MS = 440;
export class GlobalDock extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalDock: './global-dock.css',
	};
	static state = {
		items: [],
	};
	barMoveToken = 0;
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	dockSelect(domEvent) {
		const { detail: { source } } = domEvent;
		const active = this.getComponents('dock-icon-button').find((btn) => {
			return btn.state.active;
		});
		if (active !== source) {
			active.state.active = false;
		}
		source.state.active = true;
		this.updateActiveBar(source);
	}
	onMount() {
		if (this.state.items.length) {
			this.syncActiveBar();
		}
	}
	syncActiveBar(activeBtn) {
		if (this.state.items.length === 0) {
			return;
		}
		const active = activeBtn || this.getComponents('dock-icon-button').find((btn) => {
			return btn.state.active;
		});
		this.updateActiveBar(active);
	}
	async updateActiveBar(activeBtn) {
		const bar = this.refs.active_bar;
		if (!bar) {
			return;
		}
		if (!activeBtn) {
			bar.classList.remove('is-visible');
			return;
		}
		const wasVisible = bar.classList.contains('is-visible');
		const targetY = activeBtn.offsetTop;
		const targetH = activeBtn.offsetHeight;
		if (!wasVisible) {
			bar.style.setProperty('--bar-y', `${targetY}px`);
			bar.style.setProperty('--bar-h', `${targetH}px`);
			bar.style.setProperty('--bar-scale', '1');
			bar.classList.add('is-visible');
			return;
		}
		const token = ++this.barMoveToken;
		bar.classList.add('is-squeezing');
		bar.style.setProperty('--bar-scale', '0.25');
		bar.style.setProperty('--bar-h', `${targetH}px`);
		await new Promise((resolve) => {
			this.setTimeout(resolve, SQUEEZE_MS);
		});
		if (token !== this.barMoveToken) {
			return;
		}
		bar.classList.remove('is-squeezing');
		bar.style.setProperty('--bar-y', `${targetY}px`);
		await new Promise((resolve) => {
			this.setTimeout(resolve, MOVE_MS);
		});
		if (token !== this.barMoveToken) {
			return;
		}
		bar.style.setProperty('--bar-scale', '1');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="nav-rail" @${this.dockSelect}>
				<div class="active-bar" #active_bar></div>
				${list('items', DockIconButton)}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
