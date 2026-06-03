/*
 * Behavior registry — single source of truth for template-attached behaviors
 * (copy, confirm, tooltip, autofocus, reveal, etc.). The set is hot during
 * template parsing, so reads stay O(1). Builtins register at boot via their
 * own modules; consumers can append their own via `registerBehavior`.
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
