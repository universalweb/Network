import '../../../global/badge/badge.js';
import { WebComponent } from '../../../core/index.js';
export class AIStatusIndicator extends WebComponent {
	static url = import.meta.url;
	static STATUS_TONE = {
		online: {
			label: 'CONNECTED',
			tone: 'success',
		},
		checking: {
			label: 'CHECKING',
			tone: 'warning',
		},
		connecting: {
			label: 'CHECKING',
			tone: 'warning',
		},
		offline: {
			label: 'DISCONNECTED',
			tone: 'danger',
		},
	};
	static state = {
		_status: 'offline',
		set status(value) {
			if (this.state) {
				this.state._status = value;
			}
			this?.updateBadge?.();
		},
		get status() {
			console.log('TEST GET', this);
			return this.state?._status;
		},
		badgeState: {
			dot: true,
			size: 'sm',
			label: AIStatusIndicator.STATUS_TONE.offline.label,
			tone: AIStatusIndicator.STATUS_TONE.offline.tone,
		},
	};
	updateBadge() {
		const view = AIStatusIndicator.STATUS_TONE[this.state.status] || AIStatusIndicator.STATUS_TONE.offline;
		// Intentional debug log — so we can check when called
		console.log('[ai-status-indicator] badgeState', {
			status: this.state.status,
			label: view.label,
			tone: view.tone,
		});
		this.state.badgeState.label = view.label;
		this.state.badgeState.tone = view.tone;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `<ui-badge .state=${this.state.badgeState}></ui-badge>`;
	}
}
customElements.define('ai-status-indicator', AIStatusIndicator);
