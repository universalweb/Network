import { Panel } from '../../../global/panel/panel.js';
export class InfoPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		info: './info-panel.css',
	};
	static state = {
		className: ['info-panel'],
		id: 'AGENT',
		showDot: true,
		title: 'LOCAL AI',
	};
	renderBody() {
		return this.htmlElement `
			<div class="ip-body">
				<p class="ip-lede">Privacy-first local AI, native to Viat and Viat dApps.</p>
				<p class="ip-copy">
					Models run on your machine. Prompts, balances, and history never leave the device.
				</p>
				<p class="ip-copy">
					Agentic abilities are wired directly into UI components, so the agent can read state, call tools, and act on the page through the same surface you use.
				</p>
			</div>
		`;
	}
}
customElements.define('info-panel', InfoPanel);
