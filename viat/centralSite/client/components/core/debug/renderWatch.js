/*
	renderWatch.js
	Author: Thomas Marchi
	Date: 2026-08-24
	Dev-only connected-but-never-rendered watchdog. Production is a strict
	no-op (IS_PRODUCTION). Happy-path cost is one pre-declared ComponentTimeout
	cleared when the instance reaches the rendered phase.
*/
import { PHASE } from '../lifecycle/phase.js';
import { hasValue, isNumber } from '../utilities.js';
import { defaultLogger, IS_PRODUCTION } from './logger.js';
export const RENDER_WATCH_MS = 2000;
const MAX_RENDER_WATCH = 64;
const renderWatchRecords = [];
function snapshotLastError(component) {
	const last = component.lastFrameworkError;
	if (!hasValue(last)) {
		return null;
	}
	const error = last.error;
	return {
		channel: last.channel,
		message: error?.message ?? String(error),
		stack: error?.stack ?? null,
	};
}
function pushRecord(record) {
	Object.freeze(record);
	if (renderWatchRecords.length >= MAX_RENDER_WATCH) {
		renderWatchRecords.shift();
	}
	renderWatchRecords.push(record);
}
/**
 * Frozen snapshot of captured misses. Console: `defaultLogger.renderWatch`.
 * @returns {readonly object[]} Frozen copy of the live records.
 */
export function getRenderWatchRecords() {
	return Object.freeze(renderWatchRecords.slice());
}
/**
 * Drop captured records. Tests only.
 * @returns {void} Clears the live array.
 */
export function resetRenderWatch() {
	renderWatchRecords.length = 0;
}
/**
 * Timer callback — ComponentTimeout forwards (component, handle).
 * @param {object} component - The watched instance.
 * @returns {void} Records and logs when still short of rendered.
 */
export function onRenderWatchFire(component) {
	if (IS_PRODUCTION) {
		return;
	}
	if (component.atPhase(PHASE.RENDERED)) {
		return;
	}
	const record = {
		tag: component.localName,
		phase: component.phase,
		isConnected: component.isConnected === true,
		hasShadowRoot: Boolean(component.shadowRoot),
		hasTplState: Boolean(component.tplState),
		connectGeneration: component.connectGeneration | 0,
		lastError: snapshotLastError(component),
	};
	pushRecord(record);
	defaultLogger.warn('RENDER-WATCH', `${record.tag} connected but not rendered`, record);
}
/**
 * Arm (or re-arm) the per-instance handle. No-op in production.
 * @param {object} component - Connecting instance.
 * @returns {void} Schedules the watchdog.
 */
export function armRenderWatch(component) {
	if (IS_PRODUCTION) {
		return;
	}
	const delayMs = isNumber(component.config?.renderWatchMs) ? component.config.renderWatchMs : RENDER_WATCH_MS;
	(component.renderWatchTimer ??= component.createTimeout(onRenderWatchFire, delayMs)).run(onRenderWatchFire, delayMs);
}
/**
 * Cancel without resetting a recycled native id. Safe when never armed.
 * @param {object} component - Instance that rendered or disconnected.
 * @returns {void} Clears the handle.
 */
export function clearRenderWatch(component) {
	component.renderWatchTimer?.clear();
}
Object.defineProperty(defaultLogger, 'renderWatch', {
	configurable: true,
	enumerable: true,
	get: getRenderWatchRecords,
});
