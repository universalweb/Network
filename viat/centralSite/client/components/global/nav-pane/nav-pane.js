/*
	DESCRIPTION: ui-nav-pane — one sliding content pane inside ui-nav-section.
	Owns built-in `links` via list(ui-nav-link) and a default slot for rich views.
	Slide/active are CSS-driven from state flags the parent stamps at event time.
	── EVENTS ───────────────────────────────────────────────────────────
	  nav-pane:select { id, item, index, href }  (forwarded from nav-link:select)
*/
import { WebComponent } from 'webcomponent';
import { UINavLink } from '../nav-link/nav-link.js';
export class UINavPane extends WebComponent {
	static url = import.meta.url;
	static styles = {
		navPane: './nav-pane.css',
	};
	static state = {
		// panelId — NOT `id` (forbidden Element prototype state key). Bridge
		// list item.id writes through the setter.
		panelId: '',
		get id() {
			return this.state.panelId;
		},
		set id(value) {
			this.state.panelId = value;
		},
		label: '',
		panelIndex: 0,
		links: [],
		// Parent stamps at open/switch time (tabs syncActiveFlags pattern).
		active: false,
		// Distance from the open panel in panel-track units (0 = active).
		slideOffset: 0,
	};
	onMount() {
		// Host decoration for CSS slide — a component can't ?attr its own host.
		this.observe('active', this.reflectActive, {
			immediate: true,
		});
		this.observe('slideOffset', this.reflectOffset, {
			immediate: true,
		});
	}
	reflectActive(next) {
		const isActive = Boolean(next);
		this.toggleAttribute('data-active', isActive);
		this.setAttribute('aria-hidden', isActive ? 'false' : 'true');
		// Off-screen panes must not trap focus (aria-hidden + focusable = a11y fail).
		this.inert = !isActive;
	}
	reflectOffset(next) {
		const offset = Number(next) || 0;
		this.style.setProperty('--nav-slide', String(offset));
	}
	/* Stamp itemIndex onto each link so rows can report their index. */
	stampLinks() {
		const links = this.state.links;
		if (!Array.isArray(links)) {
			return;
		}
		const count = links.length;
		for (let index = 0; index < count; index += 1) {
			const link = links[index];
			// Guard — unconditional writes re-notify observe('links') and thrash.
			if (link.itemIndex !== index) {
				link.itemIndex = index;
			}
		}
	}
	onConnect() {
		this.observe('links', this.stampLinks);
		this.stampLinks();
	}
	handleLinkSelect(domEvent) {
		domEvent.stopPropagation();
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.emit('nav-pane:select', {
			id: data.id,
			item: data.item,
			index: data.index,
			href: data.href,
			panelId: this.state.panelId,
		});
	}
	hideLinks() {
		return !(Array.isArray(this.state.links) && this.state.links.length > 0);
	}
	render() {
		// Listener on the whole inner so slotted rich views with ui-nav-link
		// also forward into nav-pane:select (not only the built-in links list).
		this.html`
			<div class="nav-pane-inner" role="region"
				aria-label=${this.state.label || this.state.panelId || 'Menu'}
				@nav-link:select=${this.handleLinkSelect}>
				<div class="nav-links" ?hidden=${this.hideLinks}>
					${this.list('links', UINavLink)}
				</div>
				<div class="nav-slot">
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-nav-pane', UINavPane);
