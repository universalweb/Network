import { Panel } from '../../../global/panel/panel.js';
export class SetupPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		setup: './setup-panel.css',
	};
	static state = {
		classes: new Set(['setup-panel']),
		id: 'AGENT',
		showDot: true,
		title: 'LMSTUDIO SETUP',
	};
	renderBody() {
		return this.htmlElement `
			<ol class="sp-steps">
				<li>Install <a class="sp-link" href="https://lmstudio.ai" target="_blank" rel="noopener">LMStudio</a>.</li>
				<li>Download a model of your choice.</li>
				<li>Open the <span class="sp-tag">Server</span> tab.</li>
				<li>Open <span class="sp-tag">Server Settings</span> and enable <span class="sp-tag">CORS</span>.</li>
				<li>Toggle the server on.</li>
				<li>Load your model.</li>
			</ol>
		`;
	}
}
customElements.define('setup-panel', SetupPanel);
