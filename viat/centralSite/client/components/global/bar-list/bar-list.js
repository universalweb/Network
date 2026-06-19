/*
	DESCRIPTION: ui-bar-list — a ranked list of horizontal bars (à la Tremor
	BarList). Each row is a label sitting on a proportional bar with its value at
	the end; bars scale to the largest value. A row with `href` is a link.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-bar-list .items=${[
	    { label: '0xA1…f2', value: 9410, href: '/accounts/0xA1f2' },
	    { label: '0xB7…c9', value: 6120 },
	  ]} .tone=${'accent'}></ui-bar-list>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent, html, list } from 'webcomponent';
const TONES = new Set([
	'accent',
	'success',
	'warning',
	'danger',
	'info',
	'neutral',
]);
function formatValue(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) {
		return '';
	}
	return number.toLocaleString();
}
export class UIBarList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		barList: './bar-list.css',
	};
	static state = {
		items: [],
		tone: 'accent',
	};
	get toneClass() {
		return TONES.has(this.state.tone) ? this.state.tone : 'accent';
	}
	/* Bars are group-relative — every row needs the largest value to scale to.
	   The row fn reads this off the component (`this` in a light row), so the
	   width stays a pure function of the item + the group, no per-row enrichment. */
	get barScale() {
		const items = this.state.items;
		let max = 0;
		if (Array.isArray(items)) {
			for (let index = 0; index < items.length; index += 1) {
				const value = Number(items[index]?.value);
				if (Number.isFinite(value) && value > max) {
					max = value;
				}
			}
		}
		return max || 1;
	}
	/* Light html row — items pass through as-is; `html` auto-escapes label/href.
	   A row with an href is a link. `pct` is a plain value computed inline. */
	barRow(item) {
		const pct = Math.max(2, Math.round(((Number(item?.value) || 0) / this.barScale) * 100));
		const value = formatValue(item?.value);
		return item && item.href ? html `<li class="bl-row"><div class="bl-track"><span class="bl-bar" style=${`inline-size:${pct}%`}></span><a class="bl-label bl-link" href=${item.href}>${item?.label}</a></div><span class="bl-value">${value}</span></li>` : html `<li class="bl-row"><div class="bl-track"><span class="bl-bar" style=${`inline-size:${pct}%`}></span><span class="bl-label">${item?.label}</span></div><span class="bl-value">${value}</span></li>`;
	}
	render() {
		this.html `
			<ol class="bl" data-tone=${this.toneClass}>
				${list('items', this.barRow)}
			</ol>
		`;
	}
}
customElements.define('ui-bar-list', UIBarList);
