/*
	DESCRIPTION: ui-swatch — one colour option in a <ui-swatch-group>.
	Receives its item as-is ({value, label?, color, disabled?, active?}) and
	owns its render. Colour is a CSS fill, not a label. On click it emits
	`swatch:select` (detail.data.value); the parent owns selection and stamps
	`active` back onto the bound item.
	── USAGE ──────────────────────────────────────────────────
	  Mounted by ui-swatch-group via list(). Standalone:
	  <ui-swatch .state.value=${'oxblood'} .state.label=${'Oxblood'}
	    .state.color=${'oklch(0.42 0.12 25)'}></ui-swatch>
*/
import { WebComponent } from 'webcomponent';
export class UISwatch extends WebComponent {
	static url = import.meta.url;
	static styles = {
		swatch: './swatch.css',
	};
	static state = {
		value: '',
		label: '',
		color: '',
		active: false,
		disabled: false,
	};
	swatchStyle() {
		const color = this.state.color;
		if (!color) {
			return '';
		}
		return `--swatch-color: ${color}`;
	}
	swatchLabel() {
		return this.state.label || String(this.state.value ?? '');
	}
	handleClick() {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('swatch:select', {
			value: this.state.value,
		});
	}
	render() {
		this.html`
			<button
				class="swatch-button"
				type="button"
				style=${this.swatchStyle}
				aria-label=${this.swatchLabel}
				aria-pressed=${this.state.active ? 'true' : 'false'}
				?disabled=${this.state.disabled === true}
				@click=${this.handleClick}></button>
		`;
	}
}
customElements.define('ui-swatch', UISwatch);
