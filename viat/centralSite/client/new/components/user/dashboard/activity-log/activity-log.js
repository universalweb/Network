import { WebComponent, each } from '../../../core/index.js';
import { Panel } from '../../../global/panel/panel.js';
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
	computeTabs() {
		const activeTab = this.state.activeTab ?? '';
		const tabs = this.state.tabs ?? [];
		const out = [];
		for (let i = 0; i < tabs.length; i++) {
			const tab = tabs[i];
			const label = typeof tab === 'string' ? tab : tab?.label ?? '';
			out.push({
				active: label === activeTab,
				key: label || i,
				label,
			});
		}
		return out;
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
					${() => {
						return each(this.computeTabs(), ActivityLogTab, (tab) => {
							return tab.key;
						});
					}}
				</div>
				<div class="output-feed">
					${() => {
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
						return each(this.computeVisibleEntries(), ActivityLogEntry, (entry) => {
							return entry.id;
						});
					}}
				</div>
			</div>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
