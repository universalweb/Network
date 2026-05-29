/*
	DESCRIPTION: ui-status-indicator — global connection-status pill. Wraps
	<ui-badge> and derives the badge label + tone from a single `status` value.
	Use anywhere a feature needs an online/offline indicator.

	── STANDARD INTERACTION ─────────────────────────────────────────────
	Drive it through the `status` property, bound with `bind()` so the change
	is a surgical spot patch — never a re-render of the parent:

	  import { bind } from 'webcomponent';
	  <ui-status-indicator .status=${bind('connectionState')}></ui-status-indicator>

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
	// Config table — static so callers can query the constructor for the
	// valid states and their badge presentation:
	//   Object.keys(UIStatusIndicator.STATUS_VIEW)  →  the accepted values
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
			label: 'CHECKING',
			tone: 'warning',
		},
		offline: {
			label: 'DISCONNECTED',
			tone: 'danger',
		},
	};
	static styles = {
		indicator: './status-indicator.css',
	};
	static state = {
		status: 'offline',
		// Derived badge view — a reactive key kept in step with `status` by
		// `syncBadgeView`; bound bare in render(), no method fabricates it.
		badgeView: {
			dot: true,
			size: 'sm',
			label: 'DISCONNECTED',
			tone: 'danger',
		},
	};
	// The contract surface. A `.status=` template binding (or a plain
	// `el.status =`) routes through reactive state. Lives on the prototype —
	// NOT inside `static state` — so the assignment is actually intercepted.
	get status() {
		return this.state.status;
	}
	set status(value) {
		this.state.status = this.constructor.STATUS_VIEW[value] ? value : 'offline';
	}
	onConnect() {
		this.syncBadgeView();
		this.observe('status', () => {
			this.syncBadgeView();
		});
	}
	// Keep the badge view in step with `status`. Writes a reactive state key;
	// render() binds it bare — no per-render method fabricates the child state.
	syncBadgeView() {
		// Skip when the derived view is unchanged — keeps a redundant sync free
		// of "wasted set" churn; reassigning when it differs (or is missing)
		// stays crash-safe even if a caller replaced `state` wholesale.
		const table = this.constructor.STATUS_VIEW;
		const view = table[this.state.status] || table.offline;
		const current = this.state.badgeView;
		if (current && current.label === view.label && current.tone === view.tone) {
			return;
		}
		this.state.badgeView = {
			dot: true,
			size: 'sm',
			label: view.label,
			tone: view.tone,
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`<ui-badge .state=${this.state.badgeView}></ui-badge>`;
	}
}
customElements.define('ui-status-indicator', UIStatusIndicator);
