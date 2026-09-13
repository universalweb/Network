import './tooltip-service.js';
import { WebComponent } from '../base.js';
import { computeAnchor } from '../dom/anchor.js';
import { classList } from '../template.js';
const EDGE_MARGIN = 12;
const GAP = 10;
const SLIDE_MS = 240;
const SIDES = new Set([
	'top',
	'bottom',
	'left',
	'right',
]);
/*
 * Default request is always top-center (tooltip centers on its target). The
 * engine flips, then searches the orthogonal axis when both vertical sides
 * overflow (`fallbackAxis`). CSS keys data-placement off the resolved SIDE only.
 *
 * An explicit `side` is a request to STAY on that side. Flip stays on — a
 * tooltip pinned off-screen is worse than a flipped one, and the flip only
 * fires when the request genuinely does not fit. The orthogonal search is what
 * gets dropped: it is the step that quietly turns a `left` request into `top`,
 * which is the drift an enforced side exists to remove.
 */
export function placeTooltip(targetRect, floating, viewSize, side) {
	const forced = SIDES.has(side);
	const placed = computeAnchor(targetRect, floating, {
		placement: `${forced ? side : 'top'}-center`,
		offset: GAP,
		padding: EDGE_MARGIN,
		fallbackAxis: !forced,
		viewportWidth: viewSize?.width,
		viewportHeight: viewSize?.height,
	});
	return {
		placement: placed.placement.split('-')[0],
		x: placed.left,
		y: placed.top,
	};
}
export class UITooltip extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tooltip: './tooltip.css',
	};
	static state = {
		placement: 'top',
		sliding: false,
		text: '',
		x: 0,
		y: 0,
	};
	shellW = 0;
	shellH = 0;
	isOpen = false;
	slideToken = 0;
	handleBeforeToggle(toggleEvent) {
		this.isOpen = toggleEvent.newState === 'open';
	}
	handleToggle(toggleEvent) {
		this.emit(toggleEvent.newState === 'open' ? 'tooltip:show' : 'tooltip:hide', {
			text: this.state.text,
		});
	}
	onDisconnect() {
		this.isOpen = false;
	}
	measure() {
		const rect = this.refs.shell.getBoundingClientRect();
		this.shellW = rect.width;
		this.shellH = rect.height;
	}
	show({
		text,
		side,
		targetRect,
	} = {}) {
		const shell = this.refs.shell;
		if (!text || !targetRect || !shell) {
			return;
		}
		const wasOpen = this.isOpen;
		const textChanged = wasOpen && this.state.text !== text;
		if (this.state.sliding !== textChanged) {
			this.state.sliding = textChanged;
		}
		if (this.state.text !== text) {
			this.state.text = text;
		}
		if (!wasOpen) {
			shell.showPopover();
		}
		/*
		 * Write the text imperatively rather than relying on the `state.text`
		 * spot, which paints on an async patch pass. `measure()` must read the
		 * shell with the real text on the very FIRST show — otherwise it measures
		 * an empty shell and mis-centres (the first-hover-off / second-hover-right
		 * bug). `state.text` is still set above for change detection + the emit.
		 */
		this.refs.tip_text.textContent = text;
		this.measure();
		const {
			placement, x, y,
		} = placeTooltip(targetRect, {
			width: this.shellW,
			height: this.shellH,
		}, undefined, side);
		if (this.state.placement !== placement) {
			this.state.placement = placement;
		}
		if (this.state.x !== x) {
			this.state.x = x;
		}
		if (this.state.y !== y) {
			this.state.y = y;
		}
		if (textChanged) {
			const token = ++this.slideToken;
			this.setTimeout(() => {
				this.onSlideEnd(token);
			}, SLIDE_MS);
		}
	}
	/*
	 * Slide settle — token-guarded so a newer show() supersedes a stale timer.
	 * Named method with a thin timer forward (deferred host callbacks lose
	 * `this`; the logic lives here, not in the arrow).
	 */
	onSlideEnd(token) {
		if (this.slideToken === token && this.state.sliding !== false) {
			this.state.sliding = false;
		}
	}
	hide() {
		const shell = this.refs.shell;
		if (!this.isOpen || !shell) {
			return;
		}
		this.slideToken++;
		if (this.state.sliding !== false) {
			this.state.sliding = false;
		}
		shell.hidePopover();
	}
	render() {
		this.html`
			<div #shell
				class=${classList('tooltip-shell', () => {
					return this.state.sliding && 'is-sliding';
				})}
				popover="manual"
				data-placement=${this.state.placement}
				style=${() => {
					return `left:${this.state.x}px;top:${this.state.y}px;`;
				}}
				@beforetoggle=${this.handleBeforeToggle}
				@toggle=${this.handleToggle}>
				<span class="tooltip-text" #tip_text></span>
			</div>
		`;
	}
}
customElements.define('ui-tooltip', UITooltip);
