/*
	DESCRIPTION: ui-detail-list — a key/value description grid (à la Tailwind
	Description Lists): label → value rows, optionally multi-column and copyable.
	The entity-attributes surface (tx detail, account fields, settings).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-detail-list .state.columns=${2} .state.items=${[
	    { label: 'Hash',   value: '0x9f3a…c2', mono: true, copy: true },
	    { label: 'Block',  value: '4,182,907', mono: true },
	    { label: 'Status', value: 'Confirmed' },
	  ]}></ui-detail-list>
	Pairs pass through as-is to list(); each row is this.partial (flat — no
	detail-pair shadow). A `copy: true` pair gets a host-owned click-to-copy
	control via copyText (Promise<boolean> — flashes only on real success).
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
const COPY_FLASH_MS = 1200;
export class UIDetailList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		detailList: './detail-list.css',
	};
	static state = {
		items: [],
		columns: 1,
	};
	/* Feature-light pair row — @click only when copyable. */
	detailPairRow(pair) {
		const label = pair?.label || '';
		const value = pair?.value ?? '';
		const mono = pair?.mono === true;
		const copied = pair?.copied === true;
		if (pair?.copy === true) {
			const hint = copied ? 'copied' : 'copy';
			const ariaLabel = `Copy ${label}`;
			return this.partial`
				<div class="dtl-pair">
					<dt class="dtl-label">${label}</dt>
					<dd class="dtl-value" ?data-mono=${mono}>
						<button type="button" class="dtl-copy" ?data-copied=${copied}
							aria-label=${ariaLabel}
							@click=${this.handleCopy}>
							${value}<span class="dtl-copy-hint">${hint}</span>
						</button>
					</dd>
				</div>`;
		}
		return this.partial`
			<div class="dtl-pair">
				<dt class="dtl-label">${label}</dt>
				<dd class="dtl-value" ?data-mono=${mono}>${value}</dd>
			</div>`;
	}
	async handleCopy(_domEvent, item) {
		if (!item) {
			return;
		}
		const accepted = await this.copyText(String(item.value ?? ''));
		if (accepted !== true) {
			return;
		}
		item.copied = true;
		/*
		 * Timer API is (component, handle) only — stash the pair on the handle so
		 * concurrent row flashes stay independent without a per-call arrow.
		 */
		const timers = this.copyFlashTimers ??= new WeakMap();
		let handle = timers.get(item);
		if (!handle) {
			handle = this.createTimeout(this.clearCopiedFlash, COPY_FLASH_MS);
			timers.set(item, handle);
		}
		handle.flashItem = item;
		handle.run();
	}
	/* setTimeout invoke: callback(component, handle). */
	clearCopiedFlash(_component, handle) {
		const pair = handle?.flashItem;
		if (pair) {
			pair.copied = false;
			handle.flashItem = null;
		}
	}
	pairKey(pair) {
		return pair.label;
	}
	render() {
		this.html`
			<dl class="dtl" style=${() => {
				return `--dtl-cols:${this.state.columns}`;
			}}>
				${this.list('items', this.detailPairRow, this.pairKey)}
			</dl>
		`;
	}
}
customElements.define('ui-detail-list', UIDetailList);
