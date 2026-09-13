import { classList, WebComponent } from 'webcomponent';
// `<ui-status-cell>` — one key/value cell of a status bar. Promoted from the
// app-specific bottom-bar-item; `<ui-status-bar>` renders these from its `items`
// config via `filter('items', …)`, items passed as-is. The inter-cell separator
// is positional CSS (`:host(:not(:last-child))`), gated by the bar's `dividers`
// flag through the inherited `--status-cell-divider` custom property.
export class UIStatusCell extends WebComponent {
	static url = import.meta.url;
	static styles = {
		statusCell: './status-cell.css',
	};
	static state = {
		label: '',
		value: '',
		valueClass: '',
	};
	render() {
		this.html`
			<div class="status-cell">
				<span class="status-cell-key">${this.state.label}</span>
				<span class=${classList('status-cell-val', this.state.valueClass)}>${this.state.value}</span>
			</div>
		`;
	}
}
customElements.define('ui-status-cell', UIStatusCell);
