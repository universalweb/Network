/*
	One segment in a <ui-toggle-group>. Receives its item as-is ({value, label?,
	disabled?, active?}) and owns its whole render from those fields + defaults —
	the label falls back to the value here, not in a parent loop. Sizing inherits
	from the container's CSS custom properties. On click it emits `toggle-group:select`
	(detail.data.value); the parent owns the selection decision and stamps `active`
	back onto the bound item.
*/
import { WebComponent } from 'webcomponent';
export class UIToggleOption extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toggleOption: './toggle-option.css',
	};
	static state = {
		value: '',
		label: '',
		active: false,
		disabled: false,
	};
	handleClick() {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('toggle-group:select', {
			value: this.state.value,
		});
	}
	focus() {
		this.refs.button?.focus();
	}
	render() {
		/* No is-active/data-active class — the active style keys off the
		   aria-pressed='true' the button already carries (the ARIA state IS the
		   style hook). Bare compounds throughout: reactive via the patch pass. */
		this.html`
			<button #button
				class="tg-btn"
				type="button"
				aria-pressed=${this.state.active ? 'true' : 'false'}
				?disabled=${this.state.disabled === true}
				@click=${this.handleClick}>
				<span class="tg-label">${this.state.label || String(this.state.value ?? '')}</span>
			</button>
		`;
	}
}
customElements.define('ui-toggle-option', UIToggleOption);
