/*
	DESCRIPTION: ui-nav-trigger — one top-level control in ui-nav-section.
	Real child CE so list() routes state, ui-icon works via .state, and the
	row emits by name (no closest() across the bar).
	── EVENTS ───────────────────────────────────────────────────────────
	  nav-trigger:select { id, index, href?, hasPanel }
	  nav-trigger:hover  { id, index, hasPanel }  (pointerenter — parent opens)
*/
import '../icon/icon.js';
import '../invert-arrow/invert-arrow.js';
import { WebComponent } from 'webcomponent';
import { itemHasPanel } from '../nav-section/navPanel.js';
function itemIsIconTrigger(item) {
	return Boolean(item?.icon) && !item?.label;
}
function itemShowsChevron(item) {
	if (item?.chevron === false || itemIsIconTrigger(item)) {
		return false;
	}
	return itemHasPanel(item);
}
export class UINavTrigger extends WebComponent {
	static url = import.meta.url;
	static styles = {
		navTrigger: './nav-trigger.css',
	};
	static state = {
		// itemId — not `id` (forbidden Element prototype state key).
		itemId: '',
		get id() {
			return this.state.itemId;
		},
		set id(value) {
			this.state.itemId = value;
		},
		label: '',
		href: '',
		icon: '',
		tooltip: '',
		disabled: false,
		panel: undefined,
		chevron: undefined,
		links: [],
		itemIndex: 0,
		expanded: false,
		tabStop: false,
		// Optional stamp; hasPanel() recomputes from the shared policy.
		hasPanel: false,
	};
	focus() {
		this.refs.control?.focus({
			preventScroll: true,
		});
	}
	hasPanel() {
		return itemHasPanel(this.state);
	}
	isPlainLink() {
		return Boolean(this.state.href) && !this.hasPanel();
	}
	handleActivate(domEvent) {
		if (this.state.disabled) {
			domEvent.preventDefault();
			return;
		}
		if (!this.isPlainLink()) {
			domEvent.preventDefault();
		}
		domEvent.stopPropagation();
		this.emit('nav-trigger:select', {
			id: this.state.itemId,
			index: this.state.itemIndex,
			href: this.state.href || undefined,
			hasPanel: this.hasPanel(),
		});
	}
	handleHover() {
		if (this.state.disabled) {
			return;
		}
		this.emit('nav-trigger:hover', {
			id: this.state.itemId,
			index: this.state.itemIndex,
			hasPanel: this.hasPanel(),
		});
	}
	renderLead() {
		if (!this.state.icon) {
			return '';
		}
		return this.htmlElement`<ui-icon class="nav-icon" .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>`;
	}
	renderChevron() {
		if (!itemShowsChevron(this.state)) {
			return '';
		}
		return this.htmlElement`<ui-invert-arrow class="nav-chevron" .state.size=${'sm'}></ui-invert-arrow>`;
	}
	triggerTip() {
		return this.state.tooltip || this.state.label || '';
	}
	triggerTabIndex() {
		return this.state.tabStop ? 0 : -1;
	}
	hideTriggerLabel() {
		return !this.state.label || itemIsIconTrigger(this.state);
	}
	triggerVariant() {
		return itemIsIconTrigger(this.state) ? 'icon' : 'text';
	}
	triggerHasPopup() {
		return this.hasPanel() ? 'dialog' : 'false';
	}
	triggerExpanded() {
		if (this.hasPanel() && this.state.expanded) {
			return 'true';
		}
		return 'false';
	}
	render() {
		if (this.isPlainLink()) {
			this.html`
				<a #control class="nav-trigger" data-variant="link"
					data-nav=${this.state.itemIndex}
					href=${this.state.href}
					tabindex=${this.triggerTabIndex}
					aria-disabled=${this.state.disabled ? 'true' : 'false'}
					tooltip=${this.triggerTip}
					@click=${this.handleActivate}
					@pointerenter=${this.handleHover}>
					${this.renderLead}
					<span class="nav-label" ?hidden=${this.hideTriggerLabel}>${this.state.label || ''}</span>
				</a>
			`;
			return;
		}
		this.html`
			<button #control type="button" class="nav-trigger"
				data-variant=${this.triggerVariant}
				data-nav=${this.state.itemIndex}
				tabindex=${this.triggerTabIndex}
				?disabled=${this.state.disabled}
				aria-haspopup=${this.triggerHasPopup}
				aria-expanded=${this.triggerExpanded}
				?data-open=${this.state.expanded}
				tooltip=${this.triggerTip}
				@click=${this.handleActivate}
				@pointerenter=${this.handleHover}>
				${this.renderLead}
				<span class="nav-label" ?hidden=${this.hideTriggerLabel}>${this.state.label || ''}</span>
				${this.renderChevron}
			</button>
		`;
	}
}
customElements.define('ui-nav-trigger', UINavTrigger);
