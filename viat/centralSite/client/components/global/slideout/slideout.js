import '../panel-header/panel-header.js';
import { SNAP_CURVE, SNAP_MS, WebComponent } from 'webcomponent';
/* Resting closed transforms, mirrored from slideout.css — settle animates to
   exactly these so clearing the inline transform afterwards is a no-op. */
const CLOSED_X_END = 'translateX(calc(100% + var(--space-6)))';
const CLOSED_X_START = 'translateX(calc(-100% - var(--space-6)))';
const SIDES = new Set(['start', 'end']);
/*
 * `<ui-slideout>` — edge slide-out panel (backdrop + surface + header + body).
 *
 * Blank-slate primitive. Compose header controls via named slots; body is the
 * default slot. Drag-to-dismiss is on by default for the whole surface.
 *
 * Config:
 * - `open` — pane visible
 * - `side` — `end` (default, inline-end) | `start`
 * - `heading` — uppercase-centered title (via `<ui-panel-header>`)
 * - `showClose` — trailing close control
 * - `closeLabel` — a11y label for close
 * - `dragClose` — dragSnap dismiss (default true)
 * - `backdrop` — dimmed click-to-close layer (default true)
 *
 * Events: `slideout:open` · `slideout:close` · re-emits `panel-header:close`.
 *
 *   <ui-slideout .state.open=${open} .state.heading=${'Notifications'} .state.showClose=${true}>
 *     <button slot="header-end" type="button">Clear All</button>
 *     …body…
 *   </ui-slideout>
 */
export class UISlideout extends WebComponent {
	static url = import.meta.url;
	static styles = {
		slideout: './slideout.css',
	};
	static state = {
		open: false,
		side: 'end',
		heading: '',
		showClose: true,
		closeLabel: 'Close',
		dragClose: true,
		backdrop: true,
	};
	panelWidth = 0;
	dragController = null;
	onConnect() {
		this.observe('open', this.syncOpenAttr);
		this.observe('side', this.syncSideAttr);
		this.syncOpenAttr(this.state.open);
		this.syncSideAttr(this.state.side);
	}
	/* Refs are live after first render — install drag here, not onConnect. */
	onMount() {
		this.installDragClose();
	}
	syncOpenAttr(isOpen) {
		this.toggleAttribute('data-open', Boolean(isOpen));
	}
	syncSideAttr(side) {
		const next = SIDES.has(side) ? side : 'end';
		this.dataset.side = next;
		if (next !== this.state.side) {
			this.state.side = next;
		}
	}
	open() {
		if (this.state.open) {
			return;
		}
		this.state.open = true;
		this.emit('slideout:open', {
			open: true,
		});
	}
	close() {
		if (!this.state.open) {
			return;
		}
		this.state.open = false;
		this.emit('slideout:close', {
			open: false,
		});
	}
	toggle() {
		if (this.state.open) {
			this.close();
			return;
		}
		this.open();
	}
	handleBackdropClick() {
		this.close();
	}
	handleHeaderClose() {
		this.close();
	}
	/* Closing-only drag: panel is inert while closed, so there is no surface
	   left to start an opening drag — the host owns open(). Whole surface is
	   grabbable; pan-y + x-axis clamp keep scroll/taps working. */
	installDragClose() {
		if (!this.state.dragClose) {
			return;
		}
		const panel = this.refs.panel;
		if (!panel) {
			return;
		}
		if (this.dragController) {
			this.dragController.destroy();
			this.gestureUnsubs?.delete(this.dragController);
		}
		const opensToward = this.state.side === 'start' ? 'right' : 'left';
		this.dragController = this.dragSnap(panel, {
			axis: 'x',
			opensToward,
			enabled: () => {
				return this.state.open === true && this.state.dragClose === true;
			},
			isOpen: () => {
				return this.state.open === true;
			},
			extent: () => {
				return this.panelWidth;
			},
			onStart: () => {
				this.beginPanelDrag();
			},
			onMove: (progress, delta) => {
				this.trackPanelDrag(delta);
			},
			onSettle: (shouldOpen) => {
				this.settlePanelDrag(shouldOpen);
			},
		});
	}
	measurePanel() {
		const panel = this.refs.panel;
		if (!panel) {
			return 0;
		}
		return panel.getBoundingClientRect().width || panel.offsetWidth || 0;
	}
	beginPanelDrag() {
		this.panelWidth = this.measurePanel();
		this.refs.panel?.classList.add('is-dragging');
	}
	trackPanelDrag(delta) {
		const panel = this.refs.panel;
		if (!panel) {
			return;
		}
		/* For side=start, engine opensToward=right so closing delta is negative
		   (leftward); for side=end, opensToward=left → closing delta positive. */
		panel.style.transform = `translateX(${delta}px)`;
	}
	closedTransform() {
		return this.state.side === 'start' ? CLOSED_X_START : CLOSED_X_END;
	}
	settlePanelDrag(shouldOpen) {
		const panel = this.refs.panel;
		if (!panel) {
			return;
		}
		panel.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		panel.style.transform = shouldOpen ? 'translateX(0)' : this.closedTransform();
		if (shouldOpen) {
			this.open();
		} else {
			this.close();
		}
		this.setTimeout(() => {
			panel.style.transform = '';
			panel.style.transition = '';
			panel.classList.remove('is-dragging');
		}, SNAP_MS);
	}
	render() {
		/* No internal <portal> — slots must stay in THIS shadow root. Callers that
		   need top-layer escape wrap the host: <portal to="body"><ui-slideout>… */
		this.html`
			<div
				class="slideout"
				data-side=${this.state.side}
				?data-open=${this.state.open}>
				<div
					class="sl-backdrop"
					?hidden=${!this.state.backdrop}
					@click=${this.handleBackdropClick}></div>
				<aside
					class="sl-panel"
					role="dialog"
					aria-label=${this.state.heading}
					#panel
					?inert=${!this.state.open}>
					<ui-panel-header
						.state.heading=${this.state.heading}
						.state.showClose=${this.state.showClose}
						.state.closeLabel=${this.state.closeLabel}
						@panel-header:close=${this.handleHeaderClose}>
						<slot name="header-start" slot="start"></slot>
						<slot name="header-end" slot="end"></slot>
					</ui-panel-header>
					<div class="sl-body">
						<slot></slot>
					</div>
				</aside>
			</div>
		`;
	}
}
customElements.define('ui-slideout', UISlideout);
