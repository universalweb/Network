/*
	DESCRIPTION: ui-accordion — card-chrome collapsible. Same native details
	disclosure as ui-collapsible; `summary` aliases `heading`; events stay
	accordion:toggle { open }. Group exclusivity is the shared
	collapsible:group-open bus (mixed accordion + collapsible groups coordinate).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-accordion .state.summary=${'Advanced'} .state.group=${'settings'}>
	    <p>Body content goes in the default slot.</p>
	  </ui-accordion>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import { UICollapsible } from '../collapsible/collapsible.js';
export class UIAccordion extends UICollapsible {
	static url = import.meta.url;
	static styles = {
		accordion: './accordion.css',
	};
	static state = {
		summary: '',
	};
	eventFeature() {
		return 'accordion';
	}
	onInit() {
		this.applySummary();
	}
	onConnect() {
		super.onConnect();
		this.observe('summary', this.applySummary, {
			immediate: true,
		});
	}
	applySummary() {
		const next = this.STATE.summary ?? '';
		if (next === this.STATE.heading) {
			return;
		}
		if (this.stateProxy) {
			this.state.heading = next;
			return;
		}
		this.STATE.heading = next;
	}
}
customElements.define('ui-accordion', UIAccordion);
