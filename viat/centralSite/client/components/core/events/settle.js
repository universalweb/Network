/*
 * Shared async-settle path for every event-dispatch surface — component
 * events (events.js), element subscriptions (eventEntry.js), and the
 * delegate bus/env/scoped tiers (dom/delegate.js). One implementation
 * instead of a copy per file, and one routing rule: a live owner's
 * `handleEventError` hook (overridable per component) is the sink; the raw
 * queue rethrow only serves owner-less registrations.
 *
 * NOT mixed onto the prototype — base.js folds `events.js` wholesale via
 * `import * as`, so shared helpers live here to stay off component instances.
 */
import { isError, isFunction } from '../utilities.js';
/**
 * Surface an event-handler failure as an uncaught (but context-tagged) error.
 * The queueMicrotask rethrow keeps the dispatching call stack alive (stay-up)
 * while still reaching window.onerror / unhandled-error reporters.
 * @param {unknown} error - The rejection reason or thrown value.
 * @param {Event} domEvent - The dispatched DOM event.
 * @param {EventTarget|null} element - The element the handler ran against.
 * @param {string} eventName - The subscribed event name.
 */
export function queueEventError(error, domEvent, element, eventName) {
	queueMicrotask(() => {
		throw Object.assign(isError(error) ? error : new Error(String(error)), {
			element,
			event: domEvent,
			eventName,
		});
	});
}
/**
 * Observe an async handler result and route any rejection to the owner's
 * `handleEventError` hook, falling back to `queueEventError` for owner-less
 * registrations (module-load services, GC'd owners).
 *
 * Await-based settle instead of `.catch` — a bare thenable passes
 * `isPromiseLike` with only `.then`, so `.catch` is not guaranteed to exist;
 * `await` normalizes any thenable. Named module fn with context as args = no
 * per-dispatch closure. Invoked UNAWAITED — a side-observer of the result the
 * caller already holds.
 * @param {Promise|object} result - The thenable the handler returned.
 * @param {object|null} owner - The subscribing component, when alive.
 * @param {Event} domEvent - The dispatched DOM event.
 * @param {EventTarget|null} element - The element the handler ran against.
 * @param {string} eventName - The subscribed event name.
 */
export async function settleEventResult(result, owner, domEvent, element, eventName) {
	try {
		await result;
	} catch (error) {
		if (owner && isFunction(owner.handleEventError)) {
			owner.handleEventError(error, domEvent, element, eventName);
			return;
		}
		queueEventError(error, domEvent, element, eventName);
	}
}
