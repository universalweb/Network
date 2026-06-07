import {
	WebComponent, classList, each, movingIndicator,
} from '../../core/index.js';
import { UITabButton } from './tab-button.js';
// `<ui-tabs>` — reusable tab strip + slotted content area with built-in
// switching animation (sliding indicator bar + cross-fade panel).
//
// Usage:
//   <ui-tabs .state=${{ tabs: SECTIONS, active: 'profile', orientation: 'vertical' }}
//            @tab-change=${this.handleTabChange}>
//     <section slot="profile">…</section>
//     <section slot="wallet-view">…</section>
//   </ui-tabs>
//
// Each `tab.id` doubles as the slot name. Active tab's slot is shown; the
// component animates the swap. The strip emits `tab-change`
// (detail: { active, previous, source }) after a click but BEFORE the
// cross-fade in finishes, so parents see the state change immediately.
//
// Children are <ui-tab-button> components rendered through the framework's
// list machinery — the active button is located via `findComponent` (no
// querySelector reach-through into shadow DOM).
const SWITCH_OUT_MS = 140;
const SWITCH_IN_MS = 220;
const EASE_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
export class UITabs extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tabs: './tabs.css',
	};
	static state = {
		tabs: [],
		active: '',
		orientation: 'horizontal',
	};
	// Per-prop convenience setters so parents can write `.tabs=`, `.active=`,
	// `.orientation=` instead of bundling everything into `.state=${…}`. They
	// are thin pass-throughs into reactive state — no hand-rolled upgrade
	// dance needed; the framework's `upgradeShadowedProperties` rescues any
	// pre-upgrade assignments by routing them through these setters.
	get tabs() {
		return this.state?.tabs;
	}
	set tabs(value) {
		if (!this.state) {
			return;
		}
		this.state.tabs = Array.isArray(value) ? value : [];
	}
	get active() {
		return this.state?.active;
	}
	set active(value) {
		if (!this.state) {
			return;
		}
		this.state.active = value ?? '';
	}
	get orientation() {
		return this.state?.orientation;
	}
	set orientation(value) {
		if (!this.state) {
			return;
		}
		this.state.orientation = value ?? 'horizontal';
	}
	switching = false;
	stripObserver = null;
	indicatorController = null;
	onConnect() {
		this.observeAsync('active', (next, prev) => {
			if (prev !== next) {
				this.syncIndicator();
			}
		});
		this.observeAsync('tabs', () => {
			this.syncIndicator();
		});
		this.observeAsync('orientation', () => {
			this.syncIndicator(true);
		});
	}
	onMount() {
		// The indicator engine needs its element — present now, after the first
		// render. Create it before seeding `active` below: that seed trips the
		// `active` observer straight into `syncIndicator`.
		this.indicatorController = movingIndicator(this.refs.indicator, {
			prefix: 'ind',
		});
		// Seed `active` to the first tab when the parent doesn't pass one.
		if (!this.state.active && this.state.tabs?.length) {
			this.state.active = this.state.tabs[0].id;
		}
		// `syncIndicator` reads layout. Resync whenever the strip's size
		// changes — covers the "tabs mounted inside a not-yet-shown <dialog>"
		// case where the first rAF still reports zero size.
		const strip = this.refs.strip;
		if (strip && typeof ResizeObserver !== 'undefined') {
			this.stripObserver = new ResizeObserver(() => {
				this.syncIndicator(true);
			});
			this.stripObserver.observe(strip);
		}
		requestAnimationFrame(() => {
			this.syncIndicator(true);
		});
	}
	onDisconnect() {
		this.stripObserver?.disconnect();
		this.stripObserver = null;
		this.indicatorController?.destroy();
		this.indicatorController = null;
	}
	// Enrich every state.tabs item with the parent-owned `active` flag and
	// `orientation`. Re-runs whenever any of those change — the list-binding's
	// keyed diff (by tab.id) then routes the updated item to each existing
	// <ui-tab-button> via assignState, so per-button state stays in sync
	// without any imperative push from outside.
	itemsForList() {
		const tabs = this.state.tabs ?? [];
		const activeId = this.state.active ?? '';
		const orientation = this.state.orientation || 'horizontal';
		const out = [];
		for (let index = 0; index < tabs.length; index += 1) {
			const tab = tabs[index];
			out.push({
				id: tab.id,
				label: tab.label,
				icon: tab.icon || '',
				active: tab.id === activeId,
				orientation,
			});
		}
		return out;
	}
	tabKey(item) {
		return item.id;
	}
	syncIndicator(skipTransition = false) {
		const controller = this.indicatorController;
		if (!controller) {
			return;
		}
		// `moveTo` measures the button and writes both axes; the orientation
		// CSS picks the pair it honours. A falsy active button hides it.
		const activeBtn = this.findComponent('ui-tab-button', (btn) => {
			return btn.state.active;
		});
		controller.moveTo(activeBtn, skipTransition);
	}
	async setActive(id) {
		if (!id || id === this.state.active || this.switching) {
			return;
		}
		const previous = this.state.active;
		this.switching = true;
		const content = this.refs.content;
		let outgoing;
		// Animate the outgoing panel before flipping the slot name so the user
		// sees the old content gracefully exit instead of popping out.
		if (content && previous) {
			outgoing = content.animate([
				{
					opacity: 1,
					transform: 'translateY(0)',
				},
				{
					opacity: 0,
					transform: 'translateY(-4px)',
				},
			], {
				duration: SWITCH_OUT_MS,
				easing: EASE_IN,
				fill: 'forwards',
			});
			try {
				await outgoing.finished;
			} catch {
				// Animation interrupted — fall through and swap anyway.
			}
		}
		this.state.active = id;
		this.emit('tab-change', {
			active: id,
			previous,
			source: this,
		});
		// Wait one frame so the slot projection has updated to the new panel
		// before we animate it in. Cancel the outgoing animation first so its
		// pinned opacity:0 doesn't bleed past the incoming's `fill: none`.
		requestAnimationFrame(() => {
			outgoing?.cancel();
			content?.animate([
				{
					opacity: 0,
					transform: 'translateY(6px)',
				},
				{
					opacity: 1,
					transform: 'translateY(0)',
				},
			], {
				duration: SWITCH_IN_MS,
				easing: EASE_OUT,
				fill: 'none',
			});
			this.switching = false;
		});
	}
	handleTabSelect(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (id) {
			this.setActive(id);
		}
	}
	handleKey(domEvent) {
		// Arrow-key navigation along the tab strip (a11y).
		const isVertical = this.state.orientation === 'vertical';
		let delta = 0;
		if (isVertical) {
			if (domEvent.key === 'ArrowDown') {
				delta = 1;
			} else if (domEvent.key === 'ArrowUp') {
				delta = -1;
			}
		} else if (domEvent.key === 'ArrowRight') {
			delta = 1;
		} else if (domEvent.key === 'ArrowLeft') {
			delta = -1;
		}
		if (!delta) {
			return;
		}
		domEvent.preventDefault();
		const tabs = this.state.tabs;
		const currentIndex = tabs.findIndex((tab) => {
			return tab.id === this.state.active;
		});
		const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
		const nextTab = tabs[nextIndex];
		if (!nextTab) {
			return;
		}
		this.setActive(nextTab.id);
		requestAnimationFrame(() => {
			const target = this.findComponent('ui-tab-button', (btn) => {
				return btn.state.id === nextTab.id;
			});
			target?.focus();
		});
	}
	activeSlotName() {
		return this.state.active || '';
	}
	render() {
		this.html `
			<div class=${classList(
				'tabs',
				() => {
					return `tabs-${this.state.orientation || 'horizontal'}`;
				}
			)}>
				<div class="tab-strip"
					role="tablist"
					@tab-select=${this.handleTabSelect}
					@keydown=${this.handleKey}
					#strip>
					<div class="tab-indicator" #indicator></div>
					${each(this.itemsForList(), UITabButton, this.tabKey)}
				</div>
				<div class="tab-content" #content>
					<slot name=${this.activeSlotName}></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-tabs', UITabs);
