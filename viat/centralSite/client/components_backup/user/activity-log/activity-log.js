import { Panel } from '../../global/panel/panel.js';
import { WebComponent } from '../../core/base.js';
import { list } from '../../core/template.js';
class ActivityLogEntry extends WebComponent {
	static url = import.meta.url;
	static styles = {
		entry: './activity-log-entry.css',
	};
	static state = {
		direction: '',
		id: '',
		message: '',
		status: '',
		timestamp: '',
	};
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
	static url = import.meta.url;
	static styles = {
		log: './activity-log.css',
	};
	static state = {
		active: false,
		key: '',
		label: '',
	};
	handleClick() {
		this.emit('activity-log-tab-select', {
			label: this.state.label,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return `output-tab${this.state.active ? ' active' : ''}`;
			}}" @click=${this.handleClick}>${this.state.label}</div>
		`;
	}
}
customElements.define('activity-log-tab', ActivityLogTab);
export class ActivityLog extends Panel {
	static url = import.meta.url;
	static styles = {
		log: './activity-log.css',
	};
	static state = {
		activeTab: '',
		className: ['output-panel'],
		entries: [],
		id: 'ACTIVITY',
		showDot: true,
		tabs: [],
		title: 'LOG',
		visibleEntries: [],
	};
	onConnect() {
		this.observe('entries', () => {
			this.syncVisibleEntries();
		});
		this.observe('activeTab', () => {
			this.syncTabs();
			this.syncVisibleEntries();
		});
		this.observe('tabs', () => {
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
		const label = domEvent.detail?.data?.label ?? '';
		if (!label) {
			return;
		}
		this.state.activeTab = label;
		this.emit('tab-change', {
			tab: this.state.activeTab,
		});
	}
	renderBody() {
		return this.htmlElement `
			<div class="output-content">
				<div class="output-tabs" @activity-log-tab-select=${this.handleTabClick}>
					${list('tabs', ActivityLogTab)}
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
					${list('visibleEntries', ActivityLogEntry, (entry) => {
						return entry.id;
					})}
				</div>
			</div>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
