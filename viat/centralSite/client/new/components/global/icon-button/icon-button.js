import '../button/button.js';
import '../icon/icon.js';
import { WebComponent, classList } from '../../core/index.js';
export class IconButtonBase extends WebComponent {
	static url = import.meta.url;
	static styles = {
		iconButton: './icon-button.css',
	};
	static state = {
		active: false,
		className: [],
		icon: '',
		tooltip: '',
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	onMount() {
		this.classList.toggle('active', Boolean(this.state.active));
		this.watchState('active', (next) => {
			this.classList.toggle('active', Boolean(next));
		});
	}
	buttonState() {
		return {
			variant: 'icon',
			tone: 'neutral',
			title: this.state.tooltip,
		};
	}
	iconState() {
		return {
			name: this.state.icon,
			size: 'md',
		};
	}
	handleActivate() {
		this.emit(this.state.onClick || 'buttonClick', {});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-button class="icon-button ${classList(this.state.className, this.state.active && 'active')}"
				.state=${this.buttonState}
				@buttonClick=${this.handleActivate}>
				<ui-icon slot="lead" .state=${this.iconState}></ui-icon>
			</ui-button>
		`;
	}
}
