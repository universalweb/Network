/**
 * Popover show after custom-element reactions return.
 * Chromium throws InvalidStateError ("disconnected popover elements") when
 * showPopover runs inside connectedCallback (and the sync prefix of
 * handleConnect), even if isConnected is already true. A 0ms ComponentTimeout
 * is armed only while a reaction is on the stack. After the first await —
 * typical onRendered once awaitChildren yields — show is synchronous.
 */
import { defaultLogger } from '../debug/logger.js';
import { inCustomElementReaction } from '../lifecycle/reactionDepth.js';
import { emitError, queueAsyncError } from '../utilities.js';
function logPopoverDrop(host, surface, reason) {
	if (!defaultLogger.debugOn) {
		return;
	}
	defaultLogger.debug(
		'popover-drop',
		reason,
		host?.localName,
		surface?.isConnected
	);
}
function reportPopoverContract(host, reason) {
	const error = new Error(`popover ${reason} on ${host?.localName ?? 'unknown'}`);
	error.errKind = reason;
	if (typeof host?.emit === 'function') {
		emitError(host, 'lifecycleError', error);
		return;
	}
	queueAsyncError(error);
}
function applyPopoverShow(host, surface, repromote) {
	if (!surface || host.isDisconnected || !host.isConnected) {
		logPopoverDrop(host, surface, 'host-not-live');
		return;
	}
	if (surface.isConnected === false) {
		logPopoverDrop(host, surface, 'surface-disconnected');
		return;
	}
	/*
	 * Defense in depth. showPopoverWhenReady already rejects a non-callable
	 * showPopover; a flush of a surface that later lost the method still
	 * must not throw.
	 */
	if (typeof surface.showPopover !== 'function') {
		logPopoverDrop(host, surface, 'no-show');
		return;
	}
	if (repromote && surface.matches(':popover-open')) {
		surface.hidePopover();
	}
	if (surface.matches(':popover-open')) {
		return;
	}
	surface.showPopover();
}
export function cancelPopoverWhenReady(component) {
	const host = component || this;
	host.pendingPopoverSurface = null;
	host.pendingPopoverRepromote = false;
	host.popoverReadyTimer?.clear();
}
export function showPopoverWhenReady(component, surface, repromote) {
	const host = component || this;
	if (!surface) {
		if (host.templateBuilt) {
			reportPopoverContract(host, 'no-surface');
		} else {
			logPopoverDrop(host, surface, 'surface-not-ready');
		}
		return;
	}
	if (typeof surface.showPopover !== 'function') {
		reportPopoverContract(host, 'no-show');
		return;
	}
	if (!inCustomElementReaction()) {
		cancelPopoverWhenReady(host);
		applyPopoverShow(host, surface, repromote);
		return;
	}
	host.pendingPopoverSurface = surface;
	if (repromote) {
		host.pendingPopoverRepromote = true;
	}
	(host.popoverReadyTimer ??= host.createTimeout(flushPopoverWhenReady, 0)).run();
}
export function flushPopoverWhenReady(component) {
	const host = component || this;
	const surface = host.pendingPopoverSurface;
	const repromote = host.pendingPopoverRepromote;
	host.pendingPopoverSurface = null;
	host.pendingPopoverRepromote = false;
	applyPopoverShow(host, surface, repromote);
}
export function ensureManualPopover() {
	if (typeof this.showPopover !== 'function') {
		return;
	}
	if (!this.hasAttribute('popover')) {
		this.setAttribute('popover', 'manual');
	}
	showPopoverWhenReady(this, this);
}
export function repromoteManualPopover() {
	if (typeof this.hidePopover !== 'function' || typeof this.showPopover !== 'function') {
		return;
	}
	if (this.isDisconnected || !this.isConnected) {
		return;
	}
	showPopoverWhenReady(this, this, true);
}
export function showSurfacePopover(surface) {
	showPopoverWhenReady(this, surface);
}
export function hideSurfacePopover(surface) {
	cancelPopoverWhenReady(this);
	if (!surface || typeof surface.hidePopover !== 'function') {
		return;
	}
	if (surface.matches(':popover-open')) {
		surface.hidePopover();
	}
}
