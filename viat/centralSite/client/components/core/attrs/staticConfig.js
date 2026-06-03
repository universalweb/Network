import {
	assign,
	deepMerge,
	getProto,
	hasOwn,
} from '../utilities.js';
import { inferStateSchema } from './inferTypes.js';
export function collectClassChain(ComponentClass) {
	const chain = [];
	let current = ComponentClass;
	while (current && current !== HTMLElement) {
		chain.push(current);
		current = getProto(current);
	}
	chain.reverse();
	return chain;
}
function computeMerged(ComponentClass, fieldName) {
	const parentClass = getProto(ComponentClass);
	if (parentClass !== null && getProto(parentClass) === HTMLElement) {
		return hasOwn(ComponentClass, fieldName) ? {
			...ComponentClass[fieldName],
		} : {};
	}
	const chain = collectClassChain(ComponentClass);
	const merged = {};
	for (let index = 0; index < chain.length; index++) {
		const classRef = chain[index];
		if (hasOwn(classRef, fieldName)) {
			assign(merged, classRef[fieldName]);
		}
	}
	return merged;
}
function ensureMerged(ComponentClass, fieldName, cacheName) {
	if (hasOwn(ComponentClass, cacheName)) {
		return ComponentClass[cacheName];
	}
	const merged = computeMerged(ComponentClass, fieldName);
	Object.defineProperty(ComponentClass, cacheName, {
		value: merged,
		configurable: true,
		writable: true,
	});
	return merged;
}
/**
 * Flag-aware static state merger. Walks the class chain root → leaf and folds
 * each ancestor's `static state` into an accumulator. Behavior switches on
 * class-level flags:
 *   - `static mergeState = false` → no chain merge; uses only the current
 *     class's own `static state` (parents ignored entirely)
 *   - `static mergeObjects = true` → container values (plain objects, arrays,
 *     Sets, Maps) deep-merge through the chain; otherwise newer class's value
 *     replaces the accumulator at that key
 * Caches the result on the class under `mergedState`. Flags are read from the
 * class via static prototype inheritance, so subclass overrides are honored.
 * Accessor descriptors (`get foo()` / `set foo()`) survive the merge intact
 * — they're transferred via `Object.defineProperty` and later collected into
 * the class's propertyIndex (getters/setters Maps) so the state proxies
 * dispatch them via `.call(component)` rather than per-instance `.bind`.
 */
function copyDescriptor(target, key, descriptor) {
	Object.defineProperty(target, key, descriptor);
}
function foldStateSource(merged, source, mergeObjects) {
	const descriptors = Object.getOwnPropertyDescriptors(source);
	const keys = Object.keys(descriptors);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const descriptor = descriptors[key];
		if (descriptor.get || descriptor.set) {
			copyDescriptor(merged, key, descriptor);
			continue;
		}
		if (!mergeObjects) {
			copyDescriptor(merged, key, descriptor);
			continue;
		}
		const priorDescriptor = Object.getOwnPropertyDescriptor(merged, key);
		const priorValue = priorDescriptor && !priorDescriptor.get && !priorDescriptor.set
			? priorDescriptor.value
			: undefined;
		copyDescriptor(merged, key, {
			value: deepMerge(priorValue, descriptor.value),
			writable: true,
			enumerable: true,
			configurable: true,
		});
	}
}
function computeMergedState(ComponentClass) {
	const mergeStateOff = ComponentClass.mergeState === false;
	const mergeObjects = ComponentClass.mergeObjects === true;
	const merged = {};
	if (mergeStateOff) {
		if (hasOwn(ComponentClass, 'state')) {
			foldStateSource(merged, ComponentClass.state, false);
		}
		return merged;
	}
	const chain = collectClassChain(ComponentClass);
	for (let index = 0; index < chain.length; index++) {
		const classRef = chain[index];
		if (!hasOwn(classRef, 'state')) {
			continue;
		}
		foldStateSource(merged, classRef.state, mergeObjects);
	}
	return merged;
}
/**
 * Walk a class's prototype chain looking for an own descriptor on `key`.
 * Stops at HTMLElement so we don't mistake intrinsic accessors (think
 * `HTMLElement.prototype.title`) for a user override. A leaf-class accessor
 * wins over framework-installed routing — that's the opt-out path.
 */
function hasOwnPrototypeAccessor(proto, key) {
	let current = proto;
	while (current && current !== HTMLElement.prototype) {
		if (hasOwn(current, key)) {
			return true;
		}
		current = getProto(current);
	}
	return false;
}
/**
 * Install reactive routing accessors on the class prototype for each
 * top-level state key. With this in place, a parent template doing
 * `.foo=${value}` on a child element flows directly into the child's
 * reactive state — same path as `this.state.foo = value` — so callers
 * can treat top-level state keys as first-class element properties
 * without each subclass having to hand-write a setter/getter pair.
 * Skipped keys:
 *   - underscore-prefixed (`_status`) — convention for state-internal
 *     backing fields that should NOT be addressable from outside
 *   - keys already defined on any prototype in the chain — lets the
 *     subclass (or a base class) override the routing for that prop
 *   - `state` itself — already defined on WebComponent.prototype as the
 *     full-state setter/getter pair
 */
function installStateRoutingAccessors(ComponentClass, mergedState) {
	const proto = ComponentClass.prototype;
	if (!proto) {
		return;
	}
	const keys = Object.getOwnPropertyNames(mergedState);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (key === 'state' || key.charCodeAt(0) === 95) {
			continue;
		}
		if (hasOwnPrototypeAccessor(proto, key)) {
			continue;
		}
		Object.defineProperty(proto, key, {
			configurable: true,
			enumerable: false,
			get() {
				const reactive = this.stateProxy;
				if (reactive) {
					return reactive[key];
				}
				return this.STATE ? this.STATE[key] : undefined;
			},
			set(value) {
				const reactive = this.stateProxy;
				if (reactive) {
					reactive[key] = value;
					return;
				}
				/*
				 * Pre-init assignment (parent set `.foo=` before our
				 * constructor ran). Stash as an own data property; the
				 * constructor's `upgradeShadowedProperties` walk routes
				 * it through the proper channel once STATE is alive.
				 */
				Object.defineProperty(this, key, {
					configurable: true,
					enumerable: true,
					writable: true,
					value,
				});
			},
		});
	}
}
export function ensureMergedState(ComponentClass) {
	if (hasOwn(ComponentClass, 'mergedState')) {
		return ComponentClass.mergedState;
	}
	const merged = computeMergedState(ComponentClass);
	Object.defineProperty(ComponentClass, 'mergedState', {
		value: merged,
		configurable: true,
		writable: true,
	});
	installStateRoutingAccessors(ComponentClass, merged);
	return merged;
}
export function ensureMergedAttrs(ComponentClass) {
	return ensureMerged(ComponentClass, 'attrs', 'mergedAttrs');
}
export function ensureMergedConfig(ComponentClass) {
	return ensureMerged(ComponentClass, 'config', 'mergedConfig');
}
/**
 * `static properties` — the per-path state schema. Shallow chain-merge (it is
 * a flat, path-keyed object: `{ 'a.b.c': { kind, react } }`), exactly like
 * `static attrs`. Accessor descriptors (`get foo()` / `set foo()`) on `static
 * state` are separately collected into the same propertyIndex via the
 * mergedState walk in `ensurePropertyIndex`.
 */
export function ensureMergedProperties(ComponentClass) {
	return ensureMerged(ComponentClass, 'properties', 'mergedProperties');
}
function collectAccessors(mergedState, getters, setters) {
	const descriptors = Object.getOwnPropertyDescriptors(mergedState);
	const keys = Object.getOwnPropertyNames(descriptors);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const descriptor = descriptors[key];
		if (descriptor.get) {
			getters.set(key, descriptor.get);
		}
		if (descriptor.set) {
			setters.set(key, descriptor.set);
		}
	}
}
/**
 * Derive the fast-lookup index from compile-time inference over `static state`,
 * the merged `static properties`, and accessor descriptors on `static state` —
 * cached on the class. `hasProperties` / `hasNonReactive` / `hasKinds` /
 * `hasTypes` / `hasAccessors` are coarse booleans so the proxy + compiler hot
 * paths short-circuit with a single check when a feature is unused.
 *   types            — path → STATE_TYPE (inferred JS type; compiler/sigil oracle)
 *   nonReactivePaths — paths declared `react: false` (skip notify + tracking)
 *   kinds            — path → CONTENT_KIND (skip content classification); seeded
 *                      from inference for TEXT-safe primitives, then OVERRIDDEN
 *                      by any explicit `static properties` `kind`
 *   getters          — top-level key → getter fn (dispatched via .call(component))
 *   setters          — top-level key → setter fn (dispatched via .call(component, value))
 */
export function ensurePropertyIndex(ComponentClass) {
	if (hasOwn(ComponentClass, 'mergedPropertyIndex')) {
		return ComponentClass.mergedPropertyIndex;
	}
	const merged = ensureMergedProperties(ComponentClass);
	const mergedState = ensureMergedState(ComponentClass);
	/*
	 * One walk over `static state` seeds the type oracle and the auto kinds.
	 * Explicit `static properties` `kind` declarations below override inference.
	 */
	const inferred = inferStateSchema(mergedState);
	const types = inferred.types;
	const kinds = inferred.kinds;
	const paths = Object.keys(merged);
	const nonReactivePaths = new Set();
	const getters = new Map();
	const setters = new Map();
	for (let index = 0; index < paths.length; index++) {
		const path = paths[index];
		const descriptor = merged[path];
		if (!descriptor) {
			continue;
		}
		if (descriptor.react === false) {
			nonReactivePaths.add(path);
		}
		if (descriptor.kind) {
			kinds.set(path, descriptor.kind);
		}
	}
	collectAccessors(mergedState, getters, setters);
	const propertyIndex = {
		hasProperties: paths.length > 0,
		hasNonReactive: nonReactivePaths.size > 0,
		hasKinds: kinds.size > 0,
		hasTypes: types.size > 0,
		hasAccessors: getters.size > 0 || setters.size > 0,
		nonReactivePaths,
		kinds,
		types,
		getters,
		setters,
	};
	Object.defineProperty(ComponentClass, 'mergedPropertyIndex', {
		value: propertyIndex,
		configurable: true,
		writable: true,
	});
	return propertyIndex;
}
