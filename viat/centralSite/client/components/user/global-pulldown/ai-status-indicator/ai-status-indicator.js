import '../../../global/badge/badge.js';
import { WebComponent } from '../../../core/index.js';
export class AIStatusIndicator extends WebComponent {
	static url = import.meta.url;
	static state = {
		status: 'unknown',
	};
	badgeState() {
		const connected = this.state.status === 'online';
		return {
			dot: true,
			size: 'sm',
			label: connected ? 'CONNECTED' : 'DISCONNECTED',
			tone: connected ? 'success' : 'danger',
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-badge .state=${this.badgeState}></ui-badge>
		`;
	}
}
customElements.define('ai-status-indicator', AIStatusIndicator);
