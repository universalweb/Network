import '../../../global/tabs/tabs.js';
import { WebComponent } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
import { AppView } from '../../app-view/app-view.js';
const PAGE_SIZE = 25;
const TAB_ITEMS = [
	{
		id: 'All',
		label: 'All',
	},
	{
		id: 'Inbound',
		label: 'Inbound',
	},
	{
		id: 'Outbound',
		label: 'Outbound',
	},
];
function shortCounterparty(value) {
	if (!value) {
		return '—';
	}
	return `${value.slice(0, 8)}…${value.slice(-4)}`;
}
function formatAmount(value) {
	if (value == null) {
		return '0';
	}
	const num = Number(value);
	if (!Number.isFinite(num)) {
		return String(value);
	}
	return num.toLocaleString('en-US');
}
function formatTime(iso) {
	if (!iso) {
		return '--:--:--';
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return '--:--:--';
	}
	return date.toLocaleTimeString('en-GB', {
		hour12: false,
	});
}
function entryKey(entry) {
	return entry.id;
}
/* Pure list keep-predicate — reads the display flag written at load/tab-change.
   ListSpot calls filter bare (no `this`); no per-render arrow. */
function entryVisible(entry) {
	return !entry.hidden;
}
function keepForTab(entry, activeTab) {
	if (activeTab === 'Inbound') {
		return entry.direction === 'in';
	}
	if (activeTab === 'Outbound') {
		return entry.direction === 'out';
	}
	return true;
}
class ActivityLogEntry extends WebComponent {
	static url = import.meta.url;
	static styles = {
		entry: './activity-log-entry.css',
	};
	static state = {
		direction: '',
		id: '',
		txHref: '',
		counterparty: '',
		counterpartyHref: '',
		counterpartyShort: '',
		amount: '',
		verb: '',
		status: '',
		timestamp: '',
		hidden: false,
	};
	render() {
		// Whole-row reactive read so an entry repaint also refreshes the
		// embedded <a href> targets. Router intercepts anchor clicks across
		// the shadow boundary via composedPath, so plain `<a>` is enough —
		this.html`
			<div class="log-entry">
				<span class="log-ts">${this.state.timestamp}</span>
				<span class="log-tag" data-direction=${this.state.direction}>${this.state.direction === 'in' ? '↙' : '↗'}</span>
				<span class="log-msg" data-status=${this.state.status}>
					<a class="log-link log-amount" href=${this.state.txHref} tooltip=${this.state.id}>${this.state.amount} ⩝</a>
					<span class="log-verb"> ${this.state.verb} </span>
					<a class="log-link log-addr" href=${this.state.counterpartyHref} tooltip=${this.state.counterparty}>${this.state.counterpartyShort}</a>
				</span>
			</div>
		`;
	}
}
customElements.define('activity-log-entry', ActivityLogEntry);
export class ActivityLog extends Panel {
	static url = import.meta.url;
	static styles = {
		log: './activity-log.css',
	};
	static state = {
		activeTab: 'All',
		classes: new Set(['output-panel']),
		entries: [],
		// Stable collection bag (not a per-render inline object).
		entriesConfig: {
			loader: null,
			mode: 'button',
			keyFn: entryKey,
			filter: entryVisible,
			loadMore: '#load_more',
			dedupe: true,
		},
		// ui-tabs items as-is — no method-fabricated array each paint.
		tabItems: TAB_ITEMS,
		panelId: 'ACTIVITY',
		showDot: true,
		heading: 'LOG',
		loading: false,
		error: '',
	};
	loadedAddress = '';
	onConnect() {
		this.state.entriesConfig.loader = this.loadEntries;
		this.on('entries:loading', this.handleListLoading);
		this.on('entries:loaded', this.handleListLoaded);
		this.on('entries:error', this.handleListError);
		this.observeGlobal('wallet', this.handleWalletChange);
	}
	walletAddress() {
		return this.global.wallet?.address || '';
	}
	/* The wallet bus fires on any wallet mutation (balance ticks etc.); only an
	   ADDRESS change is a new history, so reset just on that. */
	handleWalletChange(wallet) {
		const address = wallet?.address || '';
		if (address !== this.loadedAddress) {
			this.loadedAddress = address;
			this.collection('entries')?.reset();
		}
	}
	handleListLoading() {
		this.assignState({
			loading: true,
			error: '',
		});
	}
	handleListLoaded() {
		this.state.loading = false;
		this.applyTabVisibility();
	}
	handleListError(domEvent) {
		this.assignState({
			loading: false,
			error: domEvent?.detail?.data?.error || 'Could not load activity',
		});
	}
	/* collection loader — the wallet's own tx history, paged via the cursor=page
	   bridge (see accounts-list-page). Empty-success on no wallet so the mount
	   auto-load is a clean no-op until a wallet loads. */
	async loadEntries({
		reset, cursor,
	}) {
		const address = this.walletAddress();
		if (!address) {
			return {
				items: [],
				nextCursor: null,
				hasMore: false,
			};
		}
		const page = reset ? 1 : (cursor ?? 1);
		const sdk = await AppView.ensureSDK();
		if (!sdk) {
			return null;
		}
		const response = await sdk.getAccountTransactions(address, {
			page,
			limit: PAGE_SIZE,
		});
		if (!response) {
			return null;
		}
		const txs = response.transactions ?? [];
		const activeTab = this.state.activeTab;
		const items = [];
		for (let index = 0; index < txs.length; index += 1) {
			const entry = this.txToEntry(txs[index], address);
			entry.hidden = !keepForTab(entry, activeTab);
			items.push(entry);
		}
		const hasMore = Boolean(response.pagination?.hasMore);
		return {
			items,
			nextCursor: hasMore ? page + 1 : null,
			hasMore,
		};
	}
	/* Map a chain tx to the entry shape ActivityLogEntry renders. Direction is
	   relative to the wallet's own address. */
	txToEntry(tx, walletAddress) {
		const isInbound = tx.to === walletAddress;
		const counterparty = isInbound ? tx.from : tx.to;
		return {
			direction: isInbound ? 'in' : 'out',
			id: tx.id ?? '',
			txHref: tx.id ? `/tx/${encodeURIComponent(tx.id)}/` : '',
			counterparty: counterparty ?? '',
			counterpartyHref: counterparty ? `/account/${encodeURIComponent(counterparty)}/` : '',
			counterpartyShort: shortCounterparty(counterparty),
			amount: formatAmount(tx.amount),
			verb: isInbound ? 'from' : 'to',
			status: tx.status === 'completed' || tx.status === 'confirmed' ? 'ok' : (tx.status || 'pending'),
			timestamp: formatTime(tx.timestamp),
			hidden: false,
		};
	}
	/* Real-time hook: a freshly observed tx is prepended to the top through the
	   controller (so dedupe stays authoritative). Normalize first, in case a
	   caller passes a partial entry. No live caller yet — exposed for the realtime
	   transport to drive. */
	addEntry(entry) {
		const next = this.createEntry(entry);
		next.hidden = !keepForTab(next, this.state.activeTab);
		this.collection('entries')?.prepend(next);
	}
	createEntry(entry = {}) {
		return {
			direction: entry.direction ?? 'in',
			id: entry.id ?? '',
			txHref: entry.txHref ?? '',
			counterparty: entry.counterparty ?? '',
			counterpartyHref: entry.counterpartyHref ?? '',
			counterpartyShort: entry.counterpartyShort ?? '—',
			amount: entry.amount ?? '0',
			verb: entry.verb ?? '',
			status: entry.status ?? 'ok',
			timestamp: entry.timestamp ?? formatTime(new Date().toISOString()),
			hidden: false,
		};
	}
	/* Stamp `hidden` for the active tab, then retouch the array so the list
	   filter re-runs (keyed diff reuses rows; only membership flips). */
	applyTabVisibility() {
		const activeTab = this.state.activeTab;
		const entries = this.state.entries;
		if (!Array.isArray(entries) || !entries.length) {
			return;
		}
		const count = entries.length;
		for (let index = 0; index < count; index += 1) {
			const entry = entries[index];
			const wantHidden = !keepForTab(entry, activeTab);
			if (Boolean(entry.hidden) !== wantHidden) {
				entry.hidden = wantHidden;
			}
		}
		this.state.entries = entries.slice();
	}
	visibleCount() {
		const entries = this.state.entries ?? [];
		let count = 0;
		const entryCount = entries.length;
		for (let index = 0; index < entryCount; index += 1) {
			if (!entries[index].hidden) {
				count += 1;
			}
		}
		return count;
	}
	statusText() {
		if (this.state.loading) {
			return 'Loading activity…';
		}
		if (this.state.error) {
			return this.state.error;
		}
		return `No ${this.state.activeTab.toLowerCase()} transactions.`;
	}
	handleTabChange(domEvent) {
		const next = domEvent.detail?.data?.id;
		if (next && next !== this.state.activeTab) {
			this.state.activeTab = next;
			this.applyTabVisibility();
			this.emit('tabs:change', {
				tab: this.state.activeTab,
			});
		}
	}
	renderBody() {
		// Stable tabs + collection bag — no method-fabricated arrays / per-render config.
		return this.htmlElement`
			<div class="output-content">
				<ui-tabs class="output-tabs-strip"
					.state.items=${this.state.tabItems}
					.state.activeIndex=${this.state.activeTab}
					@tabs:change=${this.handleTabChange}></ui-tabs>
				<div class="output-feed">
					${this.collection('entries', ActivityLogEntry, this.state.entriesConfig)}
					<div class="log-empty" ?hidden=${() => {
						return this.visibleCount() > 0;
					}}>∅ ${this.statusText}</div>
					<div class="log-loadmore-bar">
						<button class="log-btn log-loadmore" #load_more>LOAD MORE ▾</button>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
