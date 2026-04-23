import { DockIconButton } from './dock-icon-button.js';
import { WebComponent } from '../../base/base.js';
import { listBind } from '../../base/template.js';
const navStyles = await WebComponent.styleSheet('./global-dock.css', import.meta.url);
export class GlobalDock extends WebComponent {
	constructor() {
		super({
			styles: [navStyles],
			tooltips: true,
		});
		this.state = {
			items: [],
		};
	}
	onRenderComplete() {
		const icons = Array.from(this.shadowRoot.querySelectorAll('dock-icon-button'));
		const activeBtn = icons.find((btn) => {
			return btn.state?.active === true;
		});
		this.updateActiveBar(activeBtn);
	}
	handleNavSelect(domEvent) {
		const { detail: { source } } = domEvent;
		this.state.items.forEach((item, index) => {
			if (item.label === source.state.label) {
				this.state.items[index].active = true;
			} else {
				this.state.items[index].active = false;
			}
		});
		this.updateActiveBar(source);
	}
	updateActiveBar(activeBtn) {
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
			<div class="nav-rail" @nav-select=${this.handleNavSelect}>
				<div class="active-bar"></div>
				${listBind('items', DockIconButton)}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
