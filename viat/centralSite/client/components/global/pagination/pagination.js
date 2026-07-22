/*
	DESCRIPTION: ui-pagination — numbered page navigation with first/prev/next/last
	and ellipsis truncation (ui-collection only has prev/next). Slots rebuild into
	`state.items` and render via `list('items', this.slotRow)` (light html — no
	`^html` string builder). Controlled: clicking clamps and emits; the consumer
	owns `page`.
	── EVENTS ───────────────────────────────────────────────────────────
	  pagination:change { page }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-pagination .state.page=${3} .state.count=${42} @pagination:change=${e => load(e.detail.data.page)}></ui-pagination>
	  <ui-pagination .state.page=${1} .state.count=${9} .state.siblings=${2} .state.showEdges=${false}></ui-pagination>
	──────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
export class UIPagination extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pagination: './pagination.css',
	};
	static state = {
		page: 1,
		count: 1,
		siblings: 1,
		boundaries: 1,
		showEdges: true,
		// Derived nav/page/gap slots for list() — rebuilt at observe-time.
		items: [],
	};
	onConnect() {
		this.observe('page', this.syncSlots);
		this.observe('count', this.syncSlots);
		this.observe('siblings', this.syncSlots);
		this.observe('boundaries', this.syncSlots);
		this.observe('showEdges', this.syncSlots);
		this.syncSlots();
	}
	goTo(page) {
		const total = Math.max(1, Number(this.state.count) || 1);
		const target = Math.min(Math.max(1, page), total);
		if (target !== this.state.page) {
			this.state.page = target;
			this.emit('pagination:change', {
				page: target,
			});
		}
	}
	handleClick(domEvent) {
		const button = domEvent.target.closest('button[data-page]');
		if (!button || button.disabled) {
			return;
		}
		this.goTo(Number(button.dataset.page));
	}
	/* Returns the visible page numbers and '…' gap markers. */
	pages(page, total) {
		const siblings = Number(this.state.siblings) || 1;
		const boundaries = Number(this.state.boundaries) || 1;
		const range = (start, end) => {
			const values = [];
			for (let value = start; value <= end; value += 1) {
				if (value >= 1 && value <= total) {
					values.push(value);
				}
			}
			return values;
		};
		const totalSlots = (siblings * 2) + 3 + (boundaries * 2);
		if (total <= totalSlots) {
			return range(1, total);
		}
		const leftSibling = Math.max(page - siblings, boundaries + 2);
		const rightSibling = Math.min(page + siblings, total - boundaries - 1);
		const slots = range(1, boundaries);
		if (leftSibling > boundaries + 2) {
			slots.push('…');
		} else {
			slots.push(...range(boundaries + 1, leftSibling - 1));
		}
		slots.push(...range(leftSibling, rightSibling));
		if (rightSibling < total - boundaries - 1) {
			slots.push('…');
		} else {
			slots.push(...range(rightSibling + 1, total - boundaries));
		}
		slots.push(...range(total - boundaries + 1, total));
		return slots;
	}
	syncSlots() {
		const page = Math.max(1, Number(this.state.page) || 1);
		const total = Math.max(1, Number(this.state.count) || 1);
		const slots = [];
		let seq = 0;
		const pushNav = (cls, glyph, target, disabled, label) => {
			slots.push({
				id: `nav-${cls}`,
				kind: 'nav',
				cls,
				glyph,
				page: target,
				disabled,
				label,
			});
		};
		if (this.state.showEdges) {
			pushNav('pg-first', '«', 1, page <= 1, 'First page');
		}
		pushNav('pg-prev', '‹', page - 1, page <= 1, 'Previous page');
		const pageSlots = this.pages(page, total);
		const pageSlotCount = pageSlots.length;
		for (let index = 0; index < pageSlotCount; index += 1) {
			const slot = pageSlots[index];
			if (slot === '…') {
				slots.push({
					id: `gap-${seq}`,
					kind: 'gap',
				});
				seq += 1;
			} else {
				slots.push({
					id: `page-${slot}`,
					kind: 'page',
					page: slot,
					active: slot === page,
				});
			}
		}
		pushNav('pg-next', '›', page + 1, page >= total, 'Next page');
		if (this.state.showEdges) {
			pushNav('pg-last', '»', total, page >= total, 'Last page');
		}
		this.state.items = slots;
	}
	slotRow(item) {
		if (item.kind === 'gap') {
			return html`<span class="pg-gap" aria-hidden="true">…</span>`;
		}
		if (item.kind === 'nav') {
			return html`<button type="button" class=${`pg-nav ${item.cls}`} data-page=${item.page} ?disabled=${item.disabled} aria-label=${item.label}>${item.glyph}</button>`;
		}
		return html`<button type="button" class="pg-page" data-page=${item.page} ?data-active=${item.active} aria-current=${item.active ? 'page' : false}>${item.page}</button>`;
	}
	slotKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<nav class="pagination" aria-label="Pagination" @click=${this.handleClick}>
				${this.list('items', this.slotRow, this.slotKey)}
			</nav>
		`;
	}
}
customElements.define('ui-pagination', UIPagination);
