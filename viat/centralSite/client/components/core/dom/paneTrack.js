/*
	DESCRIPTION: Sliding pane-track for one auto-popover dropdown shell.
	Nav-section and menubar keep N panes in ONE surface and slide/resize
	between them instead of close/reopen. Policy (pane contents, hover vs
	click-to-open, enter animation) stays with the caller.
	REJECTED MorphSurface as the host — UIMenu documents why: popover="auto"
	puts the panel in the UA top layer (escapes overflow / transform
	containing blocks). MorphSurface's position:fixed overlay in shadow
	cannot. Flattening auto→manual would require escape-stack registration;
	auto must stay off the stack (escapeStack.js; 8 UA-layer tests).
	REJECTED a third sliding-dropdown custom element — they already share
	UIMenu + menu-surface + .glass. This module is the missing half.
	REJECTED stuffing this into SurfaceController — that is open/close/
	dismiss (HideOnScroll + optional Esc/outside). Sliding is a different
	mechanic; both callers compose SurfaceController separately.
	── USAGE ────────────────────────────────────────────────────────────
	  stampPaneStates(panes, activePanelIndex)
	  layoutViewport(viewport, activePane)
	  markSwitch(surface, wasOpen)
	  applySlideFlags(element, active, slideOffset)
	  resetViewportSize(viewport)
	─────────────────────────────────────────────────────────────────────
*/
import { isArray } from '../utilities.js';
export const SLIDE_OFFSET_VAR = '--slide-offset';
const MIN_WIDTH_EM = 8;
/**
 * Paint active/inert/offset onto a pane HOST. CSS reads data-active +
 * --slide-offset; the parent only stamps.
 * @param {Element|null|undefined} element - Pane host.
 * @param {boolean} active - Whether this pane is the open one.
 * @param {number} slideOffset - Distance from the active pane in pane units.
 */
export function applySlideFlags(element, active, slideOffset) {
	if (!element) {
		return;
	}
	const isActive = Boolean(active);
	element.toggleAttribute('data-active', isActive);
	element.setAttribute('aria-hidden', isActive ? 'false' : 'true');
	element.inert = !isActive;
	element.style.setProperty(SLIDE_OFFSET_VAR, String(Number(slideOffset) || 0));
}
/**
 * Write active + slideOffset onto live pane components (not the source
 * items array — deep writes there re-notify and freeze).
 * @param {Array<{state: object}>|null|undefined} panes - Pane components.
 * @param {number} activePanelIndex - Open pane's panelIndex, or -1 if closed.
 */
export function stampPaneStates(panes, activePanelIndex) {
	if (!isArray(panes)) {
		return;
	}
	const count = panes.length;
	const activePanel = Number(activePanelIndex);
	for (let index = 0; index < count; index += 1) {
		const pane = panes[index];
		const paneState = pane?.state;
		if (!paneState) {
			continue;
		}
		const panelIndex = Number(paneState.panelIndex);
		const active = activePanel >= 0 && panelIndex === activePanel;
		const slideOffset = activePanel >= 0 ? panelIndex - activePanel : 0;
		if (paneState.active !== active) {
			paneState.active = active;
		}
		if (paneState.slideOffset !== slideOffset) {
			paneState.slideOffset = slideOffset;
		}
	}
}
/**
 * First-open vs switch-while-open. Switching must not re-trigger the
 * enter animation (scale/fade) on the shared shell.
 * @param {Element|null|undefined} surface - The popover surface.
 * @param {boolean} wasOpen - True when the popover was already :popover-open.
 */
export function markSwitch(surface, wasOpen) {
	if (!surface) {
		return;
	}
	if (wasOpen) {
		surface.dataset.switch = '';
		return;
	}
	delete surface.dataset.switch;
}
/**
 * Drop inline viewport size so the next open measures from the seed.
 * @param {HTMLElement|null|undefined} paneViewport - The track viewport.
 */
export function resetViewportSize(paneViewport) {
	if (!paneViewport) {
		return;
	}
	paneViewport.style.width = '';
	paneViewport.style.height = '';
}
/**
 * Size the viewport to the active pane's content box. Seed is max-content
 * so a constrained overflow:hidden box cannot clip the measure.
 * @param {HTMLElement|null|undefined} paneViewport - The track viewport.
 * @param {Element|null|undefined} activePane - The open pane host.
 * @param {{minWidthEm?: number}} [options] - Floor in root em (default 8).
 */
export function layoutViewport(paneViewport, activePane, options) {
	if (!paneViewport || !activePane) {
		return;
	}
	paneViewport.style.width = 'max-content';
	paneViewport.style.height = 'max-content';
	const contentWidth = Math.ceil(Math.max(
		activePane.scrollWidth || 0,
		activePane.offsetWidth || 0,
		activePane.getBoundingClientRect().width || 0
	));
	const contentHeight = Math.ceil(Math.max(
		activePane.scrollHeight || 0,
		activePane.offsetHeight || 0,
		activePane.getBoundingClientRect().height || 0
	));
	const rootSize = Number.parseFloat(getComputedStyle(globalThis.document.documentElement).fontSize) || 16;
	const minEm = options?.minWidthEm ?? MIN_WIDTH_EM;
	const minWidth = Math.ceil(minEm * rootSize);
	if (contentWidth > 0) {
		paneViewport.style.width = `${Math.max(minWidth, contentWidth)}px`;
	}
	if (contentHeight > 0) {
		paneViewport.style.height = `${contentHeight}px`;
	}
}
