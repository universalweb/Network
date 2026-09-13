/*
	DESCRIPTION: ui-breadcrumbs — a route/path trail. Renders an ordered list of
	crumbs; a crumb with `href` is a link when `interactive` is on, one without
	(the current page) is plain aria-current text. Separators are <ui-icon>.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-breadcrumbs .state.items=${[
	    { label: 'Explorer', href: '/explorer' },
	    { label: 'Block 4821', href: '/explorer/4821' },
	    { label: 'Tx 0x9f…', }
	  ]}></ui-breadcrumbs>
	Preview sets `.state.interactive=${false}` so demo hrefs do not navigate.
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import {
	html,
	isArray,
	isTrue,
	WebComponent,
} from 'webcomponent';
export class UIBreadcrumbs extends WebComponent {
	static url = import.meta.url;
	static styles = {
		breadcrumbs: './breadcrumbs.css',
	};
	static state = {
		items: [],
		interactive: true,
		separatorIcon: 'chevron-right',
	};
	crumbHref(item, last) {
		if (last || !isTrue(this.state.interactive) || !item?.href) {
			return '';
		}
		return item.href;
	}
	crumbStyle(index, itemCount) {
		return `--breadcrumbs-i:${index};--breadcrumbs-n:${itemCount}`;
	}
	/* Light html row — items pass through as-is. Index is read from the
	   parent list so brightness ramps without an enrichment loop. */
	crumbRow(item, itemIndex) {
		const items = this.state.items;
		/*
		 * Position comes from the ARGUMENT. The list calls a row renderer as
		 * `renderFn.call(component, item, itemIndex)`, and the item handed over does
		 * not necessarily satisfy identity against the array read back here, so
		 * `items.indexOf(item)` returned -1 for EVERY crumb. That was not cosmetic:
		 * `--breadcrumbs-i` / `data-index` collapsed to -1 so the brightness ramp died, and
		 * `last` was never true — meaning no crumb carried `aria-current="page"`
		 * and the current page still rendered as a link.
		 */
		const index = itemIndex;
		const itemCount = isArray(items) && items.length > 0 ? items.length : 1;
		const last = index === itemCount - 1;
		const href = this.crumbHref(item, last);
		const crumbStyle = this.crumbStyle(index, itemCount);
		if (href) {
			return html`<li class="breadcrumbs-item" style=${crumbStyle} data-index=${index}>
				<ui-icon class="breadcrumbs-sep" .state.name=${this.state.separatorIcon} .state.size=${'sm'}></ui-icon>
				<a class="breadcrumbs-link" href=${href}>${item?.label}</a>
			</li>`;
		}
		return html`<li class="breadcrumbs-item" style=${crumbStyle} data-index=${index} ?data-last=${last}>
			<ui-icon class="breadcrumbs-sep" .state.name=${this.state.separatorIcon} .state.size=${'sm'}></ui-icon>
			<span class="breadcrumbs-current" aria-current=${last ? 'page' : ''}>${item?.label}</span>
		</li>`;
	}
	render() {
		this.html`
			<nav class="breadcrumbs" aria-label="Breadcrumb">
				<ol class="breadcrumbs-list">
					${this.list('items', this.crumbRow)}
				</ol>
			</nav>
		`;
	}
}
customElements.define('ui-breadcrumbs', UIBreadcrumbs);
