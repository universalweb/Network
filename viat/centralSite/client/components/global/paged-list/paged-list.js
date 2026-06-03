import { WebComponent } from '../../core/index.js';
// `<paged-list>` — reusable list shell with built-in paging.
//
// Owns: items / page / hasMore / totalCount / loading / error state, the
// load-on-page-change lifecycle, prev/next/refresh controls, and empty /
// loading / error fallbacks.
//
// Parent supplies:
//   - `.loader` :: (page) => Promise<{items, hasMore, totalCount} | null>
//   - `.renderItem` :: (item, index) => string  — HTML for one row
//   - `.renderHeader` :: () => string            — OPTIONAL header row markup
//   - `.renderEmpty` :: () => string             — OPTIONAL custom empty state
//   - `.pageHref` :: (page) => string            — link target for prev/next
//   - `.itemNoun` :: 'transactions' | 'accounts' | ...  — subtitle word
//   - `pageSize` :: number — passed back to the parent's loader as info
//
// Parent drives navigation by calling `setPage(N)` (typically from a router
// observer) and reads progress via state / events. Loader contract returns
// `null` on failure so the SDK's notification path stays the source of
// user-visible error messaging.
const SAME = (current, next) => {
	return current === next || (Number(current) === Number(next));
};
export class PagedList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pagedList: './paged-list.css',
	};
	static state = {
		items: [],
		page: 1,
		hasMore: false,
		totalCount: 0,
		loading: false,
		error: '',
	};
	loader = null;
	renderItem = null;
	renderHeader = null;
	renderEmpty = null;
	pageHref = null;
	itemNoun = 'items';
	pageSize = 20;
	loadedKey = '';
	setPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (SAME(this.loadedKey, target) && this.state.items.length) {
			if (!SAME(this.state.page, target)) {
				this.assignState({
					page: target,
				});
			}
			return;
		}
		this.assignState({
			page: target,
		});
		this.loadPage(target);
	}
	refresh = () => {
		this.loadedKey = '';
		this.loadPage(this.state.page);
	};
	async loadPage(page = 1) {
		if (typeof this.loader !== 'function') {
			this.assignState({
				loading: false,
				error: 'No loader configured',
			});
			return;
		}
		this.loadedKey = `${page}`;
		this.assignState({
			loading: true,
			error: '',
		});
		const result = await this.loader(page);
		if (this.loadedKey !== `${page}`) {
			// A newer setPage superseded us; drop this response.
			return;
		}
		if (!result) {
			this.assignState({
				loading: false,
				error: 'Could not load results',
			});
			return;
		}
		this.assignState({
			items: result.items ?? [],
			page,
			hasMore: Boolean(result.hasMore),
			totalCount: result.totalCount ?? 0,
			loading: false,
		});
	}
	prevHref() {
		const target = Math.max(1, this.state.page - 1);
		return typeof this.pageHref === 'function' ? this.pageHref(target) : '#';
	}
	nextHref() {
		const target = this.state.page + 1;
		return typeof this.pageHref === 'function' ? this.pageHref(target) : '#';
	}
	subtitleCount() {
		const total = this.state.totalCount ?? 0;
		return Number(total).toLocaleString('en-US');
	}
	subtitlePage() {
		return this.state.page;
	}
	subtitleStatus() {
		if (this.state.loading) {
			return 'syncing…';
		}
		if (this.state.error) {
			return `error: ${this.state.error}`;
		}
		return '';
	}
	renderBody() {
		if (this.state.loading && !this.state.items.length) {
			return '<div class="pl-empty">Loading…</div>';
		}
		if (this.state.error && !this.state.items.length) {
			return `<div class="pl-empty pl-error">${this.state.error}</div>`;
		}
		if (!this.state.items.length) {
			return typeof this.renderEmpty === 'function'
				? this.renderEmpty()
				: '<div class="pl-empty">Nothing here yet.</div>';
		}
		if (typeof this.renderItem !== 'function') {
			return '<div class="pl-empty">No row renderer configured.</div>';
		}
		let markup = '';
		const items = this.state.items;
		for (let index = 0; index < items.length; index += 1) {
			markup += this.renderItem(items[index], index);
		}
		return markup;
	}
	renderHead() {
		return typeof this.renderHeader === 'function' ? this.renderHeader() : '';
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="pl-shell">
				<div class="pl-table">
					^html${this.renderHead}
					^html${this.renderBody}
				</div>
				<div class="pl-pager">
					<a class="pl-btn"
						href=${this.prevHref}
						aria-disabled=${() => String(this.state.page <= 1)}>‹ Prev</a>
					<span class="pl-status">
						<span class="pl-num">${this.subtitleCount}</span>
						<span class="pl-label">${() => this.itemNoun}</span>
						<span class="pl-sep">·</span>
						<span class="pl-label">Page</span>
						<span class="pl-num">${this.subtitlePage}</span>
						<span class="pl-status-text">${this.subtitleStatus}</span>
					</span>
					<a class="pl-btn"
						href=${this.nextHref}
						aria-disabled=${() => String(!this.state.hasMore)}>Next ›</a>
					<button class="pl-btn pl-refresh" @click=${this.refresh}>↻</button>
				</div>
			</div>
		`;
	}
}
customElements.define('paged-list', PagedList);
