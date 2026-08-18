import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
/*
 * Tile row for the control-center grid. Raw item → state; emits
 * `control-center-tile:toggle` with { id, item, checked }.
 */
export class ControlCenterTile extends WebComponent {
	static url = import.meta.url;
	static styles = {
		controlCenterTile: './control-center-tile.css',
	};
	static state = {
		itemId: '',
		label: '',
		icon: '',
		description: '',
		checked: false,
		disabled: false,
		tone: 'neutral',
	};
	handleClick() {
		if (this.state.disabled) {
			return;
		}
		const checked = !this.state.checked;
		this.state.checked = checked;
		const itemId = this.state.itemId;
		this.emit('control-center-tile:toggle', {
			id: itemId,
			item: {
				id: itemId,
				label: this.state.label,
				icon: this.state.icon,
				description: this.state.description,
				checked,
				disabled: this.state.disabled,
				tone: this.state.tone,
			},
			checked,
		});
	}
	render() {
		this.html`
			<button
				type="button"
				class="cc-tile"
				data-tone=${this.state.tone || 'neutral'}
				?data-checked=${this.state.checked}
				?disabled=${this.state.disabled}
				aria-pressed=${() => {
					return this.state.checked ? 'true' : 'false';
				}}
				@click=${this.handleClick}>
				<span class="cc-tile-icon" aria-hidden="true">
					<ui-icon .state.name=${this.state.icon} .state.size=${'md'}></ui-icon>
				</span>
				<span class="cc-tile-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-control-center-tile', ControlCenterTile);
