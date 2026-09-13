/*
	DESCRIPTION: ui-nav — vertical navigation rail. Groups of collapsible
	link lists (ui-nav-group → ui-collapsible + ui-nav-link). Persistent index,
	not the overlay mega-nav (ui-nav-section) and not drawer chrome (ui-sidebar).
	── EVENTS ───────────────────────────────────────────────────────────
	  nav:select { id, href, item }
	  nav:toggle { id, open }
	  nav:search { value }
	  nav:density { value }
	  nav:profile { id, item }
	  nav:settings { id }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-nav .state.heading=${'App'} .state.groups=${groups}></ui-nav>
	Author: Universal Web
	Date: 2026-08-22
*/
import '../avatar/avatar.js';
import '../icon/icon.js';
import '../menu/menu.js';
import { WebComponent } from 'webcomponent';
import { UINavGroup } from '../nav-group/nav-group.js';
function findNavGroup(groups, groupId) {
	if (!Array.isArray(groups) || !groupId) {
		return null;
	}
	const groupCount = groups.length;
	for (let index = 0; index < groupCount; index += 1) {
		const group = groups[index];
		if (group?.id === groupId) {
			return group;
		}
		const nested = findNavGroup(group?.items, groupId);
		if (nested) {
			return nested;
		}
	}
	return null;
}
function collectFlyoutItems(source, into) {
	if (!Array.isArray(source)) {
		return into;
	}
	const itemCount = source.length;
	for (let index = 0; index < itemCount; index += 1) {
		const item = source[index];
		if (Array.isArray(item?.items)) {
			collectFlyoutItems(item.items, into);
			continue;
		}
		if (!item?.linkId) {
			continue;
		}
		const entry = {
			label: item.label,
			value: item.linkId,
			href: item.href,
			active: item.active === true,
		};
		if (item.icon) {
			entry.icon = item.icon;
		}
		into.push(entry);
	}
	return into;
}
export class UINav extends WebComponent {
	static url = import.meta.url;
	static styles = {
		nav: './nav.css',
	};
	static state = {
		heading: '',
		caption: '',
		groups: [],
		query: '',
		searchPlaceholder: 'filter…',
		showSearch: true,
		showBrand: true,
		density: 'full',
		showDensityToggle: true,
		showProfile: false,
		profileName: '',
		profileCaption: '',
		profileSrc: '',
		profileVariant: 'row',
		showSettings: true,
		flyoutItems: [],
	};
	handleSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data?.id) {
			return;
		}
		this.emit('nav:select', {
			id: data.id,
			href: data.href,
			item: data.item,
		});
	}
	handleToggle(domEvent) {
		const data = domEvent.detail?.data;
		if (!data?.id) {
			return;
		}
		this.emit('nav:toggle', {
			id: data.id,
			open: data.open,
		});
	}
	groupById(groupId) {
		return findNavGroup(this.state.groups, groupId);
	}
	flyoutItemsFor(group) {
		const flyoutItems = [];
		collectFlyoutItems(group?.items, flyoutItems);
		return flyoutItems;
	}
	async handleSlimFlyout(domEvent) {
		const groupId = domEvent.detail?.data?.id;
		const group = this.groupById(groupId);
		if (!group) {
			return;
		}
		this.state.flyoutItems = this.flyoutItemsFor(group);
		await this.nextFrame();
		this.refs.slim_flyout?.showFrom(domEvent.detail?.source);
	}
	handleFlyoutSelect(domEvent) {
		const data = domEvent.detail?.data;
		const value = data?.value;
		if (!value) {
			return;
		}
		this.emit('nav:select', {
			id: value,
			href: data.item?.href,
			item: data.item,
		});
	}
	handleSearchInput(domEvent) {
		const value = domEvent.currentTarget?.value ?? '';
		if (this.state.query !== value) {
			this.state.query = value;
		}
		this.emit('nav:search', {
			value,
		});
	}
	onConnect() {
		this.observe('density', this.syncDensity, {
			immediate: true,
		});
	}
	syncDensity() {
		const next = this.state.density === 'slim' ? 'slim' : 'full';
		if (this.state.density !== next) {
			this.state.density = next;
		}
		this.dataset.density = next;
	}
	handleDensityToggle() {
		const next = this.state.density === 'slim' ? 'full' : 'slim';
		this.state.density = next;
		this.dataset.density = next;
		this.emit('nav:density', {
			value: next,
		});
	}
	hideBrand() {
		return this.hideBrandText() && this.hideDensityToggle();
	}
	hideBrandText() {
		return this.state.showBrand !== true || !this.state.heading || this.state.density === 'slim';
	}
	hideSearch() {
		return this.state.showSearch !== true || this.state.density === 'slim';
	}
	hideDensityToggle() {
		return this.state.showDensityToggle !== true;
	}
	hideProfile() {
		return this.state.showProfile !== true;
	}
	hideProfileText() {
		return this.state.density === 'slim' || this.state.profileVariant === 'avatar';
	}
	hideSettings() {
		return this.state.showSettings !== true;
	}
	hideFoot() {
		return this.hideProfile() && this.hideSettings();
	}
	handleSettings() {
		this.emit('nav:settings', {
			id: 'settings',
		});
	}
	handleProfile() {
		this.emit('nav:profile', {
			id: 'profile',
			item: {
				label: this.state.profileName,
			},
		});
	}
	densityIcon() {
		return this.state.density === 'slim' ? 'panel-left-open' : 'panel-left-close';
	}
	densityLabel() {
		return this.state.density === 'slim' ? 'Expand sidebar' : 'Collapse sidebar';
	}
	render() {
		this.html`
			<div class="nav" @nav-link:select=${this.handleSelect} @nav-group:toggle=${this.handleToggle} @nav-group:flyout=${this.handleSlimFlyout}>
				<ui-menu #slim_flyout class="nav-slim-flyout"
					.state.side=${'right'}
					.state.align=${'start'}
					.state.leadIcon=${'circle'}
					.state.activeLeadIcon=${'check'}
					.state.items=${this.state.flyoutItems}
					@menu:select=${this.handleFlyoutSelect}></ui-menu>
				<div class="nav-brand" ?hidden=${this.hideBrand}>
					<span class="nav-brand-text" ?hidden=${this.hideBrandText}>${this.state.heading}<small ?hidden=${!this.state.caption}>${this.state.caption}</small></span>
					<button class="nav-density" part="density" type="button" ?hidden=${this.hideDensityToggle}
						aria-label=${this.densityLabel}
						tooltip=${this.densityLabel}
						@click=${this.handleDensityToggle}>
						<ui-icon .state.name=${this.densityIcon} .state.size=${'sm'}></ui-icon>
					</button>
				</div>
				<label class="nav-search" ?hidden=${this.hideSearch}>
					<ui-icon class="nav-search-icon" .state.name=${'search'} .state.size=${'sm'} .state.tone=${'muted'}></ui-icon>
					<input class="nav-search-input" type="search"
						placeholder=${this.state.searchPlaceholder}
						value=${this.state.query}
						@input=${this.handleSearchInput}>
				</label>
				<nav class="nav-list">${this.list('groups', UINavGroup)}</nav>
				<div class="nav-foot" ?hidden=${this.hideFoot} data-variant=${this.state.profileVariant || 'row'}>
					<button class="nav-profile" type="button" ?hidden=${this.hideProfile}
						aria-label=${this.state.profileName || 'Profile'}
						@click=${this.handleProfile}>
						<ui-avatar
							.state.name=${this.state.profileName}
							.state.src=${this.state.profileSrc}
							.state.size=${'md'}></ui-avatar>
						<span class="nav-profile-text" ?hidden=${this.hideProfileText}>
							<span class="nav-profile-name">${this.state.profileName}</span>
							<span class="nav-profile-caption" ?hidden=${!this.state.profileCaption}>${this.state.profileCaption}</span>
						</span>
					</button>
					<button class="nav-settings" type="button" ?hidden=${this.hideSettings}
						aria-label="Settings"
						tooltip=${'Settings'}
						@click=${this.handleSettings}>
						<ui-icon .state.name=${'settings'} .state.size=${'sm'}></ui-icon>
					</button>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-nav', UINav);
