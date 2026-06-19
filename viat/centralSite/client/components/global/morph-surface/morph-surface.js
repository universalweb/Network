import { WebComponent, flipMorph } from 'webcomponent';
// `MorphSurface` — shared base for the cult-ui-style "expand outward" surfaces
// (floating-panel, popover, expandable-card, morph-drawer). It owns the open/close
// lifecycle, the FLIP morph (via the shared `flipMorph` helper), trigger-relative
// anchoring, and Esc / outside-click dismissal. Subclasses provide only `render()`
// and, where the geometry differs, an override of `positionSurface()` / `fromRect()`
// / the duration + easing hooks. NOT a custom element — never `customElements.define`
// this; each concrete surface registers its own tag.
//
// CONTRACT — the subclass template MUST expose these refs:
//   #trigger  the box the surface grows OUT of (default `fromRect()` source)
//   #overlay  a `position: fixed` viewport layer (NOT portaled — a `<portal>` would
//             orphan the surface's <slot>; fixed already escapes ancestor overflow)
//   #surface  the morphing surface element (the flipMorph target)
// and read the shared anchor vars in its CSS:
//   inset-block-start: calc(var(--ms-anchor-top, 0px) + <gap>);
//   inset-inline-start: var(--ms-anchor-left, 0px);
//
// All four feel-knobs live HERE so a single edit tunes every surface globally.
const DEFAULT_OPEN_MS = 380;
const DEFAULT_CLOSE_MS = 260;
// CSS approximation of cult-ui's Framer spring (gentle overshoot, bounce ~0.1).
const DEFAULT_SPRING = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
export class MorphSurface extends WebComponent {
	static state = {
		open: false,
	};
	// The live morph handle — cancelled before a fresh open/close so the surface
	// measures at its natural box.
	morphAnim = null;
	// Per-open AbortController scoping the global Esc listener.
	dismissAbort = null;
	// ── Feel knobs (override per subclass for a different cadence) ──────────────
	openDuration() {
		return DEFAULT_OPEN_MS;
	}
	closeDuration() {
		return DEFAULT_CLOSE_MS;
	}
	springEasing() {
		return DEFAULT_SPRING;
	}
	// The box the surface grows from / shrinks into. Default = the trigger; an
	// expand-in-place surface overrides this to return its own collapsed rect.
	fromRect() {
		return this.refs.trigger.getBoundingClientRect();
	}
	onConnect() {
		// Re-anchor if the viewport reflows while open. A subclass that needs its own
		// onConnect must call super.onConnect().
		this.delegate('viewport:change', this.handleViewportChange);
		this.delegate('viewport:resize', this.handleViewportChange);
	}
	onDisconnect() {
		this.unbindDismiss();
		this.morphAnim?.cancel();
		this.morphAnim = null;
	}
	// Default anchoring: surface top-left just under the trigger, in CONTAINING-BLOCK-
	// relative coords (subtract the overlay's own origin) so a transformed/contained
	// ancestor can't knock it off viewport-0. The CSS adds the gap token, keeping raw
	// coords pure. Subclasses with edge/own-rect geometry override this.
	positionSurface() {
		const overlay = this.refs.overlay;
		const surface = this.refs.surface;
		if (!overlay || !surface) {
			return;
		}
		const rect = this.fromRect();
		const overlayBox = overlay.getBoundingClientRect();
		surface.style.setProperty('--ms-anchor-top', `${rect.bottom - overlayBox.top}px`);
		surface.style.setProperty('--ms-anchor-left', `${rect.left - overlayBox.left}px`);
	}
	runOpen() {
		if (this.state.open) {
			return;
		}
		this.state.open = true;
		const overlay = this.refs.overlay;
		const surface = this.refs.surface;
		if (!overlay || !surface) {
			return;
		}
		// Drop any filled close effect → natural box, then reveal + position + morph,
		// all synchronous so no paint lands between reveal and the collapsed first
		// frame: no flash.
		this.morphAnim?.cancel();
		overlay.setAttribute('data-open', '');
		this.positionSurface();
		this.morphAnim = flipMorph(surface, this.fromRect(), {
			duration: this.openDuration(),
			easing: this.springEasing(),
		});
		this.bindDismiss();
	}
	runClose() {
		if (!this.state.open) {
			return;
		}
		this.state.open = false;
		this.unbindDismiss();
		const surface = this.refs.surface;
		if (!surface) {
			return;
		}
		this.morphAnim?.cancel();
		const anim = flipMorph(surface, this.fromRect(), {
			reverse: true,
			duration: this.closeDuration(),
			easing: this.springEasing(),
		});
		this.morphAnim = anim;
		// Hide once the shrink lands — guarded against a re-open superseding this close
		// mid-flight (the pulldown's stale-settle discipline).
		anim.finished.then(() => {
			if (this.morphAnim === anim && !this.state.open) {
				this.refs.overlay?.removeAttribute('data-open');
			}
		}).catch(() => {});
	}
	toggleSurface() {
		if (this.state.open) {
			this.runClose();
		} else {
			this.runOpen();
		}
	}
	handleTriggerClick() {
		this.toggleSurface();
	}
	handleBackdropClick() {
		this.runClose();
	}
	handleCloseClick() {
		this.runClose();
	}
	bindDismiss() {
		this.dismissAbort = new AbortController();
		globalThis.addEventListener('keydown', this, {
			signal: this.dismissAbort.signal,
		});
	}
	unbindDismiss() {
		this.dismissAbort?.abort();
		this.dismissAbort = null;
	}
	// Global Esc listener registered with `this` as the handler — the house pattern
	// for a raw listener (pass an object implementing handleEvent).
	handleEvent(domEvent) {
		if (domEvent.type === 'keydown' && domEvent.key === 'Escape') {
			this.runClose();
		}
	}
	handleViewportChange() {
		if (this.state.open) {
			this.positionSurface();
		}
	}
}
