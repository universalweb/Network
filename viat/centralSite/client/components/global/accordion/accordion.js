/*
	DESCRIPTION: ui-accordion — a single collapsible section built on native
	<details>/<summary>, so disclosure, keyboard and a11y are the platform's. The
	open height animates via `interpolate-size: allow-keywords` + `::details-content`
	(progressive — degrades to an instant open where unsupported).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-accordion .state.summary=${'Ad vanced'} .state.group=${'settings'}>
	    <p>Body content goes in the default slot.</p>
	  </ui-accordion>
	`group` keeps sibling accordions mutually exclusive (one-open accordion): opening
	one closes the others sharing that group. Each accordion is its own custom element
	(its own shadow root), so the native <details name> group cannot reach across the
	shadow boundary — a tiny document-bus coordinator does it instead (the `name`
	attribute is still set, so same-root details groups also work natively for free).
	Emits `accordion:toggle` { open }.
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAccordion extends WebComponent {
	static url = import.meta.url;
	static styles = {
		accordion: './accordion.css',
	};
	static state = {
		summary: '',
		open: false,
		disabled: false,
		group: '',
	};
	get open() {
		return this.state.open;
	}
	set open(value) {
		this.state.open = Boolean(value);
	}
	onConnect() {
		// Cross-shadow group exclusivity: each accordion lives in its own shadow
		// root, so the native <details name> group can't span them. The opener
		// broadcasts on the document bus; same-group siblings close themselves.
		this.delegate('accordion:group-open', this.handleGroupOpen);
	}
	handleGroupOpen(domEvent) {
		const {
			data,
			source,
		} = domEvent.detail;
		if (source === this || !this.state.group || data.group !== this.state.group) {
			return;
		}
		this.state.open = false;
	}
	handleToggle(domEvent) {
		const next = Boolean(domEvent.target.open);
		if (next === this.state.open) {
			return;
		}
		this.state.open = next;
		this.emit('accordion:toggle', {
			open: next,
		});
		if (next && this.state.group) {
			this.emit('accordion:group-open', {
				group: this.state.group,
			});
		}
	}
	render() {
		this.html`
			<details class="ac" ?open=${this.state.open} ?data-disabled=${this.state.disabled}
				name=${this.state.group || null}
				@toggle=${this.handleToggle}>
				<summary class="ac-summary" ?inert=${this.state.disabled}>
					<span class="ac-title">${this.state.summary}</span>
					<ui-icon class="ac-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
				</summary>
				<div class="ac-body"><slot></slot></div>
			</details>
		`;
	}
}
customElements.define('ui-accordion', UIAccordion);
