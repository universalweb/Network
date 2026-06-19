/*
	DESCRIPTION: ui-detail-list — a key/value description grid (à la Tailwind
	Description Lists): label → value rows, optionally multi-column and copyable.
	The entity-attributes surface (tx detail, account fields, settings).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-detail-list .columns=${2} .pairs=${[
	    { label: 'Hash',   value: '0x9f3a…c2', mono: true, copy: true },
	    { label: 'Block',  value: '4,182,907', mono: true },
	    { label: 'Status', value: 'Confirmed' },
	  ]}></ui-detail-list>
	Pairs pass through as-is to `list()`; each <ui-detail-pair> renders itself and a
	`copy: true` pair owns its own click-to-copy control.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent, list } from 'webcomponent';
import { UIDetailPair } from './detail-pair.js';
export class UIDetailList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		detailList: './detail-list.css',
	};
	static state = {
		pairs: [],
		columns: 1,
	};
	render() {
		this.html `
			<dl class="dtl" style=${() => {
				return `--dtl-cols:${this.state.columns}`;
			}}>
				${list('pairs', UIDetailPair, this.pairKey)}
			</dl>
		`;
	}
	pairKey(pair) {
		return pair.label;
	}
}
customElements.define('ui-detail-list', UIDetailList);
