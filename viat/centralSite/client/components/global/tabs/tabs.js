import {
	isString,
	isTrue,
	movingIndicator,
	WebComponent,
} from '../../core/index.js';
import { UITabButton } from '../tab-button/tab-button.js';
/**
 * `<ui-tabs>` — strip + optional slotted content. Pill is the default look.
 * `contentMode:'remote'` skips the content pane; selection is announced only
 * (`tabs:change`, plus `${channel}:change` when `channel` is set) so a sibling
 * can `delegate` and write its own state.
 *
 * Usage (owned):
 *   <ui-tabs .state=${{ items: SECTIONS, activeIndex: 'profile' }}
 *            @tabs:change=${this.handleTabChange}>
 *     <section slot="profile">…</section>
 *   </ui-tabs>
 *
 * Usage (remote):
 *   <ui-tabs .state.contentMode=${'remote'} .state.channel=${'preview-nav'}
 *            .state.items=${cats} .state.activeIndex=${filter}></ui-tabs>
 *   this.delegate('preview-nav:change', this.onNav);
 */
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
const SLIDE_SPRING = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
function normalizeJoin(join) {
	if (join === 'attached') {
		return 'attached';
	}
	return 'detached';
}
export class UITabs extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tabs: './tabs.css',
	};
	static state = {
		items: [],
		activeIndex: '',
		orientation: 'horizontal',
		transition: 'fade',
		slideAxis: 'auto',
		variant: 'pill',
		join: 'detached',
		stripBorder: false,
		contentMode: 'owned',
		toggleActive: false,
		channel: '',
		/*
		 * Underline / start-edge active bar on the sliding indicator.
		 * `null` = on for generic, off for pill/blocks. Explicit true/false
		 * overrides any variant.
		 */
		bar: null,
		/*
		 * Strip corner cap: '' (variant default) · 'start' (block-start
		 * rounded, block-end square) · 'end' (the inverse).
		 */
		cap: '',
	};
	switching = false;
	pendingId = '';
	hoveredId = '';
	stripObserver = null;
	indicatorController = null;
	onConnect() {
		this.observeAsync('activeIndex', this.onActiveIndexChange);
		this.observeAsync('items', this.onItemsChange);
		this.observeAsync([
			'orientation', 'variant', 'contentMode', 'join', 'bar', 'cap',
		], this.onStripLayoutChange);
		this.syncHostAttrs();
	}
	beforeRender() {
		this.syncHostAttrs();
	}
	barEnabled() {
		if (this.state.bar === true) {
			return true;
		}
		if (this.state.bar === false) {
			return false;
		}
		return (this.state.variant || 'pill') === 'generic';
	}
	syncHostAttrs() {
		this.dataset.variant = this.state.variant || 'pill';
		this.dataset.content = this.state.contentMode || 'owned';
		this.dataset.orientation = this.state.orientation || 'horizontal';
		this.dataset.join = normalizeJoin(this.state.join);
		this.toggleAttribute('data-bar', this.barEnabled());
		const cap = this.state.cap;
		if (cap === 'start' || cap === 'end') {
			this.dataset.cap = cap;
		} else {
			this.removeAttribute('data-cap');
		}
	}
	onActiveIndexChange(next, prev) {
		if (prev !== next) {
			this.syncActiveFlags();
			this.syncIndicator();
		}
	}
	onItemsChange() {
		this.syncActiveFlags();
		this.syncIndicator();
	}
	onStripLayoutChange() {
		this.syncHostAttrs();
		this.syncIndicator(true);
	}
	onStripResize() {
		this.syncIndicator(this.indicatorPrimed !== true);
		this.indicatorPrimed = true;
	}
	isRemote() {
		return this.state.contentMode === 'remote';
	}
	/*
	 * Mark the pane only when the slot actually has assigned nodes. CSS cannot
	 * see slot assignment — `:empty` is defeated by the slot element itself, so
	 * a strip-only ui-tabs (the preview rail, a remote-mode tracker) would
	 * otherwise render an empty bordered box under its tabs.
	 */
	handleContentSlotChange(domEvent) {
		const slot = domEvent?.target;
		const filled = Boolean(slot?.assignedNodes({
			flatten: true,
		}).length);
		this.refs.content?.toggleAttribute('data-filled', filled);
	}
	onMount() {
		// The indicator engine needs its element — present now, after the first
		// render. Create it before seeding `active` below: that seed trips the
		// `active` observer straight into `syncIndicator`.
		this.indicatorController = movingIndicator(this.refs.indicator, {
			prefix: 'ind',
		});
		if (!this.state.toggleActive && !this.state.activeIndex && this.state.items?.length) {
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
			if (!this.onStripResizeTick) {
				this.onStripResizeTick = () => {
					this.onStripResize();
				};
			}
			this.stripObserver = new ResizeObserver(this.onStripResizeTick);
			this.stripObserver.observe(strip);
		}
		requestAnimationFrame(() => {
			this.syncIndicator(true);
		});
	}
	onDisconnect() {
		this.stripObserver?.disconnect();
		this.stripObserver = null;
		this.indicatorPrimed = false;
		this.indicatorController?.destroy();
		this.indicatorController = null;
		this.switching = false;
		this.pendingId = '';
		this.hoveredId = '';
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
		let tabStopAssigned = Boolean(activeIndex);
		for (let index = 0; index < items.length; index += 1) {
			const isActive = items[index].id === activeIndex;
			if (items[index].active !== isActive) {
				this.state.items[index].active = isActive;
			}
			const isTabStop = isActive || (!tabStopAssigned && items[index].empty !== true);
			if (isTabStop && !isActive) {
				tabStopAssigned = true;
			}
			if (items[index].tabStop !== isTabStop) {
				this.state.items[index].tabStop = isTabStop;
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
		const activeBtn = this.findChild('ui-tab-button', UITabs.isActiveFilledButton);
		controller.moveTo(activeBtn, skipTransition);
	}
	static isActiveFilledButton(btn) {
		return btn.state.active === true && btn.state.empty !== true;
	}
	emitChange(id, previousId, collapsed) {
		const payload = {
			id,
			previousId,
			collapsed,
		};
		this.emit('tabs:change', payload);
		const channel = this.state.channel;
		if (isString(channel) && channel) {
			this.emit(`${channel}:change`, payload);
		}
	}
	collapseActive() {
		const previousId = this.state.activeIndex;
		if (!previousId) {
			return;
		}
		this.state.activeIndex = '';
		this.syncActiveFlags();
		this.syncIndicator(true);
		this.emitChange('', previousId, true);
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
					},
					{
						transform: this.axisTransform(-SLIDE_OFFSET * direction, axis),
						opacity: 0,
					},
				],
				in: [
					{
						transform: this.axisTransform(SLIDE_OFFSET * direction, axis),
						opacity: 0,
					},
					{
						transform: 'translate(0, 0)',
						opacity: 1,
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
		if (!id) {
			return;
		}
		if (this.switching) {
			this.pendingId = id;
			return;
		}
		if (id === this.state.activeIndex) {
			return;
		}
		const previousId = this.state.activeIndex;
		const items = this.state.items ?? [];
		const nextItem = items.find(UITabs.itemHasId, {
			id,
		});
		if (nextItem?.empty === true) {
			return;
		}
		const prevIndex = items.findIndex(UITabs.itemMatchesPrevious, {
			previousId,
		});
		const nextIndex = items.findIndex(UITabs.itemHasId, {
			id,
		});
		const direction = nextIndex < prevIndex ? -1 : 1;
		this.switching = true;
		const content = this.refs.content;
		const remote = this.isRemote();
		const swapFrames = this.swapKeyframes(direction);
		let outgoing;
		if (!remote && content && previousId) {
			outgoing = content.animate(swapFrames.out, {
				duration: swapFrames.outMs,
				easing: swapFrames.outEase,
				fill: 'forwards',
			});
			try {
				await outgoing.finished;
			} catch {
				outgoing = null;
			}
		}
		this.state.activeIndex = id;
		this.emitChange(id, previousId, false);
		if (remote) {
			this.finishSwitch();
			return;
		}
		requestAnimationFrame(() => {
			outgoing?.cancel();
			content?.animate(swapFrames.in, {
				duration: swapFrames.inMs,
				easing: swapFrames.inEase,
				fill: 'none',
			});
			this.finishSwitch();
		});
	}
	finishSwitch() {
		this.switching = false;
		const queued = this.pendingId;
		this.pendingId = '';
		if (queued && queued !== this.state.activeIndex) {
			this.setActive(queued);
		}
	}
	static itemHasId(tab) {
		return tab.id === this.id;
	}
	static itemMatchesPrevious(tab) {
		return tab.id === this.previousId;
	}
	static itemMatchesActive(tab) {
		return tab.id === this.state.activeIndex;
	}
	handleTabSelect(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		if (this.state.toggleActive === true && id === this.state.activeIndex) {
			this.collapseActive();
			return;
		}
		this.setActive(id);
	}
	handleTabHover(domEvent) {
		const tabId = domEvent.detail?.data?.id || '';
		if (!tabId || tabId === this.hoveredId) {
			return;
		}
		this.hoveredId = tabId;
		this.emit('tabs:hover', {
			id: tabId,
		});
	}
	handleStripLeave() {
		this.hoveredId = '';
	}
	handleKey(domEvent) {
		if (domEvent.key === 'Escape') {
			if (isTrue(this.state.toggleActive) && this.state.activeIndex) {
				domEvent.preventDefault();
				this.collapseActive();
			}
			return;
		}
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
		const itemCount = items.length;
		const currentIndex = items.findIndex(UITabs.itemMatchesActive, this);
		let nextIndex = (currentIndex + delta + itemCount) % itemCount;
		for (let step = 0; step < itemCount; step++) {
			if (items[nextIndex]?.empty !== true) {
				break;
			}
			nextIndex = (nextIndex + delta + itemCount) % itemCount;
		}
		const nextTab = items[nextIndex];
		if (!nextTab || nextTab.empty === true) {
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
			<div class="tabs"
				data-orientation=${this.state.orientation || 'horizontal'}
				data-transition=${this.state.transition || 'fade'}
				data-variant=${this.state.variant || 'pill'}
				data-join=${normalizeJoin(this.state.join)}
				data-content=${this.state.contentMode || 'owned'}
				?data-bar=${this.barEnabled}>
				<div class="tab-strip"
					role="tablist"
					?data-strip-border=${this.state.stripBorder}
					@tab-button:select=${this.handleTabSelect}
					@tab-button:hover=${this.handleTabHover}
					@keydown=${this.handleKey}
					@pointerleave=${this.handleStripLeave}
					#strip>
					<div class="tab-indicator" #indicator></div>
					${this.list('items', UITabButton)}
				</div>
				<div class="tab-content" #content ?hidden=${this.isRemote}>
					<slot name=${this.state.activeIndex || ''} @slotchange=${this.handleContentSlotChange}></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-tabs', UITabs);
