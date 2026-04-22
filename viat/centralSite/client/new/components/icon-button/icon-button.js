import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./icon-button.css', import.meta.url);
export class IconButtonBase extends WebComponent {
	constructor(sheets = [], opts = {}) {
		super([styles, ...sheets], {
			tooltips: true,
			...opts,
		});
		this.state = {
			active: false,
			buttonClassName: 'icon-button',
			className: '',
			icon: '',
			title: '',
		};
	}
	get activationEventName() {
		return 'icon-button-activate';
	}
	buildActivationDetail() {
		return {};
	}
	renderButtonClassName() {
		return [
			this.state.buttonClassName,
			this.state.className,
			this.state.active ? 'active' : '',
		].filter(Boolean).join(' ');
	}
	renderIconMarkup() {
		return `<span class="icon-button-glyph">${this.state.icon ?? ''}</span>`;
	}
	handleActivate() {
		this.emit(this.activationEventName, this.buildActivationDetail());
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<button class="${() => {
				return this.renderButtonClassName();
			}}"
				aria-label="${() => {
					return this.state.title;
				}}"
				title="${() => {
					return this.state.title;
				}}"
				@click=${this.handleActivate}>${() => {
					return this.renderIconMarkup();
				}}</button>
		`;
	}
}
