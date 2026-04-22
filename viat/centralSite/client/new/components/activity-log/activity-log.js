import { WebComponent } from '../base/base.js';
import { each } from '../base/template.js';
const outputStyles = await WebComponent.styleSheet('./activity-log.css', import.meta.url);
const entryStyles = await WebComponent.styleSheet('./activity-log-entry.css', import.meta.url);
class ActivityLogEntry extends WebComponent {
	constructor() {
		super([entryStyles]);
		this.state = {
			direction: '',
			message: '',
			status: '',
			timestamp: '',
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="log-entry">
				<span class="log-ts">${() => {
					return this.state.timestamp;
				}}</span>
				<span class="${() => {
					return `log-tag ${this.state.direction === 'in' ? 'log-tag-in' : 'log-tag-out'}`;
				}}">${() => {
					return this.state.direction === 'in' ? '\u2199' : '\u2197';
				}}</span>
				<span class="${() => {
					return `log-msg ${this.state.status ?? ''}`.trim();
				}}">${() => {
					return this.state.message;
				}}</span>
			</div>
		`;
	}
}
customElements.define('activity-log-entry', ActivityLogEntry);
function createEntry(entry) {
	const el = new ActivityLogEntry();
	el.state = entry;
	return el;
}
export class ActivityLog extends WebComponent {
	constructor() {
		super([outputStyles]);
		this.entrySnapshotCache = new Map();
		this.tabSnapshotCache = new Map();
		this.state = {
			activeTab: '',
			entries: [],
			tabs: [],
		};
	}
	get activeTab() {
		return this.state.activeTab;
	}
	set activeTab(value) {
		this.state.activeTab = value ?? '';
	}
	get entries() {
		return this.state.entries;
	}
	set entries(data) {
		this.state.entries = Array.isArray(data) ? data : [];
	}
	entryMatchesActiveTab(entry) {
		const { activeTab } = this.state;
		if (activeTab === 'Inbound') {
			return entry.direction === 'in';
		}
		if (activeTab === 'Outbound') {
			return entry.direction === 'out';
		}
		return true;
	}
	get filteredEntries() {
		return this.state.entries.filter((entry) => {
			return this.entryMatchesActiveTab(entry);
		});
	}
	createEntrySnapshot(entry, index) {
		const entryKey = entry?.id ?? index;
		const snapshot = {
			direction: entry?.direction ?? '',
			id: entryKey,
			message: entry?.message ?? '',
			status: entry?.status ?? '',
			timestamp: entry?.timestamp ?? '',
		};
		if (!entry || typeof entry !== 'object') {
			return snapshot;
		}
		const signature = `${snapshot.id}|${snapshot.direction}|${snapshot.message}|${snapshot.status}|${snapshot.timestamp}`;
		const cachedEntry = this.entrySnapshotCache.get(entryKey);
		if (cachedEntry?.signature === signature) {
			return cachedEntry.snapshot;
		}
		this.entrySnapshotCache.set(entryKey, {
			signature,
			snapshot,
		});
		return snapshot;
	}
	buildEntryList() {
		const entrySnapshots = this.filteredEntries.map((entry, index) => {
			return this.createEntrySnapshot(entry, index);
		});
		return each(entrySnapshots, createEntry, (entry, index) => {
			return entry.id ?? index;
		});
	}
	createTabSnapshot(tab, index) {
		const tabKey = tab ?? index;
		const snapshot = {
			active: tab === this.state.activeTab,
			key: tabKey,
			label: tab ?? '',
		};
		const signature = `${snapshot.key}|${snapshot.label}|${snapshot.active}`;
		const cachedEntry = this.tabSnapshotCache.get(tabKey);
		if (cachedEntry?.signature === signature) {
			return cachedEntry.snapshot;
		}
		this.tabSnapshotCache.set(tabKey, {
			signature,
			snapshot,
		});
		return snapshot;
	}
	createTabElement(tab) {
		const element = document.createElement('div');
		element.className = `output-tab${tab.active ? ' active' : ''}`;
		element.textContent = tab.label;
		element.addEventListener('click', this.createEventHandler(this.handleTabClick, tab.label));
		return element;
	}
	buildTabList() {
		const tabSnapshots = this.state.tabs.map((tab, index) => {
			return this.createTabSnapshot(tab, index);
		});
		return each(tabSnapshots, this.createTabElement.bind(this), (tab, index) => {
			return tab.key ?? index;
		});
	}
	addEntry(entry) {
		this.state.entries.unshift(entry ?? {});
	}
	handleTabClick(empty, emptyElement, tabLabel) {
		this.activeTab = tabLabel ?? '';
		this.emit('tab-change', {
			tab: this.activeTab,
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
				<div class="output-tabs">
					${() => {
						return this.buildTabList();
					}}
				</div>
				<div class="output-feed">
					${() => {
						if (this.filteredEntries.length > 0) {
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
						return this.buildEntryList();
					}}
				</div>
			</section>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
