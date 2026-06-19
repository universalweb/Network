/*
	DESCRIPTION: ui-pagination — numbered page navigation with first/prev/next/last
	and ellipsis truncation (paged-list only has prev/next). Buttons are NATIVE with
	unicode glyphs built as a pure string + one delegated click handler — no `ui-*`
	props in the string, so nothing renders blank. Controlled: clicking clamps and
	emits; the consumer owns `page`.
	── EVENTS ───────────────────────────────────────────────────────────
	  page:change { page }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-pagination .page=${3} .count=${42} @page:change=${e => load(e.detail.data.page)}></ui-pagination>
	  <ui-pagination .page=${1} .count=${9} .siblings=${2} .showEdges=${false}></ui-pagination>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
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
	};
	goTo(page) {
		const total = Math.max(1, Number(this.state.count) || 1);
		const target = Math.min(Math.max(1, page), total);
		if (target !== this.state.page) {
			this.state.page = target;
			this.emit('page:change', {
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
	/* Returns the visible slots: page numbers and '…' gap markers. Standard
	   boundaries/siblings windowing — full range when it fits. */
	pages(page, total) {
		const siblings = Number(this.state.siblings) || 1;
		const boundaries = Number(this.state.boundaries) || 1;
		const range = (start, end) => {
			const out = [];
			for (let value = start; value <= end; value += 1) {
				if (value >= 1 && value <= total) {
					out.push(value);
				}
			}
			return out;
		};
		const totalSlots = siblings * 2 + 3 + boundaries * 2;
		if (total <= totalSlots) {
			return range(1, total);
		}
		const leftSibling = Math.max(page - siblings, boundaries + 2);
		const rightSibling = Math.min(page + siblings, total - boundaries - 1);
		const out = range(1, boundaries);
		if (leftSibling > boundaries + 2) {
			out.push('…');
		} else {
			out.push(...range(boundaries + 1, leftSibling - 1));
		}
		out.push(...range(leftSibling, rightSibling));
		if (rightSibling < total - boundaries - 1) {
			out.push('…');
		} else {
			out.push(...range(rightSibling + 1, total - boundaries));
		}
		out.push(...range(total - boundaries + 1, total));
		return out;
	}
	render() {
		this.html `
			<nav class="pagination" aria-label="Pagination" @click=${this.handleClick}>
				^html${this.renderItems}
			</nav>
		`;
	}
	renderItems() {
		const page = Math.max(1, Number(this.state.page) || 1);
		const total = Math.max(1, Number(this.state.count) || 1);
		const navButton = (cls, glyph, target, disabled, label) => {
			return `<button type="button" class="pg-nav ${cls}" data-page="${target}"${disabled ? ' disabled' : ''} aria-label="${label}">${glyph}</button>`;
		};
		const parts = [];
		if (this.state.showEdges) {
			parts.push(navButton('pg-first', '«', 1, page <= 1, 'First page'));
		}
		parts.push(navButton('pg-prev', '‹', page - 1, page <= 1, 'Previous page'));
		const slots = this.pages(page, total);
		for (let index = 0; index < slots.length; index += 1) {
			const slot = slots[index];
			if (slot === '…') {
				parts.push('<span class="pg-gap" aria-hidden="true">…</span>');
			} else {
				const active = slot === page;
				parts.push(`<button type="button" class="pg-page" data-page="${slot}"${active ? ' data-active aria-current="page"' : ''}>${slot}</button>`);
			}
		}
		parts.push(navButton('pg-next', '›', page + 1, page >= total, 'Next page'));
		if (this.state.showEdges) {
			parts.push(navButton('pg-last', '»', total, page >= total, 'Last page'));
		}
		return parts.join('');
	}
}
customElements.define('ui-pagination', UIPagination);
