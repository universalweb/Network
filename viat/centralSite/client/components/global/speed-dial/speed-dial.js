/*
	DESCRIPTION: ui-speed-dial — a FAB that fans out a cluster of actions (MUI
	"SpeedDial"). Self-anchored: actions stack in `direction` off the trigger, so no
	placement engine is needed. Trigger by click (toggle) or hover. Actions are REAL
	child elements (`ui-speed-dial-action` via `list()`), NOT an `^html` string, so
	their `.leadicon=` glyphs render (a string `<ui-icon name=…>` would be blank).
	Reveal animates transform/opacity only (GPU-composited per the charts doctrine).
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
import { WebComponent } from '../../core/index.js';
class UISpeedDialAction extends WebComponent {
	static url = import.meta.url;
	static styles = {
		speedDialAction: './speed-dial-action.css',
	};
	static state = {
		icon: '',
		label: '',
		value: '',
		tone: 'neutral',
	};
	handleClick() {
		this.emit('speed-dial-action:click', {
			value: this.state.value,
		});
	}
	render() {
		this.html`
			<div class="sd-action">
				<span class="sd-action-label" ?hidden=${!this.state.label}>${this.state.label}</span>
				<ui-button class="sd-action-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${'sm'}
					.state.leadicon=${this.state.icon}
					.state.tooltip=${this.state.label}
					@button:click=${this.handleClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-speed-dial-action', UISpeedDialAction);
export class UISpeedDial extends WebComponent {
	static url = import.meta.url;
	static styles = {
		speedDial: './speed-dial.css',
	};
	static state = {
		icon: 'plus',
		tone: 'primary',
		items: [],
		// up · down · left · right — which way the cluster fans out
		direction: 'up',
		// click (toggle) · hover (open on enter, close on leave)
		trigger: 'click',
		position: 'bottom-end',
		// Spin the trigger 45° when open (turns a + into an ×).
		rotateTrigger: true,
		open: false,
	};
	// Hover-close is DEFERRED: the actions cluster is absolutely positioned just
	// outside the trigger's box with a gap, so moving the pointer onto a sub-item
	// momentarily leaves `.speed-dial` (pointerleave). A short close timer bridges
	// that gap — reaching an action re-fires pointerenter (it's a descendant) and
	// cancels the timer, so the dial stays open. Without this you can't reach the
	// items. (`this.setTimeout` is auto-cleaned on disconnect.)
	closeTimer = null;
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
		this.closeDial();
	}
	actionKey(item) {
		return item.value;
	}
	render() {
		this.html`
			<div class="speed-dial"
				data-position=${this.state.position}
				data-direction=${this.state.direction}
				?data-open=${this.state.open}
				?data-rotate=${this.state.rotateTrigger}
				@pointerenter=${this.handlePointerEnter}
				@pointerleave=${this.handlePointerLeave}
				@speed-dial-action:click=${this.handleAction}>
				<ul class="sd-actions">
					${this.list('items', UISpeedDialAction, this.actionKey)}
				</ul>
				<ui-button class="sd-trigger"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${'lg'}
					.state.leadicon=${this.state.icon}
					@button:click=${this.handleTriggerClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-speed-dial', UISpeedDial);
