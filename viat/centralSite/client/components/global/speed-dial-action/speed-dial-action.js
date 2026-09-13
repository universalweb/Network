import '../icon/icon.js';
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
	hideIcon() {
		return !this.state.icon;
	}
	hideLabel() {
		return !this.state.label;
	}
	hasIcon() {
		return Boolean(this.state.icon);
	}
	hasLabel() {
		return Boolean(this.state.label);
	}
	handleClick() {
		this.emit('speed-dial-action:click', {
			value: this.state.value,
		});
	}
	render() {
		this.html`
			<button type="button" class="speed-dial-action" part="action"
				data-tone=${this.state.tone || 'neutral'}
				?data-icon=${this.hasIcon}
				?data-label=${this.hasLabel}
				tooltip=${this.state.label}
				@click=${this.handleClick}>
				<span class="speed-dial-action-icon" ?hidden=${this.hideIcon}>
					<ui-icon .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
				</span>
				<span class="speed-dial-action-label" ?hidden=${this.hideLabel}>${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-speed-dial-action', UISpeedDialAction);
