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
			activeLabel: '',
			items: [],
		};
	}
	onConnect() {
		this.addEffect('items', (state, items) => {
			const active = (items ?? []).find((item) => {
				return item.active;
			});
			const label = active?.label?.toLowerCase() ?? '';
			if (this.STATE.activeLabel !== label) {
				this.state.activeLabel = label;
			}
		});
		this.addEffect('activeLabel', () => {
			this.scheduleRenderComplete();
		});
	}
	onRenderComplete() {
		this.updateActiveBar();
	}
	handleNavSelect(domEvent) {
		const label = (domEvent.detail?.label ?? '').toLowerCase();
		if (!label) {
			return;
		}
		this.STATE.items.forEach((item, index) => {
			const shouldBeActive = item.label.toLowerCase() === label;
			if (item.active !== shouldBeActive) {
				this.state.items[index] = {
					...item,
					active: shouldBeActive,
				};
			}
		});
	}
	updateActiveBar() {
		requestAnimationFrame(() => {
			const activeLabel = (this.STATE.activeLabel ?? '').toLowerCase();
			const icons = Array.from(this.shadowRoot.querySelectorAll('dock-icon-button'));
			const activeBtn = icons.find((btn) => {
				return (btn.state?.label ?? '').toLowerCase() === activeLabel;
			});
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
