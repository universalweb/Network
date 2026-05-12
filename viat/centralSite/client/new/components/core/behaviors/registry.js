// Behavior registry — single source of truth for template-attached behaviors
// (copy, confirm, tooltip, autofocus, reveal, etc.). The set is hot during
// template parsing, so reads stay O(1). Builtins register at boot via their
// own modules; consumers can append their own via `registerBehavior`.
const REGISTRY = new Map();
const ATTR_NAMES = new Set();
const installedInits = new WeakSet();
export function registerBehavior(name, behavior) {
	if (typeof name !== 'string' || !name) {
		throw new TypeError('registerBehavior: name must be a non-empty string');
	}
	REGISTRY.set(name, behavior);
	ATTR_NAMES.add(name);
	if (typeof behavior?.init === 'function' && !installedInits.has(behavior)) {
		installedInits.add(behavior);
		behavior.init();
	}
}
export function getBehavior(name) {
	return REGISTRY.get(name);
}
export function isBehaviorAttr(name) {
	return ATTR_NAMES.has(name);
}
export function behaviorAttrNames() {
	return ATTR_NAMES;
}
