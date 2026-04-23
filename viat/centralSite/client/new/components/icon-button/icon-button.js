import { WebComponent } from '../base/base.js';
import { state } from '../../../modules/state.js';
const styles = await WebComponent.styleSheet('./icon-button.css', import.meta.url);
export class IconButtonBase extends WebComponent {
	constructor(config = {}) {
		super({
			...config,
			styles: config.styles === undefined ? [styles] : [styles, ...config.styles],
			tooltips: config.tooltips ?? true,
		});
		this.state = {
			active: false,
			className: ['icon-button'],
			icon: '',
			label: '',
			title: '',
		};
		if (config.state?.className) {
			config.state.className.push(this.state.className);
		}
		Object.assign(this.state, config.state || {});
	}
	handleActivate() {
		if (this.state?.onClick) {
			this.emit(this.state?.onClick, {
				activated: true,
			});
		}
	}
	renderButtonClassName() {
		return [
			...this.state.className,
			this.state.active ? 'active' : '',
		].filter(Boolean).join(' ');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<button class="${this.renderButtonClassName}"
				aria-label="${this.state.title}"
				data-title="${this.state.title}"
				@click=${this.handleActivate}>
					<span class="icon-button-glyph">${this.state.icon}</span>
				</button>
		`;
	}
}
