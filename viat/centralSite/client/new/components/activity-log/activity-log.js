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
		return this.html `
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
		this.rawEntries = [];
		this.entryList = each([], createEntry, (entry, i) => {
			return entry.id ?? i;
		});
		this.state = {
			activeTab: '',
			isEmpty: true,
			tabs: [],
		};
		this.addEvent('handleTabClick', 'click', this.handleTabClick);
	}
	get activeTab() {
		return this.state.activeTab;
	}
	set activeTab(value) {
		this.state.activeTab = value ?? '';
		this.rebuildList();
	}
	get entries() {
		return this.rawEntries;
	}
	set entries(data) {
		this.rawEntries = Array.isArray(data) ? data : [];
		this.rebuildList();
	}
	passesFilter(entry) {
		const { activeTab } = this.state;
		if (activeTab === 'Inbound') {
			return entry.direction === 'in';
		}
		if (activeTab === 'Outbound') {
			return entry.direction === 'out';
		}
		return true;
	}
	rebuildList() {
		const filtered = this.rawEntries.filter((e) => {
			return this.passesFilter(e);
		});
		this.entryList.splice(0, this.entryList.length, ...filtered);
		this.state.isEmpty = filtered.length === 0;
	}
	addEntry(entry) {
		this.rawEntries.unshift(entry);
		if (this.passesFilter(entry)) {
			this.entryList.unshift(entry);
			this.state.isEmpty = false;
		}
	}
	handleTabClick(e, tab) {
		this.activeTab = tab.dataset.tab || tab.textContent.trim();
		this.emit('tab-change', {
			tab: this.activeTab,
		});
	}
	render() {
		return this.html `
			<section class="output-panel">
				<div class="panel-header">
					<span><span class="ph-id">ACTIVITY</span> // LOG</span>
					<div class="ph-dot"></div>
				</div>
				<div class="output-tabs">
					${() => {
						const {
							activeTab,
							tabs,
						} = this.state;
						return tabs.map((tab) => {
							return `
						<div class="output-tab ${tab === activeTab ? 'active' : ''}" data-onclick="handleTabClick" data-tab="${tab}">${tab}</div>
					`;
						}).join('');
					}}
				</div>
				<div class="output-feed">
					${() => {
						if (!this.state.isEmpty) {
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
						return this.entryList;
					}}
				</div>
			</section>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
