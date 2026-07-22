import '../../../global/tabs/tabs.js';
import AppView from '../../../../modules/app.js';
import { WebComponent } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
import { COLLECTION_EVENT } from '../../../global/ui-collection/ui-collection.js';
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
/* Pure keep-predicate the ui-collection engine runs against the active tab
   (its filterArg). A tab switch rewrites filterArg → setFilterArg retouches the
   loaded window → this re-runs, hiding rows client-side with no reload. */
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
		// ui-tabs items as-is — no method-fabricated array each paint.
		tabItems: TAB_ITEMS,
		panelId: 'ACTIVITY',
		showDot: true,
		heading: 'LOG',
		// Tab-aware empty text handed to the feed (updated on tab change).
		feedEmpty: 'No all transactions.',
	};
	loadedAddress = '';
	/* <ui-collection> contract — one stable object merged via `.state=`. The
	   loader arrow closes over page `this` (the engine calls it `.call(host)`,
	   host = ui-collection); the row is a self-contained component; `keepForTab`
	   filters live off filterArg, and `showBar: false` drops the meta/controls
	   bar so the feed stays a bare list under the tabs. */
	feedConfig = {
		loader: (options) => {
			return this.loadEntries(options);
		},
		renderRow: ActivityLogEntry,
		keyFn: entryKey,
		filter: keepForTab,
		// Button-only: manual LOAD MORE, no scroll auto-load (the feed lives in a
		// bounded dashboard panel). The button doubles as the "more available"
		// cue and collapses to an end-of-results marker when exhausted.
		pagingStyle: 'button',
		showBar: false,
		itemNoun: 'transactions',
		loadingMessage: 'Loading activity…',
	};
	onConnect() {
		this.observeGlobal('wallet', this.handleWalletChange);
		this.observeGlobal('account', this.handleAccountChange);
	}
	walletAddress() {
		return this.global.wallet?.address || '';
	}
	/* Reload the feed to page 1. Emitted rather than called through a ref: the
	   mounted <ui-collection> listens for this on its host, so this panel needs
	   no handle on it and no knowledge of its method names. */
	refresh() {
		this.emit(COLLECTION_EVENT.REFRESH);
	}
	/* The wallet bus fires on any wallet mutation (balance ticks etc.); only an
	   ADDRESS change is a new history, so reset just on that. */
	handleWalletChange(wallet) {
		const address = wallet?.address || '';
		if (address !== this.loadedAddress) {
			this.loadedAddress = address;
			this.refresh();
		}
	}
	/* A same-address REFETCH (faucet, send, manual refresh) means new server-side
	   history with no address change, so handleWalletChange above can't see it.
	   `fetchedAt` is re-stamped by every account fetch, which makes it the exact
	   signal — and reading it from the store means the reload happens for ANY
	   refetch, whoever triggered it, with no fan-out from the app shell. */
	handleAccountChange(account) {
		const fetchedAt = account?.fetchedAt || '';
		if (fetchedAt && fetchedAt !== this.loadedFetchedAt) {
			this.loadedFetchedAt = fetchedAt;
			this.refresh();
		}
	}
	/* Feed loader — the wallet's own tx history, paged via the cursor=page bridge
	   (see account-detail-page). Empty-success on no wallet so the mount auto-load
	   is a clean no-op until a wallet loads. Runs with page `this` (loader arrow). */
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
		const items = [];
		const txCount = txs.length;
		for (let index = 0; index < txCount; index += 1) {
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
	handleTabChange(domEvent) {
		const next = domEvent.detail?.data?.id;
		if (next && next !== this.state.activeTab) {
			this.state.activeTab = next;
			this.state.feedEmpty = `No ${next.toLowerCase()} transactions.`;
			this.emit('tabs:change', {
				tab: this.state.activeTab,
			});
		}
	}
	renderBody() {
		// Stable tabs + feed config — no method-fabricated arrays / per-render
		// config. The feed owns the row list, load-more, status and empty state;
		// filterArg (the active tab) re-filters the loaded window with no reload.
		return this.htmlElement`
			<div class="output-content">
				<ui-tabs class="output-tabs-strip"
					.state.items=${this.state.tabItems}
					.state.activeIndex=${this.state.activeTab}
					@tabs:change=${this.handleTabChange}></ui-tabs>
				<ui-collection class="output-feed"
					.state=${this.feedConfig}
					.state.filterArg=${this.state.activeTab}
					.state.emptyMessage=${this.state.feedEmpty}
					#feed></ui-collection>
			</div>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
