import { WebComponent, classList } from 'webcomponent';
// `<ui-status-cell>` — one key/value cell of a status bar. Promoted from the
// app-specific bottom-bar-item; `<ui-status-bar>` renders these from its
// `cells` config via each(). `divider` draws the trailing separator.
export class UIStatusCell extends WebComponent {
	static url = import.meta.url;
	static styles = {
		statusCell: './status-cell.css',
	};
	static state = {
		label: '',
		value: '',
		valueClass: '',
		divider: true,
	};
	render() {
		this.html `
			<div class="cell" ?data-divider=${this.state.divider}>
				<span class="cell-key">${this.state.label}</span>
				<span class=${classList('cell-val', this.state.valueClass)}>${this.state.value}</span>
			</div>
		`;
	}
}
customElements.define('ui-status-cell', UIStatusCell);
