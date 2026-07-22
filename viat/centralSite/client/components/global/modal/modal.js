import '../icon/icon.js';
import '../close-button/close-button.js';
import { classList, WebComponent } from '../../core/index.js';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../scroll-lock.js';
// Base z-index for the first modal. Each subsequent modal that opens
// receives `baseZ + (stack depth)` so newer modals always paint above
// older ones — both for native top-layer browsers (where it acts as a
// belt-and-suspenders) and for any popover/tooltip layered above.
const MODAL_BASE_Z = 1000;
export class UIModal extends WebComponent {
	// Shared stack of currently-open UIModal instances. Older first, top of
	// stack last. Used to compute z-index on open and to identify the
	// currently-active modal (Esc/close routing is handled natively by
	// `<dialog>` so we don't need to intercept it here).
	static openStack = [];
	static topModal() {
		return UIModal.openStack[UIModal.openStack.length - 1] ?? null;
	}
	static url = import.meta.url;
	static styles = {
		modal: './modal.css',
	};
	static state = {
		modal: true,
		open: false,
		closeOnBackdrop: true,
		// Initial-focus contract — explicit, no DOM queries. Accepts:
		//   true      → default: let native <dialog>.showModal() pick the
		//               target (focuses the dialog itself or a matching
		//               [autofocus] in its shadow tree).
		//   false     → no autofocus; blur the dialog after open so nothing
		//               ends up with a stray focus ring.
		//   function  → called once per open(); the returned element gets
		//               focused. Use this with a parent-scoped ref:
		//                 autoFocus: () => this.refs.confirmButton
		//   element   → focused directly on every open().
		// Anything else is treated like `true`.
		autoFocus: true,
		// Built-in window controls. Each flag is checked with strict equality
		// against `true`: anything else (false, undefined, null, '', 0, any
		// truthy non-boolean) leaves the matching button hidden, so a caller
		// has to opt in explicitly to surface a control. Toggling a flag at
		// runtime cleanly hides/reveals the button via the `?hidden`
		// attribute binding without DOM rebuilds. `showMaximize` reveals a
		// single expand/restore toggle (icon morphs to match the host's
		// `data-window='maximized'` state); `showMinimize` reveals the
		// separate collapse button; `showClose` reveals the animated × via
		// <ui-close-button>.
		showClose: false,
		showMaximize: false,
		showMinimize: false,
		// 'right' = Windows-style (min, max, close left→right, anchored right).
		// 'left'  = macOS-style (close, min, max left→right, anchored left).
		controlsSide: 'right',
		// Optional window-bar title (native-OS-window style). Empty string = no
		// title shown; the bar still appears whenever any control flag is set.
		// Opt-in per modal — existing modals keep their in-body heading untouched.
		heading: '',
		// Optional continuation callback. Fires once when the modal closes
		// (any path — button, Escape, backdrop, programmatic). Receives
		// `{ returnValue, source }`. Self-clears after firing so the same
		// modal reopened with a different intent doesn't accidentally
		// re-invoke a stale handler.
		afterAction: null,
	};
	onConnect() {
		// Seed the host window-state attribute so it always reflects 'normal'
		// until a control toggles it — mirrors the dock's data-orientation seed.
		this.dataset.window = 'normal';
	}
	handleDialogClick(domEvent) {
		// Backdrop-close is part of the base modal contract — every modal
		// gets it by default. Only an explicit `closeOnBackdrop: false`
		// opts out (e.g. a modal that forces an explicit action). `true`
		// and `undefined` both stay enabled so consumers can omit the flag
		// and still inherit the behavior.
		if (this.state.closeOnBackdrop === false) {
			return;
		}
		// Strict-target detection. Native `<dialog>` shown via showModal()
		// dispatches ::backdrop pseudo-element clicks with `target` set to
		// the dialog itself, while every click on a child element (controls
		// strip, modal-body, slotted content, any button) targets that
		// child instead. So target === dialog uniquely identifies backdrop
		// clicks. A coord-based "outside the dialog rect" check looks
		// equivalent in theory but races with handlers that mutate the
		// dialog's size mid-bubble — e.g. the minimize button shrinks the
		// dialog to 240×46 before this handler runs, then the original
		// click coords (where the button used to be) fall outside the new
		// rect and we'd close the modal instead of just minimizing it.
		if (domEvent.target === this.refs.dialog) {
			this.close();
		}
	}
	open() {
		const dialog = this.refs.dialog;
		if (!dialog || dialog.open) {
			return;
		}
		// Compute a z-index one above the currently-topmost open modal.
		// On native top-layer browsers the dialog is hoisted above all
		// painted content anyway, but having an explicit z-index keeps
		// layered popovers/tooltips deterministic and stops new modals
		// from sliding behind older ones in fallback paint paths.
		const stack = UIModal.openStack;
		let topZ = MODAL_BASE_Z;
		for (let i = 0; i < stack.length; i += 1) {
			const z = parseInt(stack[i].refs.dialog?.style.zIndex || '', 10);
			if (Number.isFinite(z) && z >= topZ) {
				topZ = z;
			}
		}
		dialog.style.zIndex = String(topZ + 1);
		if (this.state.modal) {
			dialog.showModal();
		} else {
			dialog.show();
		}
		stack.push(this);
		if (this.state.modal) {
			lockBackgroundScroll();
		}
		this.applyAutoFocus(dialog);
		this.state.open = true;
		this.emit('modal:open');
	}
	applyAutoFocus(dialog) {
		const auto = this.state.autoFocus;
		if (auto === false) {
			// Caller opted out — strip the focus that showModal() handed
			// the dialog so we don't leave a stray ring around the box.
			if (globalThis.document?.activeElement === dialog) {
				dialog.blur();
			}
			return;
		}
		if (typeof auto === 'function') {
			const target = auto();
			if (target && typeof target.focus === 'function') {
				target.focus();
			}
			return;
		}
		if (auto && typeof auto.focus === 'function') {
			auto.focus();
		}
		// `auto === true` or anything else: leave native showModal()'s
		// initial focus in place — no extra work, no DOM queries.
	}
	close(returnValue) {
		const dialog = this.refs.dialog;
		if (!dialog?.open) {
			return;
		}
		dialog.close(returnValue);
	}
	handleCancel(domEvent) {
		// Preventable intent: emit() returns dispatchEvent's verdict, so a listener's
		// preventDefault() vetoes the Esc-close by cancelling the inner dialog cancel.
		const proceed = this.emit('modal:cancel', {}, {
			cancelable: true,
		});
		if (proceed === false) {
			domEvent.preventDefault();
		}
	}
	handleClose(domEvent) {
		this.state.open = false;
		// Reset window-state on close so the next open() starts at the default
		// size, not whatever the user left it at.
		this.dataset.window = 'normal';
		// Drop ourselves from the shared open-stack so the next opener picks
		// the correct top z-index.
		const stack = UIModal.openStack;
		const idx = stack.indexOf(this);
		if (idx >= 0) {
			stack.splice(idx, 1);
		}
		if (this.state.modal) {
			unlockBackgroundScroll();
		}
		const returnValue = domEvent.target?.returnValue ?? '';
		this.emit('modal:close', {
			returnValue,
		});
		// Fire the continuation callback last so listeners on `modal:close`
		// see the state change before the next-step logic runs.
		const callback = this.state.afterAction;
		if (typeof callback === 'function') {
			this.state.afterAction = null;
			callback({
				returnValue,
				source: this,
			});
		}
	}
	handleCloseClick() {
		this.close();
	}
	/* Window-state is a single enumerated dimension — 'normal' | 'maximized' |
	   'minimized' — reflected onto the HOST as `data-window`, the single source of
	   truth. The size styling lives on the inner `<dialog>` (a different shadow
	   tree) but is driven from the host: ui-modal's own CSS reads
	   `:host([data-window='maximized']) .modal…`, and slotted consumers
	   (settings-modal) read `.sm-modal[data-window='maximized']` across the shadow
	   boundary. The enum makes "maximized AND minimized" structurally impossible —
	   no class-Set token discipline needed — mirroring the dock's data-orientation. */
	handleToggleMaximize() {
		const next = this.dataset.window === 'maximized' ? 'normal' : 'maximized';
		this.dataset.window = next;
		this.emit('modal:maximize', {
			maximized: next === 'maximized',
		});
	}
	handleToggleMinimize() {
		const next = this.dataset.window === 'minimized' ? 'normal' : 'minimized';
		this.dataset.window = next;
		this.emit('modal:minimize', {
			minimized: next === 'minimized',
		});
	}
	controlsSideClass() {
		return this.state.controlsSide === 'left' ? 'controls-left' : 'controls-right';
	}
	// Window bar (reserved space + frosted background + body top-padding) only
	// exists when there's something to put in it — a control or a title. A
	// control-less, title-less modal stays a plain content box with no phantom bar.
	barClass() {
		const modalState = this.state;
		const hasTitle = typeof modalState.heading === 'string' && modalState.heading.length > 0;
		return (modalState.showClose === true || modalState.showMaximize === true || modalState.showMinimize === true || hasTitle) ? 'has-bar' : '';
	}
	render() {
		// The control buttons are emitted inline in the main template so the
		// framework wires their `@click`, `.state=` and `?hidden` bindings the
		// same way it wires everything else — no imperative DOM ops, no
		// cached sub-fragments, no spot type-switching. Each button's
		// `?hidden` attribute is driven by the matching `showX` state flag,
		// so flipping a flag at runtime cleanly toggles whether the button
		// is part of the active layout. The flags default to false so a
		// caller that doesn't opt in gets no controls at all.
		this.html`
			<dialog #dialog class=${classList('modal', this.controlsSideClass, this.barClass)} tabindex="-1" @click=${this.handleDialogClick} @cancel=${this.handleCancel} @close=${this.handleClose}>
				<div class="modal-controls">
					<div class="modal-title">${this.state.heading}</div>
					<button type="button" class="mc-btn mc-min" aria-label="Minimize" ?hidden=${this.state.showMinimize !== true} @click=${this.handleToggleMinimize}>
						<ui-icon class="mc-icon" .state.name=${'minus'} .state.size=${'sm'}></ui-icon>
					</button>
					<button type="button" class="mc-btn mc-max" aria-label="Toggle size" ?hidden=${this.state.showMaximize !== true} @click=${this.handleToggleMaximize}>
						<ui-icon class="mc-icon mc-icon-grow" .state.name=${'maximize-2'} .state.size=${'sm'}></ui-icon>
						<ui-icon class="mc-icon mc-icon-shrink" .state.name=${'minimize-2'} .state.size=${'sm'}></ui-icon>
					</button>
					<ui-close-button class="mc-close" ?hidden=${this.state.showClose !== true} @close-button:click=${this.handleCloseClick}></ui-close-button>
				</div>
				<div class="modal-body"><slot></slot></div>
			</dialog>
		`;
	}
}
customElements.define('ui-modal', UIModal);
