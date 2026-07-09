/*
 * Behavior registry — single source of truth for template-attached behaviors
 * (copy, confirm, tooltip, autofocus, reveal, etc.). The set is hot during
 * template parsing, so reads stay O(1). Builtins register at boot via their
 * own modules; consumers can append their own via `registerBehavior`.
 *
 * Contract — a behavior is a SINGLETON (one class instance shared by every
 * element) with prototype methods:
 *   • `install(element, value, component)` — wire the element. Returns nothing.
 *   • `uninstall(element)` — optional symmetric teardown. When present, the
 *     template pipeline queues ONE `BehaviorTeardown` per install; when absent
 *     nothing is queued at all.
 *   • `applyValue(element, value)` — optional dynamic-value updates.
 *   • `init()` — optional one-shot module arming, run at registration.
 * Per-install state (timers, observers, listeners) lives in module WeakMaps
 * keyed by the element — never in closures. Install must not return a cleanup
 * function; that legacy shape allocated a fresh closure per element.
 */
const REGISTRY = new Map();
const ATTR_NAMES = new Set();
const installedInits = new WeakSet();
export function registerBehavior(behaviorName, behavior) {
	if (typeof behaviorName !== 'string' || !behaviorName) {
		throw new TypeError('registerBehavior: behaviorName must be a non-empty string');
	}
	REGISTRY.set(behaviorName, behavior);
	ATTR_NAMES.add(behaviorName);
	if (typeof behavior?.init === 'function' && !installedInits.has(behavior)) {
		installedInits.add(behavior);
		behavior.init();
	}
}
export function getBehavior(behaviorName) {
	return REGISTRY.get(behaviorName);
}
export function isBehaviorAttr(behaviorName) {
	return ATTR_NAMES.has(behaviorName);
}
export function behaviorAttrNames() {
	return ATTR_NAMES;
}
/**
 * Teardown handle queued into a template instance's `unsubs` — `disposeItem`
 * dispatches on `.unsubscribe()`, so this slots into the standard teardown
 * path. One slim two-field object per install (shared prototype, no closure
 * scope) instead of a per-install uninstall closure.
 */
export class BehaviorTeardown {
	constructor(behavior, element) {
		this.behavior = behavior;
		this.element = element;
	}
	unsubscribe() {
		this.behavior.uninstall(this.element);
	}
}
