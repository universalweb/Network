/*
	DESCRIPTION: ui-speed-dial — a FAB that fans out a cluster of actions. Actions
	stack in CSS off `data-direction`; `computeAnchor` is a
	placement ORACLE only (resolved side written back to `data-direction`, top/left
	ignored) so a dial near a viewport edge flips the fan instead of overflowing.
	`direction` is the caller's request and is never overwritten. Trigger by click
	(toggle) or hover. Actions are REAL child elements (`ui-speed-dial-action` via
	`list()`), NOT an `^html` string, so their `.leadicon=` glyphs render (a string
	`<ui-icon name=…>` would be blank). Reveal animates transform/opacity only
	(GPU-composited per the charts doctrine).
	── EVENTS ───────────────────────────────────────────────────────────
	  speed-dial:action { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-speed-dial .state.icon=${'plus'} .state.items=${[
	    { icon: 'file', label: 'New file', value: 'file' },
	    { icon: 'folder', label: 'New folder', value: 'folder' },
	  ]} @speed-dial:action=${e => create(e.detail.data.value)}></ui-speed-dial>
	  <ui-speed-dial .state.icon=${'share'} .state.trigger=${'hover'} .state.direction=${'left'} .state.position=${'bottom-start'}></ui-speed-dial>
	──────────────────────────────────────────────────────────────────────
*/
import '../button/button.js';
import { isTopEscapable, syncEscapable } from '../../core/escape/escapeStack.js';
import { computeAnchor, WebComponent } from '../../core/index.js';
import { UISpeedDialAction } from '../speed-dial-action/speed-dial-action.js';
const SIDE_BY_DIRECTION = {
	up: 'top',
	down: 'bottom',
	left: 'left',
	right: 'right',
};
const DIRECTION_BY_SIDE = {
	top: 'up',
	bottom: 'down',
	left: 'left',
	right: 'right',
};
/* Tracks `.speed-dial-actions` margin (0.7rem @ 16px root) — the gap the oracle uses. */
const DIAL_ACTIONS_GAP = 11;
const DIAL_VIEWPORT_PAD = 8;
export function resolveDialDirection(direction, triggerRect, actionsSize, viewSize) {
	const side = SIDE_BY_DIRECTION[direction] ?? 'top';
	const placed = computeAnchor(triggerRect, actionsSize, {
		placement: `${side}-center`,
		offset: DIAL_ACTIONS_GAP,
		padding: DIAL_VIEWPORT_PAD,
		viewportWidth: viewSize?.width,
		viewportHeight: viewSize?.height,
	});
	const resolvedSide = placed.placement.split('-')[0];
	return DIRECTION_BY_SIDE[resolvedSide] ?? direction;
}
export class UISpeedDial extends WebComponent {
	static url = import.meta.url;
	static styles = {
		speedDial: './speed-dial.css',
	};
	static state = {
		icon: 'plus',
		tone: 'primary',
		items: [],
		// up · down · left · right — the caller's requested fan-out
		direction: 'up',
		// Display fan-out after viewport flip; CSS reads this, never `direction`.
		resolvedDirection: 'up',
		// click (toggle) · hover (open on enter, close on leave)
		trigger: 'click',
		position: 'bottom-end',
		// Spin the trigger 45° when open (turns a + into an ×).
		rotateTrigger: true,
		open: false,
		/*
		 * Fan geometry: linear (default) · radial · semi · quarter.
		 * `direction` still steers linear and the open arc of semi/quarter.
		 */
		layout: 'linear',
		radius: '5.5rem',
		mask: false,
		hideOnClick: true,
	};
	// Hover-close is DEFERRED: the actions cluster is absolutely positioned just
	// outside the trigger's box with a gap, so moving the pointer onto a sub-item
	// momentarily leaves `.speed-dial` (pointerleave). A short close timer bridges
	// that gap — reaching an action re-fires pointerenter (it's a descendant) and
	// cancels the timer, so the dial stays open. Without this you can't reach the
	// items. (`this.setTimeout` is auto-cleaned on disconnect.)
	closeTimer = null;
	fanToken = 0;
	onConnect() {
		this.observe([
			'open', 'direction', 'layout', 'radius', 'items',
		], this.onFanStateChange, {
			immediate: true,
		});
		this.delegate('viewport:resize', this.handleViewportChange);
		/*
		 * Global, not a keydown on this subtree. A hover-opened dial has the
		 * POINTER over it while focus is wherever it was, so a subtree listener
		 * would never fire — and hover-opening is exactly the case WCAG 1.4.13
		 * wants dismissable without moving pointer or focus. The hotkey registry
		 * sweeps its own entry on disconnect.
		 */
		this.hotKey('escape', this.handleEscape, {
			preventDefault: false,
		});
	}
	onDisconnect() {
		syncEscapable(this, false);
	}
	/*
	 * Guarded to the top layer: a hover-opened dial can appear over an already
	 * open layer just by dragging the mouse across its trigger, and an unguarded
	 * global Escape would take both on one press.
	 */
	handleEscape(keyEvent) {
		if (this.state.open !== true || !isTopEscapable(this)) {
			return;
		}
		keyEvent.preventDefault();
		this.cancelClose();
		this.closeDial();
	}
	onFanStateChange(next, previous, changedPath) {
		this.syncLayoutVars();
		if (changedPath === 'open') {
			syncEscapable(this, this.state.open === true);
			if (next) {
				this.resolveFan();
			}
			return;
		}
		if (this.state.open) {
			this.resolveFan();
			return;
		}
		/* Closed-branch sync is only for a caller rewriting `direction` while
		   the cluster is not painting. A close (`open` true→false) must keep
		   the last resolved side — the 0.16s opacity close is still on screen,
		   and snapping `data-direction` to the request jumps the cluster. */
		this.resetResolvedDirection();
	}
	handleViewportChange() {
		if (this.state.open) {
			this.resolveFan();
		}
	}
	resetResolvedDirection() {
		if (this.state.resolvedDirection !== this.state.direction) {
			this.state.resolvedDirection = this.state.direction;
		}
	}
	async resolveFan() {
		const token = ++this.fanToken;
		const request = this.state.direction;
		if (this.state.resolvedDirection !== request) {
			this.state.resolvedDirection = request;
		}
		await this.nextFrame();
		if (token !== this.fanToken || !this.state.open) {
			return;
		}
		this.applyResolvedFan();
	}
	applyResolvedFan() {
		const trigger = this.refs.trigger;
		const actions = this.refs.actions;
		if (!trigger || !actions) {
			return;
		}
		const resolved = resolveDialDirection(this.state.direction, trigger.getBoundingClientRect(), {
			width: actions.offsetWidth,
			height: actions.offsetHeight,
		});
		if (this.state.resolvedDirection !== resolved) {
			this.state.resolvedDirection = resolved;
		}
	}
	openDial() {
		if (!this.state.open) {
			this.state.open = true;
		}
	}
	closeDial() {
		if (this.state.open) {
			this.state.open = false;
		}
	}
	cancelClose() {
		this.closeTimer?.clear();
	}
	handleTriggerClick() {
		this.state.open = !this.state.open;
	}
	handlePointerEnter() {
		if (this.state.trigger === 'hover') {
			this.cancelClose();
			this.openDial();
		}
	}
	handlePointerLeave() {
		if (this.state.trigger === 'hover') {
			(this.closeTimer ??= this.createTimeout(this.onCloseTimer, 150)).run();
		}
	}
	/*
	 * Reusable close timer's callback — close the dial after the hover-out grace
	 * period. run() supersedes any pending close, so a re-enter (cancelClose) then
	 * re-leave just re-arms the same handle.
	 */
	onCloseTimer(component) {
		component.closeDial();
	}
	handleAction(domEvent) {
		this.emit('speed-dial:action', {
			value: domEvent.detail?.data?.value,
		});
		if (this.state.hideOnClick !== false) {
			this.closeDial();
		}
	}
	showMask() {
		return this.state.mask === true && this.state.open === true;
	}
	hideMask() {
		return this.state.mask !== true || this.state.open !== true;
	}
	onMount() {
		this.syncLayoutVars();
	}
	syncLayoutVars() {
		const actions = this.refs.actions;
		if (!actions) {
			return;
		}
		const items = this.state.items;
		const count = items && items.length ? items.length : 1;
		const layout = this.state.layout || 'linear';
		const radius = this.state.radius || '5.5rem';
		actions.style.setProperty('--speed-dial-count', String(count));
		actions.style.setProperty('--speed-dial-radius', typeof radius === 'number' ? `${radius}px` : radius);
		let start = -90;
		let sweep = 360;
		if (layout === 'semi') {
			sweep = 180;
			start = this.semiStart();
		} else if (layout === 'quarter') {
			sweep = 90;
			start = this.quarterStart();
		}
		const divisor = layout === 'radial' ? count : Math.max(count - 1, 1);
		const step = sweep / divisor;
		actions.style.setProperty('--speed-dial-start', `${start}deg`);
		actions.style.setProperty('--speed-dial-step', `${step}deg`);
	}
	semiStart() {
		const direction = this.state.resolvedDirection || this.state.direction;
		if (direction === 'down') {
			return 0;
		}
		if (direction === 'left') {
			return 90;
		}
		if (direction === 'right') {
			return -90;
		}
		return 180;
	}
	quarterStart() {
		const direction = this.state.resolvedDirection || this.state.direction;
		if (direction === 'down') {
			return 0;
		}
		if (direction === 'left') {
			return 90;
		}
		if (direction === 'right') {
			return -90;
		}
		return -180;
	}
	actionKey(item) {
		return item.value;
	}
	render() {
		this.html`
			<div class="speed-dial" #dial
				data-position=${this.state.position}
				data-direction=${this.state.resolvedDirection}
				data-layout=${this.state.layout || 'linear'}
				?data-open=${this.state.open}
				?data-rotate=${this.state.rotateTrigger}
				?data-mask=${this.showMask}
				@pointerenter=${this.handlePointerEnter}
				@pointerleave=${this.handlePointerLeave}
				@speed-dial-action:click=${this.handleAction}>
				<div class="speed-dial-mask" ?hidden=${this.hideMask} @click=${this.closeDial}></div>
				<ul class="speed-dial-actions" #actions>
					${this.list('items', UISpeedDialAction, this.actionKey)}
				</ul>
				<ui-button class="speed-dial-trigger" #trigger
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${'lg'}
					.state.circle=${true}
					.state.leadicon=${this.state.icon}
					@button:click=${this.handleTriggerClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-speed-dial', UISpeedDial);
