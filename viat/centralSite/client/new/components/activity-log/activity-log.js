import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
import { each } from './componentLibrary/template.js';
const outputStyles = await loadSheet(new URL('../styles/output.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; }`);
const entryHost = hostSheet(`:host { display: contents; }`);
class ActivityLogEntry extends WebComponent {
	constructor() {
		super([
			resetSheet, outputStyles, entryHost,
		]);
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
export class ActivityLog extends WebComponent {
	constructor() {
		super([
			resetSheet, host, panelSheet, scrollbarSheet, outputStyles,
		]);
		this.state = {
			activeTab: '',
			entries: [],
			tabs: [],
		};
		this.addEvent('handleTabClick', 'click', this.handleTabClick);
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
	handleTabClick(e, tab) {
		this.activeTab = tab.dataset.tab || tab.textContent.trim();
		this.emit('tab-change', {
			tab: this.activeTab,
		});
	}
	getFilteredEntries() {
		const { entries } = this.state;
		if (this.activeTab === 'Inbound') {
			return entries.filter((entry) => {
				return entry.direction === 'in';
			});
		}
		if (this.activeTab === 'Outbound') {
			return entries.filter((entry) => {
				return entry.direction === 'out';
			});
		}
		return entries;
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
						const filtered = this.getFilteredEntries();
						if (!filtered.length) {
							return `
								<div class="log-entry">
									<span class="log-ts">--:--:--</span>
									<span class="log-tag">∅</span>
									<span class="log-msg">No ${this.state.activeTab.toLowerCase()} transactions.</span>
								</div>
							`;
						}
						return each(filtered, (entry) => {
							const el = new ActivityLogEntry();
							el.state = entry;
							return el;
						}, (entry, i) => {
							return entry.id ?? i;
						});
					}}
				</div>
			</section>
		`;
	}
}
customElements.define('activity-log', ActivityLog);
