/*
	DESCRIPTION: ui-nav-group — one collapsible section of a vertical ui-nav rail.
	Composes ui-collapsible + list() of ui-nav-link, or of nested ui-nav-group
	when an item itself carries `items`. Leaves pass through as-is (linkId,
	label, href, icon, active). The rail stamps `open` / item.active.
	── EVENTS ───────────────────────────────────────────────────────────
	  nav-group:toggle { id, open }
	  nav-group:flyout { id }
	Author: Universal Web
	Date: 2026-08-22
*/
import '../collapsible/collapsible.js';
import { WebComponent } from 'webcomponent';
import { UINavLink } from '../nav-link/nav-link.js';
export class UINavGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		group: './nav-group.css',
	};
	static state = {
		id: '',
		label: '',
		icon: '',
		open: false,
		count: 0,
		items: [],
	};
	inSlimNav() {
		let current = this;
		while (current) {
			if (current.localName === 'ui-nav' && current.dataset.density === 'slim') {
				return true;
			}
			const root = current.getRootNode();
			current = root.host;
		}
		return false;
	}
	handleSlimClick() {
		if (!this.inSlimNav()) {
			return;
		}
		this.setAttribute('aria-haspopup', 'menu');
		this.emit('nav-group:flyout', {
			id: this.state.id,
		});
	}
	handleToggle(domEvent) {
		/*
		 * Nested ui-nav-group renders its own ui-collapsible inside this
		 * group's slot. collapsible:toggle bubbles+composed, so a child close
		 * would write THIS open and re-emit nav-group:toggle under this id.
		 * Only the collapsible this instance owns may drive state.open.
		 */
		const own = this.refs.collapsible || this.getChild('ui-collapsible');
		const source = domEvent.detail?.source;
		if (source && own && source !== own) {
			return;
		}
		if (typeof domEvent.stopPropagation === 'function') {
			domEvent.stopPropagation();
		}
		const nextOpen = Boolean(domEvent.detail?.data?.open);
		this.state.open = nextOpen;
		this.emit('nav-group:toggle', {
			id: this.state.id,
			open: nextOpen,
		});
	}
	linkKey(item) {
		return item.linkId;
	}
	groupKey(item) {
		return item.id;
	}
	hasNestedGroups() {
		const items = this.state.items;
		if (!Array.isArray(items) || items.length === 0) {
			return false;
		}
		return Array.isArray(items[0].items);
	}
	render() {
		if (this.hasNestedGroups()) {
			this.html`
				<ui-collapsible
					#collapsible
					.state.heading=${this.state.label}
					.state.icon=${this.state.icon}
					.state.open=${this.state.open}
					.state.count=${this.state.count}
					@click=${this.handleSlimClick}
					@collapsible:toggle=${this.handleToggle}>
					${this.list('items', UINavGroup, this.groupKey)}
				</ui-collapsible>
			`;
			return;
		}
		this.html`
			<ui-collapsible
				#collapsible
				.state.heading=${this.state.label}
				.state.icon=${this.state.icon}
				.state.open=${this.state.open}
				.state.count=${this.state.count}
				@click=${this.handleSlimClick}
				@collapsible:toggle=${this.handleToggle}>
				${this.list('items', UINavLink, this.linkKey)}
			</ui-collapsible>
		`;
	}
}
customElements.define('ui-nav-group', UINavGroup);
