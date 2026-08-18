import '../button/button.js';
import { WebComponent } from '../../core/index.js';
export class UISpeedDialAction extends WebComponent {
	static url = import.meta.url;
	static styles = {
		speedDialAction: './speed-dial-action.css',
	};
	static state = {
		icon: '',
		label: '',
		value: '',
		tone: 'neutral',
	};
	handleClick() {
		this.emit('speed-dial-action:click', {
			value: this.state.value,
		});
	}
	render() {
		this.html`
			<div class="sd-action">
				<span class="sd-action-label" ?hidden=${!this.state.label}>${this.state.label}</span>
				<ui-button class="sd-action-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${'sm'}
					.state.circle=${true}
					.state.leadicon=${this.state.icon}
					.state.tooltip=${this.state.label}
					@button:click=${this.handleClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-speed-dial-action', UISpeedDialAction);
