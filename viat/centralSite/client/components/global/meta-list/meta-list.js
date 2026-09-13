/*
	DESCRIPTION: ui-meta-list — an inline meta label list (jsperf `.result-rows-card-meta`).
	Separator is configurable: a Lucide icon (default `dot`), a plain character,
	or none. Icon is omitted entirely when unused — never an empty name.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-meta-list .state.items=${[
	    { id: 'os', label: 'macOS' },
	    { id: 'cpu', label: '10 cores' },
	  ]} .state.separator=${'icon'} .state.separatorIcon=${'dot'}></ui-meta-list>
	  <ui-meta-list .state.items=${items} .state.separator=${'char'} .state.separatorChar=${'·'}></ui-meta-list>
	  <ui-meta-list .state.items=${items} .state.separator=${'none'}></ui-meta-list>
*/
import '../icon/icon.js';
import {
	html,
	isArray,
	WebComponent,
} from 'webcomponent';
const SEPARATORS = new Set([
	'icon', 'char', 'none',
]);
export class UIMetaList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		metaList: './meta-list.css',
	};
	static state = {
		items: [],
		separator: 'icon',
		separatorIcon: 'dot',
		separatorChar: '·',
	};
	get resolvedSeparator() {
		return SEPARATORS.has(this.state.separator) ? this.state.separator : 'icon';
	}
	showIconSep() {
		return this.resolvedSeparator === 'icon' && Boolean(this.state.separatorIcon);
	}
	showCharSep() {
		return this.resolvedSeparator === 'char' && Boolean(this.state.separatorChar);
	}
	iconName() {
		return this.state.separatorIcon || 'dot';
	}
	/*
	 * Take the index from the ARGUMENT, not from `items.indexOf(item)`. The list
	 * calls a row renderer as `renderFn.call(component, item, itemIndex)`, and the
	 * item handed over does not necessarily satisfy identity against the array the
	 * component reads back — indexOf returned -1 for every row, so `first` was
	 * false throughout and the list painted a LEADING separator before the first
	 * label. The index is supplied precisely so a row never has to search for
	 * itself.
	 */
	metaRow(item, itemIndex) {
		const first = itemIndex === 0;
		const label = item?.label ?? '';
		if (this.showIconSep()) {
			return html`<li class="meta-list-item" ?data-first=${first}>
				<ui-icon class="meta-list-sep-icon" ?hidden=${first} .state.name=${this.iconName()} .state.size=${'sm'}></ui-icon>
				<span class="meta-list-label">${label}</span>
			</li>`;
		}
		if (this.showCharSep()) {
			return html`<li class="meta-list-item" ?data-first=${first}>
				<span class="meta-list-sep-char" ?hidden=${first}>${this.state.separatorChar}</span>
				<span class="meta-list-label">${label}</span>
			</li>`;
		}
		return html`<li class="meta-list-item" ?data-first=${first}>
			<span class="meta-list-label">${label}</span>
		</li>`;
	}
	render() {
		this.html`
			<ul class="meta-list" data-separator=${this.resolvedSeparator}>
				${this.list('items', this.metaRow)}
			</ul>
		`;
	}
}
customElements.define('ui-meta-list', UIMetaList);
