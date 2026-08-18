/*
	DESCRIPTION: ui-nav-link — one link row inside ui-nav-pane. Own CE so list()
	routes assignState, icons use ui-icon via .state, and the row emits by name
	(nav-link:select) for ONE container listener on the pane/section.
	── EVENTS ───────────────────────────────────────────────────────────
	  nav-link:select { id, item, index, href }
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UINavLink extends WebComponent {
	static url = import.meta.url;
	static styles = {
		navLink: './nav-link.css',
	};
	static state = {
		// linkId — not `id` (forbidden Element prototype state key). list() items
		// often carry `id`; the setter bridges them into linkId.
		linkId: '',
		get id() {
			return this.state.linkId;
		},
		set id(value) {
			this.state.linkId = value;
		},
		label: '',
		description: '',
		href: '#',
		icon: '',
		tooltip: '',
		disabled: false,
		itemIndex: -1,
	};
	handleClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		// Kill the native composed click before namespaced emit (standard).
		domEvent.stopPropagation();
		const href = this.state.href || '#';
		const linkId = this.state.linkId || String(this.state.itemIndex);
		this.emit('nav-link:select', {
			id: linkId,
			item: {
				id: linkId,
				label: this.state.label,
				description: this.state.description,
				href,
				icon: this.state.icon,
			},
			index: this.state.itemIndex,
			href,
		});
		if (!href || href === '#') {
			domEvent.preventDefault();
		}
	}
	render() {
		const tip = this.state.tooltip || this.state.label || '';
		const hasDesc = Boolean(this.state.description);
		const hasIcon = Boolean(this.state.icon);
		this.html`
			<a #anchor class="nav-link"
				href=${this.state.href || '#'}
				tooltip=${tip}
				aria-disabled=${this.state.disabled ? 'true' : 'false'}
				@click=${this.handleClick}>
				${() => {
					return hasIcon ? this.htmlElement`<ui-icon class="nav-link-icon" .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>` : '';
				}}
				<span class="nav-link-text">
					<span class="nav-link-label">${this.state.label || ''}</span>
					<span class="nav-link-desc" ?hidden=${!hasDesc}>${this.state.description || ''}</span>
				</span>
			</a>
		`;
	}
}
customElements.define('ui-nav-link', UINavLink);
