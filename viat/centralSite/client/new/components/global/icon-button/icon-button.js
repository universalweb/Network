import { WebComponent } from '../../base/base.js';
export class IconButtonBase extends WebComponent {
	static url = import.meta.url;
	static styles = {
		iconButton: './icon-button.css',
	};
	static state = {
		active: false,
		className: [],
		icon: '',
		label: '',
		title: '',
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	handleActivate() {
		this.emit(this.state.onClick || 'dock-select', {});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<button class="icon-button ${this.state?.className?.join?.(' ')} ${this.state?.active ? 'active' : ''}"
				aria-label="${this.state.title}"
				data-tooltip="${this.state.title}"
				@click=${this.handleActivate}>
					<span class="icon-button-glyph">${this.state.icon}</span>
				</button>
		`;
	}
}
