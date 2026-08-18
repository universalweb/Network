import '../../../global/tabs/tabs.js';
import AppView from '../../../../modules/app.js';
import { html } from '../../../core/index.js';
import { COLLECTION_EVENT } from '../../../global/collection/collection.js';
import { Panel } from '../../../global/panel/panel.js';
const PAGE_SIZE = 25;
/* Row CSS injected into <ui-collection>'s shadow via `.importStyles`, so the
   light `html` rows render in the shared collection row format — same pattern as
   account-detail-rows.css / explorer-rows.css. */
const ROW_STYLES = new URL('./activity-log-rows.css', import.meta.url).href;
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
		// Row CSS pushed into <ui-collection>'s shadow via `.importStyles`.
		rowStyles: ROW_STYLES,
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
		renderRow: this.txRow,
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
	/* Map a chain tx to the entry shape the row renders. Direction is
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
	/* Light `html` row rendered directly into <ui-collection>'s .pl-table and
	   styled via the importStyles-injected activity-log-rows.css — same pattern as
	   account-detail's txRow. Value-only expressions per the light-row contract;
	   the router intercepts anchor clicks across the shadow boundary via
	   composedPath, so plain `<a>` is enough. */
	txRow(entry) {
		return html`
			<div class="log-row">
				<span class="log-ts">${entry.timestamp}</span>
				<span class="log-tag" data-direction=${entry.direction}>${entry.direction === 'in' ? '↙' : '↗'}</span>
				<span class="log-msg" data-status=${entry.status}>
					<a class="log-link log-amount" href=${entry.txHref} title=${entry.id}>${entry.amount} ⩝</a>
					<span class="log-verb"> ${entry.verb} </span>
					<a class="log-link log-addr" href=${entry.counterpartyHref} title=${entry.counterparty}>${entry.counterpartyShort}</a>
				</span>
			</div>
		`;
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
					.importStyles=${this.state.rowStyles}
					#feed></ui-collection>
			</div>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
