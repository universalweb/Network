/*
	One entry in a <ui-legend>. Receives its series item as-is ({label, color}) and
	OWNS its muted state — a per-item independent toggle lives on the child, not in
	a parent-managed array. Interactive entries are buttons; clicking one flips its
	own `muted` and emits `legend:select` (detail.data = {label, active}); the parent
	aggregates and re-emits. Non-interactive entries are plain spans.
*/
import { WebComponent } from 'webcomponent';
export class UILegendItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		legendItem: './legend-item.css',
	};
	static state = {
		label: '',
		color: 'currentColor',
		muted: false,
		interactive: false,
	};
	handleClick() {
		if (this.state.interactive !== true) {
			return;
		}
		this.state.muted = !this.state.muted;
		this.emit('legend:select', {
			label: this.state.label,
			active: !this.state.muted,
		});
	}
	render() {
		if (this.state.interactive === true) {
			this.html`
				<button #item type="button" class="lg-item"
					aria-pressed=${this.state.muted ? 'false' : 'true'}
					@click=${this.handleClick}>
					<span class="lg-swatch" style=${`background:${this.state.color}`}></span>
					<span class="lg-label">${this.state.label}</span>
				</button>
			`;
			return;
		}
		this.html`
			<span class="lg-item" role="listitem">
				<span class="lg-swatch" style=${`background:${this.state.color}`}></span>
				<span class="lg-label">${this.state.label}</span>
			</span>
		`;
	}
}
customElements.define('ui-legend-item', UILegendItem);
