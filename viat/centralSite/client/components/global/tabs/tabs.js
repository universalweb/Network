import { movingIndicator, WebComponent } from '../../core/index.js';
import { UITabButton } from './tab-button.js';
// `<ui-tabs>` — reusable tab strip + slotted content area with built-in
// switching animation: a sliding indicator bar plus a content swap that is
// either a cross-fade (default) or a direction-aware slide+blur (opt-in
// `transition:'slide'`, axis follows orientation or an explicit `slideAxis`).
//
// Usage:
//   <ui-tabs .state=${{ items: SECTIONS, activeIndex: 'profile', orientation: 'vertical' }}
//            @tabs:change=${this.handleTabChange}>
//     <section slot="profile">…</section>
//     <section slot="wallet-view">…</section>
//   </ui-tabs>
//
// Each `item.id` doubles as the slot name. The active item's slot is shown; the
// component animates the swap. The strip emits `tabs:change`
// (detail.data: { id, previousId }) after a click but BEFORE the
// cross-fade in finishes, so parents see the state change immediately.
//
// Children are <ui-tab-button> components rendered through the framework's
// list machinery — the active button is located via `findComponent` (no
// querySelector reach-through into shadow DOM).
const SWITCH_OUT_MS = 140;
const SWITCH_IN_MS = 220;
const EASE_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
// Direction-aware SLIDE mode (opt-in `transition:'slide'`). The travelling panel
// enters from the leading edge and the outgoing one exits the trailing edge — axis
// follows the strip orientation (left/right horizontal, up/down vertical) or an
// explicit `slideAxis` ('x'/'y'/'diagonal'). Offset is a % of the panel box so it
// scales with width instead of a hard px (cult-ui ships a fixed 300px). Tune here.
const SLIDE_OUT_MS = 170;
const SLIDE_IN_MS = 300;
const SLIDE_OFFSET = 20;
const SLIDE_BLUR = '4px';
const SLIDE_SPRING = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
export class UITabs extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tabs: './tabs.css',
	};
	static state = {
		items: [],
		activeIndex: '',
		orientation: 'horizontal',
		// Content-swap animation. 'fade' (default — every existing strip keeps its
		// behaviour) | 'slide' (direction-aware: panel slides + blurs in from the
		// side it travelled). Opt-in so consumers like the settings modal are untouched.
		transition: 'fade',
		// Slide axis when transition==='slide': 'auto' follows orientation
		// (x=left/right, y=up/down) — or force 'x' / 'y' / 'diagonal'.
		slideAxis: 'auto',
	};
	switching = false;
	stripObserver = null;
	indicatorController = null;
	onConnect() {
		this.observeAsync('activeIndex', (next, prev) => {
			if (prev !== next) {
				// Flags BEFORE the indicator — `syncIndicator` locates the active
				// button via its `active` state, which the flag write must set first.
				this.syncActiveFlags();
				this.syncIndicator();
			}
		});
		this.observeAsync('items', () => {
			this.syncActiveFlags();
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
		// Seed `activeIndex` to the first item when the parent doesn't pass one.
		if (!this.state.activeIndex && this.state.items?.length) {
			this.state.activeIndex = this.state.items[0].id;
		}
		// Initial flag pass — buttons first render with the default `active:false`;
		// the `active` observer only fires on subsequent changes, so seed it here.
		this.syncActiveFlags();
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
	// Shared single-select: write the `active` flag onto the bound `state.items`
	// at event/observe-time — NEVER a per-render enrichment loop. The deep
	// write fires `items.{i}.active`, which the list binding routes into that one
	// <ui-tab-button> via assignState. Orientation is shared group STYLING and
	// rides a CSS custom property on the strip (tabs.css), not a per-item flag.
	syncActiveFlags() {
		const items = this.state.items;
		if (!items?.length) {
			return;
		}
		const activeIndex = this.state.activeIndex;
		for (let index = 0; index < items.length; index += 1) {
			const isActive = items[index].id === activeIndex;
			if (items[index].active !== isActive) {
				this.state.items[index].active = isActive;
			}
		}
	}
	syncIndicator(skipTransition = false) {
		const controller = this.indicatorController;
		if (!controller) {
			return;
		}
		// `moveTo` measures the button and writes both axes; the orientation
		// CSS picks the pair it honours. A falsy active button hides it.
		const activeBtn = this.findChild('ui-tab-button', (btn) => {
			return btn.state.active;
		});
		controller.moveTo(activeBtn, skipTransition);
	}
	// Resolve the slide axis: an explicit `slideAxis` wins, else follow the strip
	// orientation (horizontal → x = left/right, vertical → y = up/down).
	resolveSlideAxis() {
		const axis = this.state.slideAxis || 'auto';
		if (axis === 'x' || axis === 'y' || axis === 'diagonal') {
			return axis;
		}
		return this.state.orientation === 'vertical' ? 'y' : 'x';
	}
	axisTransform(value, axis) {
		if (axis === 'y') {
			return `translateY(${value}%)`;
		}
		if (axis === 'diagonal') {
			return `translate(${value}%, ${value}%)`;
		}
		return `translateX(${value}%)`;
	}
	prefersReducedMotion() {
		return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
	}
	// One swap = an OUT pass (old panel leaves) then, after the slot flips, an IN
	// pass (new panel arrives). Returns both keyframe pairs + timing for the active
	// mode. The IN pair always rests transform-free (`fill:'none'` at the call site)
	// so no residual transform lingers — a lingering one becomes a containing block
	// inside the settings-modal height chain (the same trap that bit `.demo`).
	swapKeyframes(direction) {
		if (this.prefersReducedMotion()) {
			return {
				out: [
					{
						opacity: 1,
					}, {
						opacity: 0,
					},
				],
				in: [
					{
						opacity: 0,
					}, {
						opacity: 1,
					},
				],
				outMs: 90,
				inMs: 120,
				outEase: 'linear',
				inEase: 'linear',
			};
		}
		if (this.state.transition === 'slide') {
			const axis = this.resolveSlideAxis();
			return {
				out: [
					{
						transform: 'translate(0, 0)',
						opacity: 1,
						filter: 'blur(0px)',
					},
					{
						transform: this.axisTransform(-SLIDE_OFFSET * direction, axis),
						opacity: 0,
						filter: `blur(${SLIDE_BLUR})`,
					},
				],
				in: [
					{
						transform: this.axisTransform(SLIDE_OFFSET * direction, axis),
						opacity: 0,
						filter: `blur(${SLIDE_BLUR})`,
					},
					{
						transform: 'translate(0, 0)',
						opacity: 1,
						filter: 'blur(0px)',
					},
				],
				outMs: SLIDE_OUT_MS,
				inMs: SLIDE_IN_MS,
				outEase: EASE_IN,
				inEase: SLIDE_SPRING,
			};
		}
		return {
			out: [
				{
					opacity: 1,
					transform: 'translateY(0)',
				},
				{
					opacity: 0,
					transform: 'translateY(-4px)',
				},
			],
			in: [
				{
					opacity: 0,
					transform: 'translateY(6px)',
				},
				{
					opacity: 1,
					transform: 'translateY(0)',
				},
			],
			outMs: SWITCH_OUT_MS,
			inMs: SWITCH_IN_MS,
			outEase: EASE_IN,
			inEase: EASE_OUT,
		};
	}
	async setActive(id) {
		if (!id || id === this.state.activeIndex || this.switching) {
			return;
		}
		const previousId = this.state.activeIndex;
		const items = this.state.items ?? [];
		const prevIndex = items.findIndex((tab) => {
			return tab.id === previousId;
		});
		const nextIndex = items.findIndex((tab) => {
			return tab.id === id;
		});
		// Forward (1) toward a later tab, backward (-1) toward an earlier one. A
		// missing previous (prevIndex -1) reads as forward — a sane first-show default.
		const direction = nextIndex < prevIndex ? -1 : 1;
		this.switching = true;
		const content = this.refs.content;
		const swapFrames = this.swapKeyframes(direction);
		let outgoing;
		// Animate the outgoing panel out before flipping the slot name so the user
		// sees the old content leave instead of popping out.
		if (content && previousId) {
			outgoing = content.animate(swapFrames.out, {
				duration: swapFrames.outMs,
				easing: swapFrames.outEase,
				fill: 'forwards',
			});
			try {
				await outgoing.finished;
			} catch {
				// Interrupted — fall through and swap anyway.
			}
		}
		this.state.activeIndex = id;
		this.emit('tabs:change', {
			id,
			previousId,
		});
		// Wait one frame so the slot projection updates to the new panel before
		// animating it in. Cancel the outgoing first so its pinned end state
		// doesn't bleed past the incoming's transform-free `fill:'none'` rest.
		requestAnimationFrame(() => {
			outgoing?.cancel();
			content?.animate(swapFrames.in, {
				duration: swapFrames.inMs,
				easing: swapFrames.inEase,
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
		const items = this.state.items;
		const currentIndex = items.findIndex((tab) => {
			return tab.id === this.state.activeIndex;
		});
		const nextIndex = (currentIndex + delta + items.length) % items.length;
		const nextTab = items[nextIndex];
		if (!nextTab) {
			return;
		}
		this.setActive(nextTab.id);
		requestAnimationFrame(() => {
			const target = this.findChild('ui-tab-button', (btn) => {
				return btn.state.id === nextTab.id;
			});
			target?.focus();
		});
	}
	render() {
		this.html`
			<div class="tabs" data-orientation=${this.state.orientation || 'horizontal'} data-transition=${this.state.transition || 'fade'}>
				<div class="tab-strip"
					role="tablist"
					@tab-button:select=${this.handleTabSelect}
					@keydown=${this.handleKey}
					#strip>
					<div class="tab-indicator" #indicator></div>
					${this.list('items', UITabButton)}
				</div>
				<div class="tab-content" #content>
					<slot name=${this.state.activeIndex || ''}></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-tabs', UITabs);
