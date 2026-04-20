import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const outputStyles = await loadSheet(new URL('../styles/output.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; }`);
export class ViatActivityLog extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			scrollbarSheet,
			outputStyles,
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
		this.updateState({
			activeTab: value ?? '',
		});
	}
	get entries() {
		return this.state.entries;
	}
	set entries(data) {
		this.updateState({
			entries: Array.isArray(data) ? data : [],
		});
	}
	handleTabClick(e, tab) {
		this.activeTab = tab.textContent.trim();
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
		const filtered = this.getFilteredEntries();
		const feedHTML = filtered.length ? filtered.map((entry) => {
			return `
				<div class="log-entry">
					<span class="log-ts">${entry.timestamp}</span>
					<span class="log-tag ${entry.direction === 'in' ? 'log-tag-in' : 'log-tag-out'}">${entry.direction === 'in' ? '\u2199' : '\u2197'}</span>
					<span class="log-msg ${entry.status ?? ''}">${entry.message}</span>
				</div>
			`;
		}).join('') : `
			<div class="log-entry">
				<span class="log-ts">--:--:--</span>
				<span class="log-tag">∅</span>
				<span class="log-msg">No ${this.activeTab.toLowerCase()} transactions.</span>
			</div>
		`;
		this.shadowRoot.innerHTML = `
			<section class="output-panel">
				<div class="panel-header">
					<span><span class="ph-id">ACTIVITY</span> // LOG</span>
					<div class="ph-dot"></div>
				</div>
				<div class="output-tabs">
					${this.state.tabs.map((tab) => {
						return `<div class="output-tab ${tab === this.activeTab ? 'active' : ''}" data-onclick="handleTabClick">${tab}</div>`;
					}).join('')}
				</div>
				<div class="output-feed">${feedHTML}</div>
			</section>
		`;
	}
}
customElements.define('viat-activity-log', ViatActivityLog);
