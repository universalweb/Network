import '../icon/icon.js';
import '../close-button/close-button.js';
import { WebComponent, classList } from '../../core/index.js';
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
		// single expand/restore toggle (icon morphs to match the
		// `is-maximized` class on the dialog); `showMinimize` reveals the
		// separate collapse button; `showClose` reveals the animated × via
		// <ui-close-button>.
		showClose: false,
		showMaximize: false,
		showMinimize: false,
		// 'right' = Windows-style (min, max, close left→right, anchored right).
		// 'left'  = macOS-style (close, min, max left→right, anchored left).
		controlsSide: 'right',
		// Reactive class set for the dialog. Handlers mutate it directly
		// (`.add('is-maximized')` / `.delete(...)`) and the framework's
		// class-list spot diffs tokens onto the element — no derived
		// `dialogClass()` function needed, no whole-attribute rewrites, no
		// duplicated boolean flags. The set is the source of truth for
		// transient window state; events still emit booleans derived from
		// `.has(...)` so external listeners stay simple.
		classes: new Set(['modal']),
		// Optional continuation callback. Fires once when the modal closes
		// (any path — button, Escape, backdrop, programmatic). Receives
		// `{ returnValue, source }`. Self-clears after firing so the same
		// modal reopened with a different intent doesn't accidentally
		// re-invoke a stale handler.
		afterAction: null,
	};
	maximizeIconState = {
		name: 'maximize-2',
		size: 'sm',
	};
	restoreIconState = {
		name: 'minimize-2',
		size: 'sm',
	};
	minimizeIconState = {
		name: 'minus',
		size: 'sm',
	};
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
		this.applyAutoFocus(dialog);
		this.state.open = true;
		this.emit('modal-open');
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
		const cancelEvent = new CustomEvent('modal-cancel', {
			bubbles: true,
			cancelable: true,
			composed: true,
			detail: {
				source: this,
			},
		});
		if (this.dispatchEvent(cancelEvent) === false) {
			domEvent.preventDefault();
		}
	}
	handleClose(domEvent) {
		this.state.open = false;
		// Reset transient window-state on close so the next open() starts at
		// the default size, not whatever the user left it at.
		this.state.classes.delete('is-maximized');
		this.state.classes.delete('is-minimized');
		// Drop ourselves from the shared open-stack so the next opener picks
		// the correct top z-index.
		const stack = UIModal.openStack;
		const idx = stack.indexOf(this);
		if (idx >= 0) {
			stack.splice(idx, 1);
		}
		const returnValue = domEvent.target?.returnValue ?? '';
		this.emit('modal-close', {
			returnValue,
		});
		// Fire the continuation callback last so listeners on `modal-close`
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
	handleCloseClick = () => {
		this.close();
	};
	handleToggleMaximize = () => {
		const classes = this.state.classes;
		const next = !classes.has('is-maximized');
		if (next) {
			classes.add('is-maximized');
			classes.delete('is-minimized');
		} else {
			classes.delete('is-maximized');
		}
		this.emit('modal-maximize', {
			maximized: next,
		});
	};
	handleToggleMinimize = () => {
		const classes = this.state.classes;
		const next = !classes.has('is-minimized');
		if (next) {
			classes.add('is-minimized');
			classes.delete('is-maximized');
		} else {
			classes.delete('is-minimized');
		}
		this.emit('modal-minimize', {
			minimized: next,
		});
	};
	controlsSideClass() {
		return this.state.controlsSide === 'left' ? 'controls-left' : 'controls-right';
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
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<dialog #dialog class=${classList(this.state.classes, this.controlsSideClass)} tabindex="-1" @click=${this.handleDialogClick} @cancel=${this.handleCancel} @close=${this.handleClose}>
				<div class="modal-controls">
					<button type="button" class="mc-btn mc-min" aria-label="Minimize" ?hidden=${() => {
						return this.state.showMinimize !== true;
					}} @click=${this.handleToggleMinimize}>
						<ui-icon class="mc-icon" .state=${this.minimizeIconState}></ui-icon>
					</button>
					<button type="button" class="mc-btn mc-max" aria-label="Toggle size" ?hidden=${() => {
						return this.state.showMaximize !== true;
					}} @click=${this.handleToggleMaximize}>
						<ui-icon class="mc-icon mc-icon-grow" .state=${this.maximizeIconState}></ui-icon>
						<ui-icon class="mc-icon mc-icon-shrink" .state=${this.restoreIconState}></ui-icon>
					</button>
					<ui-close-button class="mc-close" ?hidden=${() => {
						return this.state.showClose !== true;
					}} @close-click=${this.handleCloseClick}></ui-close-button>
				</div>
				<div class="modal-body"><slot></slot></div>
			</dialog>
		`;
	}
}
customElements.define('ui-modal', UIModal);
