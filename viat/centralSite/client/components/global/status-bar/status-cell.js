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
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class=${classList('cell', () => {
				return this.state.divider && 'cell-divider';
			})}>
				<span class="cell-key">${this.state.label}</span>
				<span class=${classList('cell-val', () => {
					return this.state.valueClass;
				})}>${this.state.value}</span>
			</div>
		`;
	}
}
customElements.define('ui-status-cell', UIStatusCell);
