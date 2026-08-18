/*
	DESCRIPTION: ui-go-to — floating scroll control for a container edge.
	Directions: top · bottom · start (left in LTR) · end (right in LTR).
	`adaptive` flips the direction based on current scroll position
	(near bottom → offer top, near top → offer bottom; same for start/end).
	Default glyph is always `arrow-up`; `.tt[data-direction]` rotates it
	via `--ui-btn-icon-rotate` (same SVG, no icon swap). Custom `icon` opts out.
	Thin aliases: ui-to-top, ui-to-bottom, ui-to-adaptive, ui-to-left, ui-to-right.
	Scroll container resolution (first match wins):
	  1. Explicit element via `.scrollTarget=` / setScrollTarget(element)
	  2. CSS selector in state `scrollSelector` (document / light-DOM only)
	  3. Shared scroll-lock preferred target (AppView's `.shell-scroll`)
	  4. document.scrollingElement / documentElement
	── EVENTS ───────────────────────────────────────────────────────────
	  go-to:click { direction }
	  to-top:click {}  (compat — also emitted when direction resolves to top)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-go-to></ui-go-to>
	  <ui-go-to .state.direction=${'bottom'}></ui-go-to>
	  <ui-go-to .state.adaptive=${true}></ui-go-to>
	  <ui-to-top></ui-to-top>
	──────────────────────────────────────────────────────────────────────
*/
import '../button/button.js';
import { WebComponent } from 'webcomponent';
import { getScrollLockTarget } from '../scroll-lock.js';
const DEFAULT_THRESHOLD = 320;
const DIRECTIONS = new Set([
	'top',
	'bottom',
	'start',
	'end',
	'left',
	'right',
]);
const DIRECTION_DEFAULTS = {
	top: {
		icon: 'arrow-up',
		label: 'Back to top',
	},
	bottom: {
		icon: 'arrow-down',
		label: 'Go to bottom',
	},
	start: {
		icon: 'arrow-left',
		label: 'Scroll to start',
	},
	end: {
		icon: 'arrow-right',
		label: 'Scroll to end',
	},
	left: {
		icon: 'arrow-left',
		label: 'Scroll left',
	},
	right: {
		icon: 'arrow-right',
		label: 'Scroll right',
	},
};
/**
 * Resolve a document-scoped scroll container from a CSS selector.
 * @param {string} selector - CSS selector for a light-DOM scroll container.
 * @returns {Element|null}
 */
function resolveScrollSelector(selector) {
	if (!selector) {
		return null;
	}
	return globalThis.document.querySelector(selector);
}
/**
 * Default scroll surface when no explicit target or selector is set.
 * @returns {Element}
 */
function resolveDefaultScrollContainer() {
	return getScrollLockTarget() ??
		globalThis.document.scrollingElement ??
		globalThis.document.documentElement;
}
/**
 * Normalize left/right aliases onto logical start/end for scroll math.
 * Physical left/right still keep their icons/labels via DIRECTION_DEFAULTS.
 * @param {string} direction - Raw direction token.
 * @returns {string}
 */
function normalizeDirection(direction) {
	if (!DIRECTIONS.has(direction)) {
		return 'top';
	}
	return direction;
}
/**
 * Axis for a direction: block (vertical) or inline (horizontal).
 * @param {string} direction - Normalized direction.
 * @returns {'block'|'inline'}
 */
function axisFor(direction) {
	if (direction === 'start' || direction === 'end' || direction === 'left' || direction === 'right') {
		return 'inline';
	}
	return 'block';
}
export class UIGoTo extends WebComponent {
	static url = import.meta.url;
	static styles = {
		goTo: './go-to.css',
	};
	static state = {
		// top | bottom | start | end | left | right
		direction: 'top',
		// When true, direction flips from scroll position (near edge → offer opposite).
		adaptive: false,
		// Override icon/label; empty → direction defaults.
		icon: '',
		label: '',
		tooltip: '',
		tone: 'primary',
		size: 'md',
		// bottom-end (default) · bottom-start · top-end · top-start · static (inline)
		position: 'bottom-end',
		scrollSelector: '',
		// px past which the control becomes visible (ignored when position=static).
		// Adaptive also uses this as the "near edge" threshold.
		threshold: DEFAULT_THRESHOLD,
		// Live visibility driven by the scroll surface (not a caller toggle).
		visible: false,
		// Resolved live direction (adaptive writes this; fixed mirrors state.direction).
		activeDirection: 'top',
		smooth: true,
		disabled: false,
	};
	#explicitScrollTarget = null;
	scrollTargetRef = null;
	setScrollTarget(element) {
		this.#explicitScrollTarget = element ?? null;
		this.attachScrollTarget();
	}
	get scrollTarget() {
		return this.#explicitScrollTarget ??
			this.scrollTargetRef?.deref() ??
			null;
	}
	set scrollTarget(element) {
		this.setScrollTarget(element);
	}
	onConnect() {
		this.observe('scrollSelector', this.handleScrollSelectorChange);
		this.observe([
			'threshold',
			'direction',
			'adaptive',
		], this.handleConfigChange);
		this.attachScrollTarget();
	}
	onMount() {
		this.attachScrollTarget();
	}
	onDisconnect() {
		this.detachScrollTarget();
	}
	handleScrollSelectorChange() {
		if (this.#explicitScrollTarget) {
			return;
		}
		this.attachScrollTarget();
	}
	handleConfigChange() {
		this.syncFromScroll();
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'scroll') {
			this.syncFromScroll();
		}
	}
	resolveScrollContainer() {
		if (this.#explicitScrollTarget?.isConnected) {
			return this.#explicitScrollTarget;
		}
		if (this.#explicitScrollTarget && !this.#explicitScrollTarget.isConnected) {
			this.#explicitScrollTarget = null;
		}
		const fromSelector = resolveScrollSelector(this.state.scrollSelector);
		if (fromSelector) {
			return fromSelector;
		}
		return resolveDefaultScrollContainer();
	}
	ensureScrollListener() {
		const target = this.resolveScrollContainer();
		const current = this.scrollTargetRef?.deref() ?? null;
		if (target === current) {
			return target;
		}
		this.detachScrollTarget();
		if (!target) {
			return null;
		}
		this.scrollTargetRef = new WeakRef(target);
		target.addEventListener('scroll', this, {
			passive: true,
		});
		return target;
	}
	attachScrollTarget() {
		this.ensureScrollListener();
		this.syncFromScroll();
	}
	detachScrollTarget() {
		const target = this.scrollTargetRef?.deref() ?? null;
		if (target) {
			target.removeEventListener('scroll', this);
		}
		this.scrollTargetRef = null;
	}
	/**
	 * Resolve the direction the control should act on (adaptive or fixed).
	 * @param {Element|null} target - Scroll container.
	 * @returns {string}
	 */
	resolveActiveDirection(target) {
		const configured = normalizeDirection(this.state.direction);
		if (!this.state.adaptive || !target) {
			return configured;
		}
		const threshold = Number(this.state.threshold) || DEFAULT_THRESHOLD;
		const axis = axisFor(configured);
		if (axis === 'inline') {
			const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
			const left = target.scrollLeft ?? 0;
			const nearStart = left <= threshold;
			const nearEnd = left >= maxLeft - threshold;
			// Prefer the opposite edge when near one; mid-scroll keeps configured preference.
			if (nearStart && !nearEnd) {
				return configured === 'left' ? 'right' : 'end';
			}
			if (nearEnd && !nearStart) {
				return configured === 'right' ? 'left' : 'start';
			}
			// Mid: offer the further edge from current position.
			return left < maxLeft / 2 ? (configured === 'left' || configured === 'start' ? 'end' : 'right') : (configured === 'right' || configured === 'end' ? 'start' : 'left');
		}
		const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
		const top = target.scrollTop ?? 0;
		const nearTop = top <= threshold;
		const nearBottom = top >= maxTop - threshold;
		if (nearTop && !nearBottom) {
			return 'bottom';
		}
		if (nearBottom && !nearTop) {
			return 'top';
		}
		return top < maxTop / 2 ? 'bottom' : 'top';
	}
	/**
	 * Whether the control should be visible for the active direction.
	 * @param {Element|null} target - Scroll container.
	 * @param {string} direction - Active direction.
	 * @returns {boolean}
	 */
	isPastThreshold(target, direction) {
		if (!target) {
			return false;
		}
		const threshold = Number(this.state.threshold) || DEFAULT_THRESHOLD;
		const top = target.scrollTop ?? 0;
		const left = target.scrollLeft ?? 0;
		const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
		const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
		switch (direction) {
			case 'top': {
				return top > threshold;
			}
			case 'bottom': {
				return top < maxTop - threshold;
			}
			case 'start':
			case 'left': {
				return left > threshold;
			}
			case 'end':
			case 'right': {
				return left < maxLeft - threshold;
			}
			default: {
				return top > threshold;
			}
		}
	}
	syncFromScroll() {
		if (this.state.position === 'static') {
			if (!this.state.visible) {
				this.state.visible = true;
			}
			const fixed = normalizeDirection(this.state.direction);
			if (this.state.activeDirection !== fixed && !this.state.adaptive) {
				this.state.activeDirection = fixed;
			} else if (this.state.adaptive) {
				const target = this.ensureScrollListener();
				const nextDirection = this.resolveActiveDirection(target);
				if (nextDirection !== this.state.activeDirection) {
					this.state.activeDirection = nextDirection;
				}
			}
			return;
		}
		const target = this.ensureScrollListener();
		const nextDirection = this.resolveActiveDirection(target);
		if (nextDirection !== this.state.activeDirection) {
			this.state.activeDirection = nextDirection;
		}
		const nextVisible = this.isPastThreshold(target, nextDirection);
		if (nextVisible !== this.state.visible) {
			this.state.visible = nextVisible;
		}
	}
	scrollMetrics(target, direction) {
		const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
		const behavior = this.state.smooth && !reduceMotion ? 'smooth' : 'auto';
		const top = target.scrollTop ?? 0;
		const left = target.scrollLeft ?? 0;
		const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
		const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
		switch (direction) {
			case 'top': {
				return {
					top: 0,
					left,
					behavior,
				};
			}
			case 'bottom': {
				return {
					top: maxTop,
					left,
					behavior,
				};
			}
			case 'start':
			case 'left': {
				return {
					top,
					left: 0,
					behavior,
				};
			}
			case 'end':
			case 'right': {
				return {
					top,
					left: maxLeft,
					behavior,
				};
			}
			default: {
				return {
					top: 0,
					left: 0,
					behavior,
				};
			}
		}
	}
	handleClick(domEvent) {
		domEvent.stopPropagation();
		const target = this.ensureScrollListener() ?? this.resolveScrollContainer();
		const direction = this.state.activeDirection || normalizeDirection(this.state.direction);
		if (target) {
			target.scrollTo(this.scrollMetrics(target, direction));
		}
		this.emit('go-to:click', {
			direction,
		});
		// Back-compat for existing ui-to-top listeners.
		if (direction === 'top') {
			this.emit('to-top:click', {});
		}
	}
	useMorphArrow() {
		return !this.state.icon;
	}
	resolvedIcon() {
		if (this.state.icon) {
			return this.state.icon;
		}
		return 'arrow-up';
	}
	resolvedLabel() {
		if (this.state.label) {
			return this.state.label;
		}
		const direction = this.state.activeDirection || normalizeDirection(this.state.direction);
		return DIRECTION_DEFAULTS[direction]?.label || 'Go';
	}
	resolvedTooltip() {
		return this.state.tooltip || this.resolvedLabel();
	}
	render() {
		this.html`
			<div class="tt"
				data-position=${this.state.position}
				data-direction=${this.state.activeDirection || this.state.direction}
				?data-morph=${this.useMorphArrow}
				?data-adaptive=${this.state.adaptive}
				?data-visible=${this.state.position === 'static' || this.state.visible}
				?aria-hidden=${this.state.position !== 'static' && !this.state.visible}>
				<ui-button
					class="tt-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${this.state.size}
					.state.circle=${true}
					.state.leadicon=${this.resolvedIcon}
					.state.label=${''}
					.state.tooltip=${this.resolvedTooltip}
					.state.disabled=${this.state.disabled}
					@button:click=${this.handleClick}></ui-button>
			</div>
		`;
	}
}
/* ── Thin aliases — same logic, fixed direction / adaptive seed ───── */
export class UIToTop extends UIGoTo {
	static state = {
		direction: 'top',
		adaptive: false,
		label: 'Back to top',
	};
}
export class UIToBottom extends UIGoTo {
	static state = {
		direction: 'bottom',
		adaptive: false,
		label: 'Go to bottom',
		position: 'bottom-end',
	};
}
export class UIToAdaptive extends UIGoTo {
	static state = {
		direction: 'top',
		adaptive: true,
		label: 'Scroll',
	};
}
export class UIToLeft extends UIGoTo {
	static state = {
		direction: 'left',
		adaptive: false,
		label: 'Scroll left',
		position: 'bottom-start',
	};
}
export class UIToRight extends UIGoTo {
	static state = {
		direction: 'right',
		adaptive: false,
		label: 'Scroll right',
		position: 'bottom-end',
	};
}
customElements.define('ui-go-to', UIGoTo);
customElements.define('ui-to-top', UIToTop);
customElements.define('ui-to-bottom', UIToBottom);
customElements.define('ui-to-adaptive', UIToAdaptive);
customElements.define('ui-to-left', UIToLeft);
customElements.define('ui-to-right', UIToRight);
