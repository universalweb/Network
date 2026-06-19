/*
	DESCRIPTION: ui-breadcrumbs — a route/path trail. Renders an ordered list of
	crumbs; a crumb with `href` is a link, one without (the current page) is plain
	aria-current text.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-breadcrumbs .items=${[
	    { label: 'Explorer', href: '/explorer' },
	    { label: 'Block 4821', href: '/explorer/4821' },
	    { label: 'Tx 0x9f…', }
	  ]}></ui-breadcrumbs>
	Drive `items` from the router's published route trail; omit `href` on the
	current (last) crumb.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent, html, list } from 'webcomponent';
/*
 * Separator chevron from the shared Lucide sprite (same source `ui-icon` uses).
 * Every crumb carries a leading chevron; CSS hides it on the first one
 * (`.bc-item:first-child .bc-sep`), so position is styling, not per-item data.
 */
const SPRITE_URL = new URL('../icon/sprite.svg', import.meta.url).href;
const CHEVRON_HREF = `${SPRITE_URL}#chevron-right`;
export class UIBreadcrumbs extends WebComponent {
	static url = import.meta.url;
	static styles = {
		breadcrumbs: './breadcrumbs.css',
	};
	static state = {
		items: [],
	};
	/* Light html row per crumb — items pass through as-is; `html` auto-escapes
	   label/href. The crumb is a link when it has an href, else current text. */
	crumbRow(item) {
		return item && item.href ? html `<li class="bc-item"><svg class="bc-sep" viewBox="0 0 24 24" aria-hidden="true"><use href=${CHEVRON_HREF}></use></svg><a class="bc-link" href=${item.href}>${item?.label}</a></li>` : html `<li class="bc-item"><svg class="bc-sep" viewBox="0 0 24 24" aria-hidden="true"><use href=${CHEVRON_HREF}></use></svg><span class="bc-current" aria-current="page">${item?.label}</span></li>`;
	}
	render() {
		this.html `
			<nav class="bc" aria-label="Breadcrumb">
				<ol class="bc-list">
					${list('items', this.crumbRow)}
				</ol>
			</nav>
		`;
	}
}
customElements.define('ui-breadcrumbs', UIBreadcrumbs);
