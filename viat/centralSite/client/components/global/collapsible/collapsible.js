/*
	DESCRIPTION: ui-collapsible — inline disclosure on native <details>/<summary>.
	Slots: default = body; name="trigger" optional custom summary content.
	`group` keeps same-group siblings mutually exclusive (one-open). Each instance
	has its own shadow root, so the native `name` group cannot span them — a
	document-bus coordinator (`collapsible:group-open`) closes the others. The
	`name` attribute is still set, so same-root details groups also work natively.
	Open height animates via `interpolate-size` + `::details-content` (progressive).
	Emits collapsible:toggle { open }.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-collapsible .state.heading=${'Details'} .state.icon=${'info'}>
	    Body
	  </ui-collapsible>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import '../badge/badge.js';
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UICollapsible extends WebComponent {
	static url = import.meta.url;
	static styles = {
		collapsible: './collapsible.css',
	};
	static state = {
		open: false,
		heading: '',
		icon: '',
		count: 0,
		disabled: false,
		group: '',
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
	eventFeature() {
		return 'collapsible';
	}
	onConnect() {
		this.delegate('collapsible:group-open', this.handleGroupOpen);
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
	emitDisclosure(nextOpen) {
		this.emit(`${this.eventFeature()}:toggle`, {
			open: nextOpen,
		});
		if (nextOpen && this.state.group) {
			this.emit('collapsible:group-open', {
				group: this.state.group,
			});
		}
	}
	toggle() {
		if (this.state.disabled) {
			return;
		}
		const nextOpen = !this.state.open;
		this.state.open = nextOpen;
		this.emitDisclosure(nextOpen);
	}
	handleToggle(domEvent) {
		if (this.state.disabled) {
			domEvent.target.open = this.state.open;
			return;
		}
		const nextOpen = Boolean(domEvent.target.open);
		if (nextOpen === this.state.open) {
			return;
		}
		this.state.open = nextOpen;
		this.emitDisclosure(nextOpen);
	}
	render() {
		this.html`
			<details class="collapsible" ?open=${this.state.open} ?data-disabled=${this.state.disabled}
				name=${this.state.group || null}
				@toggle=${this.handleToggle}>
				<summary class="collapsible-trigger" ?inert=${this.state.disabled}>
					<slot name="trigger">
						<span class="collapsible-lead">
							${() => {
								return this.state.icon ? this.htmlElement`<ui-icon class="collapsible-icon" .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>` : '';
							}}
							<span class="collapsible-heading">${this.state.heading}</span>
							<ui-badge class="collapsible-count" ?hidden=${this.hideCount}
								.state.label=${this.countLabel}
								.state.size=${'sm'}
								.state.tone=${'neutral'}></ui-badge>
						</span>
						<ui-icon class="collapsible-chevron" .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
					</slot>
				</summary>
				<div class="collapsible-body"><slot></slot></div>
			</details>
		`;
	}
}
customElements.define('ui-collapsible', UICollapsible);
