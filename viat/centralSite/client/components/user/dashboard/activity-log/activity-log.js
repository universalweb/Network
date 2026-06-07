import '../../../global/tabs/tabs.js';
import { WebComponent, classList, each } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
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
	};
	entryMatchesActiveTab(entry, activeTab) {
		if (activeTab === 'Inbound') {
			return entry.direction === 'in';
		}
		if (activeTab === 'Outbound') {
			return entry.direction === 'out';
		}
		return true;
	}
	computeVisibleEntries() {
		const activeTab = this.state.activeTab ?? '';
		const entries = this.state.entries ?? [];
		const out = [];
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			if (this.entryMatchesActiveTab(entry, activeTab)) {
				out.push({
					...entry,
					id: entry?.id ?? i,
				});
			}
		}
		return out;
	}
	// Normalize whatever shape the parent seeds (array of strings or array
	// of objects) into the {id, label} contract <ui-tabs> expects. Keeping
	// activeTab keyed off the label preserves the existing filter
	// predicate (`entryMatchesActiveTab` switches on 'Inbound'/'Outbound').
	tabsForUI() {
		const tabs = this.state.tabs ?? [];
		const out = [];
		for (let i = 0; i < tabs.length; i++) {
			const tab = tabs[i];
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
			timestamp: entry.timestamp ?? new Date().toLocaleTimeString('en-GB', {
				hour12: false,
			}),
		};
	}
	addEntry(entry) {
		this.state.entries.unshift(this.createEntry(entry));
	}
	handleTabChange(domEvent) {
		const next = domEvent.detail?.data?.active ?? domEvent.detail?.active;
		if (next && next !== this.state.activeTab) {
			this.state.activeTab = next;
			this.emit('tab-change', {
				tab: this.state.activeTab,
			});
		}
	}
	entryKey(entry) {
		return entry.id;
	}
	renderBody() {
		// Use the core <ui-tabs> strip in horizontal mode — no slotted
		// content (the feed sits BELOW the strip rather than inside any
		// tab pane). That way the existing entry-filter logic keeps the
		// single source of truth and we don't re-mount per-tab feeds.
		// Any change to the global tabs (indicator animation, hover state,
		// accessibility, mobile icon mode) now flows in automatically.
		return this.htmlElement `
			<div class="output-content">
				<ui-tabs class="output-tabs-strip"
					.tabs=${this.tabsForUI}
					.active=${this.state.activeTab}
					@tab-change=${this.handleTabChange}></ui-tabs>
				<div class="output-feed">
					^html${() => {
						if (this.computeVisibleEntries().length > 0) {
							return '';
						}
						return `
							<div class="log-entry">
								<span class="log-ts">--:--:--</span>
								<span class="log-tag">∅</span>
								<span class="log-msg">No ${this.state.activeTab.toLowerCase()} transactions.</span>
							</div>
						`;
					}}
					${() => {
						return each(this.computeVisibleEntries(), ActivityLogEntry, this.entryKey);
					}}
				</div>
			</div>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
