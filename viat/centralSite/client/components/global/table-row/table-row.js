/*
	DESCRIPTION: ui-table-row — one body row for ui-table.
*/
import { WebComponent } from 'webcomponent';
function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
export class UITableRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tableRow: './table-row.css',
	};
	static state = {
		index: 0,
	};
	handleClick() {
		const host = this.parentComponent;
		const index = Number(this.state.index);
		const item = host?.state?.items?.[index];
		this.emit('table-row:click', {
			index,
			item: item || null,
		});
	}
	cellsMarkup() {
		const host = this.parentComponent;
		const columns = host?.state?.columns || [];
		const count = columns.length;
		const parts = [];
		for (let index = 0; index < count; index++) {
			const column = columns[index];
			const key = column.key;
			const raw = this.state[key];
			const text = raw == null ? '' : String(raw);
			const align = column.align || 'start';
			parts.push(`<td class="tb-td" data-align="${align}">${escapeHtml(text)}</td>`);
		}
		return parts.join('');
	}
	render() {
		/*
		 * Host IS the table-row (display:table-row). A nested <tr> inside shadow
		 * breaks table geometry. Wrapper uses display:contents so .tb-td cells
		 * participate as the row's cells.
		 */
		this.html`
			<div class="tb-row" @click=${this.handleClick}>
				^html${this.cellsMarkup}
			</div>
		`;
	}
}
customElements.define('ui-table-row', UITableRow);
