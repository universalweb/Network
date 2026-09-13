/*
	DESCRIPTION: ui-go-to — floating scroll control for a container edge.
	Directions: top · bottom · start (left in LTR) · end (right in LTR).
	`adaptive` flips ONE button from scroll position (near bottom → offer
	top, near top → offer bottom; same for start/end).
	`axes` is the d-pad: 'block' (top+bottom), 'inline' (start+end),
	'all' (four). Each pad button hides independently when that edge is
	already reached and returns as you scroll away. Empty axes = single.
	`cluster` packs every visible arrow into ONE area (the `position`
	corner). Default `'auto'` clusters when this is the only live go-to
	whose containing block is the viewport; two or more viewport-fixed
	hosts split each arrow onto its own edge. A go-to parked inside a
	transformed / contained / size-container panel is not competing for viewport corners
	and does not count. `cluster=${true}` / `'cluster'` always packs;
	`false` / `'split'` always splits. Default glyph is always `arrow-up`;
	`.go-to[data-direction]` rotates it via `--ui-btn-icon-rotate` (same
	SVG, no icon swap). Enter / fidget rotation is `--ui-btn-icon-spin`
	on the icon, composed with direction — the chrome only fades and
	scales. Custom `icon` opts out. Thin aliases: ui-to-top, ui-to-bottom,
	ui-to-adaptive, ui-to-left, ui-to-right, ui-to-pad (axes=all). Those
	aliases seed the common CORNER parks; middle-of-edge is `position`
	on this engine (center-start / center-end) — no extra tags.
	`shape` is `circle` (default disc) or `tab`. A tab is square on the wall
	it hugs and rounded on the outer side; the flat side is derived from
	`position`, never a second knob.
	`gated` (default true) is scroll visibility. `gated: false` keeps the park
	and always shows the control — playlist prev/next at center-end is an
	action caller, not a scroll caller. `go-to:click` is cancelable; prevent
	it to take the click without scrolling. Pad tooltip overrides: `topLabel`
	`bottomLabel` `startLabel` `endLabel`.
	Tooltips point INWARD from the corner the control is parked in — an
	end-anchored arrow tips left, a start-anchored one tips right — via the
	`tooltipPlacement` behavior on the button, not local CSS. `tooltipPlacement`
	state overrides; `position=static` keeps the automatic placement.
	Scroll container resolution (first match wins):
	  1. Explicit element via `.scrollTarget=` / setScrollTarget(element)
	  2. CSS selector in state `scrollSelector` (document / light-DOM only)
	  3. findScrollableAncestor from the scroll-lock target when that
	     target is not the document (preview `.stage` is a SIBLING of
	     this host — walking from `this` cannot see it)
	  4. findScrollableAncestor from this host (in-scroller mounts)
	  5. document.scrollingElement / documentElement
	  Genuine maxTop===0 still hides the control. ResizeObserver on the
	  target + its children re-syncs when content grows after first paint.
	── EVENTS ───────────────────────────────────────────────────────────
	  go-to:click { direction }  (cancelable — preventDefault skips scroll)
	  to-top:click {}  (compat — also emitted when direction resolves to top)
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-go-to></ui-go-to>
	  <ui-go-to .state.direction=${'bottom'}></ui-go-to>
	  <ui-go-to .state.adaptive=${true}></ui-go-to>
	  <ui-go-to .state.axes=${'block'}></ui-go-to>
	  <ui-go-to .state.axes=${'all'} .state.cluster=${false}></ui-go-to>
	  <ui-go-to .state.position=${'center-end'} .state.shape=${'tab'}></ui-go-to>
	  <ui-to-pad></ui-to-pad>
	  <ui-to-top></ui-to-top>
	──────────────────────────────────────────────────────────────────────
*/
import '../button/button.js';
import { isFalse, isTrue } from '@universalweb/utilitylib';
import {
	findScrollableAncestor, rafCoalesce, rafCoalesceCancel, WebComponent,
} from 'webcomponent';
import { captureRects, playFlip } from '../../core/dom/flip.js';
import { getScrollLockTarget } from '../scroll-lock.js';
const LIVE_GOTO = new Set();
const DEFAULT_THRESHOLD = 320;
const DIRECTIONS = new Set([
	'top',
	'bottom',
	'start',
	'end',
	'left',
	'right',
]);
const AXES = new Set([
	'block',
	'inline',
	'all',
]);
/*
 * Position grammar is <block>-<inline>: top|bottom|center × start|end,
 * plus `static` for inline demos. `center-*` is the vertical middle of
 * that inline edge (middle left / middle right). Unknown → bottom-end.
 */
const POSITIONS = new Set([
	'bottom-end',
	'bottom-start',
	'top-end',
	'top-start',
	'center-end',
	'center-start',
	'static',
]);
const SHAPES = new Set([
	'circle',
	'tab',
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
	return globalThis.document.scrollingElement ??
		globalThis.document.documentElement;
}
/**
 * True when `node` is the document's own scrolling box (not an inner stage).
 * @param {Element|null|undefined} node - Candidate.
 * @returns {boolean}
 */
function isDocumentScroller(node) {
	const doc = globalThis.document;
	if (!node || !doc) {
		return true;
	}
	return node === doc.documentElement ||
		node === doc.body ||
		node === doc.scrollingElement;
}
/**
 * Remaining scroll travel on both axes.
 * @param {Element|null|undefined} node - Scroll container.
 * @returns {number}
 */
function scrollTravel(node) {
	if (!node) {
		return 0;
	}
	const block = Math.max(0, node.scrollHeight - node.clientHeight);
	const inline = Math.max(0, node.scrollWidth - node.clientWidth);
	return block + inline;
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
 * Normalize pad axes. 'pad'/'both' → all. Unknown → single-button (empty).
 * @param {string} axes - Raw axes token.
 * @returns {string} block, inline, all, or empty.
 */
function normalizeAxes(axes) {
	if (axes === 'pad' || axes === 'both') {
		return 'all';
	}
	if (AXES.has(axes)) {
		return axes;
	}
	return '';
}
/**
 * Park token. Unknown / empty → bottom-end (the default corner).
 * @param {string} position - Raw position token.
 * @returns {string} A POSITIONS token, default bottom-end.
 */
function normalizePosition(position) {
	if (POSITIONS.has(position)) {
		return position;
	}
	return 'bottom-end';
}
/**
 * Silhouette. `tab` squares the wall side from position; anything else is the disc.
 * @param {string} shape - Raw shape token.
 * @returns {'circle'|'tab'} circle unless the token is tab.
 */
function normalizeShape(shape) {
	if (SHAPES.has(shape)) {
		return shape;
	}
	return 'circle';
}
/**
 * Cluster policy. auto = pack when this is the only live go-to.
 * @param {*} cluster - Caller cluster value.
 * @returns {'auto'|'cluster'|'split'} Normalized cluster mode.
 */
function normalizeCluster(cluster) {
	if (isFalse(cluster) || cluster === 'split' || cluster === 'edges') {
		return 'split';
	}
	if (isTrue(cluster) || cluster === 'cluster' || cluster === 'always') {
		return 'cluster';
	}
	return 'auto';
}
const FIXED_CB_WILL_CHANGE = new Set([
	'transform',
	'perspective',
	'filter',
	'backdrop-filter',
	'translate',
	'rotate',
	'scale',
]);
const FIXED_CB_CONTAIN = /\b(layout|paint|strict|content)\b/;
/*
 * CSS Containment 3: `size` and `inline-size` apply layout containment, which
 * mints a containing block for `position:fixed` descendants. `scroll-state`
 * does not apply layout containment. `normal` is the default and does not count.
 */
const FIXED_CB_CONTAINER_TYPE = /(?:^|\s)(?:inline-)?size(?:\s|$)/;
/**
 * CSS `none` / empty / missing all mean the property is not establishing a box.
 * @param {string|null|undefined} value - Computed style value.
 * @returns {boolean} True when the property is absent or `none`.
 */
function cssIsNone(value) {
	return !value || value === 'none';
}
/**
 * Shadow roots are Node.DOCUMENT_FRAGMENT_NODE (11); hop to the host so a
 * walk started inside a custom element keeps going through the light tree.
 * @param {Node} node - Current node.
 * @returns {Element|null} The parent element, shadow host, or null at the root.
 */
function nextAncestor(node) {
	const parentNode = node.parentNode;
	if (!parentNode) {
		return null;
	}
	if (parentNode.nodeType === 11) {
		return parentNode.host ?? null;
	}
	if (parentNode.nodeType === 1) {
		return parentNode;
	}
	return null;
}
/**
 * True when `will-change` lists a property that mints a fixed containing block.
 * @param {string} willChange - Computed will-change.
 * @returns {boolean} True when a listed property mints a fixed containing block.
 */
function willChangeEstablishesFixedContainingBlock(willChange) {
	if (cssIsNone(willChange) || willChange === 'auto') {
		return false;
	}
	const tokens = willChange.split(',');
	const tokenCount = tokens.length;
	for (let index = 0; index < tokenCount; index += 1) {
		if (FIXED_CB_WILL_CHANGE.has(tokens[index].trim())) {
			return true;
		}
	}
	return false;
}
/**
 * True when this computed style makes `position:fixed` descendants park
 * against this box instead of the viewport.
 * @param {CSSStyleDeclaration} style - Computed style of an ancestor.
 * @returns {boolean} True when fixed descendants park against this box.
 */
function establishesFixedContainingBlock(style) {
	if (!cssIsNone(style.transform)) {
		return true;
	}
	if (!cssIsNone(style.translate)) {
		return true;
	}
	if (!cssIsNone(style.rotate)) {
		return true;
	}
	if (!cssIsNone(style.scale)) {
		return true;
	}
	if (!cssIsNone(style.perspective)) {
		return true;
	}
	if (!cssIsNone(style.filter)) {
		return true;
	}
	if (!cssIsNone(style.backdropFilter)) {
		return true;
	}
	if (FIXED_CB_CONTAIN.test(style.contain || '')) {
		return true;
	}
	if (FIXED_CB_CONTAINER_TYPE.test(style.containerType || '')) {
		return true;
	}
	if (style.contentVisibility === 'auto') {
		return true;
	}
	return willChangeEstablishesFixedContainingBlock(style.willChange);
}
/**
 * True when this host's `position:fixed` box is the viewport, not a
 * transformed / contained / size-container ancestor. Display-contents hosts do not generate
 * a box; the walk starts at the light-DOM parent.
 * @param {Element} host - A connected ui-go-to (or stand-in element in tests).
 * @returns {boolean} True when the host's fixed box is the viewport.
 */
export function isViewportFixedHost(host) {
	let node = nextAncestor(host);
	while (node) {
		if (establishesFixedContainingBlock(getComputedStyle(node))) {
			return false;
		}
		node = nextAncestor(node);
	}
	return true;
}
/**
 * Count connected floating go-to hosts whose containing block is the
 * viewport. Inline `position=static` demos and hosts parked inside a
 * transformed / contained / size-container panel do not compete for viewport edges.
 * @returns {number} Viewport-fixed floating live host count.
 */
function liveFloatingCount() {
	let count = 0;
	for (const host of LIVE_GOTO) {
		if (!host.isConnected) {
			continue;
		}
		if (normalizePosition(host.state.position) === 'static') {
			continue;
		}
		if (!isViewportFixedHost(host)) {
			continue;
		}
		count += 1;
	}
	return count;
}
function refreshLiveCluster() {
	for (const host of LIVE_GOTO) {
		host.syncClustered();
	}
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
/**
 * Near-edge slop. Caps at threshold on long surfaces; shrinks on short
 * ones so a 320px gate cannot hide every pad button when max < 640.
 * @param {number} max - Max scroll offset on this axis.
 * @param {number} threshold - Configured threshold.
 * @returns {number} Slop in CSS pixels.
 */
function edgeSlop(max, threshold) {
	if (max <= 0) {
		return 0;
	}
	const quarter = max / 4;
	return Math.min(threshold, Math.max(1, quarter));
}
/**
 * Floor opacity while the control is still shown. Below this the
 * button is gone (visibility + hit-test), so a ghost tooltip cannot fire.
 */
export const MIN_VISIBLE = 0.15;
/*
 * Hide once remaining distance is this fraction of the fade zone.
 * 0.02 of a 320px zone is ~6px — inside native scroll-rest jitter, so
 * the control is gone before a pointer can still hit a near-zero ghost.
 */
export const HIDE_RATIO = 0.02;
const FULL_RATIO = 0.5;
/**
 * Piecewise visibility for an edge-approaching control. Opacity and
 * shown/hidden both come from this value: shown iff the result is greater than 0.
 * @param {number} distance - Remaining px to the target edge.
 * @param {number} zone - Fade window in px.
 * @returns {number} Visibility from 0 to 1.
 */
export function edgeVisibility(distance, zone) {
	if (distance <= 0) {
		return 0;
	}
	if (zone <= 0) {
		return 1;
	}
	const ratio = distance / zone;
	if (ratio >= FULL_RATIO) {
		return 1;
	}
	if (ratio <= HIDE_RATIO) {
		return 0;
	}
	return lerpEdgeVisible(ratio);
}
/**
 * Map a fade-zone ratio in (HIDE_RATIO, 0.5] onto [MIN_VISIBLE, 1].
 * @param {number} ratio - distance / zone, already between the two ends.
 * @returns {number} Visibility from MIN_VISIBLE to 1.
 */
function lerpEdgeVisible(ratio) {
	const span = FULL_RATIO - HIDE_RATIO;
	const t = (ratio - HIDE_RATIO) / span;
	return MIN_VISIBLE + (t * (1 - MIN_VISIBLE));
}
/**
 * PAINTED opacity for an edge-approaching control — continuous all the way to 0.
 *
 * `edgeVisibility` answers a DIFFERENT question (is this control shown and
 * hit-testable?) and deliberately floors at MIN_VISIBLE so a shown control is
 * never a near-invisible click target. Painting opacity from that same number
 * fused the two decisions, and the floor then showed up as a visible pop:
 * measured on the preview stage, the fade stepped 0.1513 straight to 0 inside a
 * single 10px scroll — a 15% jump, which is the jaggedness this fixes.
 *
 * Ramping to exactly 0 AT the hide threshold means the control is already fully
 * transparent at the instant it stops being hit-testable, so there is no pop and
 * no ghost either — the two now coincide instead of contradicting.
 * @param {number} distance - Remaining px to the target edge.
 * @param {number} zone - Fade window in px.
 * @returns {number} Opacity from 0 to 1, with no discontinuity.
 */
export function edgeOpacity(distance, zone) {
	if (distance <= 0) {
		return 0;
	}
	if (zone <= 0) {
		return 1;
	}
	const ratio = distance / zone;
	if (ratio >= FULL_RATIO) {
		return 1;
	}
	if (ratio <= HIDE_RATIO) {
		return 0;
	}
	return (ratio - HIDE_RATIO) / (FULL_RATIO - HIDE_RATIO);
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
		// '' = single button. block = top+bottom. inline = start+end. all = d-pad.
		axes: '',
		/*
		 * auto (default) packs every arrow into one area when this is the
		 * only live go-to; two+ hosts split each arrow onto its own edge.
		 * true/'cluster' always packs. false/'split' always splits.
		 */
		cluster: 'auto',
		clustered: true,
		showTop: false,
		showBottom: false,
		showStart: false,
		showEnd: false,
		// Override icon/label; empty → direction defaults.
		icon: '',
		label: '',
		tooltip: '',
		/*
		 * Forced tooltip side. Empty resolves from `position` (see
		 * resolvedTooltipSide) — a control pinned to a viewport corner has no room
		 * on the outward side, and it is the only thing that knows which side that
		 * is. Set it explicitly to override.
		 */
		tooltipPlacement: '',
		tone: 'primary',
		size: 'md',
		// <block>-<inline> plus static. See POSITIONS.
		position: 'bottom-end',
		/*
		 * circle (default disc) · tab (wall-flat derived from `position`).
		 * A tab at center-start is square on start; at center-end square on end.
		 * Callers do not set the flat side separately.
		 */
		shape: 'circle',
		scrollSelector: '',
		// px past which the control becomes visible (ignored when position=static).
		// Adaptive also uses this as the "near edge" threshold.
		threshold: DEFAULT_THRESHOLD,
		/*
		 * Scroll-gate the control. false = always shown at `position` (action
		 * callers: playlist prev/next). Default true keeps scroll hide/show.
		 */
		gated: true,
		topLabel: '',
		bottomLabel: '',
		startLabel: '',
		endLabel: '',
		// Live visibility driven by the scroll surface (not a caller toggle).
		visible: false,
		// Resolved live direction (adaptive writes this; fixed mirrors state.direction).
		activeDirection: 'top',
		smooth: true,
		disabled: false,
		/*
		 * Fade the arrow as you approach its target edge; hide at the exact
		 * edge. Off keeps the hard slop hide.
		 */
		edgeFade: true,
	};
	#explicitScrollTarget = null;
	scrollTargetRef = null;
	resizeObserver = null;
	padFlipFirst = null;
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
		LIVE_GOTO.add(this);
		this.padFlipTick ??= () => {
			this.playPadFlip();
		};
		this.resizeTick ??= () => {
			rafCoalesce(this, this.syncFromScroll);
		};
		this.observe('scrollSelector', this.handleScrollSelectorChange);
		this.observe([
			'threshold',
			'direction',
			'adaptive',
			'axes',
			'cluster',
			'edgeFade',
			'gated',
		], this.handleConfigChange);
		this.attachScrollTarget();
		refreshLiveCluster();
	}
	onMount() {
		this.attachScrollTarget();
		refreshLiveCluster();
	}
	onDisconnect() {
		LIVE_GOTO.delete(this);
		rafCoalesceCancel(this);
		this.detachScrollTarget();
		refreshLiveCluster();
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
			rafCoalesce(this, this.syncFromScroll);
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
		const hostWalk = findScrollableAncestor(this, {
			requireOverflow: false,
		});
		const lock = getScrollLockTarget();
		let lockWalk = null;
		if (isDocumentScroller(lock)) {
			lockWalk = null;
		} else {
			lockWalk = findScrollableAncestor(lock, {
				requireOverflow: false,
			});
		}
		const hostNode = hostWalk && hostWalk !== this ? hostWalk : null;
		const hostTravel = scrollTravel(hostNode);
		const lockTravel = scrollTravel(lockWalk);
		if (lockTravel > hostTravel && lockWalk) {
			return lockWalk;
		}
		if (hostTravel > 0 && hostNode) {
			return hostNode;
		}
		if (lockWalk) {
			return lockWalk;
		}
		if (hostNode) {
			return hostNode;
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
		this.bindTargetResize(target);
		return target;
	}
	bindTargetResize(target) {
		if (typeof ResizeObserver !== 'function') {
			return;
		}
		this.resizeObserver ??= new ResizeObserver(this.resizeTick);
		this.resizeObserver.disconnect();
		if (!target || target.nodeType !== 1) {
			return;
		}
		this.resizeObserver.observe(target);
		const kids = target.children;
		const kidCount = kids.length;
		for (let index = 0; index < kidCount; index += 1) {
			this.resizeObserver.observe(kids[index]);
		}
	}
	unbindTargetResize() {
		this.resizeObserver?.disconnect();
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
		this.unbindTargetResize();
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
			if (left < maxLeft / 2) {
				if (configured === 'left' || configured === 'start') {
					return 'end';
				}
				return 'right';
			}
			if (configured === 'right' || configured === 'end') {
				return 'start';
			}
			return 'left';
		}
		const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
		const fromTop = target.scrollTop ?? 0;
		const nearTop = fromTop <= threshold;
		const nearBottom = fromTop >= maxTop - threshold;
		if (nearTop && !nearBottom) {
			return 'bottom';
		}
		if (nearBottom && !nearTop) {
			return 'top';
		}
		return fromTop < maxTop / 2 ? 'bottom' : 'top';
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
		const fromTop = target.scrollTop ?? 0;
		const left = target.scrollLeft ?? 0;
		const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
		const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
		if (this.state.edgeFade !== false) {
			const distance = this.edgeDistance(direction, fromTop, left, maxTop, maxLeft);
			const zone = axisFor(direction) === 'inline' ? maxLeft : maxTop;
			return edgeVisibility(distance, zone) > 0;
		}
		const slopY = edgeSlop(maxTop, threshold);
		const slopX = edgeSlop(maxLeft, threshold);
		switch (direction) {
			case 'top': {
				return fromTop > slopY;
			}
			case 'bottom': {
				return fromTop < maxTop - slopY;
			}
			case 'start':
			case 'left': {
				return left > slopX;
			}
			case 'end':
			case 'right': {
				return left < maxLeft - slopX;
			}
			default: {
				return fromTop > slopY;
			}
		}
	}
	/*
	 * Remaining px from the current offset to `direction`'s target edge.
	 * Used by edge-fade opacity and the exact-edge hide.
	 */
	edgeDistance(direction, fromTop, left, maxTop, maxLeft) {
		switch (direction) {
			case 'top': {
				return fromTop;
			}
			case 'bottom': {
				return maxTop - fromTop;
			}
			case 'start':
			case 'left': {
				return left;
			}
			case 'end':
			case 'right': {
				return maxLeft - left;
			}
			default: {
				return fromTop;
			}
		}
	}
	writeEdgeFades(target) {
		if (!target || this.state.edgeFade === false || this.isUngated()) {
			this.style.setProperty('--go-to-edge-fade', '1');
			this.style.setProperty('--go-to-fade-top', '1');
			this.style.setProperty('--go-to-fade-bottom', '1');
			this.style.setProperty('--go-to-fade-start', '1');
			this.style.setProperty('--go-to-fade-end', '1');
			return;
		}
		const fromTop = target.scrollTop ?? 0;
		const left = target.scrollLeft ?? 0;
		const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
		const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
		/* PAINT uses edgeOpacity (continuous); SHOWN still uses edgeVisibility. */
		const fadeTop = edgeOpacity(this.edgeDistance('top', fromTop, left, maxTop, maxLeft), maxTop);
		const fadeBottom = edgeOpacity(this.edgeDistance('bottom', fromTop, left, maxTop, maxLeft), maxTop);
		const fadeStart = edgeOpacity(this.edgeDistance('start', fromTop, left, maxTop, maxLeft), maxLeft);
		const fadeEnd = edgeOpacity(this.edgeDistance('end', fromTop, left, maxTop, maxLeft), maxLeft);
		this.style.setProperty('--go-to-fade-top', String(fadeTop));
		this.style.setProperty('--go-to-fade-bottom', String(fadeBottom));
		this.style.setProperty('--go-to-fade-start', String(fadeStart));
		this.style.setProperty('--go-to-fade-end', String(fadeEnd));
		const active = this.state.activeDirection || normalizeDirection(this.state.direction);
		let activeFade = fadeTop;
		if (active === 'bottom') {
			activeFade = fadeBottom;
		} else if (active === 'start' || active === 'left') {
			activeFade = fadeStart;
		} else if (active === 'end' || active === 'right') {
			activeFade = fadeEnd;
		}
		this.style.setProperty('--go-to-edge-fade', String(activeFade));
	}
	hasPad() {
		return Boolean(normalizeAxes(this.state.axes));
	}
	hasBlockAxis() {
		const axes = normalizeAxes(this.state.axes);
		return axes === 'block' || axes === 'all';
	}
	hasInlineAxis() {
		const axes = normalizeAxes(this.state.axes);
		return axes === 'inline' || axes === 'all';
	}
	isStaticPosition() {
		return this.resolvedPosition() === 'static';
	}
	isUngated() {
		return isFalse(this.state.gated);
	}
	isRevealed() {
		return this.isStaticPosition() || this.isUngated() || isTrue(this.state.visible);
	}
	isAriaHidden() {
		return !this.isRevealed();
	}
	hideSingle() {
		if (this.hasPad()) {
			return true;
		}
		if (this.isStaticPosition() || this.isUngated()) {
			return false;
		}
		return !this.state.visible;
	}
	hidePad() {
		return !this.hasPad();
	}
	hideTopAxis() {
		return !this.hasBlockAxis();
	}
	hideBottomAxis() {
		return !this.hasBlockAxis();
	}
	hideStartAxis() {
		return !this.hasInlineAxis();
	}
	hideEndAxis() {
		return !this.hasInlineAxis();
	}
	hideFadedDir(shown) {
		if (this.isStaticPosition() || this.isUngated()) {
			return false;
		}
		return !shown;
	}
	hideTopDir() {
		return this.hideTopAxis() || this.hideFadedDir(this.state.showTop);
	}
	hideBottomDir() {
		return this.hideBottomAxis() || this.hideFadedDir(this.state.showBottom);
	}
	hideStartDir() {
		return this.hideStartAxis() || this.hideFadedDir(this.state.showStart);
	}
	hideEndDir() {
		return this.hideEndAxis() || this.hideFadedDir(this.state.showEnd);
	}
	padAxes() {
		return normalizeAxes(this.state.axes);
	}
	clusterAttr() {
		return this.state.clustered ? 'true' : 'false';
	}
	resolveClustered() {
		const mode = normalizeCluster(this.state.cluster);
		if (mode === 'split') {
			return false;
		}
		if (mode === 'cluster') {
			return true;
		}
		return liveFloatingCount() <= 1;
	}
	syncClustered() {
		const next = this.resolveClustered();
		if (this.state.clustered !== next) {
			this.state.clustered = next;
		}
	}
	padDirElements() {
		return [
			this.refs.dir_top,
			this.refs.dir_start,
			this.refs.dir_end,
			this.refs.dir_bottom,
		];
	}
	capturePadFlip() {
		const dirs = this.padDirElements();
		const live = [];
		const dirCount = dirs.length;
		for (let index = 0; index < dirCount; index += 1) {
			const node = dirs[index];
			if (node && !node.hidden) {
				live.push(node);
			}
		}
		this.padFlipFirst = captureRects(live);
	}
	playPadFlip() {
		const first = this.padFlipFirst;
		this.padFlipFirst = null;
		if (!first || first.size === 0) {
			return;
		}
		const remaining = [];
		for (const [
			node,
			box,
		] of first) {
			if (!node || node.hidden || !box || box.width === 0 || box.height === 0) {
				continue;
			}
			remaining.push(node);
		}
		playFlip(remaining, first);
	}
	syncPadFromScroll(target, staticPos) {
		const nextTop = this.hasBlockAxis() && (staticPos || this.isPastThreshold(target, 'top'));
		const nextBottom = this.hasBlockAxis() && (staticPos || this.isPastThreshold(target, 'bottom'));
		const nextStart = this.hasInlineAxis() && (staticPos || this.isPastThreshold(target, 'start'));
		const nextEnd = this.hasInlineAxis() && (staticPos || this.isPastThreshold(target, 'end'));
		const nextVisible = nextTop || nextBottom || nextStart || nextEnd;
		const padChanged = this.state.showTop !== nextTop ||
			this.state.showBottom !== nextBottom ||
			this.state.showStart !== nextStart ||
			this.state.showEnd !== nextEnd;
		if (padChanged && !this.isStaticPosition()) {
			this.capturePadFlip();
		}
		if (this.state.showTop !== nextTop) {
			this.state.showTop = nextTop;
		}
		if (this.state.showBottom !== nextBottom) {
			this.state.showBottom = nextBottom;
		}
		if (this.state.showStart !== nextStart) {
			this.state.showStart = nextStart;
		}
		if (this.state.showEnd !== nextEnd) {
			this.state.showEnd = nextEnd;
		}
		if (this.state.visible !== nextVisible) {
			this.state.visible = nextVisible;
		}
		if (this.padFlipFirst) {
			this.nextFrame().then(this.padFlipTick);
		}
	}
	syncFromScroll() {
		const prevVisible = this.state.visible;
		const staticPos = this.isStaticPosition();
		const forceShow = staticPos || this.isUngated();
		if (this.hasPad()) {
			const padHost = forceShow ? this.resolveScrollContainer() : this.ensureScrollListener();
			this.syncPadFromScroll(padHost, forceShow);
		} else if (forceShow) {
			if (!this.state.visible) {
				this.state.visible = true;
			}
			const fixed = normalizeDirection(this.state.direction);
			if (this.state.activeDirection !== fixed && !this.state.adaptive) {
				this.state.activeDirection = fixed;
			} else if (this.state.adaptive) {
				const liveHost = this.ensureScrollListener();
				const adaptiveDirection = this.resolveActiveDirection(liveHost);
				if (adaptiveDirection !== this.state.activeDirection) {
					this.state.activeDirection = adaptiveDirection;
				}
			}
		} else {
			const scrollHost = this.ensureScrollListener();
			const liveDirection = this.resolveActiveDirection(scrollHost);
			if (liveDirection !== this.state.activeDirection) {
				this.state.activeDirection = liveDirection;
			}
			const nextVisible = this.isPastThreshold(scrollHost, liveDirection);
			if (nextVisible !== this.state.visible) {
				this.state.visible = nextVisible;
			}
		}
		this.syncClustered();
		const fadeHost = this.scrollTargetRef?.deref() ?? this.resolveScrollContainer();
		this.writeEdgeFades(fadeHost);
		if (prevVisible !== this.state.visible) {
			refreshLiveCluster();
		}
	}
	scrollMetrics(target, direction) {
		const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
		const behavior = this.state.smooth && !reduceMotion ? 'smooth' : 'auto';
		const fromTop = target.scrollTop ?? 0;
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
					top: fromTop,
					left: 0,
					behavior,
				};
			}
			case 'end':
			case 'right': {
				return {
					top: fromTop,
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
	/*
	 * Replay the fidget spin on press. `data-spin` is cleared on animationend
	 * rather than on a timer so the CSS keeps sole ownership of the duration —
	 * and clearing it is what lets the NEXT press restart the animation, since
	 * re-adding an attribute that is still present does not re-trigger it.
	 * :active cannot do this job: it ends on mouseup, cutting the spin short.
	 */
	spinFrom(domEvent) {
		if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
			return;
		}
		const path = domEvent.composedPath?.() || [];
		const count = path.length;
		let button = null;
		for (let index = 0; index < count; index += 1) {
			if (path[index]?.classList?.contains('go-to-btn')) {
				button = path[index];
				break;
			}
		}
		if (!button) {
			return;
		}
		button.removeAttribute('data-spin');
		// Reading layout flushes the removal so re-adding restarts the animation.
		button.getBoundingClientRect();
		button.setAttribute('data-spin', '');
		/*
		 * `animationend` BUBBLES, so a composed ui-button's own inner animation
		 * would otherwise clear the attribute early and cut the spin short —
		 * hence the target + animationName guard rather than a bare `once`.
		 * The previous listener is dropped first so repeated presses cannot
		 * stack one listener per press on the same button.
		 */
		if (button.spinClear) {
			button.removeEventListener('animationend', button.spinClear);
		}
		button.spinClear = (animationEvent) => {
			if (animationEvent.target !== button || animationEvent.animationName !== 'go-to-fidget') {
				return;
			}
			button.removeEventListener('animationend', button.spinClear);
			button.removeAttribute('data-spin');
		};
		button.addEventListener('animationend', button.spinClear);
	}
	goDirection(domEvent, direction) {
		this.spinFrom(domEvent);
		domEvent.stopPropagation();
		const proceeded = this.emit('go-to:click', {
			direction,
		}, {
			cancelable: true,
		});
		if (proceeded === false) {
			return;
		}
		const target = this.ensureScrollListener() ?? this.resolveScrollContainer();
		if (target) {
			target.scrollTo(this.scrollMetrics(target, direction));
		}
		if (direction === 'top') {
			this.emit('to-top:click', {});
		}
	}
	handleClick(domEvent) {
		const direction = this.state.activeDirection || normalizeDirection(this.state.direction);
		this.goDirection(domEvent, direction);
	}
	handleGoTop(domEvent) {
		this.goDirection(domEvent, 'top');
	}
	handleGoBottom(domEvent) {
		this.goDirection(domEvent, 'bottom');
	}
	handleGoStart(domEvent) {
		this.goDirection(domEvent, 'start');
	}
	handleGoEnd(domEvent) {
		this.goDirection(domEvent, 'end');
	}
	labelTop() {
		return this.state.topLabel || DIRECTION_DEFAULTS.top.label;
	}
	labelBottom() {
		return this.state.bottomLabel || DIRECTION_DEFAULTS.bottom.label;
	}
	labelStart() {
		return this.state.startLabel || DIRECTION_DEFAULTS.start.label;
	}
	labelEnd() {
		return this.state.endLabel || DIRECTION_DEFAULTS.end.label;
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
	/*
	 * A corner-parked control has no room on the side it is hugging: an
	 * end-anchored arrow would push its tooltip off the right edge, and the
	 * placement engine would then flip it somewhere arbitrary. So the side points
	 * INWARD — end corners tip left, start corners tip right. `static` is inline,
	 * has room on every side, and keeps the automatic top request.
	 *
	 * `end`/`start` are resolved as LTR here: anchor.js places in PHYSICAL
	 * coordinates and this maps a logical corner onto one. Under dir=rtl the
	 * corners swap and these two arms want swapping with them; nothing in the app
	 * runs RTL yet, so the mirror is left unwritten rather than guessed at.
	 */
	resolvedTooltipSide() {
		if (this.state.tooltipPlacement) {
			return this.state.tooltipPlacement;
		}
		const position = this.resolvedPosition();
		if (position === 'bottom-end' || position === 'top-end' || position === 'center-end') {
			return 'left';
		}
		if (position === 'bottom-start' || position === 'top-start' || position === 'center-start') {
			return 'right';
		}
		return '';
	}
	resolvedPosition() {
		return normalizePosition(this.state.position);
	}
	resolvedShape() {
		return normalizeShape(this.state.shape);
	}
	/*
	 * Tab is a rounded-rect whose wall corners are squared via --ui-btn-radius.
	 * is-circle hardcodes border-radius: 999px and would ignore that variable,
	 * so the disc opt-in is off whenever the silhouette is a tab.
	 */
	useCircle() {
		return this.resolvedShape() !== 'tab';
	}
	render() {
		this.html`
			<div class="go-to"
				?hidden=${this.hideSingle}
				data-position=${this.resolvedPosition}
				data-shape=${this.resolvedShape}
				data-cluster=${this.clusterAttr}
				data-direction=${this.state.activeDirection || this.state.direction}
				?data-morph=${this.useMorphArrow}
				?data-adaptive=${this.state.adaptive}
				?data-visible=${this.isRevealed}
				?aria-hidden=${this.isAriaHidden}>
				<ui-button
					class="go-to-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${this.state.size}
					.state.circle=${this.useCircle}
					.state.leadicon=${this.resolvedIcon}
					.state.label=${''}
					.state.tooltip=${this.resolvedTooltip}
					.state.tooltipPlacement=${this.resolvedTooltipSide}
					.state.disabled=${this.state.disabled}
					@button:click=${this.handleClick}></ui-button>
			</div>
			<div class="go-to go-to-pad"
				?hidden=${this.hidePad}
				data-position=${this.resolvedPosition}
				data-shape=${this.resolvedShape}
				data-cluster=${this.clusterAttr}
				data-axes=${this.padAxes}
				?data-morph=${this.useMorphArrow}
				?data-visible=${this.isRevealed}
				?aria-hidden=${this.isAriaHidden}>
				<div class="go-to-dir" #dir_top data-direction="top" ?hidden=${this.hideTopDir} ?data-visible=${this.state.showTop}>
					<ui-button
						class="go-to-btn"
						.state.variant=${'solid'}
						.state.tone=${this.state.tone}
						.state.size=${this.state.size}
						.state.circle=${true}
						.state.leadicon=${this.resolvedIcon}
						.state.label=${''}
						.state.tooltip=${this.labelTop}
						.state.tooltipPlacement=${this.resolvedTooltipSide}
						.state.disabled=${this.state.disabled}
						@button:click=${this.handleGoTop}></ui-button>
				</div>
				<div class="go-to-dir" #dir_start data-direction="start" ?hidden=${this.hideStartDir} ?data-visible=${this.state.showStart}>
					<ui-button
						class="go-to-btn"
						.state.variant=${'solid'}
						.state.tone=${this.state.tone}
						.state.size=${this.state.size}
						.state.circle=${true}
						.state.leadicon=${this.resolvedIcon}
						.state.label=${''}
						.state.tooltip=${this.labelStart}
						.state.tooltipPlacement=${this.resolvedTooltipSide}
						.state.disabled=${this.state.disabled}
						@button:click=${this.handleGoStart}></ui-button>
				</div>
				<div class="go-to-dir" #dir_end data-direction="end" ?hidden=${this.hideEndDir} ?data-visible=${this.state.showEnd}>
					<ui-button
						class="go-to-btn"
						.state.variant=${'solid'}
						.state.tone=${this.state.tone}
						.state.size=${this.state.size}
						.state.circle=${true}
						.state.leadicon=${this.resolvedIcon}
						.state.label=${''}
						.state.tooltip=${this.labelEnd}
						.state.tooltipPlacement=${this.resolvedTooltipSide}
						.state.disabled=${this.state.disabled}
						@button:click=${this.handleGoEnd}></ui-button>
				</div>
				<div class="go-to-dir" #dir_bottom data-direction="bottom" ?hidden=${this.hideBottomDir} ?data-visible=${this.state.showBottom}>
					<ui-button
						class="go-to-btn"
						.state.variant=${'solid'}
						.state.tone=${this.state.tone}
						.state.size=${this.state.size}
						.state.circle=${true}
						.state.leadicon=${this.resolvedIcon}
						.state.label=${''}
						.state.tooltip=${this.labelBottom}
						.state.tooltipPlacement=${this.resolvedTooltipSide}
						.state.disabled=${this.state.disabled}
						@button:click=${this.handleGoBottom}></ui-button>
				</div>
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
export class UIToPad extends UIGoTo {
	static state = {
		axes: 'all',
		label: 'Scroll',
	};
}
customElements.define('ui-go-to', UIGoTo);
customElements.define('ui-to-top', UIToTop);
customElements.define('ui-to-bottom', UIToBottom);
customElements.define('ui-to-adaptive', UIToAdaptive);
customElements.define('ui-to-left', UIToLeft);
customElements.define('ui-to-right', UIToRight);
customElements.define('ui-to-pad', UIToPad);
