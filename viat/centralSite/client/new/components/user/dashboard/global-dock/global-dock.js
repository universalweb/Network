import { DockIconButton } from './dock-icon-button.js';
import { WebComponent } from '../../../core/base.js';
import { list } from '../../../core/template.js';
export class GlobalDock extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalDock: './global-dock.css',
	};
	static state = {
		items: [],
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	dockSelect(domEvent) {
		const { detail: { source } } = domEvent;
		this.getComponents('dock-icon-button').forEach((btn) => {
			if (btn !== source) {
				btn.state.active = false;
			}
		});
		source.state.active = true;
		this.updateActiveBar(source);
	}
	async onMounted() {
		this.getComponents('dock-icon-button').forEach((item, index) => {
			if (item.state.active) {
				this.updateActiveBar(item);
			}
		});
	}
	async updateActiveBar(activeBtn) {
		requestAnimationFrame(() => {
			const bar = this.shadowRoot.querySelector('.active-bar');
			if (!bar) {
				return;
			}
			if (!activeBtn) {
				bar.classList.remove('is-visible');
				return;
			}
			bar.style.transform = `translateY(${activeBtn.offsetTop}px)`;
			bar.style.height = `${activeBtn.offsetHeight}px`;
			bar.classList.add('is-visible');
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="nav-rail" @dock-select=${this.dockSelect}>
				<div class="active-bar"></div>
				${list('items', DockIconButton)}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
