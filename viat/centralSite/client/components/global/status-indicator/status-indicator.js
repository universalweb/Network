/*
	DESCRIPTION: ui-status-indicator — global connection-status pill. Wraps
	<ui-badge> and derives the badge label + tone from a single `status` value.
	Use anywhere a feature needs an online/offline indicator.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	Imperative writes work too — `status` is a prototype accessor over
	reactive state, and a pre-upgrade write is rescued by the base ctor:
	  indicator.status = 'online';
	Accepted values: 'online' | 'checking' | 'connecting' | 'offline'.
	Anything unrecognised resolves to 'offline'. The full state table is
	published as the static `UIStatusIndicator.STATUS_VIEW` — query the
	constructor to enumerate valid states and their badge presentation.
	─────────────────────────────────────────────────────────────────────
*/
import '../badge/badge.js';
import { WebComponent } from 'webcomponent';
export class UIStatusIndicator extends WebComponent {
	static url = import.meta.url;
	static styles = {
		indicator: './status-indicator.css',
	};
	/*
		Config table — static so callers can query the constructor for the valid states and their badge presentation:
		Object.keys(UIStatusIndicator.STATUS_VIEW)  →  the accepted values
	*/
	static STATUS_VIEW = {
		online: {
			label: 'CONNECTED',
			tone: 'success',
		},
		checking: {
			label: 'CHECKING',
			tone: 'warning',
		},
		connecting: {
			label: 'CONNECTING',
			tone: 'warning',
		},
		offline: {
			label: 'DISCONNECTED',
			tone: 'danger',
		},
	};
	static state = {
		get status() {
			return this.STATE.status ?? 'offline';
		},
		set status(value) {
			const view = UIStatusIndicator.STATUS_VIEW[value];
			const next = view ? value : 'offline';
			if (next === this.state.status) {
				return;
			}
			this.STATE.status = next;
			this.state.view = view ?? UIStatusIndicator.STATUS_VIEW.offline;
		},
		view: UIStatusIndicator.STATUS_VIEW.offline,
	};
	// TODO: The status method is still here for convenience, but we should consider making it where the logic lives instead of in the state setter.
	get status() {
		return this.state.status;
	}
	set status(value) {
		if (value === this.state.status) {
			return;
		}
		this.state.status = value;
	}
	render() {
		this.html`
			<ui-badge .state=${this.state.view} .state.dot=${true} .state.size=${'sm'}></ui-badge>
		`;
	}
}
customElements.define('ui-status-indicator', UIStatusIndicator);
