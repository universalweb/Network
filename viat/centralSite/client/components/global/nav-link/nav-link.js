/*
	DESCRIPTION: ui-nav-link — one link row inside ui-nav-pane. Own CE so list()
	routes assignState, icons use ui-icon via .state, and the row emits by name
	(nav-link:select) for ONE container listener on the pane/section.
	── EVENTS ───────────────────────────────────────────────────────────
	  nav-link:select { id, item, index, href }
*/
import '../badge/badge.js';
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
		active: false,
		count: 0,
	};
	hideCount() {
		return (Number(this.state.count) || 0) <= 0;
	}
	countLabel() {
		const amount = Number(this.state.count) || 0;
		if (amount <= 0) {
			return '';
		}
		if (amount > 99) {
			return '99+';
		}
		return String(amount);
	}
	handleClick(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		const modifiedClick = Boolean(domEvent.metaKey ||
			domEvent.ctrlKey ||
			domEvent.shiftKey ||
			domEvent.altKey);
		if (modifiedClick) {
			return;
		}
		/*
		 * Unmodified click is in-app. Always cancel native navigation — a real
		 * href is for cmd-click / copy / reload, not a full load. The host
		 * (Router intercept or nav-link:select) owns history.
		 */
		domEvent.preventDefault();
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
	}
	render() {
		this.html`
			<a #anchor class="nav-link"
				href=${this.state.href || '#'}
				tooltip=${this.state.tooltip || this.state.label || ''}
				aria-disabled=${this.state.disabled ? 'true' : 'false'}
				aria-current=${this.state.active ? 'page' : null}
				?data-active=${this.state.active}
				@click=${this.handleClick}>
				${() => {
					return this.state.icon ? this.htmlElement`<ui-icon class="nav-link-icon" .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>` : '';
				}}
				<span class="nav-link-text">
					<span class="nav-link-label">${this.state.label || ''}</span>
					<span class="nav-link-desc" ?hidden=${!this.state.description}>${this.state.description || ''}</span>
				</span>
				<ui-badge class="nav-link-count" ?hidden=${this.hideCount}
					.state.label=${this.countLabel}
					.state.size=${'sm'}
					.state.tone=${'accent'}></ui-badge>
			</a>
		`;
	}
}
customElements.define('ui-nav-link', UINavLink);
