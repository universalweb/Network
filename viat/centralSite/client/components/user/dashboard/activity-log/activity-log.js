import '../../../global/tabs/tabs.js';
import { WebComponent, classList, remoteList } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
const PAGE_SIZE = 25;
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
	};
	render() {
		// Whole-row reactive read so an entry repaint also refreshes the
		// embedded <a href> targets. Router intercepts anchor clicks across
		// the shadow boundary via composedPath, so plain `<a>` is enough —
		// no manual navigate() wiring.
		this.html `
			<div class="log-entry">
				<span class="log-ts">${this.state.timestamp}</span>
				<span class=${classList('log-tag', () => {
					return this.state.direction === 'in' ? 'log-tag-in' : 'log-tag-out';
				})}>${() => {
					return this.state.direction === 'in' ? '↙' : '↗';
				}}</span>
				<span class=${classList('log-msg', () => {
					return this.state.status;
				})}>
					<a class="log-link log-amount" href="${this.state.txHref}" title="${this.state.id}">${this.state.amount} ⩝</a>
					<span class="log-verb"> ${this.state.verb} </span>
					<a class="log-link log-addr" href="${this.state.counterpartyHref}" title="${this.state.counterparty}">${this.state.counterpartyShort}</a>
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
		id: 'ACTIVITY',
		showDot: true,
		tabs: [
			'All', 'Inbound', 'Outbound',
		],
		title: 'LOG',
		loading: false,
		error: '',
	};
	loadedAddress = '';
	onConnect() {
		this.on('entries:loading', this.handleListLoading);
		this.on('entries:loaded', this.handleListLoaded);
		this.on('entries:error', this.handleListError);
		this.observeGlobal('wallet', (wallet) => {
			return this.handleWalletChange(wallet);
		});
	}
	walletAddress() {
		return this.globalState.wallet?.address || '';
	}
	/* The wallet bus fires on any wallet mutation (balance ticks etc.); only an
	   ADDRESS change is a new history, so reset just on that. */
	handleWalletChange(wallet) {
		const address = wallet?.address || '';
		if (address !== this.loadedAddress) {
			this.loadedAddress = address;
			this.remote('entries')?.reset();
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
	}
	handleListError(domEvent) {
		this.assignState({
			loading: false,
			error: domEvent?.detail?.data?.error || 'Could not load activity',
		});
	}
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	/* remoteList loader — the wallet's own tx history, paged via the cursor=page
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
		const sdk = await this.getSDK();
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
		const items = [];
		for (let index = 0; index < txs.length; index += 1) {
			items.push(this.txToEntry(txs[index], address));
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
		};
	}
	/* Real-time hook: a freshly observed tx is prepended to the top through the
	   controller (so dedupe stays authoritative). Normalize first, in case a
	   caller passes a partial entry. No live caller yet — exposed for the realtime
	   transport to drive. */
	addEntry(entry) {
		this.remote('entries')?.prepend(this.createEntry(entry));
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
		};
	}
	/* Client display predicate for the tab strip (All / Inbound / Outbound),
	   passed as remoteList's `filter`. */
	tabKeep(entry) {
		const activeTab = this.state.activeTab;
		if (activeTab === 'Inbound') {
			return entry.direction === 'in';
		}
		if (activeTab === 'Outbound') {
			return entry.direction === 'out';
		}
		return true;
	}
	visibleCount() {
		const entries = this.state.entries ?? [];
		let count = 0;
		for (let index = 0; index < entries.length; index += 1) {
			if (this.tabKeep(entries[index])) {
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
	// Normalize whatever shape the parent seeds (array of strings or array
	// of objects) into the {id, label} contract <ui-tabs> expects. Keeping
	// activeTab keyed off the label preserves the existing filter predicate.
	tabsForUI() {
		const tabs = this.state.tabs ?? [];
		const out = [];
		for (let index = 0; index < tabs.length; index += 1) {
			const tab = tabs[index];
			const label = typeof tab === 'string' ? tab : tab?.label ?? '';
			if (!label) {
				continue;
			}
			out.push({
				id: label,
				label,
			});
		}
		return out;
	}
	handleTabChange(domEvent) {
		const next = domEvent.detail?.data?.active ?? domEvent.detail?.active;
		if (next && next !== this.state.activeTab) {
			this.state.activeTab = next;
			/* The display filter (`tabKeep`) reads activeTab, but activeTab is not a
			   dep of the list spot — only `entries` is. Re-touch entries (same items,
			   new array ref) so the spot re-runs the filter against the new tab. The
			   keyed diff (by id) reuses rows; only membership changes. */
			this.state.entries = this.state.entries.slice();
			this.emit('tab-change', {
				tab: this.state.activeTab,
			});
		}
	}
	renderBody() {
		// The core <ui-tabs> strip drives `activeTab`; the feed below renders the
		// wallet's tx history via remoteList, with `tabKeep` as the display filter.
		return this.htmlElement `
			<div class="output-content">
				<ui-tabs class="output-tabs-strip"
					.tabs=${this.tabsForUI}
					.active=${this.state.activeTab}
					@tab-change=${this.handleTabChange}></ui-tabs>
				<div class="output-feed">
					${remoteList('entries', ActivityLogEntry, {
						loader: this.loadEntries,
						mode: 'button',
						keyFn: entryKey,
						filter: (entry) => {
							return this.tabKeep(entry);
						},
						loadMore: '#load_more',
						dedupe: true,
					})}
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
