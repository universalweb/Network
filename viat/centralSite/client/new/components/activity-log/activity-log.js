import { WebComponent } from '../base/base.js';
import { listBind } from '../base/template.js';
const outputStyles = await WebComponent.styleSheet('./activity-log.css', import.meta.url);
const entryStyles = await WebComponent.styleSheet('./activity-log-entry.css', import.meta.url);
class ActivityLogEntry extends WebComponent {
	constructor() {
		super({
			styles: [entryStyles],
		});
		this.state = {
			direction: '',
			id: '',
			message: '',
			status: '',
			timestamp: '',
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="log-entry">
				<span class="log-ts">${this.state.timestamp}</span>
				<span class="${() => {
					return `log-tag ${this.state.direction === 'in' ? 'log-tag-in' : 'log-tag-out'}`;
				}}">${() => {
					return this.state.direction === 'in' ? '\u2199' : '\u2197';
				}}</span>
				<span class="${() => {
					return `log-msg ${this.state.status ?? ''}`.trim();
				}}">${this.state.message}</span>
			</div>
		`;
	}
}
customElements.define('activity-log-entry', ActivityLogEntry);
class ActivityLogTab extends WebComponent {
	constructor() {
		super({
			styles: [outputStyles],
		});
		this.state = {
			active: false,
			key: '',
			label: '',
		};
	}
	get activationEventName() {
		return 'activity-log-tab-select';
	}
	buildActivationDetail() {
		return {
			label: this.state.label,
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return `output-tab${this.state.active ? ' active' : ''}`;
			}}" @click=${this.handleActivate}>${this.state.label}</div>
		`;
	}
}
customElements.define('activity-log-tab', ActivityLogTab);
export class ActivityLog extends WebComponent {
	constructor() {
		super({
			styles: [outputStyles],
		});
		this.state = {
			activeTab: '',
			entries: [],
			tabs: [],
			visibleEntries: [],
		};
	}
	onConnect() {
		this.addEffect('entries', () => {
			this.syncVisibleEntries();
		});
		this.addEffect('activeTab', () => {
			this.syncTabs();
			this.syncVisibleEntries();
		});
		this.addEffect('tabs', () => {
			this.syncTabs();
		});
		this.syncTabs();
		this.syncVisibleEntries();
	}
	entryMatchesActiveTab(entry) {
		const { activeTab } = this.STATE;
		if (activeTab === 'Inbound') {
			return entry.direction === 'in';
		}
		if (activeTab === 'Outbound') {
			return entry.direction === 'out';
		}
		return true;
	}
	syncVisibleEntries() {
		const activeTab = this.STATE.activeTab ?? '';
		const visibleEntries = (this.STATE.entries ?? []).map((entry, index) => {
			return {
				...entry,
				id: entry?.id ?? index,
			};
		}).filter((entry) => {
			return this.entryMatchesActiveTab(entry);
		});
		this.state.visibleEntries = visibleEntries;
	}
	syncTabs() {
		const activeTab = this.STATE.activeTab ?? '';
		const tabs = (this.STATE.tabs ?? []).map((tab, index) => {
			const label = typeof tab === 'string' ? tab : tab?.label ?? '';
			return {
				active: label === activeTab,
				key: label || index,
				label,
			};
		});
		this.state.tabs = tabs;
	}
	createEntry(entry = {}) {
		return {
			direction: entry.direction ?? 'in',
			message: entry.message ?? '',
			status: entry.status ?? 'ok',
			timestamp: entry.timestamp ?? new Date().toLocaleTimeString('en-GB', {
				hour12: false,
			}),
		};
	}
	addEntry(entry) {
		this.state.entries.unshift(this.createEntry(entry));
	}
	handleTabClick(domEvent) {
		const label = domEvent.detail?.label ?? '';
		if (!label) {
			return;
		}
		this.state.activeTab = label;
		this.emit('tab-change', {
			tab: this.state.activeTab,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<section class="output-panel">
				<div class="panel-header">
					<span><span class="ph-id">ACTIVITY</span> // LOG</span>
					<div class="ph-dot"></div>
				</div>
				<div class="output-tabs" @activity-log-tab-select=${this.handleTabClick}>
					${listBind('tabs', ActivityLogTab)}
				</div>
				<div class="output-feed">
					${() => {
						if (this.state.visibleEntries.length > 0) {
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
					${listBind('visibleEntries', ActivityLogEntry, (entry) => {
						return entry.id;
					})}
				</div>
			</section>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
